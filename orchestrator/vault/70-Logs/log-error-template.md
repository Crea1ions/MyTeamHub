---
id: log-error
type: log
title: "Error Log Template"
section: error
status: template
created: "2026-04-19T00:00:00Z"
updated: "2026-04-19T00:00:00Z"
confidence: high
tags: [log, error, incident, debugging]
lien: [ [[MOC]], [[70-Logs/errors/]] ]
---

# 🔴 Error Log Template

> Record of errors and incidents  
> ⚠️ What • 🔍 Why • ✅ Resolution

---

## 📖 PURPOSE

Document **errors, failures, and incidents** for tracking and resolution.

**When to use**:
- System error occurs
- Test failure
- Deployment issue
- Integration failure
- Performance degradation
- Security concern

**Who creates**: Developers, DevOps, monitoring systems, QA

**Lifespan**: Days to months (incident history)

---

## 📋 1. ERROR IDENTIFICATION

### Error ID
```
[error-YYYYMMDD-NNNN]
Example: error-20260419-0001
```

### Error Type
```
🔴 Critical | 🟠 Major | 🟡 Minor | 🟢 Warning
```

### Component
```
[Affected component]
Example: "Redis Cache Layer", "API Server", "Database"
```

### Timestamp
```
First Occurrence: 2026-04-19 14:23:45 UTC
Last Occurrence: 2026-04-19 14:45:12 UTC
Duration: 21 minutes, 27 seconds
```

---

## 🔍 2. ERROR DETAILS

### Error Message
```
[Exact error message from logs]

Example:
"Redis connection timeout after 30s. Failed to connect to 
redis-cluster:6379 - Connection refused"
```

### Stack Trace
```
[Full stack trace or error context]

Example:
at RedisClient.connect() [line 45]
at ConnectionPool.initialize() [line 120]
at AppServer.start() [line 8]
```

### Error Context
```
[What was happening when error occurred]

Example:
- Server was starting up
- Processing request from user [ID]
- During cache invalidation
- Under high load (CPU 95%, Memory 87%)
```

---

## 📊 3. IMPACT ASSESSMENT

### Severity
```
🔴 Critical (Service down, data loss risk, security issue)
🟠 Major (Major feature broken, significant degradation)
🟡 Minor (Non-critical feature broken)
🟢 Warning (Potential issue, needs monitoring)
```

### Affected Users/Systems
```
[Scope of impact]

Example:
- Users: All logged-in users (est. 12,000)
- Duration: 21 minutes
- Transactions affected: ~4,200
- Data loss: None (rollback successful)
```

### Business Impact
```
Revenue Impact: $[Amount] or [Percentage]
Reputation Impact: [Assessment]
Compliance Impact: [If any]
SLA Impact: Breach? Yes/No - [Details]
```

---

## 🔎 4. ROOT CAUSE ANALYSIS

### Initial Assessment
```
[Quick hypothesis]

Example: "Redis cluster connection issue"
```

### Investigation Steps
```markdown
1. Checked Redis cluster status
   - Result: Cluster master failed over
   - Time spent: 5 minutes
   
2. Reviewed recent config changes
   - Result: Connection timeout reduced from 60s to 30s
   - Time spent: 3 minutes
   
3. Analyzed monitoring metrics
   - Result: CPU spike at 14:20, coincides with error
   - Time spent: 4 minutes
```

### Root Cause (Confirmed)
```
[Definitive root cause once determined]

Example:
"Redis cluster failover happened at 14:20 due to memory pressure.
During failover, new master elected but old connection pool settings
weren't optimal for new master. Connection timeout of 30s was too short
for cluster reconfiguration."
```

### Contributing Factors
```
- Factor 1: Memory wasn't properly tuned
- Factor 2: Cluster config had redundant replicas
- Factor 3: Application didn't handle failover gracefully
```

---

## ✅ 5. RESOLUTION

### Immediate Action (Mitigation)
```
Action 1: [What was done]
Owner: [Person]
Time: [HH:MM]
Result: [Outcome]

Action 2: [What was done]
Owner: [Person]
Time: [HH:MM]
Result: [Outcome]
```

**Example**:
```
Action 1: Restarted connection pool
Owner: DevOps Lead
Time: 14:35
Result: Connections re-established, service recovered

Action 2: Increased connection timeout to 45s
Owner: DevOps Lead
Time: 14:40
Result: Prevents similar timeouts during future failovers
```

### Permanent Fix
```
Fix Applied: [What was done to prevent recurrence]
Owner: [Person]
Implementation Date: [Date]
Verification: [How confirmed it works]

Example:
Fix: Implemented circuit breaker pattern for Redis connections
Owner: Backend Lead
Date: 2026-04-20
Verification: Tested with cluster failover simulation - works correctly
```

---

## 📈 6. PREVENTION & LEARNING

### Prevention Measures
```markdown
1. Implement health checks every 5s (vs. 30s now)
2. Add circuit breaker for Redis connections
3. Document cluster failover behavior
4. Add monitoring alert for failover events
5. Increase timeout to 45s for failover scenarios
```

### Process Improvements
```
- Need better alert for cluster failover
- Need runbook for failover recovery
- Need load testing for failover scenarios
- Consider alternative caching solution resilience
```

### Documentation Updated
```
- Runbook: [Updated with this incident]
- Architecture: [Updated failover strategy]
- Monitoring: [New alerts configured]
- Testing: [New failover test added]
```

---

## 👥 7. COMMUNICATION & FOLLOW-UP

### Stakeholders Notified
```
✅ Customer Support - 14:27
✅ Engineering Team - 14:25
✅ Product Lead - 14:30
✅ C-Level - 14:35
```

### Notification Details
```
[What was communicated]

Example:
- Issue: Redis cache connection failure
- Duration: 21 minutes
- Impact: 4,200 transactions delayed
- Status: Resolved
- Root cause: Cluster failover
- Prevention: Implemented circuit breaker
```

### Post-Incident Checklist
```
- [ ] Root cause confirmed
- [ ] Permanent fix deployed
- [ ] Prevention measures implemented
- [ ] Runbook updated
- [ ] Team trained on new procedures
- [ ] Monitoring validated
- [ ] Post-mortem completed
- [ ] Stakeholders updated
- [ ] Follow-up items assigned
```

---

## 📚 8. REFERENCES & LINKS

### Related Items
```
[[20-Projects/project-name/]]
[[50-Tasks/redis-failover-resilience]]
[[70-Logs/sessions/log-2026-04-19-incident]]
```

### External References
```
- Redis Cluster Failover Docs: [URL]
- Application Logs: [Link to log system]
- Monitoring Dashboard: [Link]
- Post-Mortem: [Link if created]
```

### Related Errors
```
- error-20260415-0003 (Similar Redis issue)
- error-20260410-0001 (Connection timeout)
```

---

## ✅ 9. STATUS & TRACKING

### Resolution Status
```
🟢 Resolved - 2026-04-19 14:50
🟡 Monitoring - Verify fix stable for 24h
✅ Closed - 2026-04-20 14:50 (after 24h stability)
```

### Follow-up Tasks
```
- [ ] Implement circuit breaker (Task ID: [link])
- [ ] Update runbook (Owner: [Person])
- [ ] Add failover tests (Owner: [Person])
- [ ] Team training session (Owner: [Person])
```

### Owner & Escalation
```
Primary Owner: [Person/Team]
Escalation: [Manager] if not resolved by [Date]
Status Updates: Daily until resolved
```

---

## 📚 REFERENCES

→ [[MOC]]  
→ [[70-Logs/errors/]]  
→ [[70-Logs/sessions/]]

---

## ✅ TEMPLATE USAGE

**To use this template**:

1. Create error log: `cp log-error-template.md [error-id].md`
2. Fill Error Identification (type, component, timestamp)
3. Document Error Details (message, stack trace)
4. Assess Impact
5. Perform Root Cause Analysis
6. Document Resolution
7. Capture Learnings & Prevention
8. Complete Follow-up Items
9. Store in `70-Logs/errors/[error-id].md`

**For Agents**:
- YAML metadata enables error tracking
- Structured analysis supports pattern detection
- RCA section enables causality analysis
- Prevention measures feed into improvements

**Update Cadence**:
- Creation: When error first occurs
- Investigation: Ongoing until RCA complete
- Resolution: When fix deployed
- Verification: 24h after fix
- Closure: When prevention confirmed
