import nimgl/nimgl/glfw
import ui, logic

proc main() =
  doAssert glfwInit()

  let window = initWindow(WindowConfig(width: 1280, height: 800, title: "应用示例"))
  initImGui(window)

  var state = initApp()
  logic.onInit()

  let callbacks = LogicCallbacks(
    on计数按钮_被单击: logic.on计数按钮_被单击,
    on新按钮_被单击: logic.on新按钮_被单击,
    on新按钮_鼠标移入: logic.on新按钮_鼠标移入,
    on输入框_内容变化: logic.on输入框_内容变化
  )

  while not window.windowShouldClose:
    glfwPollEvents()
    newFrame()

    logic.onUpdate()

    # 同步全局变量到 state（用于显示）
    state.counter = logic.counter
    state.inputText = logic.inputText
    state.checkboxValue = logic.checkboxValue
    state.sliderValue = logic.sliderValue
    state.colorValue = logic.colorValue
    state.comboIndex = logic.comboIndex

    renderControlPanel(state, callbacks)
    renderInfoPanel(state)

    render(window)

  logic.onShutdown()
  shutdown(window)

when isMainModule:
  main()
