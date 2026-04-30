# Senior Product Owner Learning Log

Use append-only notes with this format:

```text
ID: SPO-YYYYMMDD-<n>
Task:
Observation:
Hypothesis:
Outcome:
Action for Next Time:
```

```text
ID: SPO-20260425-1
Task: Define product backlog and acceptance criteria for Expense Item Create Page
      (single sprint, no backend, browser-memory storage only).

Observation:
  When scope is tightly bounded (single page, hard-coded rules, no backend),
  the primary ambiguity risk shifts from "what to build" to "what is explicitly
  NOT built yet." Non-Goals section is as important as the backlog itself.
  Every acceptance criterion must be anchored to an observable browser-side
  behavior (visible message, control state, localStorage key written).

Hypothesis:
  Front-loading a hard-coded Business Rules table as a standalone artifact
  reduces per-story rule drift and gives the Solutions Architect, Software
  Engineer, and Test Automation Engineer a single authoritative source for
  limit values.

Outcome:
  Produced 10 sprint-ready user stories (8 P0/P1, 2 P2), a business-rules
  reference table, a risk register, and a complete HANDOFF_PACKET to the
  Solutions Architect with 4 Open Questions requiring architectural decisions.

Action for Next Time:
  When attachment handling appears in scope for a browser-only sprint,
  explicitly call out virus-scanning and server-side MIME validation as
  out-of-scope to prevent Solutions Architect from designing premature
  infrastructure. Add this as a standard Non-Goal bullet for any sprint
  lacking a confirmed backend upload endpoint.
```

---

ID: SPO-20260425-1
Task: Define product backlog and acceptance criteria for Expense Item Create Page (single sprint, no backend, browser-memory storage).
Observation: When scope is tightly bounded (single page, no backend, hard-coded rules), the primary risk is over-specifying edge cases that cannot be exercised without a backend. Equally, under-specifying inline validation leaves QA with ambiguous pass/fail criteria.
Hypothesis: Anchoring every acceptance criterion to an observable UI behavior (visible message, enabled/disabled control, localStorage key written) eliminates ambiguity while avoiding premature backend assumptions.
Outcome: Produced 8 sprint-ready user stories (P0/P1/P2), a business-rules table with per-category limits, a non-goals section preventing scope creep, and a complete HANDOFF_PACKET to Solutions Architect.
Action for Next Time: When attachment handling appears in scope, explicitly call out virus-scanning and server-side validation as out-of-scope for browser-only sprints to prevent architecture from designing premature infrastructure.
