"""
Trader service — parallel MT5 copy trading.

Chỉ cần chạy 1 lần: python main.py
Khi người dùng đăng ký tài khoản mới qua web → tự động provision và sẵn sàng.
Các tài khoản cũ KHÔNG bị ảnh hưởng gì khi có tài khoản mới.
"""

import asyncio
import logging
import multiprocessing as mp
import os
import sys
import time

from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, ContextTypes, MessageHandler, filters

from db import get_active_accounts, get_pending_accounts, update_account_status, log_trade, set_terminal_path
from signal_parser import parse_signal, TradeSignal
from terminal_manager import (
    allocate_terminal,
    launch_terminal,
    is_terminal_running,
    kill_terminal,
    _update_common_ini,
)
from worker import SHUTDOWN_SIGNAL, worker_process  # noqa: F401

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("trader.log", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
GROUP_ID  = int(os.environ["TELEGRAM_GROUP_ID"])
BASE_EXE  = os.environ.get("MT5_TERMINAL_EXE", r"C:\Program Files\MetaTrader 5\terminal64.exe")

# ── State ─────────────────────────────────────────────────────────────────
mp_result_queue: mp.Queue = mp.Queue()          # Workers → main (multiprocessing Queue)
mp_at_lock:      mp.Lock  = mp.Lock()           # Cross-process lock cho keyboard khi bật Algo Trading
trade_results:  asyncio.Queue                   # Kết quả trade (asyncio Queue, dùng trong async)
worker_queues:  dict[str, mp.Queue] = {}        # account_id → input queue của worker
worker_terminal_paths: dict[str, str] = {}      # account_id → terminal_path
worker_procs:   list[mp.Process]    = []
provisioned_ids: set[str]           = set()


# ── Background task: drain mp.Queue → asyncio.Queue ───────────────────────
#
# mp.Queue.get() là blocking call, không thể gọi trực tiếp trong async.
# drain_result_queue chạy vòng lặp trong thread riêng (run_in_executor),
# forward kết quả sang asyncio.Queue để các coroutine dùng non-blocking.

async def drain_result_queue():
    """
    Đọc kết quả từ tất cả workers liên tục mà không block event loop.
    - Startup message  → log ngay
    - Trade result     → đẩy vào trade_results (asyncio.Queue)
    """
    loop = asyncio.get_event_loop()
    while True:
        try:
            result = await loop.run_in_executor(
                None,
                lambda: mp_result_queue.get(timeout=0.5),
            )

            if result.get("startup"):
                acc_id = result.get("account_id", "")
                name   = result["name"]
                if result["success"]:
                    logger.info(f"[{name}] ✅ Worker sẵn sàng nhận lệnh")
                    if acc_id:
                        update_account_status(acc_id, "connected")
                else:
                    logger.error(f"[{name}] ❌ Kết nối MT5 thất bại: {result.get('message','')}")
                    if acc_id:
                        update_account_status(acc_id, "failed")
                    # Dọn worker và kill terminal
                    worker_queues.pop(acc_id, None)
                    t_path = worker_terminal_paths.pop(acc_id, None)
                    provisioned_ids.discard(acc_id)
                    if t_path:
                        await asyncio.get_event_loop().run_in_executor(None, kill_terminal, t_path)
            else:
                await trade_results.put(result)

        except Exception:
            # get() timeout hoặc queue trống → tiếp tục vòng lặp
            await asyncio.sleep(0.05)


# ── Provision 1 tài khoản (blocking, chạy trong thread pool) ──────────────

def _provision_blocking(acc_id: str, name: str, login: int, password: str,
                        server: str, terminal_path: str | None) -> bool:
    if not os.path.exists(BASE_EXE):
        logger.error(f"Không tìm thấy MT5: {BASE_EXE}")
        return False

    # 1. Tạo thư mục + copy exe (thread-safe, atomic)
    if not terminal_path or not os.path.exists(terminal_path):
        terminal_path = allocate_terminal(BASE_EXE, login=login, server=server)
        set_terminal_path(acc_id, terminal_path)
        logger.info(f"[{name}] Terminal: {terminal_path}")
    else:
        # Terminal đã tồn tại — vẫn cập nhật common.ini để đảm bảo Algo Trading bật
        config_dir = os.path.join(os.path.dirname(terminal_path), "config")
        try:
            _update_common_ini(config_dir, login, server)
        except Exception as e:
            logger.warning(f"[{name}] Không cập nhật được common.ini: {e}")

    # 2. Launch nếu chưa chạy
    if not is_terminal_running(terminal_path):
        logger.info(f"[{name}] Đang khởi động MT5...")
        launch_terminal(terminal_path, login, password, server)
        # Chờ: MT5 kết nối broker (~10s) + Ctrl+E enable Algo Trading (~5s)
        time.sleep(25)

    # 3. Spawn worker process
    q: mp.Queue = mp.Queue()
    worker_queues[acc_id] = q
    worker_terminal_paths[acc_id] = terminal_path
    provisioned_ids.add(acc_id)

    proc = mp.Process(
        target=worker_process,
        args=(acc_id, name, login, password, server, terminal_path, q, mp_result_queue, mp_at_lock),
        daemon=True,
        name=f"worker-{name}",
    )
    proc.start()
    worker_procs.append(proc)
    logger.info(f"[{name}] Worker PID={proc.pid} đang kết nối...")
    return True


async def provision_account(acc_id: str, name: str, login: int, password: str,
                            server: str, terminal_path: str | None):
    """Wrapper async: chạy provision trong thread pool → không block event loop."""
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None, _provision_blocking,
        acc_id, name, login, password, server, terminal_path,
    )


# ── Startup ────────────────────────────────────────────────────────────────

async def load_existing_accounts():
    accounts = get_active_accounts()
    if not accounts:
        logger.info("Chưa có tài khoản. Chờ người dùng đăng ký qua web...")
        return

    logger.info(f"Provision {len(accounts)} tài khoản hiện có...")
    tasks = [
        provision_account(acc_id, name, int(login), password, server, terminal_path)
        for acc_id, name, login, password, server, terminal_path in accounts
    ]
    await asyncio.gather(*tasks)   # Tất cả provision song song


# ── Background: theo dõi tài khoản mới ────────────────────────────────────

async def watch_new_accounts():
    """
    Cứ 10 giây kiểm tra DB 1 lần.
    - Tài khoản connected chưa provision (sau restart service) → provision lại
    - Tài khoản pending (mới đăng ký) → provision để xác thực kết nối
    """
    while True:
        await asyncio.sleep(10)
        try:
            for acc in get_active_accounts() + get_pending_accounts():
                acc_id = acc[0]
                if acc_id not in provisioned_ids:
                    logger.info(f"[{acc[1]}] Phát hiện tài khoản mới → provision")
                    asyncio.create_task(
                        provision_account(acc_id, acc[1], int(acc[2]), acc[3], acc[4], acc[5])
                    )
        except Exception as e:
            logger.error(f"watch_new_accounts lỗi: {e}")


# ── Background: phát hiện account bị xóa/tắt → dừng worker + kill terminal ─

async def watch_accounts_changes():
    """
    Cứ 30 giây so sánh danh sách worker đang chạy với DB.
    Nếu account bị xóa hoặc isActive=False → gửi SHUTDOWN cho worker và kill terminal.
    """
    while True:
        await asyncio.sleep(30)
        try:
            active_ids = {a[0] for a in get_active_accounts()}
            removed = [aid for aid in list(worker_queues.keys()) if aid not in active_ids]
            for acc_id in removed:
                logger.info(f"Account {acc_id} đã bị xóa — dừng worker và kill terminal...")
                # Gửi lệnh tắt worker
                try:
                    worker_queues[acc_id].put(SHUTDOWN_SIGNAL)
                except Exception:
                    pass
                # Kill terminal process
                t_path = worker_terminal_paths.get(acc_id)
                if t_path:
                    await asyncio.get_event_loop().run_in_executor(None, kill_terminal, t_path)
                # Dọn state
                worker_queues.pop(acc_id, None)
                worker_terminal_paths.pop(acc_id, None)
                provisioned_ids.discard(acc_id)
        except Exception as e:
            logger.error(f"watch_accounts_changes lỗi: {e}")


# ── Xử lý tín hiệu Telegram ────────────────────────────────────────────────

async def dispatch_signal(signal_text: str, signal: TradeSignal):
    queues = list(worker_queues.items())
    n = len(queues)

    if n == 0:
        logger.warning("Chưa có tài khoản nào sẵn sàng!")
        return

    logger.info(f"▶ {signal.action} {signal.symbol} → {n} tài khoản")
    t_start = time.time()

    # Gửi tín hiệu vào tất cả worker queues cùng lúc (non-blocking)
    for _, q in queues:
        q.put(signal)

    # Thu kết quả qua asyncio.Queue (hoàn toàn non-blocking)
    results = []
    deadline = time.time() + 30
    while len(results) < n:
        remaining = deadline - time.time()
        if remaining <= 0:
            break
        try:
            r = await asyncio.wait_for(trade_results.get(), timeout=min(remaining, 1.0))
            results.append(r)
        except asyncio.TimeoutError:
            break

    elapsed  = time.time() - t_start
    success  = sum(1 for r in results if r.get("success"))
    failed   = len(results) - success
    missing  = n - len(results)

    lines = [
        f"{'✅' if r['success'] else '❌'} {r['name']}: {r.get('message', '')}"
        for r in results
    ]
    if missing:
        lines.append(f"⚠️ {missing} tài khoản không phản hồi trong 30s")

    summary = "\n".join(lines)
    log_trade(signal_text, "success" if not failed and not missing else "partial", summary)
    logger.info(f"Xong {len(results)}/{n} | ✅{success} ❌{failed} ⚠️{missing} | {elapsed:.1f}s")
    logger.info(summary)


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    message = update.message or update.channel_post  # channel_post cho group/channel, message cho private chat
    if not message or not message.text:
        return
    if message.chat.id != GROUP_ID:
        return
    signal = parse_signal(message.text)
    if signal is None:
        return
    await dispatch_signal(message.text, signal)


# ── Main ────────────────────────────────────────────────────────────────────

async def run():
    global trade_results
    trade_results = asyncio.Queue()

    if not os.path.exists(BASE_EXE):
        logger.error(f"Không tìm thấy MT5: {BASE_EXE}")
        logger.error("Kiểm tra MT5_TERMINAL_EXE trong .env")
        sys.exit(1)

    logger.info("=" * 55)
    logger.info("  GIAO DỊCH TỰ ĐỘNG — PARALLEL MT5")
    logger.info("=" * 55)

    # Khởi chạy tất cả background tasks
    asyncio.create_task(drain_result_queue())
    asyncio.create_task(watch_new_accounts())
    asyncio.create_task(watch_accounts_changes())

    # Load tài khoản hiện có
    await load_existing_accounts()

    # Chạy bot — dùng async context manager thay vì run_polling()
    # vì mình đã trong asyncio.run() rồi, không thể gọi run_polling() lồng vào
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(MessageHandler(filters.TEXT & filters.Chat(GROUP_ID), handle_message))

    async with app:
        await app.start()
        await app.updater.start_polling(
            allowed_updates=["message", "channel_post", "edited_message"]
        )
        logger.info(f"Bot đang chạy | Group: {GROUP_ID}")
        try:
            await asyncio.Event().wait()   # Chạy mãi cho đến khi Ctrl+C
        except (asyncio.CancelledError, KeyboardInterrupt):
            pass
        finally:
            await app.updater.stop()
            await app.stop()


def main():
    mp.set_start_method("spawn", force=True)
    asyncio.run(run())


if __name__ == "__main__":
    main()
