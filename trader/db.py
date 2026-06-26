import os
from typing import List, Tuple, Optional
from datetime import datetime, timezone

import requests

def _api(method: str, path: str = "", **kwargs):
    base = os.environ.get("APP_URL", "").rstrip("/")
    secret = os.environ.get("INTERNAL_API_SECRET", "")
    url = f"{base}/api/internal{path}"
    resp = requests.request(method, url, headers={"x-internal-secret": secret}, timeout=15, **kwargs)
    resp.raise_for_status()
    return resp.json()


def _to_tuple(acc) -> Optional[Tuple[str, str, int, str, str, Optional[str], str, float]]:
    try:
        login = int(acc["mt5Login"])
    except (ValueError, TypeError):
        import logging
        logging.warning(f"Bỏ qua tài khoản '{acc.get('name')}': mt5Login không hợp lệ ({acc.get('mt5Login')})")
        return None
    return (
        acc["id"],
        acc["name"],
        login,
        acc["mt5Password"],
        acc["mt5Server"],
        acc.get("terminalPath"),
        acc.get("signalMode", "both"),
        float(acc.get("lot", 0.01)),
    )


def get_all_account_ids() -> dict[str, dict]:
    """Trả về {id: {isActive, signalMode, lot}} cho tất cả account."""
    return {a["id"]: {"isActive": a["isActive"], "signalMode": a.get("signalMode", "both"), "lot": float(a.get("lot", 0.01))}
            for a in _api("GET", "?type=all")}


def get_all_terminal_paths() -> list[str]:
    """Trả về danh sách terminalPath của TẤT CẢ account (kể cả inactive)."""
    return [a["terminalPath"] for a in _api("GET", "?type=all")
            if a.get("terminalPath")]


def get_active_accounts() -> List[Tuple[str, str, int, str, str, Optional[str]]]:
    return [t for a in _api("GET", "?type=active") if (t := _to_tuple(a)) is not None]


def get_all_accounts() -> List[Tuple[str, str, int, str, str, Optional[str]]]:
    """Trả về tất cả account kể cả inactive (để provision MT5 khi restart)."""
    return [t for a in _api("GET", "?type=all") if (t := _to_tuple(a)) is not None]


def get_pending_accounts() -> List[Tuple[str, str, int, str, str, Optional[str]]]:
    return [t for a in _api("GET", "?type=pending") if (t := _to_tuple(a)) is not None]


def update_account_status(account_id: str, status: str):
    _api("PATCH", f"?id={account_id}&action=status&value={status}")


def set_terminal_path(account_id: str, terminal_path: str):
    import urllib.parse
    encoded = urllib.parse.quote(terminal_path, safe="")
    _api("PATCH", f"?id={account_id}&action=terminal&value={encoded}")


def log_trade(signal_text: str, status: str, result: str):
    _api("POST", "", json={"signal": signal_text, "status": status, "result": result})


def push_trade_history(account_id: str, deal: dict):
    _api("POST", "", json={"type": "trade", "accountId": account_id, **deal})
