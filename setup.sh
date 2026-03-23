#!/bin/bash
# Aurora new machine setup
# Usage: bash setup.sh
# Run from the aurora repo root after cloning.

set -e

AURORA_APP="release/mac-arm64/Aurora.app"
MODELS_DIR="$HOME/.aurora/models"
WHISPER_DIR="$HOME/code/whisper.cpp"

echo "==> Aurora setup"

# ── 1. Build app ───────────────────────────────────────────────────────────
echo ""
echo "1/5  Building Aurora..."
npm install --silent
npm run build 2>&1 | grep -E "✓|error|Error" | head -10

# ── 2. Install to /Applications ────────────────────────────────────────────
echo ""
echo "2/5  Installing to /Applications..."
if [ -d "/Applications/Aurora.app" ]; then
  # update-app: replace only .asar (preserves ad-hoc signature)
  cp "$AURORA_APP/Contents/Resources/app.asar" \
     "/Applications/Aurora.app/Contents/Resources/app.asar"
  cp -R "$AURORA_APP/Contents/Resources/app.asar.unpacked" \
     "/Applications/Aurora.app/Contents/Resources/app.asar.unpacked"
  HASH=$(openssl dgst -sha256 /Applications/Aurora.app/Contents/Resources/app.asar | awk '{print $2}')
  plutil -replace "ElectronAsarIntegrity" \
    -json "{\"Resources/app.asar\":{\"algorithm\":\"SHA256\",\"hash\":\"$HASH\"}}" \
    /Applications/Aurora.app/Contents/Info.plist
  echo "     Updated existing install."
else
  cp -r "$AURORA_APP" /Applications/Aurora.app
  xattr -cr /Applications/Aurora.app
  echo "     Fresh install done."
fi

# ── 3. whisper.cpp ─────────────────────────────────────────────────────────
echo ""
echo "3/5  whisper.cpp..."
if [ ! -f "$WHISPER_DIR/build/bin/whisper-server" ]; then
  echo "     Cloning and building whisper.cpp (this takes a few minutes)..."
  mkdir -p "$HOME/code"
  git clone --depth=1 https://github.com/ggerganov/whisper.cpp "$WHISPER_DIR" 2>/dev/null \
    || git -C "$WHISPER_DIR" pull --ff-only
  cmake -B "$WHISPER_DIR/build" -S "$WHISPER_DIR" \
    -DGGML_METAL=ON -DWHISPER_BUILD_SERVER=ON -DCMAKE_BUILD_TYPE=Release -Wno-dev \
    > /dev/null
  cmake --build "$WHISPER_DIR/build" -j$(sysctl -n hw.ncpu) --target whisper-server \
    2>&1 | tail -3
  echo "     whisper-server built."
else
  echo "     whisper-server already built, skipping."
fi

# ── 4. Models ──────────────────────────────────────────────────────────────
echo ""
echo "4/5  Whisper models..."
mkdir -p "$MODELS_DIR"

download_model() {
  local stem="$1"
  local dest="$MODELS_DIR/ggml-${stem}.bin"
  if [ -f "$dest" ]; then
    echo "     ggml-${stem}.bin already present, skipping."
    return
  fi
  echo "     Downloading ggml-${stem}.bin..."
  bash "$WHISPER_DIR/models/download-ggml-model.sh" "$stem" > /dev/null
  cp "$WHISPER_DIR/models/ggml-${stem}.bin" "$dest"
  echo "     ggml-${stem}.bin done."
}

download_model "large-v3"
download_model "large-v3-turbo"

# ── 5. Karabiner ───────────────────────────────────────────────────────────
echo ""
echo "5/5  Karabiner config..."
DOTFILES_KARA="$HOME/code/dotfiles/karabiner/karabiner.json"
if [ -f "$DOTFILES_KARA" ]; then
  mkdir -p "$HOME/.config/karabiner"
  # Only copy if not already a symlink from dotfiles
  if [ ! -L "$HOME/.config/karabiner" ]; then
    ln -sfn "$(dirname "$DOTFILES_KARA")" "$HOME/.config/karabiner"
    echo "     Symlinked ~/.config/karabiner → dotfiles."
  else
    echo "     Karabiner already symlinked."
  fi
else
  echo "     No dotfiles Karabiner config found — set up Karabiner manually."
  echo "     Rule needed: Dictation key → Cmd+Ctrl+Alt+Shift+F13 (Hyper+F13)"
fi

# ── Done ───────────────────────────────────────────────────────────────────
echo ""
echo "✅  Setup complete."
echo ""
echo "Next steps:"
echo "  1. Open Aurora from /Applications"
echo "  2. Grant Microphone + Accessibility permissions when prompted"
echo "  3. Add Aurora to Login Items: System Settings → General → Login Items"
echo ""
echo "Aurora defaults to local whisper (large-v3). Switch backend in the tray menu."
