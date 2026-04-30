# Senior Database Administrator Learning Log

Use append-only notes with this format:

```text
ID: DBA-YYYYMMDD-<n>
Task:
Observation:
Hypothesis:
Outcome:
Action for Next Time:
```

```text
ID: DBA-20260425-1
Task: Define client-side data model and localStorage schema for Expense Item
      Create Page (Sprint 1, no server-side database).

Observation:
  localStorage is a flat key-value store, not a relational engine. All
  integrity constraints that a DB engine would enforce declaratively must
  instead be enforced by validator.js before write. The DBA role in a
  browser-only sprint is primarily a schema governance and constraint
  documentation role, not an infrastructure provisioning role.

Hypothesis:
  Defining the JSON Schema (Draft 2020-12) as the authoritative contract —
  even when it cannot be enforced at the storage layer — gives the Test
  Automation Engineer a precise fixture definition and gives the Software
  Engineer a precise write-path checklist.

Outcome:
  Delivered logical model, physical schema, integrity controls table,
  ID collision analysis, migration/compatibility strategy with quarantine
  pattern, security controls, 3 test fixtures (minimal/maximal/edge),
  and operational monitoring guidance for storage.js.

Action for Next Time:
  Embed schemaVersion: 1 in the root object wrapper from Sprint 2 onward.
  Detecting schema version by array-vs-object shape (current workaround) is
  brittle. A named version field eliminates migration detection ambiguity
  and enables a proper migration dispatch table.
```

---

```text
ID:     DBA-20260425-1
Task:   Define client-side data model, localStorage schema, validation constraints,
        and migration/compatibility strategy for the Expense Item Create Page.

Observation:
  Browser localStorage imposes unique constraints compared to server databases:
  synchronous I/O, ~5 MB quota, no transactions, no referential integrity engine,
  and behavior differences across Private Browsing modes (especially Safari).
  Schema versioning is the single most important thing to establish before first
  data is written — retrofitting version detection is painful.

Hypothesis:
  Establishing a quarantine strategy and schema-version detection pattern at
  sprint 1 (even without a schemaVersion field in the data yet) creates a clear
  upgrade path that prevents breaking existing user data when the schema changes
  in sprint 2.

Outcome:
  Delivered complete logical model, TypeScript interfaces, JSON Schema, collision
  analysis for the epoch+hex ID strategy, migration/quarantine strategy,
  XSS/path-traversal security controls, 3 test fixture sets (4 sub-cases for
  edge/error), operational monitoring guidance, and dual handoff packets to the
  Software Engineer and Test Automation Engineer.
  Artifact: .github/data-model/expense-item-create-page-data-model.md

Action for Next Time:
  1. For any localStorage schema, embed schemaVersion in the first sprint even
     if only one version exists. Wrap the root array in { schemaVersion: 1,
     submissions: [] } from day one to make future migrations trivial.
  2. When the real backend arrives, ensure the migration from localStorage to
     server involves a one-time upload confirmation flow — do not silently
     discard local data on first authenticated session.
  3. Document the crypto.getRandomValues() upgrade trigger explicitly in the
     storage module as a comment so it is not forgotten in the backlog.
```
