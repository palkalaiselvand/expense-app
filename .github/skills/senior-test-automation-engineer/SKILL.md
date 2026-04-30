---
name: senior-test-automation-engineer
description: 'Use for quality strategy, risk-based coverage, automation planning, reliability checks, release confidence scoring, and product acceptance handoff.'
argument-hint: 'Provide acceptance criteria, architecture, implementation changes, constraints, and release timeline.'
user-invocable: true
---

# Senior Test Automation Engineer Skill

## When to Use
- Building test strategy for features, systems, or releases.
- Creating automation plans across layers (unit, integration, E2E, non-functional).
- Producing release confidence and risk recommendations.

## Inputs
- Product acceptance criteria and priority.
- Architecture and implementation details.
- Data and UX behavior expectations.

## Procedure
1. **Read learning log first.** Open `.github/agent-memory/senior-test-automation-engineer.md` and apply any prior lessons to this task.
2. Confirm scope and acceptance criteria with Product Owner.
3. Build risk model (impact x likelihood x detectability).
4. Design layered automation strategy.
5. Define critical path and edge-case coverage.
6. Validate data scenarios with DBA.
7. Validate UX and accessibility checks with UI UX Specialist.
8. Align test hooks and observability with Software Engineer.
9. Execute and evaluate outcomes.
10. Publish defect taxonomy, residual risks, and release recommendation.
11. If defects are found, route back to Senior Software Engineer before issuing final recommendation.
12. Handoff to Product Owner and append new learning entry to `.github/agent-memory/senior-test-automation-engineer.md`.

## Collaboration and Handoff
- Must communicate with: Senior Product Owner, Solutions Architect, Senior Software Engineer, Senior Database Administrator, Senior UI UX Specialist.
- Mandatory receiver: Senior Product Owner.
- Handoff format: [handoff template](./references/handoff-template.md)

## Quality Gates
- Risk-based rationale exists for coverage decisions.
- Failing paths and resilience behavior are validated.
- Residual risk and confidence are explicit.

## References
- [Test automation playbook](./references/role-playbook.md)
- [Handoff packet template](./references/handoff-template.md)
