#!/bin/bash

VAULT_DIR="/home/devdipper/dev/APP/001-APP-MyTeamHub/orchestrator/vault/"
BACKUP_DIR="/home/devdipper/dev/vault_backup_$(date +%Y%m%d_%H%M%S)"

mkdir -p "$BACKUP_DIR"
echo "Backing up files to $BACKUP_DIR..."
cp -r "$VAULT_DIR"*.md "$BACKUP_DIR/" 2>/dev/null

updated_count=0

for file in "$VAULT_DIR"*.md; do
  [ -e "$file" ] || continue
  
  filename=$(basename "$file")
  id="${filename%.md}"
  needs_frontmatter=false
  
  if [ ! -s "$file" ]; then
    needs_frontmatter=true
  elif [ "$(head -c 3 "$file")" != "---" ]; then
    needs_frontmatter=true
  fi
  
  if [ "$needs_frontmatter" = true ]; then
    cat << FRONTMATTER > "$file.tmp"
---
id: $id
type: note
created: 2026-04-18
updated: 2026-04-18
status: draft
tags:
  - vault
---
$(cat "$file")
FRONTMATTER
    mv "$file.tmp" "$file"
    ((updated_count++))
    echo "Updated: $filename"
  fi
done

echo "Total files updated: $updated_count"
