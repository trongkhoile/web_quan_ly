import os
from typing import List, Tuple, Optional
from datetime import datetime, timezone

import psycopg2
import psycopg2.extras


def _conn():
    url = os.environ.get("DATABASE_URL", "")
    last_err = None
    for _ in range(3):
        try:
            return psycopg2.connect(url, connect_timeout=15)
        except psycopg2.OperationalError as e:
            last_err = e
            import time; time.sleep(3)
    raise last_err


def get_active_accounts() -> List[Tuple[str, str, int, str, str, Optional[str]]]:
    """Trả về (id, name, mt5Login, mt5Password, mt5Server, terminalPath) — chỉ tài khoản đã kết nối."""
    with _conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, name, TRIM(mt5Login), TRIM(mt5Password), TRIM(mt5Server), terminalPath
                FROM "Mt5Account"
                WHERE "isActive" = true AND status = 'connected'
            """)
            return cur.fetchall()


def get_pending_accounts() -> List[Tuple[str, str, int, str, str, Optional[str]]]:
    """Tài khoản mới chưa xác thực kết nối."""
    with _conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, name, TRIM(mt5Login), TRIM(mt5Password), TRIM(mt5Server), terminalPath
                FROM "Mt5Account"
                WHERE "isActive" = true AND status = 'pending'
            """)
            return cur.fetchall()


def update_account_status(account_id: str, status: str):
    """Cập nhật status: pending | connected | failed."""
    with _conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                'UPDATE "Mt5Account" SET status = %s, "updatedAt" = %s WHERE id = %s',
                (status, _now(), account_id),
            )
        conn.commit()


def set_terminal_path(account_id: str, terminal_path: str):
    """Gán đường dẫn terminal cho 1 tài khoản."""
    with _conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                'UPDATE "Mt5Account" SET "terminalPath" = %s, "updatedAt" = %s WHERE id = %s',
                (terminal_path, _now(), account_id),
            )
        conn.commit()


def log_trade(signal_text: str, status: str, result: str):
    with _conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                'INSERT INTO "TradeLog" (id, signal, status, result, "createdAt") VALUES (%s, %s, %s, %s, %s)',
                (_cuid(), signal_text, status, result, _now()),
            )
        conn.commit()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _cuid() -> str:
    import random, string, time
    ts = hex(int(time.time() * 1000))[2:]
    rand = "".join(random.choices(string.ascii_lowercase + string.digits, k=16))
    return f"c{ts}{rand}"
