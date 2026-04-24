import ui

# ========== Win32 API ==========
proc MessageBoxA(hWnd: pointer, lpText: cstring, lpCaption: cstring, uType: uint32): int32
  {.stdcall, dynlib: "user32", importc.}

const
  MB_OK = 0x00000000'u32
  MB_ICONINFORMATION = 0x00000040'u32

# ========== 全局变量（用户状态） ==========
var
  counter*: int = 0
  inputText*: string = ""
  checkboxValue*: bool = false
  sliderValue*: float32 = 50.0f
  colorValue*: array[4, float32] = [1.0f, 0.5f, 0.2f, 1.0f]
  comboIndex*: int32 = 0

# ========== 工具函数 ==========
proc showInfo*(title, message: string) =
  discard MessageBoxA(nil, message.cstring, title.cstring, MB_OK or MB_ICONINFORMATION)

# ========== 生命周期 ==========
proc onInit*() =
  echo "应用初始化"

proc onUpdate*() =
  discard

proc onShutdown*() =
  echo "应用关闭"

# ========== 计数按钮事件 ==========
proc on计数按钮_被单击*() =
  inc counter

# ========== 新按钮事件 ==========
proc on新按钮_被单击*() =
  inputText = "新按钮被点击！"
  sliderValue = 100.0f
  showInfo("提示", "你点击了新按钮！\n计数器: " & $counter)

proc on新按钮_鼠标移入*() =
  inputText = "鼠标移入新按钮"

# ========== 输入框事件 ==========
proc on输入框_内容变化*(text: string) =
  inputText = text
