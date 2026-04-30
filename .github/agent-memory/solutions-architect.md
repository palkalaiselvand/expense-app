# Solutions Architect Learning Log

Use append-only notes with this format:

```text
ID: SA-YYYYMMDD-<n>
Task:
Observation:
Hypothesis:
Outcome:
Action for Next Time:
```

```text
ID: SA-20260425-1
Task: Design client-side architecture for Expense Item Create Page
      (plain HTML/JS/CSS, localStorage persistence, no backend).

Observation:
  Choosing vanilla JS (no framework) eliminates build tooling entirely and
  makes the result openable as a file:// URL in any browser. The <template>
  element cloning pattern is the correct idiomatic HTML5 approach for
  dynamic row management without a virtual DOM.

Hypothesis:
  Centralizing all business-rule constants in a single constants.js module
  and encapsulating all localStorage access in storage.js creates a clean
  seam for future backend migration — only storage.js needs to change.

Outcome:
  Delivered 4 ADRs answering all Product Owner open questions, a full
  module breakdown with interface contracts, localStorage schema, security
  controls, and ordered implementation work packages.

Action for Next Time:
  For any project using <template> cloning, document the attribute-rewriting
  convention (data-tmpl-id, data-tmpl-for, data-tmpl-error-for,
  data-tmpl-aria-describedby) as a formal pattern in the architecture doc
  so Software Engineer and Test Engineer understand the ID suffix contract.
```

---

ID: SA-20260425-1
Task: Design client-side architecture for Expense Item Create Page (single sprint, no backend, vanilla JS, localStorage persistence).
Observation: When the entire stack is client-side (no API, no DB engine), the "database" role pivots from schema/query design to data contract and migration-readiness review. Framing the DBA handoff around forward-compatibility questions (ID format, numeric precision, UTC timestamps) produced more actionable feedback than a generic schema review.
Hypothesis: Explicitly resolving all Product Owner open questions (OQ-1 through OQ-4) as first-class ADRs — with alternatives considered and review triggers — prevents scope creep by eliminating ambiguity that engineers might otherwise resolve ad hoc.
Outcome: Produced 10 independently deliverable work packages, 3 HANDOFF_PACKETs, full interface contracts for 4 modules, localStorage schema, and complete WCAG 2.1 AA coverage mapping — all from a PO handoff with 4 open questions.
Action for Next Time: For browser-only sprints with file handling, proactively state in the architecture that virus scanning and server-side validation are out of scope (echoes SPO-20260425-1 lesson). Add a "deferred security controls" section to prevent reviewers from flagging known omissions as defects. Also: specify a row ID generation strategy (monotonic counter vs. timestamp) explicitly in form.js interface contract to prevent RISK-01 ambiguity.
