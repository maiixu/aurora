# Aurora — 开发记录 & 踩坑备忘

## App-specific paste 策略

### Obsidian

**问题**：Obsidian 使用 CodeMirror（Electron 内嵌 web 编辑器），`keystroke "v" using command down` 无法送达 CodeMirror 的输入层。

**尝试过但无效的方案**：
- `keystroke "v" using command down` via System Events（axPaster 默认方案）
- `set value of attribute "AXSelectedText" of fe to ...`（AXUIElement）
  - 还触发了 AppleScript 语法错误：在 `tell process` 块内调用 `do shell script` 会报 `-2741`，需要把 `do shell script` 提到 `tell` 块外

**有效方案**：通过菜单栏点击 `Edit > Paste`，Obsidian 会正确处理

```applescript
tell application "Obsidian" to activate
delay 0.15
tell application "System Events"
  tell process "Obsidian"
    click menu item "Paste" of menu 1 of menu bar item "Edit" of menu bar 1
  end tell
end tell
```

### Cursor

**问题**：Cursor 是基于 VS Code 的 Electron app，编辑器输入框是 CodeMirror web 层，`keystroke "v" using command down` 无法送达。

**有效方案**：与 Obsidian 同样的 `click menu item "Paste"` 方式。

### Messages (iMessage)

**问题**：Messages 是沙盒应用，键盘模拟无法送达。

**有效方案**：与 Obsidian 同样的 `click menu item "Paste"` 方式。

### iTerm2

**有效方案**：直接写入 session（不需要键盘模拟）。

---

## AppleScript 踩坑

- `do shell script` 在 `tell application "System Events" ... tell process` 块内会触发语法错误 `-2741`。原因：`do shell script` 属于 Standard Additions 词典，在 `tell` 目标切换为 System Events 进程后作用域变了。解决：在任何 `tell` 块外先执行 `set theText to do shell script "pbpaste"`。

---

## paste-helper 二进制

曾尝试用独立 helper 进程做 paste。**结论：行不通**。macOS Accessibility 授权是针对进程的，Aurora 主进程有 `trusted: true`，但它 `spawn` 出来的子进程不继承这个授权，osascript 调用会直接失败。所有 paste 操作必须从 Aurora 主进程发出。

---

## 状态机 & 快捷键

- 最初是长按模式（hold = LISTENING，release = PROCESSING），后改为 toggle 模式（按一次开始，按一次结束），更简单，不需要 Karabiner 长按阈值。
- uiohook 有键重复事件，用 `ignoreUntil` 时间戳去抖（300ms 窗口）。

---

## 部署流程

`npm run build` 只生成 `release/mac-arm64/Aurora.app`，不会自动替换 `/Applications/Aurora.app`。

**每次改完代码后用**：
```bash
npm run deploy   # = build + kill Aurora + 复制 asar + 重新打开
```

`update-app` 单独使用（已有 build 产物时）：
```bash
npm run update-app
```

---

## Whisper 后处理

- whisper.cpp 会输出 `[Music]`、`[Noise]` 等 artifact，用正则过滤。
- 长段录音会产生重复 n-gram（如 "Jiba Jiba Jiba"），用滑窗去重（n=1..4），保留首次出现。
- 词汇替换通过 `~/.aurora/dictionary.txt` 的 `[replace]` 段做确定性替换（如 `cloud = Claude`）。
