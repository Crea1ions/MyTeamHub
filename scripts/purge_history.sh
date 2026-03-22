#!/usr/bin/env bash
set -euo pipefail

# Helper script to purge sensitive files from Git history using git-filter-repo
# This script operates on a mirrored clone to avoid corrupting the local working copy.
# Review and run only after rotating secrets and coordinating with team.

if ! command -v git-filter-repo >/dev/null 2>&1; then
  echo "git-filter-repo not installed. Install from https://github.com/newren/git-filter-repo" >&2
  exit 1
fi

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <remote-repo-url>" >&2
  exit 1
fi

REMOTE_URL="$1"
MIRROR_DIR="repo-mirror-$(date +%s)"

# Clone mirror
git clone --mirror "$REMOTE_URL" "$MIRROR_DIR"
cd "$MIRROR_DIR"

# Paths to remove from history
git filter-repo --invert-paths --path server/.env --path server/.openclaw_device.json --path server/ssl/key.pem --path server/ssl/cert.pem

# Force push cleaned history
git push --force --all
git push --force --tags

echo "Purge complete. Instruct all contributors to reclone repository."
