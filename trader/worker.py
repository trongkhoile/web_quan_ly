"""
Mỗi tài khoản MT5 chạy trong 1 process riêng biệt.
Process khởi động → kết nối MT5 → giữ kết nối liên tục → chờ tín hiệu → đặt lệnh ngay.
Không initialize/shutdown giữa các lệnh → tốc độ ~0.5-1 giây/lệnh.
"""

import datetime
import multiprocessing as mp
import os
import queue
import random
import threading
import time
import logging
import MetaTrader5 as mt5
from signal_parser import TradeSignal
from terminal_manager import enable_algo_trading_by_path

SHUTDOWN_SIGNAL = "__SHUTDOWN__"

logger = logging.getLogger(__name__)


def _resolve_symbol(raw: str) -> str:
    """Tìm tên symbol thực tế trên broker (thử thêm hậu tố 'm' nếu không thấy)."""
    if mt5.symbol_info(raw) is not None:
        return raw
    with_m = raw + "m"
    if mt5.symbol_info(with_m) is not None:
        return with_m
    raise RuntimeError(f"Symbol {raw} không tồn tại (đã thử {with_m})")


def _get_filling_mode(symbol_info) -> int:
    """Chọn filling mode được broker/symbol hỗ trợ."""
    fmode = symbol_info.filling_mode  # bitmask: 1=FOK, 2=IOC
    if fmode & 2:
        return mt5.ORDER_FILLING_IOC
    if fmode & 1:
        return mt5.ORDER_FILLING_FOK
    return mt5.ORDER_FILLING_RETURN


def _open_order(signal: TradeSignal) -> str:
    symbol = _resolve_symbol(signal.symbol)
    symbol_info = mt5.symbol_info(symbol)
    if not symbol_info.visible:
        mt5.symbol_select(symbol, True)
        time.sleep(0.3)  # chờ tick refresh sau khi thêm vào Market Watch
        symbol_info = mt5.symbol_info(symbol)

    tick = mt5.symbol_info_tick(symbol)
    if tick is None:
        raise RuntimeError(f"Không lấy được giá {symbol}")

    order_type = mt5.ORDER_TYPE_BUY if signal.action == "BUY" else mt5.ORDER_TYPE_SELL
    price = tick.ask if signal.action == "BUY" else tick.bid
    filling = _get_filling_mode(symbol_info)

    request = {
        "action":       mt5.TRADE_ACTION_DEAL,
        "symbol":       symbol,
        "volume":       signal.lot,
        "type":         order_type,
        "price":        price,
        "deviation":    20,
        "magic":        123456,
        "comment":      "TelegramSignal",
        "type_time":    mt5.ORDER_TIME_GTC,
        "type_filling": filling,
    }
    # Validate SL/TP — phải đúng phía so với giá thị trường
    if signal.sl is not None:
        valid_sl = (signal.action == "BUY" and signal.sl < price) or \
                   (signal.action == "SELL" and signal.sl > price)
        if valid_sl:
            request["sl"] = signal.sl
        else:
            logging.warning(f"SL={signal.sl} không hợp lệ cho {signal.action} (giá={price}), bỏ qua")

    if signal.tp is not None:
        valid_tp = (signal.action == "BUY" and signal.tp > price) or \
                   (signal.action == "SELL" and signal.tp < price)
        if valid_tp:
            request["tp"] = signal.tp
        else:
            logging.warning(f"TP={signal.tp} không hợp lệ cho {signal.action} (giá={price}), bỏ qua")

    logging.info(
        f"order_send: {signal.action} {symbol} "
        f"price={price} sl={request.get('sl')} tp={request.get('tp')} "
        f"lot={signal.lot} filling={filling} stops_level={symbol_info.trade_stops_level}"
    )

    result = mt5.order_send(request)
    if result is None or result.retcode != mt5.TRADE_RETCODE_DONE:
        retcode = result.retcode if result else "None"
        comment = result.comment if result else ""
        raise RuntimeError(f"retcode={retcode} {comment}")

    return f"ticket={result.order}"


def _open_dca_order(signal: TradeSignal, dca_price: float) -> str:
    """Đặt lệnh pending limit tại giá DCA."""
    symbol = _resolve_symbol(signal.symbol)
    symbol_info = mt5.symbol_info(symbol)
    if not symbol_info.visible:
        mt5.symbol_select(symbol, True)
        time.sleep(0.3)
        symbol_info = mt5.symbol_info(symbol)

    filling = _get_filling_mode(symbol_info)

    # SELL + DCA trên giá entry → SELL LIMIT; BUY + DCA dưới giá entry → BUY LIMIT
    order_type = (mt5.ORDER_TYPE_SELL_LIMIT if signal.action == "SELL"
                  else mt5.ORDER_TYPE_BUY_LIMIT)

    request = {
        "action":       mt5.TRADE_ACTION_PENDING,
        "symbol":       symbol,
        "volume":       signal.lot,
        "type":         order_type,
        "price":        dca_price,
        "deviation":    20,
        "magic":        123456,
        "comment":      "TelegramDCA",
        "type_time":    mt5.ORDER_TIME_GTC,
        "type_filling": filling,
    }
    if signal.sl is not None:
        request["sl"] = signal.sl
    if signal.tp is not None:
        request["tp"] = signal.tp

    result = mt5.order_send(request)
    if result is None or result.retcode != mt5.TRADE_RETCODE_DONE:
        retcode = result.retcode if result else "None"
        comment = result.comment if result else ""
        raise RuntimeError(f"DCA retcode={retcode} {comment}")

    return f"dca_ticket={result.order}"


def _close_single_position(pos) -> bool:
    tick = mt5.symbol_info_tick(pos.symbol)
    if not tick:
        return False
    symbol_info = mt5.symbol_info(pos.symbol)
    if not symbol_info:
        return False
    close_type = mt5.ORDER_TYPE_SELL if pos.type == mt5.ORDER_TYPE_BUY else mt5.ORDER_TYPE_BUY
    price = tick.bid if close_type == mt5.ORDER_TYPE_SELL else tick.ask
    result = mt5.order_send({
        "action":       mt5.TRADE_ACTION_DEAL,
        "symbol":       pos.symbol,
        "volume":       pos.volume,
        "type":         close_type,
        "position":     pos.ticket,
        "price":        price,
        "deviation":    20,
        "magic":        123456,
        "comment":      "TelegramCloseAll",
        "type_time":    mt5.ORDER_TIME_GTC,
        "type_filling": _get_filling_mode(symbol_info),
    })
    if result and result.retcode != mt5.TRADE_RETCODE_DONE:
        logging.warning(f"close_single retcode={result.retcode} {result.comment}")
    return bool(result and result.retcode == mt5.TRADE_RETCODE_DONE)


def _cancel_pending(ticket: int) -> bool:
    result = mt5.order_send({"action": mt5.TRADE_ACTION_REMOVE, "order": ticket})
    return bool(result and result.retcode == mt5.TRADE_RETCODE_DONE)


def _close_positions(symbol: str) -> str:
    symbol = _resolve_symbol(symbol)
    positions = mt5.positions_get(symbol=symbol)
    if not positions:
        return f"Không có vị thế nào cho {symbol}"

    closed = 0
    for pos in positions:
        tick = mt5.symbol_info_tick(symbol)
        if tick is None:
            continue
        close_type = mt5.ORDER_TYPE_SELL if pos.type == mt5.ORDER_TYPE_BUY else mt5.ORDER_TYPE_BUY
        price = tick.bid if close_type == mt5.ORDER_TYPE_SELL else tick.ask

        result = mt5.order_send({
            "action":      mt5.TRADE_ACTION_DEAL,
            "symbol":      symbol,
            "volume":      pos.volume,
            "type":        close_type,
            "position":    pos.ticket,
            "price":       price,
            "deviation":   20,
            "magic":       123456,
            "comment":     "TelegramClose",
            "type_time":   mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        })
        if result and result.retcode == mt5.TRADE_RETCODE_DONE:
            closed += 1

    return f"Đóng {closed}/{len(positions)} vị thế"


def _monitor_positions(
    account_id: str,
    name: str,
    result_queue: mp.Queue,
    stop_event: threading.Event,
):
    """
    Thread riêng: theo dõi positions mở mỗi 3 giây.
    Khi position biến mất (đóng bởi TP/SL/tay) → lấy deal từ history và push ngay.
    """
    open_positions: dict[int, dict] = {}  # ticket → thông tin lúc mở

    while not stop_event.is_set():
        try:
            current = mt5.positions_get() or []
            current_tickets = {pos.ticket for pos in current}

            # Ghi nhận positions mới xuất hiện
            for pos in current:
                if pos.ticket not in open_positions:
                    open_positions[pos.ticket] = {
                        "symbol":    pos.symbol,
                        "tradeType": "buy" if pos.type == mt5.ORDER_TYPE_BUY else "sell",
                        "lot":       pos.volume,
                        "openPrice": pos.price_open,
                        "openTime":  datetime.datetime.fromtimestamp(pos.time).isoformat(),
                    }

            # Phát hiện positions vừa đóng
            closed = set(open_positions.keys()) - current_tickets
            for ticket in closed:
                info = open_positions.pop(ticket)
                try:
                    deals = mt5.history_deals_get(position=ticket)
                    out = next((d for d in (deals or []) if d.entry == mt5.DEAL_ENTRY_OUT), None)
                    if out:
                        result_queue.put({
                            "account_id":    account_id,
                            "name":          name,
                            "trade_history": [{
                                "dealTicket": str(out.ticket),
                                "symbol":     info["symbol"],
                                "tradeType":  info["tradeType"],
                                "lot":        info["lot"],
                                "openPrice":  info["openPrice"],
                                "closePrice": out.price,
                                "profit":     round(out.profit + out.commission + out.swap, 2),
                                "openTime":   info["openTime"],
                                "closeTime":  datetime.datetime.fromtimestamp(out.time).isoformat(),
                            }],
                        })
                        logging.info(f"[{name}] Lệnh đóng: {info['symbol']} profit={out.profit:.2f}")

                        # TP/SL đóng → đóng các lệnh mở cùng symbol + hủy DCA pending
                        if out.reason in (mt5.DEAL_REASON_TP, mt5.DEAL_REASON_SL):
                            sym = info["symbol"]
                            others = [p for p in (mt5.positions_get(symbol=sym) or [])
                                      if p.magic == 123456]
                            for pos in others:
                                if _close_single_position(pos):
                                    logging.info(f"[{name}] Đóng lệnh liên quan ticket={pos.ticket}")
                            pending = [o for o in (mt5.orders_get(symbol=sym) or [])
                                       if o.magic == 123456]
                            for order in pending:
                                if _cancel_pending(order.ticket):
                                    logging.info(f"[{name}] Hủy DCA pending ticket={order.ticket}")
                except Exception as e:
                    logging.warning(f"[{name}] Lỗi lấy deal ticket={ticket}: {e}")

        except Exception as e:
            logging.warning(f"[{name}] monitor_positions lỗi: {e}")

        stop_event.wait(3)  # Kiểm tra mỗi 3 giây


def _close_all_positions() -> str:
    """Đóng tất cả lệnh mở + hủy tất cả pending orders của bot (magic=123456)."""
    positions = mt5.positions_get() or []
    bot_positions = [p for p in positions if p.magic == 123456]

    closed = 0
    for pos in bot_positions:
        if _close_single_position(pos):
            closed += 1

    pending = mt5.orders_get() or []
    cancelled = 0
    for order in [o for o in pending if o.magic == 123456]:
        if _cancel_pending(order.ticket):
            cancelled += 1

    return f"Đóng {closed}/{len(bot_positions)} lệnh, hủy {cancelled} pending"


def _reconnect(terminal_path: str, login: int, password: str, server: str) -> bool:
    mt5.shutdown()
    time.sleep(2)
    return mt5.initialize(path=terminal_path, login=login, password=password, server=server)


def worker_process(
    account_id: str,
    name: str,
    login: int,
    password: str,
    server: str,
    terminal_path: str,
    signal_queue: mp.Queue,
    result_queue: mp.Queue,
    at_lock: mp.Lock = None,
):
    """
    Process chính của mỗi worker.
    Chạy mãi: kết nối MT5 → chờ tín hiệu → đặt lệnh → báo kết quả.
    """
    logging.basicConfig(
        level=logging.INFO,
        format=f"%(asctime)s [%(levelname)s] [{name}] %(message)s",
    )

    # ── Kết nối MT5 lần đầu ──────────────────────────────────────────────
    # Retry tối đa 3 lần; nếu lỗi xác thực (sai ID/pass) → dừng ngay
    connected = False
    auth_failed = False
    _AUTH_KEYWORDS = ("authorization", "auth", "invalid account", "no ipo", "password", "login")
    for attempt in range(1, 4):
        if mt5.initialize(path=terminal_path, login=login, password=password, server=server):
            info = mt5.account_info()
            if info is not None:
                connected = True
                logging.info(f"Kết nối thành công | Balance: {info.balance} {info.currency}")
                break
            # initialize OK nhưng không lấy được account info
            err_code, err_msg = mt5.last_error()
            logging.error(f"account_info thất bại (lần {attempt}): ({err_code}) {err_msg}")
            mt5.shutdown()
            if any(kw in err_msg.lower() for kw in _AUTH_KEYWORDS):
                auth_failed = True
                break
        else:
            err_code, err_msg = mt5.last_error()
            logging.error(f"Kết nối thất bại lần {attempt}: ({err_code}) {err_msg}")
            if any(kw in err_msg.lower() for kw in _AUTH_KEYWORDS):
                auth_failed = True
                break
        if attempt < 3:
            time.sleep(attempt * 5)  # 5s, 10s

    if not connected:
        msg = ("Sai tài khoản hoặc mật khẩu MT5. Vui lòng kiểm tra lại."
               if auth_failed else "Không thể kết nối MT5 sau 3 lần thử")
        result_queue.put({
            "account_id": account_id,
            "name": name,
            "success": False,
            "message": msg,
            "startup": True,
        })
        return

    # Kiểm tra Algo Trading — MT5 reset về OFF khi terminal kết nối broker lần đầu.
    # Bật từ đây (sau khi kết nối) để tránh bị reset.
    term = mt5.terminal_info()
    if term and not term.trade_allowed:
        logging.warning("⚠️  Algo Trading TẮT — đang bật từ worker...")
        # Dùng cross-process lock để chỉ 1 worker gửi Ctrl+E tại 1 thời điểm
        lock_ctx = at_lock if at_lock else __import__("contextlib").nullcontext()
        for attempt in range(10):
            with lock_ctx:
                enable_algo_trading_by_path(terminal_path)
            time.sleep(2)
            term = mt5.terminal_info()
            if term and term.trade_allowed:
                logging.info("✅ Algo Trading đã BẬT")
                break
            logging.warning(f"Retry {attempt + 1}/10 bật Algo Trading...")
        else:
            logging.error("❌ Không bật được Algo Trading sau 10 lần thử")

    # Thêm các symbol hay dùng vào Market Watch
    symbols = os.environ.get("MT5_SYMBOLS", "XAUUSD,XAUUSDm,EURUSD,GBPUSD").split(",")
    for sym in symbols:
        sym = sym.strip()
        if sym and mt5.symbol_info(sym) is not None:
            mt5.symbol_select(sym, True)
            logging.info(f"Thêm {sym} vào Market Watch")

    # Báo startup thành công
    result_queue.put({"account_id": account_id, "name": name, "success": True, "startup": True})

    # Khởi động thread theo dõi positions
    stop_event = threading.Event()
    monitor_thread = threading.Thread(
        target=_monitor_positions,
        args=(account_id, name, result_queue, stop_event),
        daemon=True,
        name=f"monitor-{name}",
    )
    monitor_thread.start()

    # ── Vòng lặp chờ tín hiệu ────────────────────────────────────────────
    try:
        while True:
            try:
                item = signal_queue.get()

                if item == SHUTDOWN_SIGNAL:
                    logging.info("Nhận lệnh tắt")
                    break

                signal: TradeSignal
                signal_mode: str
                if isinstance(item, tuple):
                    signal, signal_mode = item
                else:
                    signal, signal_mode = item, "both"

                if mt5.account_info() is None:
                    logging.warning("Mất kết nối MT5, đang kết nối lại...")
                    if not _reconnect(terminal_path, login, password, server):
                        raise RuntimeError(f"Kết nối lại thất bại: {mt5.last_error()}")

                if signal.action in ("CLOSE", "CLOSE_ALL"):
                    msg = _close_all_positions() if signal.action == "CLOSE_ALL" else _close_positions(signal.symbol)
                else:
                    has_dca = signal.dca is not None

                    # Lọc theo signal mode
                    if signal_mode == "simple" and has_dca:
                        msg = "Bỏ qua (tín hiệu DCA, chế độ lệnh đơn)"
                    elif signal_mode == "dca" and not has_dca:
                        msg = "Bỏ qua (tín hiệu không có DCA, chế độ DCA)"
                    else:
                        # Đặt lệnh market
                        msg = _open_order(signal)
                        # Đặt DCA pending nếu có
                        if has_dca:
                            try:
                                msg += f" | {_open_dca_order(signal, signal.dca)}"
                            except Exception as e:
                                msg += f" | DCA thất bại: {e}"

                result_queue.put({
                    "account_id": account_id,
                    "name": name,
                    "success": True,
                    "message": msg,
                })

            except Exception as e:
                result_queue.put({
                    "account_id": account_id,
                    "name": name,
                    "success": False,
                    "message": str(e),
                })
    finally:
        stop_event.set()
        monitor_thread.join(timeout=5)

    mt5.shutdown()
