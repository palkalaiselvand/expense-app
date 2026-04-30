# Client-Side Data Model: Expense Item Create Page

**Author:** Senior Database Administrator  
**Date:** 2026-04-25  
**Status:** Approved — ready for engineering and QA handoff  
**Aligned With:**  
- SA Architecture: `expense-item-create-page-architecture.md` (SA-20260425-1)  
- UX Specification: `expense-item-create-page-ux-spec.md` (UIUX-20260425-1)  
**Learning Note:** DBA-20260425-1

---

## Table of Contents

1. [Logical Data Model](#1-logical-data-model)
2. [Physical Schema Definition](#2-physical-schema-definition)
3. [Data Integrity Controls](#3-data-integrity-controls)
4. [ID Generation Strategy](#4-id-generation-strategy)
5. [Migration and Compatibility Strategy](#5-migration-and-compatibility-strategy)
6. [Data Security Controls](#6-data-security-controls)
7. [Test Datasets](#7-test-datasets)
8. [Operational Monitoring Guidance](#8-operational-monitoring-guidance)
9. [HANDOFF_PACKETs](#9-handoff_packets)
10. [Learning Note](#10-learning-note)

---

## 1. Logical Data Model

### 1.1 Entities and Cardinality

```
┌─────────────────────────────────┐        ┌──────────────────────────────────────┐
│          Submission             │        │              LineItem                │
├─────────────────────────────────┤        ├──────────────────────────────────────┤
│ PK  id              : string    │ 1    ──►  1..10                               │
│     submittedAt     : string    │        │ PK  id               : string        │
│     currency        : string    │        │     description      : string        │
│     lineItems       : LineItem[]│        │     category         : CategoryEnum  │
└─────────────────────────────────┘        │     amount           : number        │
                                           │     date             : string        │
                                           │     attachmentFileName: string|null  │
                                           └──────────────────────────────────────┘
```

**Cardinality:**
- One `Submission` contains **1 to 10** `LineItem` records (mandatory lower bound: you cannot submit an empty report).
- The `localStorage` root array holds **0 to N** `Submission` records. Given the sprint's workload constraint of ≤ 100 submissions before a real backend replaces this layer, N is practically bounded.

---

### 1.2 Entity: Submission

| Attribute       | Logical Type        | Nullable | Business Rule                                                       |
|-----------------|---------------------|----------|----------------------------------------------------------------------|
| `id`            | Identifier string   | No       | Globally unique within the browser session; format `sub-<epoch>-<4hex>` |
| `submittedAt`   | ISO-8601 UTC string | No       | Timestamp of the moment `saveSubmission()` is called; set by storage layer, not user input |
| `currency`      | Currency code       | No       | Always `"USD"` for this sprint; drawn from `CURRENCY` constant      |
| `lineItems`     | Collection          | No       | 1 to 10 `LineItem` objects; enforced before write                   |

---

### 1.3 Entity: LineItem

| Attribute            | Logical Type          | Nullable | Business Rule                                                                 |
|----------------------|-----------------------|----------|--------------------------------------------------------------------------------|
| `id`                 | Identifier string     | No       | Unique within the session; format `item-<epoch>-<4hex>`                        |
| `description`        | Short text            | No       | 1–200 characters after whitespace trimming; no HTML markup stored             |
| `category`           | Enumerated string     | No       | Must be one of: `Travel-Air`, `Travel-Car`, `Food`, `Hotel`, `Mobile`         |
| `amount`             | Decimal number        | No       | Positive number > 0; must not exceed `CATEGORY_LIMITS[category]`              |
| `date`               | ISO date string       | No       | `YYYY-MM-DD` format; must not be a future date relative to submission date    |
| `attachmentFileName` | Sanitized string      | Yes      | Basename only (no path); null when no file is attached                        |

---

### 1.4 Category Limit Reference (Denormalized Constant)

The following limits are not stored in localStorage — they live in `constants.js` and are applied at validation time:

| Category     | Maximum Amount (USD) |
|--------------|----------------------|
| `Travel-Air` | $5,000.00            |
| `Travel-Car` | $1,000.00            |
| `Food`       | $100.00              |
| `Hotel`      | $500.00              |
| `Mobile`     | $200.00              |

> **DBA Rationale:** These limits are intentionally not stored with the submission record. If limits change in a future sprint, historical records remain valid as-filed. The limits apply at creation time only and are enforced by the validator, not the storage layer.

---

## 2. Physical Schema Definition

### 2.1 localStorage Layout

```
Storage:   window.localStorage
Key:       "expenseSubmissions"
Value:     JSON-encoded string of an array of Submission objects
Encoding:  UTF-16 (browser native); all content is ASCII-safe given constraints
```

### 2.2 TypeScript-Style Interface (Authoritative)

```typescript
// ── Enumerations ────────────────────────────────────────────────────────────

type Category =
  | "Travel-Air"
  | "Travel-Car"
  | "Food"
  | "Hotel"
  | "Mobile";

type Currency = "USD";  // extensible in future sprints

// ── Identifier Format ───────────────────────────────────────────────────────

// sub-<epoch ms>-<4 lowercase hex chars>  e.g.  sub-1745577600000-4f3a
type SubmissionId = `sub-${number}-${string}`;

// item-<epoch ms>-<4 lowercase hex chars>  e.g.  item-1745577600001-9b2c
type LineItemId = `item-${number}-${string}`;

// ── Core Entities ────────────────────────────────────────────────────────────

interface LineItem {
  id:                   LineItemId;        // required; generated by storage.js
  description:          string;            // required; 1–200 chars, trimmed, text-only
  category:             Category;          // required; must be a valid Category value
  amount:               number;            // required; > 0; <= CATEGORY_LIMITS[category]
  date:                 string;            // required; "YYYY-MM-DD"; not in the future
  attachmentFileName:   string | null;     // optional; sanitized basename or null
}

interface Submission {
  id:          SubmissionId;               // required; generated by storage.js
  submittedAt: string;                     // required; ISO-8601 UTC e.g. "2026-04-25T10:30:00.000Z"
  currency:    Currency;                   // required; always "USD" this sprint
  lineItems:   LineItem[];                 // required; length 1–10
}

// ── Root localStorage Value ─────────────────────────────────────────────────

type ExpenseSubmissionsStore = Submission[];
```

### 2.3 JSON Schema (for runtime validation or future tooling)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "expense-submissions-store",
  "title": "Expense Submissions Store",
  "type": "array",
  "items": {
    "$ref": "#/$defs/Submission"
  },
  "$defs": {
    "Submission": {
      "type": "object",
      "required": ["id", "submittedAt", "currency", "lineItems"],
      "additionalProperties": false,
      "properties": {
        "id": {
          "type": "string",
          "pattern": "^sub-[0-9]+-[0-9a-f]{4}$"
        },
        "submittedAt": {
          "type": "string",
          "format": "date-time"
        },
        "currency": {
          "type": "string",
          "const": "USD"
        },
        "lineItems": {
          "type": "array",
          "minItems": 1,
          "maxItems": 10,
          "items": {
            "$ref": "#/$defs/LineItem"
          }
        }
      }
    },
    "LineItem": {
      "type": "object",
      "required": ["id", "description", "category", "amount", "date", "attachmentFileName"],
      "additionalProperties": false,
      "properties": {
        "id": {
          "type": "string",
          "pattern": "^item-[0-9]+-[0-9a-f]{4}$"
        },
        "description": {
          "type": "string",
          "minLength": 1,
          "maxLength": 200
        },
        "category": {
          "type": "string",
          "enum": ["Travel-Air", "Travel-Car", "Food", "Hotel", "Mobile"]
        },
        "amount": {
          "type": "number",
          "exclusiveMinimum": 0,
          "maximum": 5000
        },
        "date": {
          "type": "string",
          "pattern": "^[0-9]{4}-[0-1][0-9]-[0-3][0-9]$"
        },
        "attachmentFileName": {
          "oneOf": [
            {
              "type": "string",
              "minLength": 1,
              "maxLength": 255,
              "pattern": "^[^/\\\\]+$"
            },
            { "type": "null" }
          ]
        }
      }
    }
  }
}
```

> **Note on `amount` maximum in JSON Schema:** The schema-level maximum of 5000 reflects the highest single-category cap (`Travel-Air`). Per-category enforcement (e.g., `Food` max $100) is handled by `validator.js` at field-validation time, not by the JSON Schema, since JSON Schema does not permit cross-field conditional constraints readably here.

---

## 3. Data Integrity Controls

All field-level constraints are enforced by `validator.js` before `saveSubmission()` is called. The storage layer **must not** be the sole gatekeeper; the form layer enforces at blur time and again holistically at submit time.

### 3.1 Submission-Level Constraints

| Constraint                  | Enforcement Point       | Failure Handling                                                     |
|-----------------------------|-------------------------|----------------------------------------------------------------------|
| `lineItems` length 1–10     | `validateForm()` in `validator.js` | Submission blocked; error surfaces on form                |
| `currency` is `"USD"`       | `storage.js` constant injection — not user-settable | N/A — never user-controllable |
| `submittedAt` is server time | `new Date().toISOString()` in `storage.js` — not user-settable | N/A               |
| No duplicate IDs            | `generateId()` collision strategy (see §4) | Practically zero risk at ≤100 submissions |

### 3.2 LineItem Field-Level Constraints

| Field                | Rule                                               | Validator Function        | Error Message Shown to User                                         |
|----------------------|----------------------------------------------------|---------------------------|----------------------------------------------------------------------|
| `description`        | Required; 1–200 chars after trim; text only — no HTML tags written to storage | `validateDescription()`   | "Description is required." / "Description must be 200 characters or fewer." |
| `category`           | Required; must be a key in `CATEGORY_LIMITS`       | `validateCategory()`      | "Please select a category."                                         |
| `amount`             | Required; numeric; > 0; ≤ `CATEGORY_LIMITS[category]` | `validateAmount()`     | "Amount is required." / "Amount must be greater than $0.00." / "Amount exceeds the $X.XX [Category] limit." |
| `date`               | Required; valid `YYYY-MM-DD`; not in the future    | `validateDate()`          | "Expense date is required." / "Date cannot be in the future."       |
| `attachmentFileName` | Optional; if provided, sanitized basename only; no path traversal characters | `sanitizeFileName()` applied before storage | Not a user-facing validation error; sanitization is transparent |

### 3.3 Pre-Write Integrity Checklist

`saveSubmission()` **must** verify all of the following before calling `JSON.stringify` and writing to `localStorage`:

```
[x] submission.id has been generated and is non-empty
[x] submission.submittedAt is a valid ISO-8601 string (from new Date().toISOString())
[x] submission.currency === "USD"
[x] submission.lineItems is a non-empty array with length <= 10
[x] Each lineItem.id has been generated
[x] Each lineItem.description is a non-empty trimmed string <= 200 chars
[x] Each lineItem.category is a member of CATEGORIES
[x] Each lineItem.amount is a finite positive number within CATEGORY_LIMITS[category]
[x] Each lineItem.date matches YYYY-MM-DD and is not a future date
[x] Each lineItem.attachmentFileName is either null or a sanitized basename string
```

---

## 4. ID Generation Strategy

### 4.1 Format

```
Submission ID:  sub-<Date.now()>-<4 hex digits>
                e.g.  sub-1745577600000-4f3a

LineItem ID:    item-<Date.now()>-<4 hex digits>
                e.g.  item-1745577600001-9b2c
```

The 4 hex digits are generated as:
```javascript
Math.floor(Math.random() * 0xFFFF).toString(16).padStart(4, '0')
```

### 4.2 Implementation: `generateId(prefix)`

```javascript
// src/storage.js
export function generateId(prefix) {
  const epoch = Date.now();                                          // ms since Unix epoch
  const hex   = Math.floor(Math.random() * 0xFFFF)
                     .toString(16)
                     .padStart(4, '0');
  return `${prefix}-${epoch}-${hex}`;
}
```

### 4.3 Collision Risk Analysis

**Assumptions:**
- Generating IDs serially within a single JS call stack (IDs for one submission's items are created in a tight loop, but `Date.now()` can return distinct values in modern engines for sub-millisecond calls on most hardware; if not, the hex suffix handles it).
- Maximum 10 `item-` IDs generated per submission.
- Maximum 100 submissions in a session.
- Total maximum ID space usage: 1,000 IDs per browser session.

**Probability of Collision (Birthday Problem estimate):**

The random component is 4 hex digits = 16 bits = 65,535 possible values.

For N IDs generated within the **same millisecond** (same epoch component):

$$P(\text{at least one collision}) \approx 1 - e^{-\frac{N(N-1)}{2 \times 65535}}$$

For N = 10 (worst case within one submit call):

$$P \approx 1 - e^{-\frac{10 \times 9}{2 \times 65535}} \approx 1 - e^{-0.000687} \approx 0.069\%$$

**Verdict:** Collision probability is negligible for this workload. No additional entropy is required for the sprint. The epoch component also changes between submissions, further reducing risk.

**Future mitigation (if needed):** Replace `Math.random()` with `crypto.getRandomValues()` and expand to 8 hex digits when submission volume exceeds 10,000 or when concurrent multi-tab usage becomes a concern. See §5 for version tagging that would support this upgrade non-destructively.

---

## 5. Migration and Compatibility Strategy

### 5.1 Schema Versioning (Sprint-1 Baseline)

The sprint-1 schema does **not** embed a `schemaVersion` field in individual records. However, the migration detection strategy below provides a safe upgrade path.

**Action for Sprint-2+ (before changing the schema):** Add a top-level wrapper object and embed `schemaVersion` so the migration path is unambiguous:

```json
// Future sprint structure — not implemented yet
{
  "schemaVersion": 2,
  "submissions": [ /* Submission objects */ ]
}
```

> **DBA Note to Software Engineer:** Before making any schema change in a future sprint, bump `schemaVersion` in the wrapper and implement `migrateStore()` in `storage.js`. The section below defines the detection logic to use.

### 5.2 Migration Detection Logic

When `loadSubmissions()` is called:

```
1. Read raw value from localStorage.getItem("expenseSubmissions")
2. If null → return []  (no data; no migration needed)
3. JSON.parse the value:
   a. If parse throws → quarantine key (see §8) and return []
   b. If result is a plain Array → this is sprint-1 format; proceed normally
   c. If result is an Object with a "schemaVersion" field → dispatch to migrateStore(result)
   d. If result is neither Array nor Object → treat as corrupted; quarantine and return []
```

### 5.3 Migration: Sprint-1 Array → Sprint-2 Wrapped Object (Example)

```javascript
// src/storage.js — future sprint addition
function migrateStore(raw) {
  if (raw.schemaVersion === 2) return raw.submissions;           // already current
  if (raw.schemaVersion === 1) return migratev1tov2(raw);        // one hop
  console.warn('[storage] Unknown schemaVersion; discarding store.');
  quarantineKey();
  return [];
}

function migratev1tov2(raw) {
  // Sprint-1 records stored directly as an array under "expenseSubmissions".
  // Sprint-2 wraps them. If somehow a v1 object-style was written, unwrap here.
  return Array.isArray(raw.submissions) ? raw.submissions : [];
}
```

### 5.4 Field-Addition Compatibility (Non-Breaking)

Adding **new optional fields** to `LineItem` or `Submission` is backward-compatible, provided:
1. `loadSubmissions()` does not validate schema strictly on read (treat unknown fields as pass-through).
2. New fields have sensible defaults applied lazily when missing from old records.
3. `additionalProperties: false` in the JSON Schema must be relaxed to `additionalProperties: true` on the **read path** until all old data has been migrated.

**Safe changes (no migration required):**
- Adding a new optional field to `LineItem` (e.g., `tags: string[] | undefined`)
- Adding a new `Currency` enum value

**Breaking changes (require `schemaVersion` bump and migration):**
- Renaming a field
- Changing a field's type
- Removing a required field
- Changing the root structure from Array to Object

### 5.5 Quarantine Strategy

When corrupted or incompatible data is detected:

```javascript
function quarantineKey() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    const quarantineKey = `${STORAGE_KEY}_corrupted_${Date.now()}`;
    try {
      localStorage.setItem(quarantineKey, raw);
    } catch (_) {
      // ignore if quota exceeded even for quarantine
    }
    localStorage.removeItem(STORAGE_KEY);
  }
}
```

This preserves the raw corrupted value for potential manual recovery or developer inspection, and clears the active key so the app can start fresh.

---

## 6. Data Security Controls

### 6.1 Threat Model

| Threat                            | Vector                                     | Control                                              |
|-----------------------------------|--------------------------------------------|------------------------------------------------------|
| Stored XSS via `description`      | User pastes `<script>alert(1)</script>` into description field; if another page reads and renders the stored value via `innerHTML` | **Never** use `innerHTML` to render stored values; use `textContent` only. Validator enforces max-200 chars but does not strip tags — the rendering layer must not interpret HTML |
| Path traversal in attachment name | Malicious file chosen via `<input type="file">` with name `../../etc/passwd` | `sanitizeFileName()` strips all `/` and `\` and everything before the last separator |
| Prototype pollution via JSON.parse | Specially crafted JSON with `__proto__` keys | Use `JSON.parse` only (no `eval`); after parsing, immediately validate against expected shape before placing in application state |
| localStorage quota abuse          | Submitting very large descriptions repeatedly | 200-char cap on `description`; attachment binary is never written (filename only); 10-item cap; ≤100 submissions |
| Clipboard injection               | Pasted content in `description` containing `javascript:` or `data:` URIs | These are harmless in a text node; dangerous only if rendered as HTML. Rendering layer must use `textContent` |

### 6.2 What Must Be Excluded Before Writing to localStorage

The following data **must never be written** to `localStorage`:

| Data                                | Reason                                                                 |
|-------------------------------------|------------------------------------------------------------------------|
| File binary content / File object   | `File` objects are not serializable; attempting to store them produces empty `{}`. Even if serializable, binary data would cause rapid quota exhaustion. Store only `attachmentFileName` (the sanitized basename string). |
| Full file path                       | OS paths reveal local directory structure (`C:\Users\<username>\...`). `sanitizeFileName()` must run before storage. |
| Browser-provided MIME type as-is    | Unused — only the validated basename is stored. Do not store `file.type` or `file.size` for this sprint. |
| Raw unvalidated form input           | `collectFormData()` must return data only after `validateForm()` passes; `saveSubmission()` must not be callable with unvalidated data. |
| HTML markup in `description`         | Even though it will be rendered as text, defense in depth recommends stripping or refusing any value where `<` or `>` appears. Optional hardening: apply a text-only guard in `validateDescription()`. |

### 6.3 `sanitizeFileName()` Contract

```javascript
// Required behavior:
//   Input:  File object (browser File API)
//   Output: string — last path component only, no directory separators
//
// Examples:
//   "receipt.pdf"                         →  "receipt.pdf"
//   "C:\\Users\\john\\receipt.pdf"        →  "receipt.pdf"
//   "/home/user/docs/receipt.pdf"         →  "receipt.pdf"
//   "../../etc/passwd"                    →  "passwd"
//   "receipt"                             →  "receipt"
//
// Implementation:
export function sanitizeFileName(file) {
  const name = file.name || '';
  // Split on both Unix and Windows separators; take last segment
  const parts = name.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1] || '';
}
```

### 6.4 Rendering Safety Reminder (for Software Engineer)

When reading from `localStorage` and displaying values in the UI (e.g., a future "view submitted reports" page):

```javascript
// CORRECT — safe
element.textContent = submission.lineItems[0].description;

// DANGEROUS — never do this
element.innerHTML = submission.lineItems[0].description;  // XSS vector
```

---

## 7. Test Datasets

These fixtures are authoritative for the Test Automation Engineer. All records are valid, pre-sanitized JSON ready to seed `localStorage` via a test helper that calls `localStorage.setItem("expenseSubmissions", JSON.stringify(fixtures))`.

### 7.1 Fixture A — Minimal Valid Submission

**Intent:** Smoke-test the happy path with a single line item, no attachment, lowest valid values.

```json
[
  {
    "id": "sub-1745577600000-0001",
    "submittedAt": "2026-04-25T10:00:00.000Z",
    "currency": "USD",
    "lineItems": [
      {
        "id": "item-1745577600001-0001",
        "description": "Lunch",
        "category": "Food",
        "amount": 0.01,
        "date": "2026-04-24",
        "attachmentFileName": null
      }
    ]
  }
]
```

**What it validates:**
- Minimum description length (5 chars — "Lunch")
- Minimum valid amount (> 0)
- Most restrictive category limit (Food, $100 max) — but amount is well within
- No attachment (null)
- Single line item (minimum cardinality)

---

### 7.2 Fixture B — Maximal Valid Submission

**Intent:** Stress-test the full capacity: 10 line items, all categories represented, amounts at their category ceiling, all attachments present, description at max length.

```json
[
  {
    "id": "sub-1745577600000-ffff",
    "submittedAt": "2026-04-25T23:59:59.999Z",
    "currency": "USD",
    "lineItems": [
      {
        "id": "item-1745577600001-aaa1",
        "description": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        "category": "Travel-Air",
        "amount": 5000.00,
        "date": "2026-04-01",
        "attachmentFileName": "airline_receipt.pdf"
      },
      {
        "id": "item-1745577600002-aaa2",
        "description": "Car rental for full conference week including fuel and tolls",
        "category": "Travel-Car",
        "amount": 1000.00,
        "date": "2026-04-02",
        "attachmentFileName": "car_rental_receipt.pdf"
      },
      {
        "id": "item-1745577600003-aaa3",
        "description": "Team dinner — client entertainment",
        "category": "Food",
        "amount": 100.00,
        "date": "2026-04-03",
        "attachmentFileName": "restaurant_receipt.jpg"
      },
      {
        "id": "item-1745577600004-aaa4",
        "description": "Hotel stay — 2 nights conference rate",
        "category": "Hotel",
        "amount": 500.00,
        "date": "2026-04-04",
        "attachmentFileName": "hotel_folio.png"
      },
      {
        "id": "item-1745577600005-aaa5",
        "description": "Monthly mobile plan reimbursement",
        "category": "Mobile",
        "amount": 200.00,
        "date": "2026-04-05",
        "attachmentFileName": "mobile_bill.pdf"
      },
      {
        "id": "item-1745577600006-aaa6",
        "description": "Second flight segment — connecting flight",
        "category": "Travel-Air",
        "amount": 4999.99,
        "date": "2026-04-06",
        "attachmentFileName": "segment2_receipt.pdf"
      },
      {
        "id": "item-1745577600007-aaa7",
        "description": "Mileage reimbursement — airport drive",
        "category": "Travel-Car",
        "amount": 45.50,
        "date": "2026-04-07",
        "attachmentFileName": null
      },
      {
        "id": "item-1745577600008-aaa8",
        "description": "Working lunch — solo",
        "category": "Food",
        "amount": 22.00,
        "date": "2026-04-08",
        "attachmentFileName": "lunch_receipt.jpg"
      },
      {
        "id": "item-1745577600009-aaa9",
        "description": "Extended hotel check-out fee",
        "category": "Hotel",
        "amount": 75.00,
        "date": "2026-04-09",
        "attachmentFileName": null
      },
      {
        "id": "item-1745577600010-aaaa",
        "description": "Roaming data overage charge",
        "category": "Mobile",
        "amount": 199.99,
        "date": "2026-04-10",
        "attachmentFileName": "mobile_overage.pdf"
      }
    ]
  }
]
```

**What it validates:**
- Maximum 10 line items (upper cardinality bound)
- All 5 categories present
- Amounts at or near their category ceiling (boundary value testing)
- Description at maximum 200 characters (item 1 is exactly 200 `A` characters)
- Mix of attachment present and null
- Earliest date in a multi-item submission still valid (non-future relative to April 25, 2026)

> **Note to QA:** The 200-`A` description in item 1 should be verified to be exactly 200 characters by your test fixture loader.

---

### 7.3 Fixture C — Edge / Error-Recovery State

**Intent:** Simulate a pre-existing corrupted or boundary submission in localStorage that the app must handle gracefully on next read, alongside a valid recovery snapshot.

**7.3a — Quarantine Trigger (Corrupted JSON):**

Seed `localStorage` with this raw string (not valid JSON):
```
expenseSubmissions = "not_valid_json{["
```

**Expected behavior:** `loadSubmissions()` catches `SyntaxError`, calls `quarantineKey()`, writes corrupted value to `expenseSubmissions_corrupted_<epoch>`, removes `expenseSubmissions`, and returns `[]`. Application starts with a blank form.

---

**7.3b — Schema Evolution (Unknown Field Pass-Through):**

```json
[
  {
    "id": "sub-1745577600000-e001",
    "submittedAt": "2026-04-25T08:00:00.000Z",
    "currency": "USD",
    "schemaVersion": 99,
    "unknownFutureField": "some value",
    "lineItems": [
      {
        "id": "item-1745577600001-e001",
        "description": "Conference registration fee",
        "category": "Travel-Air",
        "amount": 350.00,
        "date": "2026-04-20",
        "attachmentFileName": "conf_receipt.pdf",
        "tags": ["conference", "q2"]
      }
    ]
  }
]
```

**Expected behavior:** `loadSubmissions()` returns the array. Unknown fields (`schemaVersion`, `unknownFutureField`, `tags`) are passed through without error. The app renders the known fields; unknown fields are ignored. No data loss on pass-through read.

---

**7.3c — Boundary: Amount Exactly at Category Limit (Food $100.00, valid):**

```json
[
  {
    "id": "sub-1745577600000-e003",
    "submittedAt": "2026-04-25T09:00:00.000Z",
    "currency": "USD",
    "lineItems": [
      {
        "id": "item-1745577600001-e003",
        "description": "Team lunch at limit",
        "category": "Food",
        "amount": 100.00,
        "date": "2026-04-24",
        "attachmentFileName": null
      }
    ]
  }
]
```

**Expected behavior:** Amount exactly at `CATEGORY_LIMITS["Food"]` ($100.00) is **valid**. `validateAmount()` must use `<=`, not `<`.

---

**7.3d — Boundary: Amount One Cent Over Category Limit (Food $100.01, invalid):**

This is an **invalid** record — do not seed it as a starting state. Instead it is a form-input test case:

```javascript
// Test input object (NOT a localStorage fixture — this never reaches storage)
const invalidInput = {
  description: "Over-limit lunch",
  category: "Food",
  amount: "100.01",    // string from form input
  date: "2026-04-24",
  file: null
};
// Expected: validateAmount("100.01", "Food") →
//   { valid: false, message: "Amount exceeds the $100.00 Food limit. Maximum allowed: $100.00." }
```

---

## 8. Operational Monitoring Guidance

The Software Engineer must instrument `storage.js` to catch and handle all of the following failure modes at the localStorage boundary:

### 8.1 Read-Path Failures

| Failure Mode                     | Cause                                                           | Handling                                                                                           |
|----------------------------------|-----------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| `getItem()` returns `null`        | Key not present (first visit or cleared)                       | Return `[]`. This is normal — not an error.                                                        |
| `JSON.parse()` throws `SyntaxError` | Corrupted data (truncated write, manual edit, browser bug)  | Call `quarantineKey()`, log `console.warn('[storage] Corrupted data quarantined.')`, return `[]`   |
| `JSON.parse()` returns non-Array  | Old single-object format or wrong schema                       | Treat as unknown schema; if object with `schemaVersion`, dispatch to migration; else quarantine    |
| `localStorage.getItem()` throws   | Private/Incognito mode in some browsers; strict content security policy | Wrap in `try/catch`; log warning; return `[]`; app must be functional without persistence   |

### 8.2 Write-Path Failures

| Failure Mode                     | Cause                                                           | Handling                                                                                           |
|----------------------------------|-----------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| `localStorage.setItem()` throws `DOMException: QuotaExceededError` | Storage full (~5 MB limit; unlikely at ≤100 submissions but possible in shared-origin environments) | Catch the error; do NOT silently fail. Return `{ success: false, error: 'QUOTA_EXCEEDED' }` to `form.js`. `form.js` must display a user-visible error: "Your browser storage is full. Please clear your history or use a different browser." |
| `localStorage.setItem()` throws in Private Browsing | Safari in Private mode does not allow localStorage writes | Catch `SecurityError` or `DOMException`; return `{ success: false, error: 'STORAGE_UNAVAILABLE' }`. Display: "Storage is unavailable in private browsing mode. Your submission will not be saved." |
| `JSON.stringify()` throws         | Circular references (impossible with plain objects) or `BigInt` values (impossible here) | Defensive `try/catch` around stringify; return `{ success: false, error: 'SERIALIZE_ERROR' }` |

### 8.3 Instrumentation Code Pattern

```javascript
// src/storage.js — recommended wrapper pattern

export function saveSubmission(submission) {
  try {
    const existing = loadSubmissions();
    existing.push(submission);
    const serialized = JSON.stringify(existing);
    localStorage.setItem(STORAGE_KEY, serialized);
    return { success: true, id: submission.id };
  } catch (err) {
    if (err.name === 'QuotaExceededError' || err.code === 22) {
      return { success: false, error: 'QUOTA_EXCEEDED' };
    }
    if (err.name === 'SecurityError') {
      return { success: false, error: 'STORAGE_UNAVAILABLE' };
    }
    console.error('[storage] Unexpected write error:', err);
    return { success: false, error: 'UNKNOWN_ERROR' };
  }
}

export function loadSubmissions() {
  let raw;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (err) {
    console.warn('[storage] localStorage unavailable:', err);
    return [];
  }
  if (raw === null) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    // Object with schemaVersion → future migration path
    if (parsed && typeof parsed === 'object' && 'schemaVersion' in parsed) {
      return migrateStore(parsed);   // to be implemented in future sprint
    }
    console.warn('[storage] Unexpected schema shape; quarantining.');
    quarantineKey();
    return [];
  } catch (err) {
    console.warn('[storage] JSON parse error; quarantining:', err);
    quarantineKey();
    return [];
  }
}
```

### 8.4 Performance Considerations

| Consideration                         | Assessment                                                              |
|---------------------------------------|-------------------------------------------------------------------------|
| Read cost per page load               | One `getItem()` + one `JSON.parse()`. Negligible for ≤100 submissions of ≤10 items each. No indexing needed. |
| Write cost per submission             | One `getItem()` + one `JSON.parse()` + one `JSON.stringify()` + one `setItem()`. Single-item append requires reading and re-writing the full array; acceptable at sprint volume. |
| Memory footprint                      | Worst case: 100 submissions × 10 items × ~600 bytes/item ≈ 600 KB. Well within the 5 MB localStorage limit and the V8 heap threshold for this payload size. |
| Future mitigation if volume grows     | If submission count exceeds 500, switch the append strategy to one-key-per-submission under a `expenseSubmission-<id>` naming convention, or migrate to IndexedDB. |

---

## 9. HANDOFF_PACKETs

### 9.1 Handoff to Senior Software Engineer

```text
HANDOFF_PACKET
From:    Senior Database Administrator
To:      Senior Software Engineer
Task:    Implement storage.js, validator.js field constraints, sanitizeFileName(),
         and ID generation per the Data Model document.

Context:
  The localStorage schema, TypeScript interfaces, JSON Schema, and all field-level
  constraints are fully defined in:
    .github/data-model/expense-item-create-page-data-model.md
  The Solutions Architect's interface contracts in:
    .github/architecture/expense-item-create-page-architecture.md (§5)
  are consistent with this document. Both sources must remain in sync.

Decisions:
  1. ID format: sub-<epoch>-<4hex> and item-<epoch>-<4hex> via generateId(prefix).
     Use Math.random() for this sprint; upgrade to crypto.getRandomValues() if
     volume exceeds 10,000 IDs.
  2. sanitizeFileName() must strip path separators (both / and \) before storage.
     Implementation contract is in §6.3 of this document.
  3. saveSubmission() must return { success, id } or { success: false, error }.
     form.js must check success before showing the confirmation banner (§8.2).
  4. loadSubmissions() must detect Array vs. Object shape and dispatch accordingly.
     Quarantine strategy must be implemented exactly as described in §5.5.
  5. Never use innerHTML to render data read from localStorage (§6.4).
  6. amount must be stored as a JSON number (not a string). parseFloat() the input
     before building the LineItem object in collectFormData().
  7. description must be stored as a trimmed string. Apply .trim() in
     collectFormData(), not in the validator.
  8. The JSON Schema in §2.3 is provided for reference tooling and future
     integration tests; no runtime JSON Schema validator is required this sprint.

Open Questions:
  - None blocking implementation.

Risks:
  - Safari Private Browsing blocks localStorage writes. Ensure form.js handles
    the STORAGE_UNAVAILABLE error return from saveSubmission() and shows the
    user-visible fallback message described in §8.2.
  - QuotaExceededError is unlikely but must not be a silent failure.

Acceptance Criteria:
  1. generateId('sub') returns a string matching ^sub-[0-9]+-[0-9a-f]{4}$.
  2. generateId('item') returns a string matching ^item-[0-9]+-[0-9a-f]{4}$.
  3. sanitizeFileName({ name: 'C:\\Users\\john\\receipt.pdf' }) === 'receipt.pdf'.
  4. saveSubmission() returns { success: false, error: 'QUOTA_EXCEEDED' } when
     localStorage is full (simulate by mocking setItem to throw).
  5. loadSubmissions() returns [] and calls quarantineKey() when stored JSON is
     invalid (simulate by seeding bad JSON via setItem directly in test).
  6. Stored amount is a number, not a string (JSON.parse of stored value shows
     typeof lineItem.amount === 'number').
  7. A stored description with < or > characters is rendered via textContent
     only — no innerHTML usage anywhere in the read path.

Artifacts Updated:
  .github/data-model/expense-item-create-page-data-model.md  (this document)

Learning Note ID: DBA-20260425-1
```

---

### 9.2 Handoff to Senior Test Automation Engineer

```text
HANDOFF_PACKET
From:    Senior Database Administrator
To:      Senior Test Automation Engineer
Task:    Use the three fixture sets and boundary cases in §7 to build data-layer
         test coverage for storage.js and validator.js.

Context:
  All fixture records and boundary test cases are in:
    .github/data-model/expense-item-create-page-data-model.md  §7
  All field constraints and error messages are in §3.2 of the same document.
  Operational failure scenarios are in §8.

Decisions:
  1. Fixture A (minimal) covers the happy path with a single item and no attachment.
  2. Fixture B (maximal) covers 10-item limit, all categories, amounts at ceiling,
     and 200-char description boundary.
  3. Fixture C has 4 sub-cases:
     C-a: corrupt JSON → quarantine + return []
     C-b: unknown fields → pass-through without error
     C-c: amount exactly at limit ($100.00 Food) → valid
     C-d: amount one cent over limit ($100.01 Food) → validateAmount returns
          { valid: false, message: "Amount exceeds the $100.00 Food limit..." }
  4. Three operational failure modes must have explicit test cases (§8.1–8.2):
     - QUOTA_EXCEEDED: mock localStorage.setItem to throw DOMException code 22
     - STORAGE_UNAVAILABLE: mock to throw SecurityError
     - parse error: seed raw invalid JSON string directly

Open Questions:
  - None blocking test authoring.

Risks:
  - The 200-character description fixture in Fixture B must be verified to be
    exactly 200 characters by the fixture loader — do not rely on visual count.
  - Safari Private Browsing behavior may not be reproducible in all CI browser
    configurations; document any skipped environments.

Acceptance Criteria (Test Coverage):
  1. loadSubmissions() with Fixture A → returns array of 1 Submission.
  2. loadSubmissions() with Fixture B → returns array of 1 Submission with 10 items.
  3. loadSubmissions() with Fixture C-a (corrupt JSON) → returns []; quarantine
     key expenseSubmissions_corrupted_<epoch> exists in localStorage.
  4. loadSubmissions() with Fixture C-b (unknown fields) → returns without error;
     all known fields accessible; no crash.
  5. validateAmount("100.00", "Food") → { valid: true }.
  6. validateAmount("100.01", "Food") → { valid: false }.
  7. sanitizeFileName({ name: "C:\\Users\\john\\receipt.pdf" }) === "receipt.pdf".
  8. saveSubmission() with mocked QuotaExceededError → { success: false, error:
     'QUOTA_EXCEEDED' }.
  9. validateDescription("") → { valid: false, message: "Description is required." }.
  10. validateDate("2026-04-26") (future date relative to submission on 2026-04-25)
      → { valid: false }.

Artifacts Updated:
  .github/data-model/expense-item-create-page-data-model.md  (this document)

Learning Note ID: DBA-20260425-1
```

---

## 10. Learning Note

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
