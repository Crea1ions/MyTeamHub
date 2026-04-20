---
id: openclaw-anomalies
type: note
title: "OpenClaw Anomalies"
status: active
created: "2026-04-19T00:00:00Z"
updated: "2026-04-19T00:00:00Z"
confidence: high
tags: [openclaw, insights, anomalies, exceptions]
lien: [[MOC-Agent-Openclaw]]
---

# 🚨 OpenClaw Anomalies

## Definition
Deviations from expected patterns that warrant attention.

Actual exceptions, not just variations.

---

## Detected Anomalies

### Anomaly: _template-project appears twice
**Location**: 20-Projects/ AND 00-Inbox/agent-dev/projects-dev/
**Status**: INTENTIONAL (dev-prefixed versions)
**Assessment**: ✅ Correctly resolved with dev- prefix

### Anomaly: obs-orchestrator was instance-specific
**Location**: Was in 20-Projects/
**Status**: REMOVED (prior audit)
**Assessment**: ✅ Correct cleanup

### Anomaly: external-analysis is vague
**Location**: Used to be directly in agent-openclaw/
**Status**: NOW in 01-analyses/vault/
**Assessment**: ✅ Better structured

---

## Resolution Status

| Anomaly | Status | Action | Owner |
|---------|--------|--------|-------|
| Duplicate IDs | Resolved | dev- prefix | agent-dev |
| Personal paths | Resolved | <vault-root>/ | vault |
| Broken links | Resolved | Updated refs | vault |
| Instance content | Resolved | Archived | vault |

---

## If New Anomalies Appear

Document here with:
1. **What** - Description of deviation
2. **Where** - File or pattern location
3. **Why** - Hypothesis about root cause
4. **Impact** - What breaks if ignored
5. **Fix** - Proposed resolution

---

*Last updated: 2026-04-19*
