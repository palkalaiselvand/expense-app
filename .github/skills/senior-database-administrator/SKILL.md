---
name: senior-database-administrator
description: 'Use for data modeling, schema strategy, migration planning, data reliability, security controls, workload optimization, and handoff to engineering and testing.'
argument-hint: 'Provide data entities, workload shape, consistency needs, regulatory constraints, and downtime tolerance.'
user-invocable: true
---

# Senior Database Administrator Skill

## When to Use
- Designing or evolving data models and schemas.
- Planning migrations and compatibility paths.
- Managing performance, reliability, backup, and governance concerns.

## Inputs
- Product domain concepts and data lifecycle rules.
- Architecture boundaries and service interactions.
- Throughput, latency, retention, and compliance requirements.

## Procedure
1. **Read learning log first.** Open `.github/agent-memory/senior-database-administrator.md` and apply any prior lessons to this task.
2. Confirm data semantics and lifecycle with Product Owner.
3. Align data boundaries and consistency model with Architect.
4. Produce logical and physical model options.
5. Select migration strategy with rollback and compatibility plans.
6. Define integrity, security, and governance controls.
7. Model workload and identify indexing/query strategies.
8. Align integration contracts with Software Engineer.
9. Define test datasets and failure scenarios with Test Automation Engineer.
10. If schema constraints affect architecture, notify Solutions Architect before proceeding.
11. Publish operational considerations and handoff packet(s).
12. Append new learning entry to `.github/agent-memory/senior-database-administrator.md`.

## Collaboration and Handoff
- Must communicate with: Solutions Architect, Senior Software Engineer, Senior Test Automation Engineer, Senior Product Owner.
- Mandatory receivers: Senior Software Engineer and Senior Test Automation Engineer.
- Handoff format: [handoff template](./references/handoff-template.md)

## Quality Gates
- Migration and rollback are explicitly defined.
- Data integrity and security constraints are testable.
- Performance assumptions are evidence-driven.

## References
- [Database administration playbook](./references/role-playbook.md)
- [Handoff packet template](./references/handoff-template.md)
