import nimgl/nimgl/[opengl, glfw]
import imguin/[cimgui, glfw_opengl, simple]
export cimgui, simple

type
  AppState* = object
    counter*: int
    inputText*: string
    checkboxValue*: bool
    sliderValue*: float32
    colorValue*: array[4, float32]
    comboIndex*: int32

proc initApp*(): AppState =
  result = AppState(
    counter: 0,
    inputText: "",
    checkboxValue: false,
    sliderValue: 50.0f,
    colorValue: [1.0f, 0.5f, 0.2f, 1.0f],
    comboIndex: 0
  )

type
  WindowConfig* = object
    width*: int32
    height*: int32
    title*: string

proc initWindow*(config: WindowConfig): GLFWWindow =
  glfwWindowHint(GLFWContextVersionMajor, 3)
  glfwWindowHint(GLFWContextVersionMinor, 3)
  glfwWindowHint(GLFWOpenglForwardCompat, GLFW_TRUE)
  glfwWindowHint(GLFWOpenglProfile, GLFW_OPENGL_CORE_PROFILE)

  result = glfwCreateWindow(config.width, config.height, config.title)
  result.makeContextCurrent()
  glfwSwapInterval(1)
  doAssert glInit()

proc initImGui*(window: GLFWWindow) =
  discard igCreateContext(nil)
  let pio = igGetIO()
  pio.ConfigFlags = pio.ConfigFlags or ImGuiConfigFlags_DockingEnable.cint
  discard ImGui_ImplGlfw_InitForOpenGL(cast[ptr GLFWwindow](window), true)
  discard ImGui_ImplOpenGL3_Init("#version 330")
  igStyleColorsDark(nil)

proc newFrame*() =
  ImGui_ImplOpenGL3_NewFrame()
  ImGui_ImplGlfw_NewFrame()
  igNewFrameAuto()

proc render*(window: GLFWWindow) =
  igRender()
  glClearColor(0.1f, 0.1f, 0.12f, 1.0f)
  glClear(GL_COLOR_BUFFER_BIT)
  ImGui_ImplOpenGL3_RenderDrawData(igGetDrawData())
  window.swapBuffers()

proc shutdown*(window: GLFWWindow) =
  ImGui_ImplOpenGL3_Shutdown()
  ImGui_ImplGlfw_Shutdown()
  igDestroyContext(igGetCurrentContext())
  window.destroyWindow()
  glfwTerminate()

type
  LogicCallbacks* = object
    on计数按钮_被单击*: proc()
    on新按钮_被单击*: proc()
    on新按钮_鼠标移入*: proc()
    on输入框_内容变化*: proc(text: string)

proc renderControlPanel*(state: var AppState, callbacks: LogicCallbacks) =
  igBegin("控制面板", nil, 0)

  if igButton("点击计数", ImVec2(x: 120, y: 30)):
    if callbacks.on计数按钮_被单击 != nil:
      callbacks.on计数按钮_被单击()
  igSameLine()
  igText("计数: %d", state.counter)

  igSeparator()

  igButton("新按钮", ImVec2(x: 120, y: 30))
  if igIsItemClicked(ImGui_MouseButton_Left.cint):
    if callbacks.on新按钮_被单击 != nil:
      callbacks.on新按钮_被单击()
  if igIsItemHovered(0):
    if callbacks.on新按钮_鼠标移入 != nil:
      callbacks.on新按钮_鼠标移入()

  igSeparator()

  igText("输入框:")
  igSameLine()
  var buf = state.inputText
  buf.setLen(256)
  if igInputText("##input", buf[0].addr, 256, 0, nil, nil):
    if callbacks.on输入框_内容变化 != nil:
      callbacks.on输入框_内容变化($buf)
  igSameLine()
  igText("你输入: %s", state.inputText)

  igSeparator()

  discard igCheckbox("复选框", state.checkboxValue.addr)

  igSeparator()

  igText("滑块: %.1f", state.sliderValue)
  discard igSliderFloat("##slider", state.sliderValue.addr, 0.0f, 100.0f, "%.1f", 0)

  igSeparator()

  igText("颜色选择:")
  discard igColorEdit4("##color", state.colorValue, 0)

  igSeparator()

  discard igCombo_Str("下拉框", state.comboIndex.addr, "选项1\0选项2\0选项3\0选项4\0", -1)

  igEnd()

proc renderInfoPanel*(state: AppState) =
  igBegin("信息面板", nil, 0)
  igText("应用状态:")
  igBulletText("计数器: %d", state.counter)
  igBulletText("复选框: %s", if state.checkboxValue: "开启" else: "关闭")
  igBulletText("滑块值: %.1f", state.sliderValue)
  igBulletText("下拉选择: %d", state.comboIndex)
  igBulletText("输入文本: %s", state.inputText)
  igEnd()


