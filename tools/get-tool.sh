#!/usr/bin/env bash
# Clone (or update) an external tool into tools/vendor/<name>. Skips anything already present.
# These repos are NOT committed (tools/vendor is git-ignored): NullMotion and MotionClone have no license.
# Usage: bash tools/get-tool.sh NullMotion|video-ad-editor|open-edit|MotionClone|hyperframes [--update]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; V="$ROOT/tools/vendor"; mkdir -p "$V"
declare -A URL=(
  [NullMotion]=https://github.com/blixvip/NullMotion
  [video-ad-editor]=https://github.com/majedphotos/video-ad-editor
  [open-edit]=https://github.com/veedstudio/open-edit
  [MotionClone]=https://github.com/LPengYang/MotionClone
  [hyperframes]=https://github.com/heygen-com/hyperframes
)
name="${1:-}"; [ -n "$name" ] && [ -n "${URL[$name]:-}" ] || { echo "usage: $0 ${!URL[*]} [--update]"; exit 1; }
if [ -d "$V/$name/.git" ]; then
  if [ "${2:-}" = "--update" ]; then git -C "$V/$name" pull --ff-only; else echo "$name already present at $V/$name (use --update to pull)"; fi
  exit 0
fi
GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 "${URL[$name]}" "$V/$name"
echo "cloned $name -> $V/$name"
case "$name" in
  NullMotion) echo "run: cd $V/NullMotion && npm start   (Node 22, opens http://127.0.0.1:4343)";;
  MotionClone) echo "needs an NVIDIA GPU + conda env + several GB of checkpoints; read docs/tool-audit.md first";;
  video-ad-editor) echo "prefer installing as a Claude plugin: claude plugin marketplace add majedphotos/video-ad-editor && claude plugin install majed-video@majed-video  (only if not already installed)";;
esac
