#include <windows.h>
#include <tlhelp32.h>

#include <chrono>
#include <iostream>
#include <sstream>
#include <string>
#include <thread>
#include <unordered_set>

namespace {
std::unordered_set<DWORD> descendants;
HWND chromeWindow = nullptr;

void collectDescendants(DWORD root) {
  descendants = {root};
  bool changed = true;
  while (changed) {
    changed = false;
    const HANDLE snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (snapshot == INVALID_HANDLE_VALUE) return;
    PROCESSENTRY32 entry{.dwSize = sizeof(PROCESSENTRY32)};
    if (Process32First(snapshot, &entry)) {
      do {
        if (!descendants.contains(entry.th32ProcessID) && descendants.contains(entry.th32ParentProcessID)) {
          descendants.insert(entry.th32ProcessID);
          changed = true;
        }
      } while (Process32Next(snapshot, &entry));
    }
    CloseHandle(snapshot);
  }
}

BOOL CALLBACK findChromeWindow(HWND window, LPARAM) {
  DWORD process = 0;
  GetWindowThreadProcessId(window, &process);
  if (!descendants.contains(process) || !IsWindowVisible(window) || GetWindow(window, GW_OWNER)) return TRUE;
  wchar_t className[64]{};
  GetClassName(window, className, 64);
  if (std::wstring(className) != L"Chrome_WidgetWin_1") return TRUE;
  chromeWindow = window;
  return FALSE;
}

HWND waitForChromeWindow(DWORD process) {
  for (int attempt = 0; attempt < 300; ++attempt) {
    collectDescendants(process);
    EnumWindows(findChromeWindow, 0);
    if (chromeWindow) return chromeWindow;
    std::this_thread::sleep_for(std::chrono::milliseconds(50));
  }
  return nullptr;
}

void setBounds(int x, int y, int width, int height) {
  if (chromeWindow) MoveWindow(chromeWindow, x, y, width, height, TRUE);
}
}

int wmain(int argc, wchar_t** argv) {
  if (argc != 8) return 2;
  SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2);
  const auto parent = reinterpret_cast<HWND>(std::stoull(argv[1], nullptr, 16));
  const DWORD process = std::stoul(argv[2]);
  const int x = std::stoi(argv[3]);
  const int y = std::stoi(argv[4]);
  const int width = std::stoi(argv[5]);
  const int height = std::stoi(argv[6]);
  const bool visible = std::wstring(argv[7]) == L"show";

  if (!IsWindow(parent) || !waitForChromeWindow(process)) return 3;
  ShowWindow(chromeWindow, SW_HIDE);
  SetLastError(0);
  if (!SetParent(chromeWindow, parent) && GetLastError()) return 4;
  SetWindowLongPtr(chromeWindow, GWL_STYLE, (GetWindowLongPtr(chromeWindow, GWL_STYLE) & ~WS_POPUP) | WS_CHILD | WS_CLIPCHILDREN | WS_CLIPSIBLINGS);
  SetWindowLongPtr(chromeWindow, GWL_EXSTYLE, GetWindowLongPtr(chromeWindow, GWL_EXSTYLE) & ~(WS_EX_APPWINDOW | WS_EX_TOPMOST));
  SetWindowPos(chromeWindow, HWND_TOP, x, y, width, height, SWP_FRAMECHANGED | SWP_NOACTIVATE | (visible ? SWP_SHOWWINDOW : SWP_HIDEWINDOW));
  std::cout << "ready" << std::endl;

  std::string line;
  while (IsWindow(parent) && IsWindow(chromeWindow) && std::getline(std::cin, line)) {
    std::istringstream command(line);
    std::string name;
    command >> name;
    if (name == "bounds") {
      int nextX = 0, nextY = 0, nextWidth = 0, nextHeight = 0;
      command >> nextX >> nextY >> nextWidth >> nextHeight;
      setBounds(nextX, nextY, nextWidth, nextHeight);
    }
    if (name == "show") ShowWindow(chromeWindow, SW_SHOW);
    if (name == "hide") ShowWindow(chromeWindow, SW_HIDE);
    if (name == "focus") SetFocus(chromeWindow);
    if (name == "close") break;
  }

  if (IsWindow(chromeWindow)) PostMessage(chromeWindow, WM_CLOSE, 0, 0);
  return 0;
}
