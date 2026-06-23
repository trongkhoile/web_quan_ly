"""
Đọc button IDs từ toolbar "Standard" của MT5.
Chạy khi MT5 đang mở.
"""

import ctypes
import struct
import win32gui
import win32process

TB_BUTTONCOUNT = 0x0418
TB_GETBUTTON   = 0x0417
TBBUTTON_SIZE  = 32      # 64-bit Windows

TBSTATE_CHECKED = 0x01
TBSTYLE_CHECK   = 0x02
TBSTATE_ENABLED = 0x04

PROCESS_ALL_ACCESS = 0x1F0FFF

user32   = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32


def read_toolbar_buttons(toolbar_hwnd: int) -> list[dict]:
    _, pid = win32process.GetWindowThreadProcessId(toolbar_hwnd)

    btn_count = user32.SendMessageW(toolbar_hwnd, TB_BUTTONCOUNT, 0, 0)
    if btn_count <= 0:
        return []

    h_proc = kernel32.OpenProcess(PROCESS_ALL_ACCESS, False, pid)
    if not h_proc:
        print(f"  OpenProcess(pid={pid}) thất bại — thử chạy script với quyền Admin")
        return []

    remote = kernel32.VirtualAllocEx(
        h_proc, ctypes.c_void_p(0), TBBUTTON_SIZE, 0x3000, 0x04)
    if not remote:
        print("  VirtualAllocEx thất bại")
        kernel32.CloseHandle(h_proc)
        return []

    buttons = []
    for i in range(btn_count):
        # Xóa bộ nhớ remote trước khi đọc
        zero = ctypes.create_string_buffer(TBBUTTON_SIZE)
        written = ctypes.c_size_t()
        kernel32.WriteProcessMemory(h_proc, remote, zero, TBBUTTON_SIZE, ctypes.byref(written))

        # Yêu cầu MT5 ghi TBBUTTON vào remote memory
        user32.SendMessageW(toolbar_hwnd, TB_GETBUTTON, i, remote)

        # Đọc lại từ remote memory
        buf = ctypes.create_string_buffer(TBBUTTON_SIZE)
        n   = ctypes.c_size_t()
        kernel32.ReadProcessMemory(h_proc, remote, buf, TBBUTTON_SIZE, ctypes.byref(n))

        iBitmap, idCommand = struct.unpack_from('<ii', buf.raw, 0)
        fsState, fsStyle   = struct.unpack_from('<BB', buf.raw, 8)

        buttons.append({
            "index":   i,
            "id":      idCommand,
            "state":   fsState,
            "style":   fsStyle,
            "checked": bool(fsState & TBSTATE_CHECKED),
            "toggle":  bool(fsStyle & TBSTYLE_CHECK),
            "enabled": bool(fsState & TBSTATE_ENABLED),
        })

    kernel32.VirtualFreeEx(h_proc, remote, 0, 0x8000)
    kernel32.CloseHandle(h_proc)
    return buttons


# ── Tìm MT5 main window ──────────────────────────────────────────────────
mt5_windows = []
def _top(hwnd, _):
    if win32gui.IsWindowVisible(hwnd):
        t = win32gui.GetWindowText(hwnd)
        if "Exness" in t or "MetaTrader" in t:
            mt5_windows.append((hwnd, t))
win32gui.EnumWindows(_top, None)

if not mt5_windows:
    print("Không tìm thấy MT5! Chạy 'python main.py' trước.")
    exit(1)

for hwnd, title in mt5_windows:
    print(f"\n{'='*70}")
    print(f"MT5 hwnd={hwnd}: {title[:60]}")

    # Tìm tất cả ToolbarWindow32 con
    toolbars = []
    def _find_tb(h, _):
        if win32gui.GetClassName(h) == "ToolbarWindow32":
            txt = win32gui.GetWindowText(h)
            vis = win32gui.IsWindowVisible(h)
            r   = win32gui.GetWindowRect(h)
            w   = r[2] - r[0]
            toolbars.append((h, txt, vis, w))
    win32gui.EnumChildWindows(hwnd, _find_tb, None)

    for tb_hwnd, tb_text, tb_vis, tb_w in toolbars:
        if not tb_vis:
            continue
        buttons = read_toolbar_buttons(tb_hwnd)
        if not buttons:
            continue

        print(f"\n  Toolbar '{tb_text}' (hwnd={tb_hwnd}, w={tb_w})  — {len(buttons)} buttons:")
        print(f"  {'idx':>3}  {'id':>7}  {'ON':>4}  {'toggle':>6}  {'enabled':>7}")
        print(f"  {'-'*45}")
        for b in buttons:
            on_str  = "ON " if b["checked"] else "off"
            tog_str = "yes" if b["toggle"]  else "no"
            ena_str = "yes" if b["enabled"] else "no"
            print(f"  {b['index']:>3}  {b['id']:>7}  {on_str:>4}  {tog_str:>6}  {ena_str:>7}")
