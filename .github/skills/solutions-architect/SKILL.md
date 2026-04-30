---
name: solutions-architect
description: 'Use for end-to-end architecture design, decision records, tradeoff analysis, integration contracts, and implementation handoff to engineering, database, and UX roles.'
argument-hint: 'Provide goals, quality attributes, scale assumptions, constraints, and known interfaces.'
user-invocable: true
---

# Solutions Architect Skill

## When to Use
- Translating product intent into architecture decisions.
- Defining component boundaries and integration contracts.
- Driving non-functional requirements into implementation slices.

## Inputs
- Product goals, acceptance criteria, and constraints.
- Existing systems, dependencies, and operational assumptions.
- Security, reliability, performance, and compliance expectations.

## Procedure
1. **Read learning log first.** Open `.github/agent-memory/solutions-architect.md` and apply any prior lessons to this task.
2. Confirm scope and success outcomes with Product Owner.
3. Define system context, boundaries, and responsibilities.
4. Map functional and non-functional requirements to architecture elements.
5. Evaluate design options with explicit tradeoff rationale.
6. Define interface contracts and failure handling patterns.
7. Collaborate with DBA on data architecture and lifecycle.
8. Collaborate with UI UX Specialist on interaction architecture.
9. Slice architecture into executable work packages for Software Engineer.
10. Publish handoff packets to implementation roles.
11. Append new learning entry to `.github/agent-memory/solutions-architect.md`.

## Collaboration and Handoff
- Must communicate with: Senior Product Owner, Senior Software Engineer, Senior Database Administrator, Senior UI UX Specialist.
- Mandatory receiver: Senior Software Engineer and Senior Database Administrator.
- Optional additional receiver: Senior UI UX Specialist.
- Handoff format: [handoff template](./references/handoff-template.md)

## Quality Gates
- Every architecture decision has a reason and consequence.
- NFR coverage is explicit.
- Implementation slices are independently deliverable.

## References
- [Architecture playbook](./references/role-playbook.md)
- [Handoff packet template](./references/handoff-template.md)
