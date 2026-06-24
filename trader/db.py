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


def _to_tuple(acc) -> Tuple[str, str, int, str, str, Optional[str]]:
    return (
        acc["id"],
        acc["name"],
        int(acc["mt5Login"]),
        acc["mt5Password"],
        acc["mt5Server"],
        acc.get("terminalPath"),
    )


def get_active_accounts() -> List[Tuple[str, str, int, str, str, Optional[str]]]:
    return [_to_tuple(a) for a in _api("GET", "?type=active")]


def get_pending_accounts() -> List[Tuple[str, str, int, str, str, Optional[str]]]:
    return [_to_tuple(a) for a in _api("GET", "?type=pending")]


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
