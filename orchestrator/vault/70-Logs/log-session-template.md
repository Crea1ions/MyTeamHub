---
id: log-session
type: log
title: "Session Log Template"
section: session
status: template
created: "2026-04-19T00:00:00Z"
updated: "2026-04-19T00:00:00Z"
confidence: high
tags: [log, session, audit, work-record]
lien: [ [[MOC]], [[70-Logs/sessions/]] ]
---

# 📝 Session Log Template

> Record of work session activities  
> 🕐 Timeline • 📋 Events • 📊 Summary

---

## 📖 PURPOSE

Document **what happened during a work session**: actions, decisions, outcomes.

**When to use**:
- Wrapping up a work session
- Recording important meetings
- Capturing incident responses
- Documenting investigations
- Team collaboration records

**Who creates**: Team members, agents, automated systems

**Lifespan**: Days to months (audit trail)

---

## 📋 1. SESSION HEADER

### Session ID
```
[Date-sequential-id]
Example: 2026-04-19-001
```

### Session Type
```
🔧 Development | 📊 Analysis | 🐛 Debugging | 👥 Meeting | 🚨 Incident Response | 🧪 Testing | 📚 Research
```

### Participants
```
[Name 1] (Role)
[Name 2] (Role)
[Agent Name] (if applicable)
```

### Duration
```
Start: 2026-04-19 09:00
End: 2026-04-19 12:30
Duration: 3.5 hours
```

---

## 🎯 2. SESSION GOAL

### Primary Objective
```
[What we aimed to accomplish]

Example: "Implement Redis caching layer for API endpoints"
```

### Success Criteria
```
- [ ] Criteria 1
- [ ] Criteria 2
- [ ] Criteria 3
```

### Achieved
```
✅ Full Success | 🟡 Partial (X% done) | 🔴 Not Achieved
```

---

## 📝 3. SESSION TIMELINE

### Events Log

#### 09:00 - Session Start
```
Action: Team kickoff meeting
Participants: [Names]
Outcome: Aligned on approach, assigned subtasks
```

#### 09:30 - First Milestone
```
Action: Architecture review completed
Owner: [Name]
Notes: Approved design, minor feedback on scaling
```

#### 11:00 - Development Begins
```
Action: Started implementation in feature branch
Owner: [Name]
Status: 🟡 In Progress
```

#### 12:00 - Issue Discovered
```
Action: Found N+1 query problem in existing code
Owner: [Name]
Severity: 🟡 Medium (not blocking current task)
Decision: Document for Phase 2, proceed with caching
```

#### 12:30 - Session Wrap-up
```
Action: Code review, merge readiness check
Owner: [Name]
Status: Ready for review, 2 inline comments to address
```

---

## 🧠 4. DECISIONS MADE

### Decision 1
```
What: [Decision]
Rationale: [Why this decision]
Owner: [Who decided]
Impact: [What changes]
Recorded At: [HH:MM]
```

**Example**:
```
What: Use lazy-loading for cache initialization
Rationale: Simplifies deployment, prevents startup delays
Owner: Senior Dev
Impact: Reduces startup time, improves scaling
Recorded At: 10:15
```

### Decision 2
```
What: [Decision]
Rationale: [Why]
Owner: [Who]
Impact: [What]
Recorded At: [HH:MM]
```

---

## 📊 5. WORK COMPLETED

### Tasks Finished
```markdown
- [x] Task 1: Architecture design review (2h)
- [x] Task 2: Setup dev environment (1h)
- [x] Task 3: Initial implementation (2.5h)
- [ ] Task 4: Code review (deferred to next session)
```

### Deliverables
```
1. [DELIVERABLE_1] - Completed
2. Feature branch: [FEATURE_NAME] ([STATUS], [PERCENT]% done)
3. Test coverage: [COVERAGE_PERCENT]% ([COVERAGE_STATUS])
```

### Metrics Captured
```
- Lines of code: [LOC_COUNT]
- Tests added: [TEST_COUNT]
- Documentation: [DOC_COUNT] sections
- Time spent: [TIME_SPENT] hours
```

---

## 🚨 6. BLOCKERS & ISSUES

### Issues Encountered
```
Issue 1: [Description]
- Severity: 🟡 Medium
- Discovered At: [HH:MM]
- Root Cause: [If known]
- Workaround: [If applicable]
- Resolution: [Or owner/due date]

Issue 2: [Description]
- Severity: 🟢 Low
- Discovered At: [HH:MM]
- Workaround: [Option A or Option B]
- Resolution: Ticket filed for Phase 2
```

### Blockers Remaining
```
None - all blockers cleared

Or if any:
- Blocker 1: [Description] (Owner: [Person], Due: [Date])
```

---

## 💡 7. LEARNINGS & INSIGHTS

### What Went Well ✅
```
- Team communication excellent
- Architecture design clear and unambiguous
- Rapid iteration with good feedback loop
- Strong code review discipline
```

### What Could Improve 🟡
```
- Should have profiled existing code earlier
- Need better test environment setup
- Documentation templates would save time
```

### Patterns Discovered 🔍
```
- Pattern 1: [Reusable approach found]
- Pattern 2: [Best practice observed]
- Pattern 3: [Tool/process improvement]
```

### Knowledge Captured 📚
```
- Reusable pattern: Redis cluster configuration
- Gotcha: N+1 queries in legacy endpoints
- Optimization: Pre-warm cache on startup
```

---

## 🔗 8. REFERENCES & LINKS

### Related Items
```
[[20-Projects/project-name/concept]]
[[20-Projects/project-name/plan-complet]]
[[50-Tasks/setup-redis-caching]]
[[50-Tasks/implement-cache-layer]]
```

### Artifacts Created
```
- Feature branch: `feature/redis-caching`
- PR #1234: [Link]
- Documentation: [Wiki URL]
- Test results: [Link to CI/CD]
```

### Incident Record (if applicable)
```
Incident ID: [ID]
Post-Mortem: [[70-Logs/incidents/[incident-id]]]
Resolution: [Summary]
```

---

## ✅ 9. NEXT SESSION PREP

### Handoff Notes
```
[What the next person/team needs to know]

Example:
"Redis implementation is 85% done. Need to:
1. Address 2 code review comments
2. Add edge case tests
3. Performance benchmark
Estimated 2-3 more hours. Can be merged after review."
```

### Dependencies for Next Session
```
- Waiting for: [Item] from [Person] by [Date]
- Blocking: [Other task] starting [Date]
- Prerequisite: [Completed task]
```

### Recommended Next Steps
```
1. [Action] - Owner: [Person]
2. [Action] - Owner: [Person]
3. [Action] - Owner: [Person]
```

---

## 📚 REFERENCES

→ [[MOC]]  
→ [[70-Logs/sessions/]]  
→ [[00-Inbox/agent-dev/sessions-dev/]]

---

## ✅ TEMPLATE USAGE

**To use this template**:

1. Create new session: `cp log-session-template.md log-[YYYY-MM-DD]-[seq].md`
2. Update Header (type, participants, time)
3. Record Goal & Success Criteria
4. Log Events as they happen (or afterwards)
5. Document Decisions Made
6. Summarize Work Completed
7. Capture Blockers & Issues
8. Extract Learnings
9. Prepare Handoff Notes
10. Store in `70-Logs/sessions/[session-file].md`

**For Agents**:
- YAML metadata enables automated indexing
- Timeline structure supports causality tracking
- Decision log enables auditing
- Learnings section feeds into knowledge base

**Update Cadence**:
- Real-time: Add events as they occur
- Session end: Complete learnings & handoff
- Archive: Move to completed sessions folder
