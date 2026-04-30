---
name: senior-software-engineer
description: 'Use for implementation planning, maintainable code delivery, API behavior design, integration, technical debt control, and quality handoff to testing and product owners.'
argument-hint: 'Provide architecture decisions, acceptance criteria, constraints, and existing code context.'
user-invocable: true
---

# Senior Software Engineer Skill

## When to Use
- Implementing feature or platform changes from architecture inputs.
- Refactoring for maintainability and extensibility.
- Translating acceptance criteria into code and verifiable behavior.

## Inputs
- Architectural decisions and system boundaries.
- Product acceptance criteria.
- Data, UX, and test quality requirements.

## Procedure
1. **Read learning log first.** Open `.github/agent-memory/senior-software-engineer.md` and apply any prior lessons to this task.
2. Validate requirements and architecture assumptions.
3. Create an incremental implementation plan.
4. Coordinate data change impact with DBA.
5. Coordinate UX and interaction fidelity with UI UX Specialist.
6. Implement in small, reviewable steps.
7. Add or update tests with Test Automation Engineer strategy.
8. Verify behavior, edge cases, and failure handling.
9. Prepare release notes and technical debt notes.
10. Handoff to Test Automation Engineer and Product Owner.
11. Append new learning entry to `.github/agent-memory/senior-software-engineer.md`.

## Collaboration and Handoff
- Must communicate with: Solutions Architect, Senior Database Administrator, Senior UI UX Specialist, Senior Test Automation Engineer.
- Mandatory receiver: Senior Test Automation Engineer.
- Secondary receiver: Senior Product Owner.
- Handoff format: [handoff template](./references/handoff-template.md)

## Quality Gates
- Code is readable, testable, and traceable to requirements.
- Integration points are validated.
- Known risks and debt are documented.

## References
- [Software engineering playbook](./references/role-playbook.md)
- [Handoff packet template](./references/handoff-template.md)
