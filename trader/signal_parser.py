import re
from dataclasses import dataclass
from typing import Literal, Optional


@dataclass
class TradeSignal:
    action: Literal["BUY", "SELL", "CLOSE"]
    symbol: str
    entry: Optional[float] = None
    sl: Optional[float] = None
    tp: Optional[float] = None
    dca: Optional[float] = None
    lot: float = 0.01


# Từ không phải symbol dù toàn chữ hoa
_NOT_SYMBOL = {"BUY", "SELL", "CLOSE", "PRO", "SIGNAL", "TRADE", "ALERT",
               "ENTRY", "STOP", "TAKE", "PROFIT", "LOSS", "LOT", "TP", "SL"}


def _strip_emojis(text: str) -> str:
    """Xóa tất cả ký tự non-ASCII (emoji, unicode đặc biệt)."""
    return re.sub(r"[^\x00-\x7F]+", "", text)


def _parse_float(raw: str) -> Optional[float]:
    """Chuyển chuỗi số (có thể có dấu phẩy ngàn) thành float."""
    cleaned = re.sub(r"[^\d.]", "", raw.strip())
    try:
        return float(cleaned) if cleaned else None
    except ValueError:
        return None


def parse_signal(text: str) -> Optional[TradeSignal]:
    """
    Nhận dạng tín hiệu dạng:

        🔴 SELL PRO - XAUUSD          hoặc   BUY XAUUSD
        💰 Entry: 4185.46
        🛑 SL: 4191.02
        🎯 TP: 4182.68

        CLOSE XAUUSD
    """
    clean = _strip_emojis(text)
    lines = [l.strip() for l in clean.splitlines() if l.strip()]
    if not lines:
        return None

    first = lines[0].upper()

    # CLOSE XAUUSD
    m = re.search(r"\bCLOSE\s+([A-Z][A-Z0-9]{1,9})\b", first)
    if m:
        return TradeSignal(action="CLOSE", symbol=m.group(1))

    # Tìm BUY hoặc SELL trên dòng đầu
    action_m = re.search(r"\b(BUY|SELL)\b", first)
    if not action_m:
        return None
    action = action_m.group(1)

    # Symbol là từ viết hoa cuối cùng trên dòng đầu (sau BUY/SELL)
    after_action = first[action_m.end():]
    tokens = re.findall(r"[A-Z][A-Z0-9]{1,9}", after_action)
    symbol = None
    for tok in reversed(tokens):
        if tok not in _NOT_SYMBOL:
            symbol = tok
            break
    if not symbol:
        return None

    def get_value(key: str) -> Optional[float]:
        for line in lines:
            if line.upper().startswith(key + ":"):
                return _parse_float(line.split(":", 1)[1])
        return None

    return TradeSignal(
        action=action,
        symbol=symbol,
        entry=get_value("ENTRY"),
        sl=get_value("SL"),
        tp=get_value("TP"),
        dca=get_value("DCA"),
        lot=get_value("LOT") or 0.01,
    )
