---
name: team-validation
description: "Validate all 6 scrum team agents work in correct sequence with proper handoffs, collaboration, and self-learning. Use this prompt against any project scenario to test team readiness."
argument-hint: "Provide the feature scenario to use for validation, or leave blank to use the default scenario."
---

# Scrum Team Sequential Validation Prompt

## Purpose
Run each of the six scrum agents through a shared scenario in the correct order.  
At every gate, verify the handoff packet is complete before proceeding.

## Default Validation Scenario
> **Feature:** Secure User Profile Management
> Users must be able to view, update, and delete their own profile (name, email, preferences).
> Data must be encrypted at rest. Changes must be auditable. UI must be WCAG 2.1 AA compliant.
> Team must deliver production-ready slice in a two-week sprint.

You may substitute your own scenario in the argument above.

---

## STEP 1 — Senior Product Owner

@Senior Product Owner apply your senior-product-owner skill to the scenario above.

**You must produce:**
- Problem Statement
- Outcome metrics (measurable, observable)
- Prioritized Backlog (P0 / P1 / P2)
- Acceptance Criteria (at least one criterion per backlog item)
- Risks and Assumptions
- HANDOFF_PACKET to Solutions Architect

**Validation Gate 1 — SPO Checklist**
Before STEP 2 starts, confirm ALL of the following are present in the output:
- [ ] Problem Statement exists
- [ ] Each backlog item has a business value statement and acceptance criterion
- [ ] Acceptance criteria are testable (observable behaviors, not intentions)
- [ ] HANDOFF_PACKET contains: From, To, Task, Context, Decisions, Open Questions, Risks, Acceptance Criteria, Artifacts Updated, Learning Note ID

---

## STEP 2 — Solutions Architect

@Solutions Architect apply your solutions-architect skill using the HANDOFF_PACKET received from Senior Product Owner.

**You must produce:**
- Context Diagram and Component Breakdown
- Functional and Non-Functional Mapping (use the 7-point NFR matrix: Availability, Performance, Scalability, Security, Observability, Recoverability, Operability)
- At least one ADR (Architecture Decision Record)
- Implementation Slices tied to backlog items
- Risk Register
- HANDOFF_PACKET to Senior Software Engineer
- HANDOFF_PACKET to Senior Database Administrator
- HANDOFF_PACKET to Senior UI UX Specialist (required for this scenario — UX-impacting)

**Validation Gate 2 — SA Checklist**
- [ ] Context Diagram identifies all system boundaries
- [ ] Every NFR dimension is addressed (even if "N/A with reason")
- [ ] At least one ADR exists with Alternatives Considered and Tradeoffs
- [ ] Each HANDOFF_PACKET includes implementation slice scope
- [ ] No handoff is sent without trade-off rationale

---

## STEP 3 — Parallel Track (DBA + UI UX Specialist)

Both roles work from their respective HANDOFF_PACKETs from Step 2. Each must also check for conflicts with the other track.

### 3A — Senior Database Administrator

@Senior Database Administrator apply your senior-database-administrator skill using the SA handoff.

**You must produce:**
- Logical and Physical Data Model
- Migration Plan with rollback strategy
- Security Controls (encryption, access)
- Observability plan (slow queries, capacity, backup verification)
- Operational Runbook Inputs
- HANDOFF_PACKET to Senior Software Engineer (schema + query contracts)
- HANDOFF_PACKET to Senior Test Automation Engineer (test datasets + failure scenarios)

**Validation Gate 3A — DBA Checklist**
- [ ] Migration is backward-compatible or breaking change is flagged
- [ ] Rollback plan exists
- [ ] Security controls include encryption at rest and access control
- [ ] Audit logging design is included (scenario requires it)
- [ ] Test data and failure scenarios are defined

### 3B — Senior UI UX Specialist

@Senior UI UX Specialist apply your senior-ui-ux-specialist skill using the SA handoff.

**You must produce:**
- UX Problem Framing aligned to user outcomes
- User Flows for view, update, and delete profile
- Accessibility and Inclusivity Criteria (WCAG 2.1 AA required)
- Empty / Loading / Error / Success states defined
- Design-to-Engineering Notes
- HANDOFF_PACKET to Senior Software Engineer
- HANDOFF_PACKET to Senior Test Automation Engineer

**Validation Gate 3B — UI UX Checklist**
- [ ] User flows for all three actions (view, update, delete) exist
- [ ] Accessibility criteria are specific and testable (not just "make it accessible")
- [ ] Empty, loading, failure, success states are all defined
- [ ] Design-to-Engineering Notes include implementation constraints

---

## STEP 4 — Senior Software Engineer

@Senior Software Engineer apply your senior-software-engineer skill using the SA, DBA, and UI UX handoffs.

**You must produce:**
- Implementation Plan with incremental steps
- Change List (which components, data, interfaces change)
- Coordination confirmation with DBA (schema locked), UI UX (flow agreed)
- Quality and Risk Notes
- Testability Notes aligned to Test Automation Engineer's upcoming work
- HANDOFF_PACKET to Senior Test Automation Engineer
- HANDOFF_PACKET to Senior Product Owner (implementation complete signal)

**Validation Gate 4 — SSE Checklist**
- [ ] Implementation plan steps are individually deliverable
- [ ] DBA and UI UX dependencies are confirmed (not assumed)
- [ ] Edge case and error handling is explicit
- [ ] Testability notes include hooks for automated checks
- [ ] Known technical debt is documented

---

## STEP 5 — Senior Test Automation Engineer

@Senior Test Automation Engineer apply your senior-test-automation-engineer skill using SSE, DBA, and UI UX handoffs.

**You must produce:**
- Test Strategy with risk model scores (Impact × Likelihood × DetectabilityGap)
- Coverage Matrix (unit, integration, E2E, non-functional layers)
- Automated Test Design aligned to acceptance criteria
- Defect and Risk Report
- Release Confidence Score and Recommendation (Go / No-Go / Conditional Go)
- HANDOFF_PACKET to Senior Product Owner

**Validation Gate 5 — STAE Checklist**
- [ ] Risk model is applied to prioritize test effort
- [ ] All four coverage layers are addressed
- [ ] Accessibility and audit behavior are tested (scenario-specific)
- [ ] Release Recommendation is explicit with rationale
- [ ] Every open defect has a severity and owner

---

## STEP 6 — Senior Product Owner (Acceptance Decision)

@Senior Product Owner apply your senior-product-owner skill to evaluate test results and make an acceptance decision.

**You must produce:**
- Acceptance evaluation against original criteria
- Go / No-Go / Conditional acceptance decision with rationale
- Updated backlog (carry-forward items if any)
- Sprint Retrospective Learning Note candidate for each team member

**Validation Gate 6 — Final Checklist**
- [ ] Acceptance decision references each original acceptance criterion
- [ ] Any No-Go or Conditional items have owner and next-action
- [ ] Learning Note IDs are present for all 6 roles

---

## Team-Level Validation Checklist

After all steps complete, verify all team-level contracts:

| Contract | Expected | Check |
|----------|----------|-------|
| Every agent used its skill | Procedure steps visible in output | [ ] |
| Every handoff has all 10 required fields | From, To, Task, Context, Decisions, Open Questions, Risks, AC, Artifacts, Learning Note ID | [ ] |
| No agent handed off to wrong role | Matches chain in AGENTS.md | [ ] |
| Every agent produced a Learning Note ID | Format: ROLE-YYYYMMDD-N | [ ] |
| Receiver confirmed inputs before proceeding | "Completion Rule" satisfied at each gate | [ ] |
| Parallel tracks (DBA + UIUX) were coordinated | No conflict in data/UX interface | [ ] |

---

## Common Failure Modes to Watch For

| Failure Pattern | Likely Cause | Fix |
|----------------|--------------|-----|
| Acceptance criteria not testable | SPO skipped delivery role consultation | Return to Gate 1 |
| Architecture handoff missing NFR | SA skipped QA or DBA consultation | Return to Gate 2 |
| Schema handed off without rollback | DBA skipped backward-compat analysis | Return to Gate 3A |
| UX flows not testable | UIUX didn't align with STAE | Return to Gate 3B |
| SSE handed off without testability notes | SSE skipped STAE sync | Return to Gate 4 |
| Release recommendation without risk score | STAE skipped risk model | Return to Gate 5 |
| No learning entries produced | Agent skipped self-learning step | Review all memory logs |
