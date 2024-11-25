#!/bin/bash

# Create directories if they don't exist
mkdir -p ~/.config/VSCodium/User/
mkdir -p ~/.vscode-oss/extensions/

# Copy settings
if [ -f ~/.config/Code/User/settings.json ]; then
  cp ~/.config/Code/User/settings.json ~/.config/VSCodium/User/
fi

# Copy keybindings
if [ -f ~/.config/Code/User/keybindings.json ]; then
  cp ~/.config/Code/User/keybindings.json ~/.config/VSCodium/User/
fi

# Copy snippets
if [ -d ~/.config/Code/User/snippets ]; then
  cp -r ~/.config/Code/User/snippets ~/.config/VSCodium/User/
fi

# Copy extensions
if [ -d ~/.vscode/extensions ]; then
  cp -r ~/.vscode/extensions/* ~/.vscode-oss/extensions/
fi

echo "Settings, keybindings, snippets, and extensions have been imported from VS Code to Codium"
