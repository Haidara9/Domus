#!/usr/bin/env bash
# DOMUS environment check: reports what is installed and what is missing. Installs NOTHING.
# Usage: bash tools/check-env.sh        (works in Git Bash / WSL on Windows, macOS, Linux)
set -u
have() { command -v "$1" >/dev/null 2>&1; }
row() { printf '%-28s %-10s %s\n' "$1" "$2" "$3"; }
ver() { "$@" 2>&1 | head -1; }

echo "== Core (required) =="
have node    && row node "ok" "$(node -v)$( [ "$(node -p 'process.versions.node.split(".")[0]')" -ge 20 ] || echo '  (need >= 20; HyperFrames/NullMotion need 22)')" || row node MISSING "https://nodejs.org (LTS 22)"
have ffmpeg  && row ffmpeg "ok" "$(ver ffmpeg -version | cut -c1-40)" || row ffmpeg MISSING "winget install Gyan.FFmpeg | brew install ffmpeg | apt install ffmpeg"
have ffprobe && row ffprobe "ok" "" || row ffprobe MISSING "comes with ffmpeg"
have git     && row git "ok" "$(git --version)" || row git MISSING ""
have git-lfs && row git-lfs "ok" "$(git lfs version | cut -c1-30)" || row git-lfs "missing" "needed for large media in the repo"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
[ -d "$ROOT/engine/node_modules/playwright" ] && row "engine deps" "ok" "" || row "engine deps" "missing" "cd engine && npm install"

echo; echo "== Optional =="
have python3 && row python3 "ok" "$(python3 --version)" || { have python && row python "ok" "$(python --version)" || row python "missing" "only for Video Ad Editor / NullMotion import"; }
have nvidia-smi && row "NVIDIA GPU" "ok" "$(nvidia-smi --query-gpu=name,memory.total --format=csv,noheader | head -1)" || row "NVIDIA GPU" "none" "MotionClone needs one (not required)"
have claude && row "claude CLI" "ok" "$(claude --version 2>/dev/null)" || row "claude CLI" "missing" ""
for d in "/c/Program Files/Blackmagic Design/DaVinci Resolve" "/Applications/DaVinci Resolve" "/opt/resolve"; do [ -d "$d" ] && row "DaVinci Resolve" "found" "$d (Studio edition needed for scripting)"; done

echo; echo "== Skills / plugins already installed (do not reinstall) =="
for base in "$HOME/.claude/skills" "$HOME/.claude/plugins"; do
  [ -d "$base" ] || continue
  find "$base" -maxdepth 4 -name SKILL.md 2>/dev/null | sed "s#$HOME#~#; s#/SKILL.md##" | sort | sed 's/^/  /'
done
have claude && claude plugin list 2>/dev/null | sed 's/^/  /'

echo; echo "== External tool clones (tools/vendor, not committed) =="
for r in NullMotion video-ad-editor open-edit MotionClone; do
  [ -d "$ROOT/tools/vendor/$r/.git" ] && row "$r" "cloned" "$(git -C "$ROOT/tools/vendor/$r" log -1 --format=%cd --date=short)" || row "$r" "-" "bash tools/get-tool.sh $r"
done
