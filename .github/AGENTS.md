# Scrum Team Agents

This workspace defines a six-role, technology-agnostic software delivery team:

1. Senior Product Owner
2. Solutions Architect
3. Senior Software Engineer
4. Senior Test Automation Engineer
5. Senior Database Administrator
6. Senior UI UX Specialist

## Team Contract

- Every role must READ its learning log before starting any task.
- Every role must communicate with at least one peer role while working.
- Every role must finish with a mandatory handoff packet.
- Every role must run a self-learning loop after each completed assignment.
- Every role must log and re-issue a handoff if rejected by the receiver.
- Parallel tracks (DBA + UI UX) must check for interface conflicts before issuing downstream handoffs.

## Required Handoff Packet

Each role uses this structure when handing off:

```text
HANDOFF_PACKET
From: <role>
To: <next role>
Task: <task summary>
Context: <business and technical context>
Decisions: <key decisions and tradeoffs>
Open Questions: <unresolved items>
Risks: <known risks>
Acceptance Criteria: <done conditions for receiver>
Artifacts Updated: <files, docs, tests, diagrams>
Learning Note ID: <role-memory entry ID>
```

## Self-Learning Store

Roles append lessons learned to:

- `.github/agent-memory/senior-product-owner.md`
- `.github/agent-memory/solutions-architect.md`
- `.github/agent-memory/senior-software-engineer.md`
- `.github/agent-memory/senior-test-automation-engineer.md`
- `.github/agent-memory/senior-database-administrator.md`
- `.github/agent-memory/senior-ui-ux-specialist.md`
