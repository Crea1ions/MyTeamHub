#!/bin/bash

# MyTeamHub Installation Script
# Sets up 'myteam' command available globally from any terminal
# Run once: bash install.sh

set -e

MYTEAMHUB_DIR="/home/devdipper/dev/APP/001-APP-MyTeamHub"
MYTEAM_SCRIPT="$MYTEAMHUB_DIR/myteam"
BIN_DIR="$HOME/.local/bin"

echo "🔧 Setting up MyTeamHub global command..."
echo ""

# Ensure ~/.local/bin exists
if [[ ! -d "$BIN_DIR" ]]; then
  echo "📁 Creating $BIN_DIR..."
  mkdir -p "$BIN_DIR"
fi

# Make script executable
if [[ ! -x "$MYTEAM_SCRIPT" ]]; then
  echo "🔐 Making myteam script executable..."
  chmod +x "$MYTEAM_SCRIPT"
fi

# Create symlink
if [[ -e "$BIN_DIR/myteam" ]]; then
  echo "⚠️  $BIN_DIR/myteam already exists"
  read -p "   Overwrite? (y/n) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm "$BIN_DIR/myteam"
  else
    echo "❌ Installation cancelled"
    exit 1
  fi
fi

ln -s "$MYTEAM_SCRIPT" "$BIN_DIR/myteam"
echo "✅ Symlink created: $BIN_DIR/myteam → $MYTEAM_SCRIPT"
echo ""

# Ensure ~/.local/bin is in PATH
if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
  echo "📋 Adding $BIN_DIR to PATH..."
  
  # Add to ~/.bashrc if not already there
  if ! grep -q "export PATH=.*\.local/bin" ~/.bashrc; then
    echo "" >> ~/.bashrc
    echo "# MyTeamHub global command" >> ~/.bashrc
    echo "export PATH=\"$BIN_DIR:\$PATH\"" >> ~/.bashrc
    echo "✅ Added to ~/.bashrc"
  fi
  
  # Add to ~/.zshrc if it exists
  if [[ -f ~/.zshrc ]]; then
    if ! grep -q "export PATH=.*\.local/bin" ~/.zshrc; then
      echo "" >> ~/.zshrc
      echo "# MyTeamHub global command" >> ~/.zshrc
      echo "export PATH=\"$BIN_DIR:\$PATH\"" >> ~/.zshrc
      echo "✅ Added to ~/.zshrc"
    fi
  fi
  
  echo ""
  echo "⚠️  IMPORTANT: Run this to reload your shell:"
  echo "   source ~/.bashrc"
  echo "   (or restart your terminal)"
else
  echo "✅ $BIN_DIR already in PATH"
fi

echo ""
echo "🎉 Installation complete!"
echo ""
echo "Try it now:"
echo "  myteam help       # Show commands"
echo "  myteam            # Start dev mode"
echo "  myteam check      # Check services"
echo ""
