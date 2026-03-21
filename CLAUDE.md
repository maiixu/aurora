# Aurora — Development Rules

## Branching

- `main` is always shippable
- New features go on `feat/<name>` branches, bug fixes on `fix/<name>`
- Merge back to main when done; no long-lived branches

## Sync workflow

```bash
git pull --rebase          # before starting work
git push                   # after each logical commit
```

## Commits

- One logical change per commit
- Message format: `type: short description` (feat / fix / refactor / chore)
- Always commit `paste-helper` binary alongside `paste-helper.swift` if recompiled

## Adding a new app paster

1. Create `src/main/pasters/<appname>.ts` implementing `Paster`
2. Register it in `src/main/pasters/index.ts` registry
3. App name must match the string returned by `getFrontApp()` (System Events process name)

```typescript
// Example
export const myAppPaster: Paster = {
  paste(_text: string) {
    execSync(`osascript -e '...'`)
  },
}
```

## Rebuilding paste-helper

If `paste-helper.swift` changes, recompile and add to Accessibility:

```bash
swiftc paste-helper.swift -o paste-helper
# Then: System Settings → Privacy → Accessibility → remove old, add new binary
```

## HUD / tray icons

Tray icon is a pixel-rendered dot in `TrayAnimator` (no external assets needed).
HUD dot size is computed at startup from screen height — do not hardcode px values.

## Environment

| Var | Default | Purpose |
|-----|---------|---------|
| `AURORA_SSH_HOST` | `mac-ec2` | SSH alias for EC2 whisper server |

## macOS permissions required

- Microphone — for recording
- Input Monitoring — for global hotkey (uiohook)
- Accessibility — for paste injection (Aurora + paste-helper)
