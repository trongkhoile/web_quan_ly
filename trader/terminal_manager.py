"""
Quản lý các MT5 Portable terminal.
Mỗi tài khoản có 1 thư mục riêng chứa terminal64.exe + data từ MT5 gốc.
"""

import configparser
import glob
import io
import os
import shutil
import subprocess
import threading
import time
import logging

logger = logging.getLogger(__name__)

TERMINALS_DIR = os.path.join(os.path.dirname(__file__), "..", "mt5_terminals")

# Lock đảm bảo chỉ 1 thread tạo terminal tại 1 thời điểm (tránh race condition)
_create_lock = threading.Lock()
# Lock đảm bảo chỉ 1 thread gửi keyboard event tại 1 thời điểm
_keyboard_lock = threading.Lock()


def _find_main_config_dir() -> str | None:
    """
    Tìm thư mục config của MT5 đã cài đặt — nơi chứa servers.dat, accounts.dat, common.ini.
    Đây là {GUID}/config/ trong AppData.
    """
    appdata = os.environ.get("APPDATA", "")
    pattern = os.path.join(appdata, "MetaQuotes", "Terminal", "*", "config")
    matches = [
        p for p in glob.glob(pattern)
        if os.path.isdir(p) and os.path.exists(os.path.join(p, "servers.dat"))
    ]
    if not matches:
        return None
    return max(matches, key=lambda p: os.path.getmtime(os.path.join(p, "servers.dat")))


def _update_common_ini(config_dir: str, login: int, server: str):
    """
    Cập nhật login và server trong common.ini (giữ nguyên mọi settings khác như
    Algo Trading enabled, chart profiles, notification settings...).
    MT5 dùng lowercase key: login, server (không phải Login/LastServer).
    """
    ini_path = os.path.join(config_dir, "common.ini")
    if not os.path.exists(ini_path):
        return

    # Đọc file — MT5 dùng UTF-16
    content = ""
    enc_used = "utf-8"
    for enc in ("utf-16", "utf-8", "latin-1"):
        try:
            with open(ini_path, encoding=enc) as f:
                content = f.read()
            enc_used = enc
            break
        except Exception:
            pass

    cfg = configparser.RawConfigParser()
    cfg.optionxform = str.lower  # Normalize về lowercase để tránh key trùng (Enabled vs enabled)
    cfg.read_string(content)

    if not cfg.has_section("Common"):
        cfg.add_section("Common")

    # MT5 dùng lowercase keys trong common.ini
    cfg.set("Common", "login", str(login))
    cfg.set("Common", "server", server)

    # Xóa environment hash — khi portable terminal thấy hash không khớp sẽ reset
    # mọi settings về default (Algo Trading = OFF). Để trống → terminal tự tạo hash mới.
    if cfg.has_option("Common", "environment"):
        cfg.remove_option("Common", "environment")

    # Đảm bảo Algo Trading bật ngay từ đầu
    if not cfg.has_section("Experts"):
        cfg.add_section("Experts")
    cfg.set("Experts", "enabled", "1")

    buf = io.StringIO()
    cfg.write(buf, space_around_delimiters=False)  # MT5 cần "key=value" không phải "key = value"
    updated = buf.getvalue()

    with open(ini_path, "w", encoding=enc_used) as f:
        f.write(updated)


def get_terminal_path(index: int) -> str:
    folder = os.path.join(TERMINALS_DIR, f"T{index:03d}")
    return os.path.join(folder, "terminal64.exe")


def create_terminal(base_exe: str, index: int, login: int = 0, server: str = "") -> str:
    """
    Tạo 1 portable terminal mới:
    1. Copy terminal64.exe
    2. Copy servers.dat + certificates từ MT5 gốc → terminal mới biết broker ngay
    3. Ghi common.ini với login/server pre-configured → bỏ qua dialog 'Open an Account'
    """
    folder = os.path.join(TERMINALS_DIR, f"T{index:03d}")
    os.makedirs(folder, exist_ok=True)
    dest = os.path.join(folder, "terminal64.exe")

    if not os.path.exists(dest):
        logger.info(f"Copy terminal64.exe → {dest}")
        shutil.copy2(base_exe, dest)

    # Thư mục config của portable terminal (tương đương {GUID}/config/ của MT5 gốc)
    config_dst = os.path.join(folder, "config")
    os.makedirs(config_dst, exist_ok=True)

    main_cfg = _find_main_config_dir()
    if main_cfg:
        for fname, is_dir in [("servers.dat", False), ("certificates", True)]:
            src = os.path.join(main_cfg, fname)
            dst = os.path.join(config_dst, fname)
            if not os.path.exists(dst):
                if is_dir and os.path.isdir(src):
                    shutil.copytree(src, dst)
                    logger.info(f"Copy {fname}/ → {dst}")
                elif not is_dir and os.path.exists(src):
                    shutil.copy2(src, dst)
                    logger.info(f"Copy {fname} ({os.path.getsize(src)} bytes) → {dst}")

        # Copy common.ini nguyên vẹn từ main terminal (chứa settings tắt dialog welcome,
        # trạng thái Algo Trading và nhiều preferences khác đã cấu hình)
        src_common = os.path.join(main_cfg, "common.ini")
        dst_common = os.path.join(config_dst, "common.ini")
        if os.path.exists(src_common) and not os.path.exists(dst_common):
            shutil.copy2(src_common, dst_common)
            logger.info(f"Copy common.ini ({os.path.getsize(src_common)} bytes) từ MT5 gốc")
    else:
        logger.warning("Không tìm thấy config MT5 gốc (servers.dat)")

    # Cập nhật Login/Server trong common.ini cho tài khoản này
    if login and server:
        try:
            _update_common_ini(config_dst, login, server)
            logger.info(f"Cập nhật common.ini: Login={login} Server={server}")
        except Exception as e:
            logger.warning(f"Không cập nhật được common.ini: {e}")

    return dest


def next_available_index() -> int:
    """Chỉ gọi khi đang giữ _create_lock."""
    os.makedirs(TERMINALS_DIR, exist_ok=True)
    existing = set()
    for name in os.listdir(TERMINALS_DIR):
        if name.startswith("T") and os.path.isdir(os.path.join(TERMINALS_DIR, name)):
            try:
                existing.add(int(name[1:]))
            except ValueError:
                pass
    i = 1
    while i in existing:
        i += 1
    return i


def allocate_terminal(base_exe: str, login: int = 0, server: str = "") -> str:
    """Thread-safe: lấy index mới và tạo terminal trong 1 bước atomic."""
    with _create_lock:
        idx = next_available_index()
        return create_terminal(base_exe, idx, login=login, server=server)


def is_terminal_running(terminal_path: str) -> bool:
    import psutil
    norm = os.path.normcase(terminal_path)
    for proc in psutil.process_iter(["exe"]):
        try:
            if proc.info["exe"] and os.path.normcase(proc.info["exe"]) == norm:
                return True
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    return False


def launch_terminal(terminal_path: str, login: int, password: str, server: str) -> subprocess.Popen:
    """Launch MT5 portable, sau đó tự động điền mật khẩu vào dialog Login nếu xuất hiện."""
    terminal_dir = os.path.dirname(terminal_path)
    proc = subprocess.Popen(
        [
            terminal_path,
            "/portable",
            f"/login:{login}",
            f"/server:{server}",
        ],
        cwd=terminal_dir,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    logger.info(f"Launch terminal PID={proc.pid} | login={login} server={server}")

    t = threading.Thread(
        target=_auto_fill_login_dialog,
        args=(proc.pid, str(password), terminal_path),
        daemon=True,
    )
    t.start()

    return proc


def _auto_fill_login_dialog(pid: int, password: str, terminal_path: str = "", timeout: int = 60):
    """
    Chờ dialog Login của MT5 xuất hiện rồi tự điền mật khẩu và click OK.
    Chạy trong background thread, không block luồng chính.
    """
    try:
        from pywinauto.application import Application
        import pywinauto

        # Chờ terminal khởi động xong (tối đa 30s)
        app = None
        connect_deadline = time.time() + 30
        while time.time() < connect_deadline:
            try:
                app = Application(backend="win32").connect(process=pid, timeout=2)
                break
            except Exception:
                time.sleep(1)

        if not app:
            logger.warning(f"PID={pid}: Không kết nối được terminal để auto-login")
            return

        # Chờ dialog Login tối đa 10s
        # (Nếu common.ini có credentials thì MT5 auto-login, không hiện dialog)
        login_done = False
        login_deadline = time.time() + 10
        while time.time() < login_deadline:
            try:
                dlg = app.window(title="Login")
                if dlg.exists(timeout=1):
                    edits = dlg.children(class_name="Edit")
                    if len(edits) >= 2:
                        edits[1].set_focus()
                        edits[1].type_keys(password, with_spaces=False)
                        time.sleep(0.3)
                        dlg.child_window(title="OK", class_name="Button").click()
                        logger.info(f"PID={pid}: Auto-login thành công")
                        login_done = True
                        break
            except pywinauto.findwindows.ElementNotFoundError:
                pass
            except Exception as e:
                logger.debug(f"PID={pid}: {e}")
            time.sleep(1)

        if not login_done:
            logger.info(f"PID={pid}: Auto-login từ config (không có dialog)")

        # Chờ MT5 render xong UI trước khi thao tác
        time.sleep(5)

        # Đóng mọi dialog phụ (Open an Account, wizards...)
        _close_cancel_dialogs(app, pid)
        # Không gửi Ctrl+E ở đây — MT5 reset trade_allowed về OFF khi kết nối broker.
        # Worker sẽ bật Algo Trading SAU KHI kết nối broker thành công.

    except Exception as e:
        logger.error(f"PID={pid}: Auto-login lỗi: {e}")


def _close_cancel_dialogs(app, pid: int):
    """
    Đóng mọi dialog phụ của MT5 có nút Cancel (Open an Account, wizard...).
    Dùng win32gui để tìm nút Cancel thực sự vì MT5 dùng custom controls.
    """
    try:
        import win32gui, win32con, win32process

        cancel_handles = []

        def _enum_child(hwnd, _):
            try:
                if win32gui.IsWindowVisible(hwnd) and win32gui.GetWindowText(hwnd) == "Cancel":
                    cancel_handles.append(hwnd)
            except Exception:
                pass

        def _enum_top(hwnd, _):
            try:
                _, wpid = win32process.GetWindowThreadProcessId(hwnd)
                if wpid == pid:
                    win32gui.EnumChildWindows(hwnd, _enum_child, None)
            except Exception:
                pass

        win32gui.EnumWindows(_enum_top, None)

        for hwnd in cancel_handles:
            win32gui.SendMessage(hwnd, win32con.BM_CLICK, 0, 0)
            logger.info(f"PID={pid}: Đóng dialog phụ (Cancel hwnd={hwnd})")
            time.sleep(0.3)

        if not cancel_handles:
            logger.debug(f"PID={pid}: Không tìm thấy nút Cancel nào")

    except Exception as e:
        logger.warning(f"PID={pid}: _close_cancel_dialogs lỗi: {e}")


def _get_family_pids(pid: int) -> set[int]:
    """Trả về PID của process và tất cả child processes (recursive)."""
    import psutil
    pids = {pid}
    try:
        for child in psutil.Process(pid).children(recursive=True):
            pids.add(child.pid)
    except Exception:
        pass
    return pids


def _enable_algo_trading(app, pid: int, terminal_path: str = ""):
    """
    Bật Algo Trading bằng Ctrl+E gửi trực tiếp qua win32api.
    Tìm window theo PATH (chính xác từng terminal) + PID family + retry loop.
    MT5 có thể mất 20s mới render main window nên cần chờ.
    """
    try:
        import win32gui, win32con, win32process, win32api
        import psutil

        # Thu thập tất cả PIDs: family của launcher + process đang chạy exe này
        target_pids = _get_family_pids(pid)
        if terminal_path:
            norm = os.path.normcase(os.path.abspath(terminal_path))
            for proc in psutil.process_iter(["exe", "pid"]):
                try:
                    if proc.info["exe"] and os.path.normcase(proc.info["exe"]) == norm:
                        target_pids.add(proc.pid)
                except Exception:
                    pass
        logger.info(f"PID={pid}: target PIDs = {target_pids}")

        # Log toàn bộ visible windows để debug PID mismatch
        all_wins = []
        def _all_cb(hwnd, _):
            if win32gui.IsWindowVisible(hwnd):
                _, wpid = win32process.GetWindowThreadProcessId(hwnd)
                t = win32gui.GetWindowText(hwnd)
                if t:
                    all_wins.append((wpid, t[:50]))
        win32gui.EnumWindows(_all_cb, None)
        mt5_like = [(p, t) for p, t in all_wins if "MetaTrader" in t or "Exness" in t or "terminal" in t.lower()]
        logger.info(f"PID={pid}: MT5-like windows = {mt5_like}")

        # Retry tìm window — MT5 có thể chưa render main window ngay lập tức
        main_hwnd = None
        for attempt in range(10):   # Tối đa 20s
            found = []

            def _cb(hwnd, _):
                if not win32gui.IsWindowVisible(hwnd):
                    return
                _, wpid = win32process.GetWindowThreadProcessId(hwnd)
                if wpid in target_pids:
                    title = win32gui.GetWindowText(hwnd)
                    found.append((hwnd, title))

            win32gui.EnumWindows(_cb, None)

            if found:
                found.sort(key=lambda x: len(x[1]), reverse=True)
                logger.info(f"PID={pid}: matched windows = {[(t[:30],) for _, t in found[:3]]}")
                main_hwnd = found[0][0]
                break

            logger.info(f"PID={pid}: chưa thấy MT5 window (lần {attempt+1}/10), thử lại 2s...")
            time.sleep(2)

        if not main_hwnd:
            logger.warning(f"PID={pid}: Không tìm thấy MT5 main window để bật Algo Trading")
            return

        # Serialize: chỉ 1 thread gửi key tại 1 thời điểm để tránh race condition
        with _keyboard_lock:
            # Restore nếu minimize
            win32gui.ShowWindow(main_hwnd, 9)  # SW_RESTORE
            time.sleep(0.3)

            # AttachThreadInput trick: bypass Windows foreground restriction
            fg_hwnd = win32gui.GetForegroundWindow()
            fg_tid  = win32process.GetWindowThreadProcessId(fg_hwnd)[0]
            mt5_tid = win32process.GetWindowThreadProcessId(main_hwnd)[0]
            if fg_tid != mt5_tid:
                win32process.AttachThreadInput(fg_tid, mt5_tid, True)
            win32gui.SetForegroundWindow(main_hwnd)
            if fg_tid != mt5_tid:
                win32process.AttachThreadInput(fg_tid, mt5_tid, False)
            time.sleep(0.5)   # Chờ window lấy focus ổn định

            # Gửi Ctrl+E
            win32api.keybd_event(win32con.VK_CONTROL, 0, 0, 0)
            win32api.keybd_event(ord('E'), 0, 0, 0)
            time.sleep(0.1)
            win32api.keybd_event(ord('E'), 0, win32con.KEYEVENTF_KEYUP, 0)
            win32api.keybd_event(win32con.VK_CONTROL, 0, win32con.KEYEVENTF_KEYUP, 0)
            time.sleep(0.5)   # Chờ MT5 xử lý event xong trước khi nhả lock
            logger.info(f"PID={pid}: ✅ Bật Algo Trading (Ctrl+E via win32)")

    except Exception as e:
        logger.warning(f"PID={pid}: Không bật được Algo Trading: {e}")


def enable_algo_trading_by_path(terminal_path: str) -> bool:
    """
    Gửi Ctrl+E đến MT5 terminal xác định bằng đường dẫn exe.
    Gọi từ worker process SAU KHI đã kết nối broker (tránh bị MT5 reset).
    Không dùng _keyboard_lock vì mỗi worker là process riêng biệt.
    """
    try:
        import psutil
        import win32gui, win32con, win32process, win32api

        norm = os.path.normcase(os.path.abspath(terminal_path))
        target_pids = set()
        for proc in psutil.process_iter(["exe", "pid"]):
            try:
                if proc.info["exe"] and os.path.normcase(proc.info["exe"]) == norm:
                    target_pids.add(proc.pid)
            except Exception:
                pass

        if not target_pids:
            logger.warning(f"enable_algo_trading_by_path: không tìm thấy process {terminal_path}")
            return False

        # Tìm window có title dài nhất (main trading window khi đã kết nối)
        found = []
        def _cb(hwnd, _):
            if not win32gui.IsWindowVisible(hwnd):
                return
            _, wpid = win32process.GetWindowThreadProcessId(hwnd)
            if wpid in target_pids:
                title = win32gui.GetWindowText(hwnd)
                if title:
                    found.append((hwnd, title))
        win32gui.EnumWindows(_cb, None)

        if not found:
            logger.warning("enable_algo_trading_by_path: không tìm thấy MT5 window")
            return False

        found.sort(key=lambda x: len(x[1]), reverse=True)
        main_hwnd = found[0][0]

        # Focus + Ctrl+E
        win32gui.ShowWindow(main_hwnd, 9)
        time.sleep(0.2)

        fg_hwnd = win32gui.GetForegroundWindow()
        fg_tid  = win32process.GetWindowThreadProcessId(fg_hwnd)[0]
        mt5_tid = win32process.GetWindowThreadProcessId(main_hwnd)[0]
        if fg_tid != mt5_tid:
            win32process.AttachThreadInput(fg_tid, mt5_tid, True)
        win32gui.SetForegroundWindow(main_hwnd)
        if fg_tid != mt5_tid:
            win32process.AttachThreadInput(fg_tid, mt5_tid, False)
        time.sleep(0.5)

        win32api.keybd_event(win32con.VK_CONTROL, 0, 0, 0)
        win32api.keybd_event(ord('E'), 0, 0, 0)
        time.sleep(0.1)
        win32api.keybd_event(ord('E'), 0, win32con.KEYEVENTF_KEYUP, 0)
        win32api.keybd_event(win32con.VK_CONTROL, 0, win32con.KEYEVENTF_KEYUP, 0)
        time.sleep(0.5)

        logger.info(f"Ctrl+E → '{found[0][1][:45]}'")
        return True

    except Exception as e:
        logger.warning(f"enable_algo_trading_by_path lỗi: {e}")
        return False


def wait_for_terminals(terminal_paths: list[str], timeout: int = 30):
    start = time.time()
    remaining = set(terminal_paths)
    while remaining and (time.time() - start) < timeout:
        for path in list(remaining):
            if is_terminal_running(path):
                remaining.discard(path)
        if remaining:
            time.sleep(1)
    if remaining:
        logger.warning(f"{len(remaining)} terminal chưa khởi động sau {timeout}s")


def kill_terminal(terminal_path: str) -> int:
    """Kill toàn bộ process đang chạy terminal_path (kể cả child process)."""
    import psutil
    norm = os.path.normcase(os.path.abspath(terminal_path))
    pids_to_kill: set[int] = set()

    for proc in psutil.process_iter(["exe", "pid"]):
        try:
            if proc.info["exe"] and os.path.normcase(proc.info["exe"]) == norm:
                pids_to_kill.update(_get_family_pids(proc.info["pid"]))
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass

    killed = 0
    for pid in pids_to_kill:
        try:
            psutil.Process(pid).kill()
            killed += 1
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass

    if killed:
        logger.info(f"kill_terminal: đã kill {killed} process của {os.path.basename(terminal_path)}")
    return killed
