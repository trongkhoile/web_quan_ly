"""
Script tuỳ chọn — launch lại tất cả MT5 terminal (dùng khi restart máy).
Thường không cần vì main.py tự xử lý.

Chạy: python setup.py
"""

import os, sys, time, logging
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from db import get_active_accounts
from terminal_manager import launch_terminal, is_terminal_running, wait_for_terminals

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")

def main():
    accounts = get_active_accounts()
    has_terminal = [a for a in accounts if a[5] and os.path.exists(a[5])]

    if not has_terminal:
        print("Chưa có terminal nào. Hãy đăng ký tài khoản và chạy main.py để tự động provision.")
        return

    print(f"Launch {len(has_terminal)} terminal...")
    launched = []
    for acc_id, name, login, password, server, terminal_path in has_terminal:
        if is_terminal_running(terminal_path):
            print(f"  [{name}] Đang chạy rồi, bỏ qua")
        else:
            launch_terminal(terminal_path, int(login), password, server)
            launched.append((name, terminal_path))
            print(f"  [{name}] Đã launch")

    if launched:
        print(f"Chờ {len(launched)} terminal khởi động...")
        wait_for_terminals([t for _, t in launched])
        time.sleep(5)

    print("Xong! Bây giờ chạy: python main.py")

if __name__ == "__main__":
    main()
