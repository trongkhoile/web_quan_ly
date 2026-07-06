import re
from dataclasses import dataclass
from typing import Literal, Optional


@dataclass
class TradeSignal:
    action: Literal["BUY", "SELL", "CLOSE", "CLOSE_ALL", "CLOSE_SIMPLE", "CLOSE_DCA", "CLOSE_M1", "CLOSE_M5"]
    symbol: str
    entry: Optional[float] = None
    sl: Optional[float] = None
    tp: Optional[float] = None
    dca: Optional[float] = None
    lot: float = 0.01


# Từ không phải symbol dù toàn chữ hoa
_NOT_SYMBOL = {"BUY", "SELL", "CLOSE", "PRO", "VIP", "SUPERVIP", "SIGNAL", "TRADE", "ALERT",
               "ENTRY", "STOP", "TAKE", "PROFIT", "LOSS", "LOT", "TP", "SL",
               "DCA", "STANDARD", "PREMIUM", "MINI", "MICRO", "ORDER", "LIMIT",
               "WIN", "PIPS", "GOING"}


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

        ✅ WIN SELL VIP   → đóng tất cả lệnh đơn (CLOSE_SIMPLE)
        ❌ LOSS BUY PRO   → đóng tất cả lệnh DCA (CLOSE_DCA)
    """
    clean = _strip_emojis(text)
    lines = [l.strip() for l in clean.splitlines() if l.strip()]
    if not lines:
        return None

    first = lines[0].upper()

    # WIN/LOSS SUPERVIP → đóng tất cả lệnh M1 (comment="m1")
    if re.search(r"\b(WIN|LOSS)\b", first) and re.search(r"\bSUPERVIP\b", first):
        return TradeSignal(action="CLOSE_M1", symbol="")

    # WIN/LOSS VIP → đóng tất cả lệnh đơn (comment="lenhdon")
    if re.search(r"\b(WIN|LOSS)\b", first) and re.search(r"\bVIP\b", first):
        return TradeSignal(action="CLOSE_SIMPLE", symbol="")

    # WIN/LOSS PRO → đóng tất cả lệnh DCA (comment="dca") hoặc M5 (remap trong main.py)
    if re.search(r"\b(WIN|LOSS)\b", first) and re.search(r"\bPRO\b", first):
        return TradeSignal(action="CLOSE_DCA", symbol="")

    # CLOSE XAUUSD
    m = re.search(r"\bCLOSE\s+([A-Z][A-Z0-9]{1,9})\b", first)
    if m:
        return TradeSignal(action="CLOSE", symbol=m.group(1))

    # Bỏ qua tin thông báo (đã khớp, đã đóng, v.v.) — không phải tín hiệu mới
    _IGNORE_KEYWORDS = ("DA KHOP", "KHOP LENH", "DA DONG", "DA MO", "PENDING", "FILLED")
    if any(kw in first for kw in _IGNORE_KEYWORDS):
        return None

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
        # Fallback: tìm symbol trên các dòng tiếp theo (ví dụ "- XAUUSD" trên dòng 2)
        for line in lines[1:]:
            upper = line.upper()
            if any(upper.startswith(k) for k in ("ENTRY", "SL", "TP", "DCA", "LOT")):
                break
            toks = re.findall(r"[A-Z][A-Z0-9]{1,9}", upper)
            for tok in reversed(toks):
                if tok not in _NOT_SYMBOL:
                    symbol = tok
                    break
            if symbol:
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
