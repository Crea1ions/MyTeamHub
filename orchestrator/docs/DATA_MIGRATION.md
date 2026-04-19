---
id: data-migration-guide
type: guide
phase: 1.4
status: complete
created: 2026-04-17
---

# Phase 1.4: Data Migration Guide

## Overview

Phase 1.4 provides automated migration tools to convert existing Team-Studio data (JSON format) to the new Vault format (Markdown + JSON with frontmatter).

**Purpose**: Preserve all historical data while transitioning to the new storage format without data loss.

---

## What Gets Migrated

### Projects
- **Context files** (`projects/{id}/context.md`) → Migrated as project metadata
- **Sessions** (`projects/{id}/sessions/*.json`) → Converted to Markdown files with frontmatter

### Sessions  
- **Message history** — Each message becomes a Markdown section with timestamp
- **Metadata** — Stored in frontmatter (id, type, created, updated, tags, project_id, session_id)
- **Role/Content** — User/Assistant messages clearly separated

### Format Conversion

**Before (JSON)**:
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Question?",
      "timestamp": "2026-03-22T03:44:19.135Z"
    },
    {
      "role": "assistant",
      "content": "Answer...",
      "timestamp": "2026-03-22T03:44:19.136Z"
    }
  ]
}
```

**After (Markdown with Frontmatter)**:
```markdown
---
id: 2ff10972-791d-4564-823b-4d2d45dee092
type: session
created: 2026-04-17T13:01:33.027Z
updated: 2026-04-17T13:01:33.027Z
title: Session: default
tags:
  - team-studio
  - session
  - project_id
project_id: test
session_id: default
migrated: true
---

## 👤 User — 2026-03-22T03:44:19.135Z
Question?

---

## 🤖 Assistant — 2026-03-22T03:44:19.136Z
Answer...
```

---

## Running the Migration

### Prerequisites
- Node.js installed
- Rust Orchestrator project available at `./orchestrator/`
- Team-Studio data available at `./data/` (default) or custom path

### Dry-Run Mode (Recommended First)

```bash
cd orchestrator

# Test migration without writing files
node scripts/migrate.js --source ../data --target ./vault --dry-run
```

**Output**:
```
🚀 Phase 1.4: Data Migration Tool
Source: ../data
Target: ./vault
Mode: DRY-RUN (no files written)

Found 5 projects to migrate:

  📁 codesnippets         → ✓ (1 context, 1 sessions)
  📁 plan-ui              → ✓ (1 context, 1 sessions)
  📁 test                 → ✓ (0 context, 1 sessions)
  📁 teste                → ✓ (0 context, 1 sessions)
  📁 ui                   → ✓ (1 context, 1 sessions)

============================================================
📊 Migration Summary
============================================================
Projects processed:   5
Sessions migrated:    5
Messages processed:   71
Files created:        8

✓ Dry-run complete. No files were written.
Run with --execute to perform actual migration.
```

### Execute Migration

Once you've validated the dry-run output, perform the actual migration:

```bash
node scripts/migrate.js --source ../data --target ./vault --execute
```

**This will**:
- ✅ Create Vault directory structure
- ✅ Generate UUID for each file
- ✅ Create Markdown files with frontmatter
- ✅ Preserve all message history
- ✅ Maintain timestamps and metadata

---

## Verification

### 1. Check Vault Structure

```bash
find ./vault/projects -type f -name "*.md"
```

Expected output:
```
./vault/projects/codesnippets/sessions/default.md
./vault/projects/codesnippets/context.md
./vault/projects/plan-ui/sessions/default.md
./vault/projects/plan-ui/context.md
./vault/projects/test/sessions/default.md
./vault/projects/teste/sessions/default.md
./vault/projects/ui/sessions/default.md
./vault/projects/ui/context.md
```

### 2. Verify File Format

```bash
# Check a migrated session file
cat ./vault/projects/test/sessions/default.md | head -30
```

Should show:
- Valid YAML frontmatter (between `---` delimiters)
- Proper markdown formatting with message separators
- Timestamps preserved

### 3. Validate Frontmatter

```bash
# Extract and check frontmatter
sed -n '2,/^---$/p' ./vault/projects/test/sessions/default.md
```

Expected fields:
- `id`: UUID (unique identifier)
- `type`: session or project
- `created`: ISO8601 timestamp
- `updated`: ISO8601 timestamp
- `title`: Display name
- `tags`: Array (team-studio, session, project_id)
- `project_id`: Link to project
- `migrated`: true (indicates data migration source)

### 4. Test Via Vault API

Start the Orchestrator and test reading migrated files:

```bash
# Terminal 1: Start Orchestrator
cargo run

# Terminal 2: Test read
curl http://127.0.0.1:8001/vault/file/projects/test/sessions/default.md
```

Expected response:
```json
{
  "id": "2ff10972-791d-4564-823b-4d2d45dee092",
  "file_type": "session",
  "content": "...",
  "frontmatter": { ... }
}
```

---

## Data Integrity

### What's Preserved

✅ All message content (user + assistant)  
✅ Timestamps (with millisecond precision)  
✅ Project associations  
✅ Session hierarchy  
✅ Metadata (created, updated dates)  
✅ Tags and categorization

### What's Transformed

- **Storage format**: JSON → Markdown + Frontmatter
- **Structure**: Flat files → Hierarchical directory tree
- **IDs**: Added UUIDs (v4) for unique file identification
- **Tags**: Automatically added (`team-studio`, `session`, project name)
- **Metadata**: Frontmatter added with standardized fields

### No Data Loss

- All message content preserved verbatim
- Timestamps converted to ISO8601 format
- Message count validated in migration summary
- Each message remains timestamped and attributed

---

## Migration Script Options

### Basic Usage

```bash
node scripts/migrate.js
```

Uses default paths: `./data` → `./vault`

### Custom Paths

```bash
node scripts/migrate.js --source /path/to/source --target /path/to/target
```

### Dry-Run (Recommended)

```bash
node scripts/migrate.js --dry-run
```

Simulates migration without writing files. Perfect for:
- Validating data structure
- Checking project/session counts
- Estimating file count

### Execute

```bash
node scripts/migrate.js --execute
```

Performs actual migration. Creates directories and writes Markdown files.

---

## Rollback Plan

If migration needs to be rolled back:

1. **Vault directory is separate** — Original `./data/` remains untouched
2. **Delete vault directory**:
   ```bash
   rm -rf ./vault
   ```
3. **Re-run migration** — Can be executed multiple times safely (overwrites existing files)

---

## Performance Notes

### Migration Time

Typical migration of 5 projects with 71 messages: **<1 second**

### Disk Space

**Before**: ~500KB (JSON compressed)  
**After**: ~600KB (Markdown with frontmatter)

Markdown format is ~20% larger due to:
- Duplicate metadata in each file (frontmatter)
- Message separators and headers
- Human-readable formatting

### Index Building

After migration, rebuild the Vault index:

```bash
curl -X POST http://127.0.0.1:8001/vault/rebuild-index
```

This scans all Vault files and rebuilds `_index.json` for efficient searching.

---

## Troubleshooting

### Issue: "Source directory not found"

```
Error: Cannot access ./data/projects
```

**Solution**: Ensure you're running from the correct directory:
```bash
cd /home/devdipper/dev/APP/001-APP-MyTeamHub
node orchestrator/scripts/migrate.js --source ./data --target ./orchestrator/vault --dry-run
```

### Issue: "Permission denied"

```
Error: EACCES permission denied
```

**Solution**: Check write permissions on target directory:
```bash
chmod -R u+w ./orchestrator/vault
```

### Issue: "JSON parse error"

```
Error: Unexpected token in JSON at position...
```

**Solution**: Check if source JSON files are valid:
```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('./data/projects/test/sessions/default.json', 'utf8')))"
```

---

## Next Steps (Phase 1 Verification)

After successful migration:

1. **Start Orchestrator**: `cargo run`
2. **Test Vault API**: Read/search migrated files
3. **Verify Event Log**: Check `/vault/system/events.log`
4. **Run Integration Tests**: `./scripts/test-integration.sh`
5. **Benchmark Performance**: Measure startup and search times

---

## Files

- **Migration Script**: `orchestrator/scripts/migrate.js`
- **Integration Test**: `orchestrator/scripts/test-integration.sh`
- **Vault Format**: `orchestrator/docs/VAULT_SCHEMA.md`
- **Phase 1 Plan**: `orchestrator/docs/PHASE_1_COMPLETION.md`

---

**Status**: ✅ COMPLETE  
**Date**: 2026-04-17  
**Data Migrated**: 5 projects, 5 sessions, 71 messages  
**Files Created**: 8 Markdown files with frontmatter  
**Next**: Phase 1 Verification & End-to-End Testing
