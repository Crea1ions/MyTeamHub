---
id: state-component
type: state
title: "Component State Template"
section: component
status: template
created: "2026-04-19T00:00:00Z"
updated: "2026-04-19T00:00:00Z"
confidence: high
tags: [state, tracking, health, status]
lien: [ [[MOC]], [[60-State/]] ]
---

# 🟢 State Template: Component Status

> Real-time component health tracking  
> 📊 Status • 🏥 Health • ⚡ Metrics

---

## 📖 PURPOSE

Track **real-time state** of a system component or subsystem.

**When to use**:
- System startup/monitoring
- Component health checks
- Configuration validation
- Integration testing
- Post-deployment verification

**Who updates**: DevOps, system monitoring, integration tests

**Lifespan**: Hours to weeks (persistent, auto-updated)

---

## 🔍 1. COMPONENT IDENTIFICATION

### Component Name
```
[System component]
Example: "Redis Cluster", "API Server", "Database Pool"
```

### Component Type
```
🗄️ Database | 🔌 Service | ⚙️ Infrastructure | 🔄 Connector | 📊 Storage | 📡 Network
```

### Version
```
[Version or commit SHA]
```

---

## 🟢 2. HEALTH STATUS

### Current Status
```
🟢 Healthy | 🟡 Degraded | 🔴 Failing | ⚫ Unknown
```

### Last Check
```
Timestamp: [YYYY-MM-DD HH:MM:SS]
Check Type: [Automated | Manual | Integration Test]
```

### Health Details
```
Connection: 🟢 Healthy | 🟡 Slow | 🔴 Failed
Response Time: [avg]ms (target: [X]ms)
Error Rate: [X]% (threshold: [Y]%)
Availability: [X.XX]% (target: [99.9]%)
```

---

## 📊 3. METRICS

### Performance Metrics
```markdown
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Latency (p95) | 245ms | <250ms | 🟢 |
| Throughput | 4500 req/s | >4000 | 🟢 |
| Error Rate | 0.02% | <0.1% | 🟢 |
| CPU Usage | 45% | <80% | 🟢 |
| Memory Usage | 62% | <85% | 🟢 |
| Disk I/O | 35% | <70% | 🟢 |
```

### Availability Metrics
```markdown
| Period | Uptime | Incidents |
|--------|--------|-----------|
| Today | 99.98% | 0 |
| This Week | 99.95% | 1 |
| This Month | 99.92% | 2 |
| YTD | 99.87% | 5 |
```

---

## 🚨 4. ALERTS & THRESHOLDS

### Active Alerts
```
None 🟢

Or if any:
- Alert 1: [Issue] (Severity: 🟡 Warning | 🔴 Critical)
  - Threshold: [When triggered]
  - First Detected: [When]
  - Status: [Investigating | Mitigating | Resolved]
```

### Alert Thresholds
```
- Latency > 500ms → 🟡 Warning
- Error Rate > 1% → 🔴 Critical
- CPU > 90% → 🟡 Warning
- Memory > 95% → 🔴 Critical
- Downtime > 30s → 🔴 Critical
```

---

## ⚙️ 5. CONFIGURATION STATE

### Current Configuration
```markdown
- Connection Pool: [Size] connections
- Timeout: [X]s
- Retry Policy: [Exponential backoff]
- Circuit Breaker: [Enabled | Disabled]
- Caching: [Enabled | Disabled]
- Compression: [Enabled | Disabled]
```

### Recent Changes
```markdown
**2026-04-19 14:30** - Updated connection pool size (100 → 150)
**2026-04-18 09:00** - Enabled compression on API responses
**2026-04-17 22:00** - Increased cache TTL (5min → 15min)
```

---

## 🔄 6. DEPENDENCY STATE

### Connected Components
```
✅ Database: Connected
✅ Cache Layer: Connected
✅ Message Queue: Connected
⚠️ External API: Degraded (slow responses)
```

### Integration Status
```
Ready to accept: 🟢 Traffic | 🟡 Limited | 🔴 None
Ready to send: 🟢 Traffic | 🟡 Limited | 🔴 None
```

---

## 📋 7. RECENT HISTORY

### Last 24 Hours
```markdown
**09:00** - System online, all checks passing
**11:30** - Brief latency spike (500ms) detected, auto-scaled
**14:20** - Configuration update applied (connection pool)
**16:45** - Regular backup completed successfully
**Current** - Stable, all metrics normal
```

### Known Issues
```
Issue 1: [Description]
- Status: 🟡 Monitoring
- Workaround: [If any]
- Fix ETA: [Date]

Issue 2: [Description]
- Status: 🔴 Critical
- Workaround: Restart component
- Fix ETA: [Date]
```

---

## 📞 8. SUPPORT & CONTACTS

### Component Owner
```
[Person/Team name]
Contact: [Email or channel]
```

### On-Call Contact
```
[Person]
Available: [Hours]
Escalation: [Manager name]
```

### Documentation
```
→ [[10-Context/system-runtime-state]]
→ [[30-Knowledge/architecture/]]
→ [Runbook URL]
```

---

## ✅ 9. VALIDATION CHECKLIST

**For automated checks**:
```markdown
- [ ] Connection established
- [ ] Authentication successful
- [ ] Response time acceptable
- [ ] No critical errors
- [ ] Metrics being collected
- [ ] Alerts properly configured
- [ ] Documentation current
```

---

## 📚 REFERENCES

→ [[MOC]]  
→ [[10-Context/system-runtime-state]]  
→ [[60-State/]]

---

## ✅ TEMPLATE USAGE

**To use this template**:

1. Copy: `cp state-template.md [component-name]-state.md`
2. Update Component Identification
3. Add Health Status (automated or manual)
4. Define Key Metrics
5. Set Alert Thresholds
6. Store in `60-State/[component-name]-state.md`

**For Agents**:
- YAML metadata enables state parsing
- Structured metrics allow comparison
- Threshold definitions enable alerts
- History tracking supports trend analysis

**Update Frequency**:
- Automated: Every 5-15 minutes (via monitoring)
- Manual: Weekly or on significant change
- Status: Whenever health changes
