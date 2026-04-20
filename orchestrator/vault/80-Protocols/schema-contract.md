---
id: schema-contract
type: protocol
title: "Vault Schema Contract"
status: active
created: "2026-04-19T00:00:00Z"
updated: "2026-04-19T00:00:00Z"
confidence: high
tags: [rules, protocols, schema, contract, validation]
lien: [[MOC]]
---

# schema-contract


# schema-contract


# 🔗 VAULT SCHEMA CONTRACT

**Version**: 2.0  
**Status**: Active  
**Last Updated**: 2026-04-18

---

## 📋 Vault Structure (MANDATORY)

### 10-Directory System (Non-negotiable)

```
Orchestrator-Vault/
├── 00-Inbox/           (entry points, sessions, ideas)
├── 10-Context/         (global state, architecture)
├── 20-Projects/        (project structures)
├── 30-Knowledge/       (long-term knowledge)
├── 40-Snippets/        (reusable code)
├── 50-Tasks/           (task management)
├── 60-State/           (system state, logs)
├── 70-Logs/            (sessions, agents, errors)
├── 80-Protocols/       (rules, contracts)
├── 90-Indexes/         (navigation, indexes)
└── System Files        (_SYSTEM.md, README.md, RECENT_CONTEXT.md)
```

### Subdirectories (Required for each root)

| Root | Subdirectories | Purpose |
|------|----------------|---------|
| 00-Inbox | myteam-studio, agent-dev, agent-openclaw, projects | Entry points |
| 10-Context | (none) | Global state |
| 20-Projects | (dynamic per project) | Project folders |
| 30-Knowledge | architecture, llm, dev, patterns | Knowledge categories |
| 40-Snippets | rust, api, ui, sql | Code categories |
| 50-Tasks | active, backlog, completed | Task status |
| 60-State | (none) | State files |
| 70-Logs | sessions, agents, system, errors | Log categories |
| 80-Protocols | (none) | Protocol files |
| 90-Indexes | (none) | Index files |

---

## 📝 File Format Rules

### YAML Frontmatter (MANDATORY)

All markdown files must have frontmatter:

```yaml
---
id: unique-identifier
type: project|note|protocol|task|etc
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: active|archived|completed
tags:
  - tag1
  - tag2
---
```

### Filename Convention

- Use kebab-case for filenames: `project-name.md`
- Use lowercase for directories: `agent-dev/`
- No spaces in filenames
- No special characters except `-` and `_`

### Content Structure

```markdown
---
[frontmatter]
---

# Title

**Status**: [status]
**Created**: [date]
**Updated**: [date]

## Overview
[description]

## Details
[content]

## Links
- [[Related file]]
- [External](url)
```

---

## 🔗 Link Format (MANDATORY)

### Obsidian Format
```markdown
[[path/to/file.md]]
[[path/to/file.md|Display Text]]
```

### Markdown Format
```markdown
[Display Text](path/to/file.md)
[External Link](https://example.com)
```

### Validation Rules
- Paths must be lowercase
- Paths cannot start with `/`
- Paths cannot have consecutive `/`
- Extensions optional (defaults to `.md`)

---

## 📊 File Size Limits

| Limit | Value |
|-------|-------|
| Max file size | 10 MB |
| Max lines per file | 10,000 |
| Max frontmatter size | 2 KB |
| Max file path length | 255 chars |

---

## ✅ Validation Rules

### All Files Must
- [ ] Have valid YAML frontmatter
- [ ] Have lowercase id field
- [ ] Have type field
- [ ] Have created and updated dates
- [ ] Have at least one tag
- [ ] Use valid filenames (kebab-case)

### All Directories Must
- [ ] Follow 10-directory structure
- [ ] Contain no loose files (except root level)
- [ ] Have consistent naming (lowercase)
- [ ] Respect subdirectory rules

### All Links Must
- [ ] Use valid path format
- [ ] Point to existing files
- [ ] Use either Obsidian or Markdown format
- [ ] Not have circular references

---

## 🔒 Forbidden Patterns

❌ **Do NOT do this**:
- Store files in root directory (except _SYSTEM.md, README.md, RECENT_CONTEXT.md)
- Mix contexts in the same file
- Skip frontmatter metadata
- Use absolute paths in links
- Create arbitrary nesting beyond defined structure
- Store binary files in vault
- Create files without type field
- Use spaces in filenames

---

## 🧪 Validation Checklist

Before committing files to vault:

- [ ] File has valid YAML frontmatter
- [ ] Frontmatter has all required fields
- [ ] File in correct directory (00-90)
- [ ] Filename is lowercase and kebab-case
- [ ] Content follows format guidelines
- [ ] All links use correct format
- [ ] File size under 10 MB
- [ ] No sensitive information exposed
- [ ] Metadata is accurate and current

---

## 📈 Metrics & Health

### Vault Health Check
```
Directories: 10 required + N project folders ✓
Files: Minimum 8 critical files ✓
Structure: Valid 10-directory hierarchy ✓
Frontmatter: 100% compliance ✓
Links: No broken links ✓
Size: Under 100 MB ✓
```

---

## 🔄 Migration Rules

When moving files:
1. Preserve all metadata
2. Update frontmatter paths if needed
3. Update all links pointing to moved file
4. Preserve creation date, update updated date
5. Verify integrity after migration

---

**This contract is non-negotiable.**  
**Violations will cause system instability.**  
*Enforced by: VaultValidator*  
*Last updated: 2026-04-18*
