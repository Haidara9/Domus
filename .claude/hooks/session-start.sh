#!/usr/bin/env bash
# DOMUS: prepare the engine at session start (idempotent, installs only what is missing).
cd "${CLAUDE_PROJECT_DIR:-.}/engine" 2>/dev/null || exit 0
[ -d node_modules/playwright ] && [ -d node_modules/gsap ] || PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install --silent >/dev/null 2>&1
echo "DOMUS ready: read CLAUDE.md; engine: node engine/bin/domus.mjs help; talk to the owner in Levantine Arabic."
