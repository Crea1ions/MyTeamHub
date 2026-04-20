---
id: task-single
type: task
title: "Task Template"
section: individual
status: template
created: "2026-04-19T00:00:00Z"
updated: "2026-04-19T00:00:00Z"
confidence: high
tags: [task, template, tracking, work-item]
lien: [ [[MOC]], [[50-Tasks/]] ]
---

# ✅ Task Template

> Individual task tracking  
> 📋 What • 👤 Who • ⏰ When

---

## 📖 PURPOSE

Track a **single work item** from creation to completion.

**When to use**: 
- New task or work item assigned
- Bug fix or feature implementation
- Investigation or spike
- Documentation task

**Who creates**: Team member, project lead, or agent

**Lifespan**: Hours to days (active-only)

---

## 📝 1. TASK BASICS

### Task ID
```
[kebab-case-unique-id]
Example: setup-redis-caching
```

### Title
```
[Clear, specific task name]
Example: "Set up Redis caching layer for API endpoints"
```

### Description
```
[2-3 sentences explaining what needs to be done]

Example:
"Implement Redis-based caching for the top 3 API endpoints 
to reduce database load. Cache invalidation rules must follow 
the strategy defined in [project-doc-link]."
```

---

## 👤 2. ASSIGNMENT

### Assigned To
```
[Person name or self-assignment]
```

### Reporter
```
[Who created this task]
```

### Task Type
```
🟦 Feature | 🐛 Bug | 📚 Documentation | 🧪 Investigation | 🏗️ Refactoring | ⚡ Spike
```

---

## ⏰ 3. TIMELINE

### Created
```
Date: [YYYY-MM-DD HH:MM]
```

### Target Start
```
Date: [YYYY-MM-DD]
Reason: [Why this timing]
```

### Target End
```
Date: [YYYY-MM-DD]
Duration: [X days estimated]
```

### Actual End (Fill on completion)
```
Date: [YYYY-MM-DD]
Duration Actual: [X days]
```

---

## 🎯 4. ACCEPTANCE CRITERIA

What defines "done" for this task?

```markdown
- [ ] Acceptance criterion 1
- [ ] Acceptance criterion 2
- [ ] Acceptance criterion 3
- [ ] Code reviewed
- [ ] Tests passing
- [ ] Documentation updated
```

**Example**:
```markdown
- [ ] Redis connection pool configured and tested
- [ ] Cache hit rate > 70% on target endpoints
- [ ] Cache invalidation working correctly
- [ ] Performance tests passing (p95 < 250ms)
- [ ] Code review approved
- [ ] Documentation updated in wiki
```

---

## 📊 5. STATUS & PROGRESS

### Current Status
```
🔮 Not Started | 🟡 In Progress | 🟠 Blocked | 👀 Review | ✅ Done | ❌ Canceled
```

### Progress %
```
0% | 25% | 50% | 75% | 100%
```

### Last Updated
```
Date: [YYYY-MM-DD HH:MM]
Notes: [Brief status note]
```

### Status Log (Update as you work)
```markdown
**2026-04-19 09:00** - Task created, waiting for resources
**2026-04-19 14:00** - Started setup, reviewing existing code
**2026-04-20 10:00** - Connected to Redis cluster
**2026-04-20 16:00** - Cache implementation 80% complete, in code review
```

---

## 🚧 6. BLOCKERS & DEPENDENCIES

### Blocking This Task
```
- Blocker 1: [Description]
  - Impact: Can't proceed until [date/condition]
  - Owner: [Person to resolve]
  - Mitigation: [What to do meanwhile]

- Blocker 2: [Description]
  - Impact: [Impact]
  - Owner: [Person]
```

### This Task Blocks
```
- [Other task or project]
- [Other task or project]
```

### Dependencies
```
- Task 1: [Must complete first]
- Task 2: [Needs input from]
- Task 3: [Waiting on result from]
```

---

## 📚 7. RELATED CONTEXT

### References
```
[[20-Projects/project-name/concept]]
[[20-Projects/project-name/plan-complet]]
[[10-Context/architecture-global]]
```

### Related Tasks
```
- task-related-1.md
- task-related-2.md
```

### Related Code/Docs
```
- Repository: [URL]
- PR/Branch: [Link]
- Documentation: [Link]
```

---

## 💬 8. NOTES & COMMENTS

### Implementation Notes
```
[Discoveries, decisions, technical notes made while working]

Example:
- Redis 7.0+ supports cluster mode, need to upgrade from 6.x
- Database schema has N+1 query issues, should address together
- Existing cache layer uses Memcached, need migration strategy
```

### Review Comments
```
[Feedback from code review, testing, or validation]

Example:
- Reviewer: "Consider adding cache metrics/observability"
- QA: "Test cache invalidation under concurrent requests"
- Product: "Looks good, matches requirements"
```

### Learnings
```
[What we learned completing this task - for future reference]

Example:
- Redis cluster configuration is complex, document for next time
- Should have added monitoring earlier in the process
- Pattern: [reusable pattern discovered]
```

---

## ✅ 9. COMPLETION

### Completion Checklist
```markdown
- [ ] All acceptance criteria met
- [ ] Code merged to main
- [ ] Tests passing in CI/CD
- [ ] Documentation updated
- [ ] Performance verified
- [ ] No regressions found
- [ ] Team notified of completion
- [ ] Task marked as Done
```

### Completion Notes
```
[Summary of what was accomplished]

Example:
"Successfully implemented Redis caching for API endpoints.
Cache hit rate reached 78%. Performance improved by 35%.
Migration from Memcached completed. Documentation added to wiki.
Ready for production deployment."
```

### Retrospective (Optional)
```
What went well: [Points]
What could improve: [Points]
Time estimate vs actual: [Variance analysis]
```

---

## 📚 REFERENCES

→ [[50-Tasks/]]  
→ [[MOC]]  
→ [[20-Projects/]]

---

## ✅ TEMPLATE USAGE

**To use this template**:

1. Copy this file: `cp task-template.md [task-name].md`
2. Update Basics (title, description, assigned to)
3. Set Timeline (target dates)
4. Define Acceptance Criteria
5. Add to appropriate folder:
   - `50-Tasks/active/` - New task
   - Move to `50-Tasks/completed/` when done
   - Move to `50-Tasks/backlog/` if postponed

**For Agents**:
- YAML metadata ensures parsing
- Status field updates programmatically
- Links enable relationship tracking
- Structured sections support automation

