#!/usr/bin/env bash
set -euo pipefail

# Safe helper script to remove sensitive files from git tracking and prepare a commit.
# This script DOES NOT purge git history. It untracks the files and creates a commit.

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

FILES=(
  "server/.env"
  "server/.openclaw_device.json"
  "server/ssl/key.pem"
  "server/ssl/cert.pem"
)

# Ensure we are on a clean working tree
if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree not clean. Commit or stash changes before running this script." >&2
  exit 1
fi

# Backup files to user's tmp dir
BACKUP_DIR="$HOME/tmp/secrets-backup-$(date +%s)"
mkdir -p "$BACKUP_DIR"
for f in "${FILES[@]}"; do
  if [ -f "$f" ]; then
    cp --preserve=mode,timestamps "$f" "$BACKUP_DIR/"
    echo "Backed up $f -> $BACKUP_DIR/"
  fi
done

# Add entries to .gitignore if not present
add_ignore() {
  local file="$1"
  local entry="$2"
  if ! grep -Fxq "$entry" "$file" 2>/dev/null; then
    printf "%s\n" "$entry" >> "$file"
    echo "Appended $entry to $file"
  else
    echo "$entry already present in $file"
  fi
}

add_ignore ".gitignore" "server/.env"
add_ignore ".gitignore" "server/.openclaw_device.json"
add_ignore ".gitignore" "server/ssl/*.pem"
add_ignore "server/.gitignore" "/.openclaw_device.json"
add_ignore "server/.gitignore" "ssl/*.pem"

# Remove from git index but keep files locally
for f in "${FILES[@]}"; do
  if git ls-files --error-unmatch "$f" >/dev/null 2>&1; then
    git rm --cached "$f"
    echo "Removed $f from git index"
  else
    echo "$f not tracked by git"
  fi
done

# Create commit
git commit -m "chore(secrets): remove committed secrets from repo and add to .gitignore" || {
  echo "No changes to commit or commit failed." >&2
}

echo "Removal commit created. NEXT: rotate exposed secrets and purge history with filter-repo or BFG as documented in scripts/purge_history.sh"

echo "Backup location: $BACKUP_DIR"
