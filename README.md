# Aurora

Ghost voice-injection for macOS. Hold Dictation key → mic records → EC2 whisper.cpp transcribes → text pastes into the focused app.

## How it works

```
Hold Dictation key (400ms)
  → green dot appears (LISTENING)
Release key
  → dot spins (PROCESSING) — audio sent to EC2 whisper via SSH tunnel
Transcription arrives
  → dot flashes green (READY) — text pasted into focused app
```

## New machine setup

### 1. Clone and install

```bash
git clone git@github.com:maiixu/aurora
cd aurora
npm install
```

### 2. EC2 whisper server

Aurora connects via SSH tunnel. Set your SSH host:

```bash
# Option A: use the default alias
# Add to ~/.ssh/config:
Host mac-ec2
  HostName <your-EC2-IP>
  User ec2-user
  IdentityFile ~/.ssh/your-key.pem

# Option B: override via env var
export AURORA_SSH_HOST=my-other-host
```

The EC2 instance must be running `whisper-server` (whisper.cpp) on port 8080.

### 3. Karabiner Elements

Install [Karabiner Elements](https://karabiner-elements.pqrs.org/) and copy config from dotfiles:

```bash
cp ~/code/dotfiles/karabiner/karabiner.json ~/.config/karabiner/karabiner.json
```

The rule maps: `Dictation key → f5 → right_option (hold 400ms)`. Aurora listens for `right_option`.

### 4. macOS permissions

Grant these in **System Settings → Privacy & Security**:

| Permission | Why |
|---|---|
| **Microphone** | Record audio (prompted on first launch) |
| **Input Monitoring** | Global hotkey detection (uiohook-napi) |
| **Accessibility** | Paste text into apps |

For Accessibility, add both:
- The Electron app (`Electron` or `Aurora` in the list)
- `paste-helper` binary: `aurora/paste-helper`

### 5. Run

```bash
npm run dev       # development
npm run build     # production .app
```

## Secrets / what's NOT in this repo

| Secret | Location |
|---|---|
| EC2 SSH key | `~/.ssh/` |
| SSH host config | `~/.ssh/config` |
| Karabiner config | `~/code/dotfiles/` |

No API keys, no passwords, no tokens are stored in this repo.

## Rebuilding paste-helper

The `paste-helper` binary must be compiled on the target machine (arm64):

```bash
swiftc paste-helper.swift -o paste-helper
```

Then add the new binary to System Settings → Accessibility.
