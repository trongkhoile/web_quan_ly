import sqlite3
import os
from typing import List, Tuple, Optional
from datetime import datetime, timezone

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "dev.db")


def get_active_accounts() -> List[Tuple[str, str, int, str, str, Optional[str]]]:
    """Trả về (id, name, mt5Login, mt5Password, mt5Server, terminalPath) — chỉ tài khoản đã kết nối."""
    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.execute("""
            SELECT id, name, TRIM(mt5Login), TRIM(mt5Password), TRIM(mt5Server), terminalPath
            FROM Mt5Account
            WHERE isActive = 1 AND status = 'connected'
        """)
        return cur.fetchall()
    finally:
        conn.close()


def get_pending_accounts() -> List[Tuple[str, str, int, str, str, Optional[str]]]:
    """Tài khoản mới chưa xác thực kết nối."""
    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.execute("""
            SELECT id, name, TRIM(mt5Login), TRIM(mt5Password), TRIM(mt5Server), terminalPath
            FROM Mt5Account
            WHERE isActive = 1 AND status = 'pending'
        """)
        return cur.fetchall()
    finally:
        conn.close()


def update_account_status(account_id: str, status: str):
    """Cập nhật status: pending | connected | failed."""
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute(
            "UPDATE Mt5Account SET status = ?, updatedAt = ? WHERE id = ?",
            (status, _now(), account_id),
        )
        conn.commit()
    finally:
        conn.close()


def set_terminal_path(account_id: str, terminal_path: str):
    """Gán đường dẫn terminal cho 1 tài khoản."""
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute(
            "UPDATE Mt5Account SET terminalPath = ?, updatedAt = ? WHERE id = ?",
            (terminal_path, _now(), account_id),
        )
        conn.commit()
    finally:
        conn.close()


def log_trade(signal_text: str, status: str, result: str):
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute(
            "INSERT INTO TradeLog (id, signal, status, result, createdAt) VALUES (?, ?, ?, ?, ?)",
            (_cuid(), signal_text, status, result, _now()),
        )
        conn.commit()
    finally:
        conn.close()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _cuid() -> str:
    import random, string, time
    ts = hex(int(time.time() * 1000))[2:]
    rand = "".join(random.choices(string.ascii_lowercase + string.digits, k=16))
    return f"c{ts}{rand}"
