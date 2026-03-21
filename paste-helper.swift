// paste-helper.swift
// Inserts clipboard text into the focused UI element via the Accessibility API
// (AXUIElement), then falls back to CGEventPost Cmd+V.
// Running inside Aurora's process isn't possible from Node, so this binary must
// be added to System Settings → Privacy → Accessibility.
import ApplicationServices
import Cocoa

guard let text = NSPasteboard.general.string(forType: .string), !text.isEmpty else {
    exit(0)
}

// Try Accessibility API first: insert text at the current cursor position
let systemWide = AXUIElementCreateSystemWide()
var focusedRef: CFTypeRef?
let fetchResult = AXUIElementCopyAttributeValue(
    systemWide, kAXFocusedUIElementAttribute as CFString, &focusedRef)

var usedAxInsert = false
if fetchResult == .success, let focusedRef {
    let focused = focusedRef as! AXUIElement
    // kAXSelectedTextAttribute: replaces current selection (or inserts at cursor if empty)
    if AXUIElementSetAttributeValue(focused, kAXSelectedTextAttribute as CFString,
                                    text as CFTypeRef) == .success {
        usedAxInsert = true
    }
}

// Fallback: post Cmd+V via CGEventPost
if !usedAxInsert {
    let src = CGEventSource(stateID: .hidSystemState)
    let down = CGEvent(keyboardEventSource: src, virtualKey: 0x09, keyDown: true)!
    down.flags = .maskCommand
    down.post(tap: .cgSessionEventTap)
    let up = CGEvent(keyboardEventSource: src, virtualKey: 0x09, keyDown: false)!
    up.flags = .maskCommand
    up.post(tap: .cgSessionEventTap)
}
