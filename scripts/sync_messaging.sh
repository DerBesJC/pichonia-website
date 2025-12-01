#!/usr/bin/env bash
set -euo pipefail
SRC="$HOME/Documents/Pichonia_LLC/brand/docs/messaging"
DST="$HOME/Documents/Pichonia_LLC/website/src/content/messaging"
mkdir -p "$DST"
cp -f "$SRC/pichonia_story.md" "$DST/about.md"
cp -f "$SRC/services.md" "$DST/services.md"
cp -f "$SRC/subbrands.md" "$DST/subbrands.md"
cp -f "$SRC/capabilities.md" "$DST/capabilities.md" 2>/dev/null || true
cp -f "$SRC/engagements.md" "$DST/engagements.md" 2>/dev/null || true
echo "Synced messaging → $DST"
