# ✨ Aurora

Ghost voice-injection for macOS. Press Dictation key → mic records → press again → EC2 whisper.cpp transcribes → text pastes into the focused app.

## How it works

```
Press Dictation key
  → green dot appears (LISTENING) — recording starts
Press again
  → dot spins (PROCESSING) — audio sent to EC2 whisper via SSH tunnel
Transcription arrives
  → dot flashes green (READY) — text pasted into focused app
Esc at any point → cancel (red dot)
```

## New machine setup

### 1. Clone and install

```bash
git clone git@github.com:maiixu/aurora
cd aurora
npm install
```

### 2. EC2 whisper server

Aurora connects via SSH tunnel. Configure your SSH host:

```bash
# Add to ~/.ssh/config:
Host mac-ec2
  HostName <your-EC2-IP>
  User ec2-user
  IdentityFile ~/.ssh/your-key.pem
```

To use a different alias: `export AURORA_SSH_HOST=my-host`

The EC2 instance must run `whisper-server` (whisper.cpp) on port 8080.

### 3. Karabiner Elements

Install [Karabiner Elements](https://karabiner-elements.pqrs.org/) and copy config from dotfiles:

```bash
cp ~/code/dotfiles/karabiner/karabiner.json ~/.config/karabiner/karabiner.json
```

The rule maps Dictation key → `right_option` on every press. Aurora toggles recording on each press.

### 4. macOS permissions

Grant in **System Settings → Privacy & Security**:

| Permission | Why |
|---|---|
| **Microphone** | Record audio (prompted on first launch) |
| **Input Monitoring** | Global hotkey via uiohook-napi |
| **Accessibility** | Paste text into apps via UI scripting |

### 5. Vocabulary (optional)

Create `~/.aurora/prompt.txt` with terms whisper should recognise correctly:

```
Claude, Cursor, Obsidian, TypeScript, Karabiner, macOS, EC2
```

Whisper uses this as an initial prompt to bias spelling toward these words. Edit anytime — loaded fresh on every transcription.

### 6. Run

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
| Vocabulary prompt | `~/.aurora/prompt.txt` |

No API keys, no passwords, no tokens are stored in this repo.
