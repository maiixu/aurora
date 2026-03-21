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

To use a different alias or port:

```bash
export AURORA_SSH_HOST=my-host      # default: mac-ec2
export AURORA_WHISPER_PORT=9000     # default: 8080 (whisper.cpp default)
```

The EC2 instance must run `whisper-server` (whisper.cpp), default port 8080.

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

### 5. Dictionary

Symlink from dotfiles and edit to taste:

```bash
mkdir -p ~/.aurora
ln -sf ~/code/dotfiles/aurora/dictionary.txt ~/.aurora/dictionary.txt
```

Format (`~/code/dotfiles/aurora/dictionary.txt`):

```
Claude, Claude Code, Cursor, Obsidian, TypeScript, Karabiner, macOS, EC2

[replace]
cloud code = Claude Code
cloud = Claude
```

- Top section: whisper initial prompt — biases recognition toward these spellings
- `[replace]` section: deterministic post-processing substitutions (applied in order, longer phrases first)
- Loaded fresh on every transcription — edit anytime, no restart needed

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
| Dictionary | `~/code/dotfiles/aurora/dictionary.txt` |

No API keys, no passwords, no tokens are stored in this repo.
