"""
Trader service — parallel MT5 copy trading.

Chỉ cần chạy 1 lần: python main.py
Khi người dùng đăng ký tài khoản mới qua web → tự động provision và sẵn sàng.
Các tài khoản cũ KHÔNG bị ảnh hưởng gì khi có tài khoản mới.
"""

import asyncio
import logging
import msvcrt
import multiprocessing as mp
import os
import sys
import time

from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, ContextTypes, MessageHandler, filters

from db import get_active_accounts, get_pending_accounts, get_all_account_ids, get_all_terminal_paths, get_all_accounts, update_account_status, log_trade, set_terminal_path, push_trade_history
from signal_parser import parse_signal, TradeSignal
from terminal_manager import (
    allocate_terminal,
    launch_terminal,
    is_terminal_running,
    kill_terminal,
    kill_orphan_terminals,
    dismiss_login_dialogs,
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

BOT_TOKEN        = os.environ["TELEGRAM_BOT_TOKEN"]
GROUP_ID_DCA     = int(os.environ["TELEGRAM_GROUP_ID"])          # Nhóm lệnh DCA
GROUP_ID_SIMPLE  = int(os.environ.get("TELEGRAM_GROUP_ID_SIMPLE", "0"))  # Nhóm lệnh đơn
BASE_EXE         = os.environ.get("MT5_TERMINAL_EXE", r"C:\Program Files\MetaTrader 5\terminal64.exe")

# ── Single-instance lock (Windows) ────────────────────────────────────────────
_LOCK_FILE_PATH = os.path.join(os.path.dirname(__file__), ".trader.lock")
_lock_file = None

def _acquire_lock():
    global _lock_file
    _lock_file = open(_LOCK_FILE_PATH, "w")
    try:
        msvcrt.locking(_lock_file.fileno(), msvcrt.LK_NBLCK, 1)
    except OSError:
        print("❌ Đã có tiến trình main.py đang chạy.")
        print("   Chạy lệnh sau để dừng nó: Stop-Process -Name python -Force")
        sys.exit(1)

def _release_lock():
    global _lock_file
    if _lock_file:
        try:
            msvcrt.locking(_lock_file.fileno(), msvcrt.LK_UNLCK, 1)
            _lock_file.close()
        except Exception:
            pass
        try:
            os.remove(_LOCK_FILE_PATH)
        except Exception:
            pass

# ── State ─────────────────────────────────────────────────────────────────
mp_result_queue: mp.Queue = mp.Queue()          # Workers → main (multiprocessing Queue)
mp_at_lock:      mp.Lock  = mp.Lock()           # Cross-process lock: serialize Ctrl+E giữa workers
trade_results:  asyncio.Queue                   # Kết quả trade (asyncio Queue, dùng trong async)
worker_queues:  dict[str, mp.Queue] = {}        # account_id → input queue của worker
worker_terminal_paths: dict[str, str] = {}      # account_id → terminal_path
worker_signal_modes: dict[str, str]  = {}       # account_id → signalMode
worker_lots:         dict[str, float] = {}       # account_id → lot size
worker_procs:   list[mp.Process]    = []
provisioned_ids: set[str]           = set()     # Đã được provision (ngăn provision trùng)
inactive_ids:    set[str]           = set()     # isActive=False (không nhận lệnh)


# ── Background task: drain mp.Queue → asyncio.Queue ───────────────────────

async def drain_result_queue():
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
                    worker_queues.pop(acc_id, None)
                    t_path = worker_terminal_paths.pop(acc_id, None)
                    provisioned_ids.discard(acc_id)
                    if t_path:
                        await asyncio.get_event_loop().run_in_executor(None, kill_terminal, t_path)

            elif result.get("trade_history"):
                acc_id = result.get("account_id", "")
                for deal in result["trade_history"]:
                    try:
                        await asyncio.get_event_loop().run_in_executor(
                            None, push_trade_history, acc_id, deal
                        )
                        logger.info(f"[{result['name']}] 📊 Lưu lịch sử: {deal['symbol']} {deal['tradeType']} profit={deal['profit']}")
                    except Exception as e:
                        logger.error(f"Lỗi lưu lịch sử lệnh: {e}")

            else:
                await trade_results.put(result)

        except Exception:
            await asyncio.sleep(0.05)


# ── Provision 1 tài khoản (blocking, chạy trong thread pool) ──────────────

def _provision_blocking(acc_id: str, name: str, login: int, password: str,
                        server: str, terminal_path: str | None,
                        signal_mode: str = "both", lot: float = 0.01) -> bool:
    if not os.path.exists(BASE_EXE):
        logger.error(f"Không tìm thấy MT5: {BASE_EXE}")
        return False

    if not terminal_path or not os.path.exists(terminal_path):
        terminal_path = allocate_terminal(BASE_EXE, login=login, server=server)
        set_terminal_path(acc_id, terminal_path)
        logger.info(f"[{name}] Terminal: {terminal_path}")

    config_dir = os.path.join(os.path.dirname(terminal_path), "config")
    try:
        _update_common_ini(config_dir, login, server)
    except Exception as e:
        logger.warning(f"[{name}] Không cập nhật được common.ini: {e}")

    if is_terminal_running(terminal_path):
        # Terminal đang chạy → giữ nguyên, kết nối worker vào luôn
        logger.info(f"[{name}] Terminal đã chạy sẵn → kết nối worker trực tiếp")
    else:
        logger.info(f"[{name}] Đang khởi động MT5...")
        launch_terminal(terminal_path, login, password, server)
        time.sleep(25)

    q: mp.Queue = mp.Queue()
    worker_queues[acc_id] = q
    worker_terminal_paths[acc_id] = terminal_path
    worker_signal_modes[acc_id] = signal_mode
    worker_lots[acc_id] = lot

    proc = mp.Process(
        target=worker_process,
        args=(acc_id, name, login, password, server, terminal_path, q, mp_result_queue, mp_at_lock, lot),
        daemon=True,
        name=f"worker-{name}",
    )
    proc.start()
    worker_procs.append(proc)
    logger.info(f"[{name}] Worker PID={proc.pid} đang kết nối...")
    return True


async def provision_account(acc_id: str, name: str, login: int, password: str,
                            server: str, terminal_path: str | None,
                            signal_mode: str = "both", lot: float = 0.01):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None, _provision_blocking,
        acc_id, name, login, password, server, terminal_path, signal_mode, lot,
    )


# ── Startup ────────────────────────────────────────────────────────────────

async def load_existing_accounts():
    all_accs = await asyncio.to_thread(get_all_accounts)
    if not all_accs:
        logger.info("Chưa có tài khoản. Chờ người dùng đăng ký qua web...")
        terminal_paths = await asyncio.to_thread(get_all_terminal_paths)
        kill_orphan_terminals(terminal_paths)
        dismiss_login_dialogs()
        return

    # Kill terminal không thuộc tài khoản nào trước khi provision
    terminal_paths = await asyncio.to_thread(get_all_terminal_paths)
    kill_orphan_terminals(terminal_paths)
    dismiss_login_dialogs()

    # Đánh dấu ngay để watch_new_accounts không provision trùng
    active_acc_ids = {a[0] for a in await asyncio.to_thread(get_active_accounts)}
    for acc in all_accs:
        provisioned_ids.add(acc[0])
        if acc[0] not in active_acc_ids:
            inactive_ids.add(acc[0])  # khởi tạo sớm để dispatch_signal không gửi cho inactive

    logger.info(f"Provision {len(all_accs)} tài khoản (kể cả inactive)...")
    tasks = [
        provision_account(acc_id, name, int(login), password, server, terminal_path, signal_mode, lot)
        for acc_id, name, login, password, server, terminal_path, signal_mode, lot in all_accs
    ]
    await asyncio.gather(*tasks)


# ── Background: theo dõi tài khoản mới ────────────────────────────────────

async def watch_new_accounts():
    while True:
        await asyncio.sleep(10)
        try:
            accs = await asyncio.to_thread(lambda: get_active_accounts() + get_pending_accounts())
            for acc in accs:
                acc_id = acc[0]
                if acc_id not in provisioned_ids:
                    provisioned_ids.add(acc_id)  # Đánh dấu ngay, tránh provision trùng
                    logger.info(f"[{acc[1]}] Phát hiện tài khoản mới → provision")
                    asyncio.create_task(
                        provision_account(acc_id, acc[1], int(acc[2]), acc[3], acc[4], acc[5], acc[6], acc[7])
                    )
        except Exception as e:
            logger.error(f"watch_new_accounts lỗi: {e}")


# ── Background: phát hiện account bị xóa/tắt → dừng worker + kill terminal ─

async def watch_accounts_changes():
    while True:
        await asyncio.sleep(5)
        try:
            all_accounts = await asyncio.to_thread(get_all_account_ids)  # {id: {isActive, signalMode}}
            all_ids      = set(all_accounts.keys())
            active_ids   = {aid for aid, info in all_accounts.items() if info["isActive"]}

            # Cập nhật inactive_ids: account vẫn tồn tại nhưng isActive=False → bỏ qua tín hiệu, GIỮ worker
            inactive_ids.clear()
            inactive_ids.update(aid for aid in worker_queues if aid in all_ids and aid not in active_ids)

            # Sync signal_mode và lot từ DB (cập nhật khi user thay đổi trên web)
            for aid, info in all_accounts.items():
                if aid in worker_queues and isinstance(info, dict):
                    worker_signal_modes[aid] = info.get("signalMode", "both")
                    worker_lots[aid] = float(info.get("lot", 0.01))

            # Account active nhưng terminal không chạy → kill worker (nếu có) và mở lại
            for aid in list(active_ids):
                if aid not in provisioned_ids:
                    continue
                t_path = worker_terminal_paths.get(aid)
                if not t_path or is_terminal_running(t_path):
                    continue
                logger.info(f"Account {aid}: terminal đóng nhưng isActive=True → dừng worker và mở lại...")
                if aid in worker_queues:
                    try:
                        worker_queues[aid].put(SHUTDOWN_SIGNAL)
                    except Exception:
                        pass
                    worker_queues.pop(aid, None)
                worker_terminal_paths.pop(aid, None)
                provisioned_ids.discard(aid)

            # Account bị XÓA khỏi DB → dừng worker VÀ kill terminal
            deleted_ids = [aid for aid in list(worker_queues.keys()) if aid not in all_ids]
            for acc_id in deleted_ids:
                logger.info(f"Account {acc_id} đã bị xóa — dừng worker và kill terminal...")
                try:
                    worker_queues[acc_id].put(SHUTDOWN_SIGNAL)
                except Exception:
                    pass
                t_path = worker_terminal_paths.get(acc_id)
                if t_path:
                    await asyncio.get_event_loop().run_in_executor(None, kill_terminal, t_path)
                worker_queues.pop(acc_id, None)
                worker_terminal_paths.pop(acc_id, None)
                provisioned_ids.discard(acc_id)

        except Exception as e:
            logger.error(f"watch_accounts_changes lỗi: {e}")


# ── Xử lý tín hiệu Telegram ────────────────────────────────────────────────

async def dispatch_signal(signal_text: str, signal: TradeSignal, source: str = "dca"):
    """
    source: "dca" (từ nhóm DCA) hoặc "simple" (từ nhóm lệnh đơn)
    Worker chỉ nhận nếu signal_mode khớp:
      - mode "dca"    → chỉ nhận source "dca"
      - mode "simple" → chỉ nhận source "simple"
      - mode "both"   → nhận cả hai
    """
    queues = [
        (aid, q) for aid, q in worker_queues.items()
        if aid not in inactive_ids
        and (worker_signal_modes.get(aid, "both") == "both"
             or worker_signal_modes.get(aid) == source)
    ]
    n = len(queues)

    if n == 0:
        logger.warning("Chưa có tài khoản nào sẵn sàng!")
        return

    logger.info(f"▶ {signal.action} {signal.symbol} → {n} tài khoản")
    t_start = time.time()

    for aid, q in queues:
        mode = worker_signal_modes.get(aid, "both")
        lot  = worker_lots.get(aid, 0.01)
        q.put((signal, mode, source, lot))

    results = []
    deadline = time.time() + 60
    while len(results) < n:
        remaining = deadline - time.time()
        if remaining <= 0:
            break
        try:
            r = await asyncio.wait_for(trade_results.get(), timeout=min(remaining, 1.0))
            results.append(r)
        except asyncio.TimeoutError:
            continue  # tiếp tục đợi đến hết deadline, không thoát sớm

    elapsed  = time.time() - t_start
    success  = sum(1 for r in results if r.get("success"))
    failed   = len(results) - success
    missing  = n - len(results)

    lines = [
        f"{'✅' if r['success'] else '❌'} {r['name']}: {r.get('message', '')}"
        for r in results
    ]
    if missing:
        lines.append(f"⚠️ {missing} tài khoản không phản hồi trong 60s")

    summary = "\n".join(lines)
    log_trade(signal_text, "success" if not failed and not missing else "partial", summary)
    logger.info(f"Xong {len(results)}/{n} | ✅{success} ❌{failed} ⚠️{missing} | {elapsed:.1f}s")
    logger.info(summary)


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    message = update.message or update.channel_post
    if not message or not message.text:
        return

    chat_id = message.chat.id
    if chat_id == GROUP_ID_DCA:
        source = "dca"
    elif GROUP_ID_SIMPLE and chat_id == GROUP_ID_SIMPLE:
        source = "simple"
    else:
        return

    signal = parse_signal(message.text)
    if signal is None:
        return
    await dispatch_signal(message.text, signal, source)


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

    asyncio.create_task(drain_result_queue())
    asyncio.create_task(watch_new_accounts())
    asyncio.create_task(watch_accounts_changes())

    await load_existing_accounts()

    app = (
        Application.builder()
        .token(BOT_TOKEN)
        .connect_timeout(10.0)
        .read_timeout(30.0)
        .write_timeout(10.0)
        .pool_timeout(5.0)
        .build()
    )
    allowed_chats = [GROUP_ID_DCA] + ([GROUP_ID_SIMPLE] if GROUP_ID_SIMPLE else [])
    app.add_handler(MessageHandler(filters.TEXT & filters.Chat(allowed_chats), handle_message))

    async def run_telegram():
        # initialize một lần duy nhất — chỉ stop/start trong vòng retry
        await app.initialize()
        first_start = True
        try:
            while True:
                try:
                    await app.start()
                    await app.updater.start_polling(
                        allowed_updates=["message", "channel_post", "edited_message"],
                        # Lần đầu: drop tin nhắn cũ trước khi bot start
                        # Auto-restart: giữ lại để không mất tín hiệu trong lúc reconnect
                        drop_pending_updates=first_start,
                    )
                    first_start = False
                    logger.info(f"Bot đang chạy | DCA group: {GROUP_ID_DCA} | Simple group: {GROUP_ID_SIMPLE}")
                    # Heartbeat 5 phút/lần: phát hiện polling chết lặng
                    while True:
                        await asyncio.sleep(300)
                        if not app.updater.running:
                            raise RuntimeError("Telegram updater dừng bất ngờ — restart")
                        await app.bot.get_me()  # ping Telegram API
                except asyncio.CancelledError:
                    break
                except Exception as e:
                    logger.warning(f"Telegram lỗi kết nối: {e} — thử lại sau 5s...")
                finally:
                    try:
                        if app.updater.running:
                            await app.updater.stop()
                    except Exception:
                        pass
                    try:
                        if app.running:
                            await app.stop()
                    except Exception:
                        pass
                try:
                    await asyncio.sleep(5)
                except asyncio.CancelledError:
                    break
        finally:
            try:
                await app.shutdown()
            except Exception:
                pass

    asyncio.create_task(run_telegram())

    try:
        await asyncio.Event().wait()
    except (asyncio.CancelledError, KeyboardInterrupt):
        pass
    finally:
        _release_lock()


def main():
    _acquire_lock()
    mp.set_start_method("spawn", force=True)
    try:
        asyncio.run(run())
    finally:
        _release_lock()


if __name__ == "__main__":
    main()
