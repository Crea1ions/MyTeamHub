---
id: orphan-files
type: index
title: "Orphan Files Detection"
status: active
created: "2026-04-19T00:00:00Z"
updated: "2026-04-19T00:00:00Z"
confidence: high
tags: [index, quality, orphans, maintenance]
lien: [[MOC]]
---

# 🔍 Orphan Files Detection

> Fichiers sans liens entrants (detected by IndexManager)  
> 📊 Analysis • ⚠️ Risks • ✅ Fixes

---

## 📊 1. CURRENT STATUS

### Metrics
- Total files scanned: 50+
- Orphan files found: 0
- Coverage: 100%
- Last scan: 2026-04-19

---

## ⚠️ 2. WHAT IS AN ORPHAN?

A file is orphan if:
- ❌ No file links to it (`linked_from: []`)
- ❌ Not in any MOC
- ❌ Not referenced from indexes
- ❌ Not explicitly included in parent structure

**Exception**: MOCs and indexes can be orphans by design

---

## ✅ 3. PREVENTION

### Rules
1. Every file should have at least one backlink
2. Add to MOC or parent index
3. Use `lien: [[parent]]` in frontmatter
4. Run IndexManager weekly

---

## 🔗 Links

- [[MOC]] — Main navigation
- [[vault-standardization-analysis]] — Quality audit
- [[90-Indexes/]] — All indexes

---

**Last Scan**: 2026-04-19
