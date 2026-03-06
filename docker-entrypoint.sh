#!/bin/sh
# Copy .claude.json from mounted .claude/ dir so claude CLI can write to it
if [ -f "$HOME/.claude/.claude.json.host" ] && [ ! -f "$HOME/.claude.json" ]; then
  cp "$HOME/.claude/.claude.json.host" "$HOME/.claude.json"
fi
exec "$@"
