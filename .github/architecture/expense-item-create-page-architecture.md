# Client-Side Architecture: Expense Item Create Page

**Author:** Solutions Architect  
**Date:** 2026-04-25  
**Status:** Approved — ready for implementation handoff  
**Sprint scope:** Single-page Create Expense Item; no backend, auth, or approval workflow  
**Learning Note:** SA-20260425-1

---

## Table of Contents

1. [Architecture Decision Records](#1-architecture-decision-records)
2. [System Context Diagram](#2-system-context-diagram)
3. [Component Breakdown](#3-component-breakdown)
4. [localStorage Schema](#4-localstorage-schema)
5. [Interface Contracts](#5-interface-contracts)
6. [Security Controls](#6-security-controls)
7. [NFR Coverage](#7-nfr-coverage)
8. [Implementation Work Packages](#8-implementation-work-packages)
9. [HANDOFF_PACKETs](#9-handoff_packets)
10. [Learning Note](#10-learning-note)

---

## 1. Architecture Decision Records

### ADR-001 — localStorage Schema (answers OQ-1)

```
ADR-ID:     ADR-001
Context:    The application has no backend. Submitted expense reports must survive
            page refresh and be retrievable by future sprints. The schema must be
            defined now to prevent breaking changes later.
Decision:   Store all submissions as a JSON array under the single localStorage key
            "expenseSubmissions". Each element is a submission envelope containing
            an auto-generated ID, ISO-8601 timestamp, currency code, and a
            lineItems array. Each line item carries its own ID, description,
            category, amount (number), ISO date string, and an optional
            attachmentFileName (string | null).
Alternatives Considered:
  - One key per submission (e.g., "expenseSubmission-<id>"): rejected because
    enumerating all keys is error-prone and fragile.
  - IndexedDB: rejected as over-engineered for ≤10 items per submission and a
    browser-only sprint with no query requirements.
Tradeoffs:
  + Simple read/write; single JSON.parse/stringify call per operation.
  + Future sprint can migrate to IndexedDB by replacing storage.js only.
  - localStorage is synchronous and limited to ~5 MB; acceptable given max 10
    items per submission and no binary attachment content stored.
Consequences:    All modules depend on storage.js, not directly on localStorage.
Review Trigger:  If attachment binary content must be persisted, migrate to IndexedDB.
```

---

### ADR-002 — Frontend Approach (answers OQ-2)

```
ADR-ID:     ADR-002
Context:    Team wants zero external dependencies, immediate browser runnability,
            and no build toolchain for this sprint.
Decision:   Plain HTML5 + CSS3 + vanilla JavaScript (ES2020). No framework,
            no bundler, no transpiler. Three script files loaded as ES modules
            via <script type="module">. HTML template element used for repeating
            row cloning.
Alternatives Considered:
  - React/Vue/Svelte: rejected — requires Node.js build step, contradicts the
    "open index.html directly" constraint.
  - Web Components (custom elements): rejected — adds unnecessary complexity for
    a single-page sprint.
Tradeoffs:
  + Zero install, zero build; works offline and in corporate locked-down browsers.
  + Full control over DOM and event model; no framework abstraction to debug.
  - No reactive data binding; form state must be managed imperatively in form.js.
  - Adding a framework in a future sprint requires a refactor boundary at form.js.
Consequences:   All DOM manipulation is explicit; security review of innerHTML
                usage is mandatory (see Section 6).
Review Trigger: If the form grows beyond 3 pages of scroll or adds 5+ reusable
                components, evaluate a lightweight framework.
```

---

### ADR-003 — Accessibility Baseline (answers OQ-3)

```
ADR-ID:     ADR-003
Context:    Enterprise expense tools are subject to accessibility audits. The
            Product Owner specified WCAG 2.1 AA.
Decision:   Implement WCAG 2.1 AA as a first-class requirement, not a retrofit.
            Every interactive element has a visible label (<label for="..."> or
            aria-label). Error messages are associated via aria-describedby.
            Dynamic line-item changes are announced via aria-live="polite" on
            the line-items container. Focus is managed on add/remove row actions.
            Color is never the sole error indicator (icon + text + border change).
Alternatives Considered:
  - WCAG 2.0 AA: rejected — 2.1 adds mobile and cognitive criteria the Product
    Owner cares about (1.3.4 Orientation, 1.4.10 Reflow).
  - WCAG 2.2 AA: deferred — 2.2 adds focus appearance criteria not yet baseline
    in enterprise tooling; schedule for next sprint audit.
Tradeoffs:
  + Meets legal minimum for most enterprise procurement requirements.
  + Builds accessible patterns as the codebase grows.
  - Requires discipline in form.js: every programmatic DOM insertion must carry
    correct ARIA attributes.
Consequences:   UI UX Specialist review required before release cut.
Review Trigger: Any new interactive element added to the form.
```

---

### ADR-004 — Validation Timing (answers OQ-4)

```
ADR-ID:     ADR-004
Context:    Validating on every keystroke is disruptive; validating only on
            submit creates a poor error-discovery experience for multi-field forms.
Decision:   Two-phase validation:
            Phase 1 — On-blur: validate the individual field that just lost focus.
              Show inline error immediately below the field.
            Phase 2 — On-submit: re-validate all fields holistically, block
              submission if any error exists, scroll to first error, and set focus
              on first invalid field.
            Clear a field's error on next input event (eager clearing).
Alternatives Considered:
  - Validate on every keystroke: rejected — amount fields would show errors
    while the user is mid-type.
  - Validate on submit only: rejected — user discovers all errors at once;
    poor UX for a 10-item form.
Tradeoffs:
  + Balances discoverability and non-intrusiveness.
  + Consistent with browser native :invalid pseudo-class timing expectations.
  - Requires validator.js functions to be callable in both contexts (they are
    stateless, so this is free).
Consequences:   form.js must bind both blur and submit handlers. Validator
                functions must be pure (no side effects).
Review Trigger: User research showing > 20% error-recovery failure rate.
```

---

## 2. System Context Diagram

```
╔══════════════════════════════════════════════════════════════════╗
║                          BROWSER CONTEXT                        ║
║                                                                  ║
║  ┌─────────────────────────────────────────────────────────┐    ║
║  │                       index.html                        │    ║
║  │                                                         │    ║
║  │  ┌──────────┐   ┌────────────┐   ┌──────────────────┐  │    ║
║  │  │constants │   │ validator  │   │    storage.js    │  │    ║
║  │  │  .js     │◄──┤   .js      │   │                  │  │    ║
║  │  │          │   │            │   │  loadSubmissions()│  │    ║
║  │  │CATEGORIES│   │validateAmt │   │  saveSubmission() │  │    ║
║  │  │LIMITS    │   │validateDate│   └────────┬─────────┘  │    ║
║  │  │FILE_TYPES│   │validateFile│            │             │    ║
║  │  │MAX_ITEMS │   │validateForm│            │             │    ║
║  │  └──────────┘   └─────┬──────┘            │             │    ║
║  │                       │                   │             │    ║
║  │             ┌──────────▼──────────────────▼──────────┐  │    ║
║  │             │                form.js                  │  │    ║
║  │             │  init() · addLineItem() · removeLineItem│  │    ║
║  │             │  collectFormData() · handleSubmit()     │  │    ║
║  │             │  handleFieldBlur()                      │  │    ║
║  │             └──────────────────┬──────────────────────┘  │    ║
║  │                                │                         │    ║
║  │  ┌─────────────────────────────▼───────────────────────┐ │    ║
║  │  │            <form id="expense-form">                  │ │    ║
║  │  │  [description] [category] [amount] [date] [attach]  │ │    ║
║  │  │  [+ Add Line Item]           [Submit Expense Report] │ │    ║
║  │  └──────────────────────────────────────────────────────┘ │    ║
║  └─────────────────────────────────────────────────────────┘    ║
║                                │                                 ║
║                                │ JSON.stringify / JSON.parse     ║
║                                ▼                                 ║
║         ┌────────────────────────────────────────┐               ║
║         │           localStorage                 │               ║
║         │   key: "expenseSubmissions"            │               ║
║         │   value: JSON array of submissions     │               ║
║         └────────────────────────────────────────┘               ║
╚══════════════════════════════════════════════════════════════════╝

Data flow:
  User Input → form.js (on-blur) → validator.js → inline error OR clear
  User clicks Submit → form.js → validator.js (holistic) → storage.js → localStorage
  Page load → storage.js → localStorage (read-back for future sprints)
```

---

## 3. Component Breakdown

### 3.1 `constants.js`

**Responsibility:** Single source of truth for all hard-coded business rules and limits. No functions — exports only named constants. All other modules import from here; no magic numbers elsewhere.

```
File: src/constants.js
Exports:
  CATEGORY_LIMITS   — Object mapping category name → max USD amount
  CATEGORIES        — Array of category name strings (ordered for <select>)
  ALLOWED_MIME_TYPES       — Array of allowed MIME type strings
  ALLOWED_FILE_EXTENSIONS  — Array of allowed file extension strings (lowercase)
  MAX_FILE_SIZE_BYTES      — Number (5 * 1024 * 1024)
  MAX_LINE_ITEMS           — Number (10)
  STORAGE_KEY              — String ("expenseSubmissions")
  CURRENCY                 — String ("USD")
```

---

### 3.2 `validator.js`

**Responsibility:** Pure, stateless validation functions. Each function returns a result object `{ valid: boolean, message: string }`. No DOM interaction. Imports constants.js only.

```
File: src/validator.js
Imports: constants.js

Functions:
  validateDescription(value)
  validateCategory(value)
  validateAmount(value, category)
  validateDate(value)
  validateAttachment(file | null)   — file is a File object or null
  sanitizeFileName(file)            — returns safe basename string
  validateLineItem(lineItemData)    — returns { valid, errors: { field: message } }
  validateForm(lineItemsData[])     — returns { valid, itemErrors: array of per-item errors }
```

---

### 3.3 `storage.js`

**Responsibility:** Encapsulate all localStorage access. No other module touches localStorage directly. Handles parse errors gracefully.

```
File: src/storage.js
Imports: constants.js

Functions:
  loadSubmissions()           — returns array (empty array on parse error or missing key)
  saveSubmission(submission)  — appends to array, writes back; returns { success, id }
  generateId(prefix)          — returns string like "sub-1745577600000-4f3a"
```

---

### 3.4 `form.js`

**Responsibility:** All DOM interaction and form lifecycle. Orchestrates validator.js and storage.js. Manages dynamic line-item rows using the `<template>` element.

```
File: src/form.js
Imports: constants.js, validator.js, storage.js

Functions:
  init()                        — called on DOMContentLoaded; adds first row, binds submit
  addLineItem()                 — clones template, appends row, binds row-level events,
                                   enforces MAX_LINE_ITEMS cap, updates aria-live region
  removeLineItem(rowElement)    — removes row, re-numbers visible rows, updates aria-live,
                                   returns focus to Add button if last row removed
  collectFormData()             — reads all row inputs; returns array of raw data objects
  handleFieldBlur(event)        — identifies field type, calls validator, shows/clears error
  handleSubmit(event)           — prevents default, calls validateForm, writes to storage
                                   on success, shows confirmation message, resets form
  showFieldError(inputEl, msg)  — sets aria-describedby, renders error span, adds CSS class
  clearFieldError(inputEl)      — removes error span and CSS class
  showFormSuccess()             — renders success banner, moves focus to banner
  showFormError(itemErrors[])   — renders summary, scrolls to first error, focuses it
```

---

### 3.5 `index.html`

**Responsibility:** Page shell. Semantic HTML structure. No inline scripts or styles. All behavior loaded as ES modules.

```
File: index.html

Structure:
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Create Expense Report</title>
      <link rel="stylesheet" href="src/styles.css">
    </head>
    <body>
      <header role="banner">
        <h1>Create Expense Report</h1>
      </header>
      <main id="main-content" role="main">
        <div id="form-status" aria-live="polite" aria-atomic="true" class="sr-only"></div>
        <form id="expense-form" novalidate aria-label="Expense Report Form">
          <div
            id="line-items"
            aria-live="polite"
            aria-label="Expense line items">
            <!-- rows cloned here from template -->
          </div>
          <div class="form-actions">
            <button type="button" id="add-item-btn"
                    aria-label="Add another expense line item">
              + Add Line Item
            </button>
            <button type="submit" id="submit-btn">
              Submit Expense Report
            </button>
          </div>
        </form>
        <!-- Row template — not rendered -->
        <template id="line-item-template">
          <fieldset class="line-item" role="group">
            <legend>Line Item <span class="item-number"></span></legend>
            <div class="field-group">
              <label for="description-ROWID">Description <span aria-hidden="true">*</span></label>
              <input type="text" id="description-ROWID" name="description"
                     aria-required="true" maxlength="200" autocomplete="off">
              <span class="field-error" role="alert" id="description-error-ROWID"></span>
            </div>
            <div class="field-group">
              <label for="category-ROWID">Category <span aria-hidden="true">*</span></label>
              <select id="category-ROWID" name="category" aria-required="true">
                <option value="">-- Select Category --</option>
                <!-- options injected by form.js from CATEGORIES constant -->
              </select>
              <span class="field-error" role="alert" id="category-error-ROWID"></span>
            </div>
            <div class="field-group">
              <label for="amount-ROWID">Amount (USD) <span aria-hidden="true">*</span></label>
              <input type="number" id="amount-ROWID" name="amount"
                     aria-required="true" min="0.01" step="0.01"
                     inputmode="decimal">
              <span class="field-error" role="alert" id="amount-error-ROWID"></span>
            </div>
            <div class="field-group">
              <label for="date-ROWID">Expense Date <span aria-hidden="true">*</span></label>
              <input type="date" id="date-ROWID" name="date" aria-required="true">
              <span class="field-error" role="alert" id="date-error-ROWID"></span>
            </div>
            <div class="field-group">
              <label for="attachment-ROWID">Attachment (optional, PDF/JPG/PNG, max 5 MB)</label>
              <input type="file" id="attachment-ROWID" name="attachment"
                     accept=".pdf,.jpg,.jpeg,.png">
              <span class="field-error" role="alert" id="attachment-error-ROWID"></span>
            </div>
            <button type="button" class="remove-item-btn"
                    aria-label="Remove this line item">
              Remove
            </button>
          </fieldset>
        </template>
      </main>
      <script type="module" src="src/form.js"></script>
    </body>
  </html>
```

---

### 3.6 `styles.css`

**Responsibility:** Visual layout and state styling. No behavior. Uses CSS custom properties for theming tokens.

```
File: src/styles.css

Key rules:
  :root                        — design tokens (color, spacing, font-size)
  body                         — single-column layout, max-width 800px, centered
  .line-item (fieldset)        — card-style border, padding, margin-bottom
  .field-group                 — flex column: label → input → error span
  .field-error                 — color: var(--error-color); font-size: 0.875rem;
                                  min-height: 1.25rem (reserves space to avoid layout shift)
  input.invalid, select.invalid — border: 2px solid var(--error-color)
  input:focus, select:focus, button:focus — visible focus ring (min 3px, WCAG 2.1 AA 1.4.11)
  .form-actions                — flex row, space-between, margin-top
  #add-item-btn[disabled]      — reduced opacity, cursor: not-allowed
  .sr-only                     — visually hidden but screen-reader accessible
  @media (max-width: 600px)    — single column, full-width inputs (WCAG 1.4.10 Reflow)
  .success-banner              — green background, role="status", padding
  .error-summary               — red border-left, padding, list of error links
```

---

## 4. localStorage Schema

### Top-level structure

```json
{
  "expenseSubmissions": [ /* array of Submission objects */ ]
}
```

### Submission object

```json
{
  "id": "sub-1745577600000-4f3a",
  "submittedAt": "2026-04-25T10:30:00.000Z",
  "currency": "USD",
  "lineItems": [ /* array of LineItem objects, 1–10 */ ]
}
```

### LineItem object

```json
{
  "id": "item-1745577600001-9b2c",
  "description": "Round-trip flight JFK to LAX",
  "category": "Travel-Air",
  "amount": 1250.00,
  "date": "2026-04-20",
  "attachmentFileName": "airline_receipt.pdf"
}
```

### Field constraints enforced at write time

| Field               | Type             | Constraint                                           |
|---------------------|------------------|------------------------------------------------------|
| `id`                | string           | `sub-<epoch>-<4hex>` format                          |
| `submittedAt`       | string           | ISO-8601 UTC (`new Date().toISOString()`)            |
| `currency`          | string           | Always `"USD"` (from constant)                       |
| `lineItems`         | array            | Length 1–10                                          |
| `item.id`           | string           | `item-<epoch>-<4hex>` format                         |
| `item.description`  | string           | 1–200 characters, trimmed                            |
| `item.category`     | string           | Must be a key in `CATEGORY_LIMITS`                   |
| `item.amount`       | number           | `> 0` and `<= CATEGORY_LIMITS[category]`             |
| `item.date`         | string           | ISO date `YYYY-MM-DD`, not in the future             |
| `item.attachmentFileName` | string \| null | Sanitized basename; null if no attachment       |

### Example full localStorage value

```json
[
  {
    "id": "sub-1745577600000-4f3a",
    "submittedAt": "2026-04-25T10:30:00.000Z",
    "currency": "USD",
    "lineItems": [
      {
        "id": "item-1745577600001-9b2c",
        "description": "Round-trip flight JFK to LAX",
        "category": "Travel-Air",
        "amount": 1250.00,
        "date": "2026-04-20",
        "attachmentFileName": "airline_receipt.pdf"
      },
      {
        "id": "item-1745577600002-a1d7",
        "description": "Hotel stay NYC",
        "category": "Hotel",
        "amount": 450.00,
        "date": "2026-04-21",
        "attachmentFileName": null
      }
    ]
  }
]
```

---

## 5. Interface Contracts

### 5.1 `constants.js`

```javascript
// All exports are const — never mutated by consumers.

export const CATEGORY_LIMITS = {
  "Travel-Air": 5000,
  "Travel-Car": 1000,
  "Food":        100,
  "Hotel":       500,
  "Mobile":      200
};

export const CATEGORIES = Object.keys(CATEGORY_LIMITS); // ordered as above

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png"
];

export const ALLOWED_FILE_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;   // 5 MB
export const MAX_LINE_ITEMS = 10;
export const STORAGE_KEY = "expenseSubmissions";
export const CURRENCY = "USD";
```

---

### 5.2 `validator.js`

```javascript
/**
 * All functions return: { valid: boolean, message: string }
 * message is "" when valid === true.
 * Functions are pure — no DOM side effects.
 */

// Precondition: value is a trimmed string
// Postcondition: valid if length 1–200
export function validateDescription(value) { ... }

// Precondition: value is a string
// Postcondition: valid if value is a key in CATEGORY_LIMITS
export function validateCategory(value) { ... }

// Precondition: value is a string; category is a valid category string
// Postcondition: valid if parseFloat(value) > 0 and <= CATEGORY_LIMITS[category]
//   Returns specific message: "Amount exceeds $X.XX limit for <category>"
export function validateAmount(value, category) { ... }

// Precondition: value is a string in YYYY-MM-DD or empty
// Postcondition: valid if parseable date, not in the future, not empty
export function validateDate(value) { ... }

// Precondition: file is a File object or null/undefined
// Postcondition: valid if null/undefined (attachment is optional);
//   if File present: MIME type in ALLOWED_MIME_TYPES AND size <= MAX_FILE_SIZE_BYTES
export function validateAttachment(file) { ... }

// Precondition: file is a File object
// Postcondition: returns basename string with path separators stripped
//   strips both Unix '/' and Windows '\' prefixes
//   Example: "C:\Users\john\receipt.pdf" → "receipt.pdf"
export function sanitizeFileName(file) { ... }

// Precondition: lineItemData is { description, category, amount, date, file }
// Postcondition: { valid: boolean, errors: { description?, category?, amount?, date?, attachment? } }
export function validateLineItem(lineItemData) { ... }

// Precondition: lineItemsData is a non-empty array (max 10) of raw form data objects
// Postcondition: { valid: boolean, itemErrors: [{ index, errors }] }
//   itemErrors is empty array when valid === true
export function validateForm(lineItemsData) { ... }
```

---

### 5.3 `storage.js`

```javascript
/**
 * Encapsulates all localStorage access.
 * No caller touches localStorage directly.
 */

// Returns: Submission[] — empty array if key missing or JSON invalid
// Never throws.
export function loadSubmissions() { ... }

// Precondition: submission is a valid Submission object (already validated)
// Postcondition: appends to array, writes back to localStorage
// Returns: { success: true, id: string } | { success: false, error: string }
export function saveSubmission(submission) { ... }

// Returns a collision-resistant string ID
// Format: "<prefix>-<Date.now()>-<4 random hex chars>"
// Example: generateId("sub") → "sub-1745577600000-4f3a"
export function generateId(prefix) { ... }
```

---

### 5.4 `form.js`

```javascript
/**
 * Orchestrates DOM, validator, and storage.
 * Called once on DOMContentLoaded via init().
 */

// Precondition: DOM is fully loaded
// Postcondition: one line-item row rendered; all event handlers bound
export function init() { ... }

// Precondition: current row count < MAX_LINE_ITEMS
// Postcondition: new row appended; focus moved to description field of new row;
//   Add button disabled if count reaches MAX_LINE_ITEMS;
//   aria-live region updated with "Line item N added"
export function addLineItem() { ... }

// Precondition: rowElement is a .line-item fieldset in the DOM
// Postcondition: row removed from DOM; remaining rows re-numbered;
//   Add button re-enabled if count drops below MAX_LINE_ITEMS;
//   aria-live region updated with "Line item N removed";
//   focus moved to Add button
export function removeLineItem(rowElement) { ... }

// Returns: array of { description, category, amount, date, file } objects
// One object per row in current DOM order; file is File|null
export function collectFormData() { ... }

// Triggered on input 'blur' event
// Identifies field name from event.target; calls corresponding validator;
//   shows or clears inline error
export function handleFieldBlur(event) { ... }

// Triggered on form 'submit' event
// Calls validateForm; on failure: renders error summary, scrolls, focuses first error;
//   on success: builds Submission object, calls saveSubmission, shows success banner,
//   calls form.reset(), re-initializes one empty row
export function handleSubmit(event) { ... }

// DOM helpers — internal; exported for testing
// showFieldError(inputEl, message) — adds .invalid class, populates error span,
//   sets aria-describedby on inputEl to errorSpanId
// clearFieldError(inputEl) — removes .invalid class, empties error span,
//   removes aria-describedby
export function showFieldError(inputEl, message) { ... }
export function clearFieldError(inputEl) { ... }
```

---

## 6. Security Controls

### 6.1 File Name Sanitization

**Risk:** A maliciously crafted `<input type="file">` might carry a path like `C:\private\secrets\receipt.pdf` or `../../etc/passwd.pdf`. Even though browser sandboxing prevents path traversal in reading, storing the full path string in localStorage could leak directory structure.

**Control (in `validator.js` → `sanitizeFileName`):**

```javascript
export function sanitizeFileName(file) {
  // Strip both Windows (\) and Unix (/) path separators
  const raw = file.name;
  const basename = raw.split(/[\\/]/).pop();
  // Allow only safe filename characters: alphanumeric, dash, underscore, dot
  return basename.replace(/[^a-zA-Z0-9._\-]/g, '_');
}
```

Called in `form.js` before constructing the LineItem object. The original `File` object is never stored — only the sanitized string.

---

### 6.2 XSS Prevention in DOM Manipulation

**Risk:** User-supplied values (description, file name) rendered back into the DOM could execute scripts if inserted via `innerHTML`.

**Controls:**

| Operation | Unsafe pattern (forbidden) | Safe pattern (required) |
|-----------|---------------------------|------------------------|
| Render description | `el.innerHTML = userValue` | `el.textContent = userValue` |
| Render file name | `el.innerHTML = fileName` | `el.textContent = fileName` |
| Insert error message | `el.innerHTML = validatorMsg` | `el.textContent = validatorMsg` (messages are from constants only) |
| Create row | `container.innerHTML = templateStr` | `template.content.cloneNode(true)` |

**Rule:** `innerHTML` is only permitted for static, developer-supplied strings (e.g., SVG icons). Any string derived from user input must use `textContent` or `setAttribute`.

---

### 6.3 localStorage Integrity on Read

**Risk:** localStorage content can be modified by browser extensions or DevTools. A corrupt or malicious value could cause a crash or unexpected behavior.

**Control (in `storage.js`):**

```javascript
export function loadSubmissions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Validate it is an array before returning
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
```

**Note:** Deep schema validation of loaded data is deferred to the next sprint when read-back UI is added. For this sprint (write-only path), the guard above is sufficient.

---

### 6.4 Input Length Enforcement

Description field: `maxlength="200"` HTML attribute + validator enforced at submit. Prevents localStorage bloat and potential DoS on future read-back rendering.

Amount field: `type="number"` with `min="0.01"` + server-side-equivalent JavaScript validation. The category limit is enforced in `validateAmount`, not by HTML alone (HTML `max` is not dynamic per row).

---

## 7. NFR Coverage

### 7.1 Accessibility (WCAG 2.1 AA)

| Criterion | Implementation |
|-----------|---------------|
| 1.1.1 Non-text content | File input visually labeled; no image-only UI elements |
| 1.3.1 Info and relationships | `<fieldset>/<legend>` per row; `<label for>` on all inputs |
| 1.3.4 Orientation | No CSS that locks orientation |
| 1.4.1 Use of color | Error: border change + icon text + message (not color alone) |
| 1.4.3 Contrast | Minimum 4.5:1 for body text, 3:1 for UI components (verified in design tokens) |
| 1.4.10 Reflow | Responsive CSS; single column at 320 px viewport width |
| 1.4.11 Non-text contrast | Focus ring ≥ 3 px |
| 2.1.1 Keyboard | All controls reachable by Tab; Remove button in DOM flow |
| 2.4.3 Focus order | Row insertion appends at end; focus moved programmatically to new row's first field |
| 2.4.6 Headings and labels | `<h1>` page title; `<legend>` per fieldset; all inputs labeled |
| 3.3.1 Error identification | Inline error per field with `role="alert"` |
| 3.3.2 Labels or instructions | Placeholder supplementary only; label carries full context |
| 4.1.3 Status messages | `aria-live="polite"` for row add/remove; `role="status"` for success banner; `role="alert"` for error summary |

---

### 7.2 Performance

- **No network calls.** All data is in-memory and localStorage.
- **No render-blocking resources.** CSS in `<head>`, JS as `type="module"` (deferred by default).
- **Row cloning via `<template>`.** No string parsing; cloneNode is O(subtree size), constant per row.
- **LocalStorage write is synchronous.** Acceptable for ≤10 items; no observable latency.
- **Total asset budget:** 3 JS files + 1 CSS file. Target combined uncompressed size < 30 KB.

---

### 7.3 Browser Compatibility

| Browser | Target version | Notes |
|---------|---------------|-------|
| Chrome | Latest 2 | ES2020 modules, `<template>`, localStorage — all native |
| Edge | Latest 2 | Chromium-based; identical to Chrome |
| Firefox | Latest 2 | Full support |
| Safari | Latest 2 | Full support; `type="date"` renders native date picker |
| IE 11 | Not supported | `type="module"` not supported; explicitly out of scope |

No polyfills or transpilation required. No `babel`, no `webpack`, no `postcss`.

---

## 8. Implementation Work Packages

Work packages are independently deliverable and ordered by dependency. Each WP has a clear done condition.

---

### WP-1 — Project Scaffold

**Delivers:** Runnable skeleton that opens in any browser with zero install.

Tasks:
- Create `index.html` with semantic shell (header, main, form, template, module script tag)
- Create `src/styles.css` with CSS custom properties (tokens), base reset, `.sr-only`
- Create `src/constants.js`, `src/validator.js`, `src/storage.js`, `src/form.js` as empty ES module stubs

Done condition: `index.html` opens in browser; no console errors; heading and empty form render.

---

### WP-2 — Constants Module

**Delivers:** `src/constants.js` fully populated.

Tasks:
- Define all exports per interface contract in Section 5.1
- No logic; export-only file

Done condition: `import { CATEGORY_LIMITS } from './constants.js'` resolves correctly in browser console.

---

### WP-3 — Validator Module

**Delivers:** `src/validator.js` fully implemented with all 7 functions.

Tasks:
- Implement each function per contract in Section 5.2
- Implement `sanitizeFileName` per Section 6.1
- Manual test each function in browser console against boundary values

Done condition: All validators return correct `{ valid, message }` for valid input, boundary input, and invalid input.

---

### WP-4 — Storage Module

**Delivers:** `src/storage.js` with `loadSubmissions`, `saveSubmission`, `generateId`.

Tasks:
- Implement per contract in Section 5.3
- Implement try/catch guard per Section 6.3
- Manual smoke-test via browser console: save → reload → load returns saved data

Done condition: `saveSubmission` appends to localStorage; `loadSubmissions` returns correct array after page refresh.

---

### WP-5 — Static Single-Row Form

**Delivers:** `index.html` template populated; one row rendered on load; no add/remove yet.

Tasks:
- Complete `<template id="line-item-template">` with all 5 fields (Section 3.5)
- Implement `form.js` init(): clone template, inject CATEGORIES `<option>` list, append first row
- Wire "Submit" button to `console.log(collectFormData())` (placeholder)

Done condition: Page renders one complete row; all fields present; category dropdown populated from constant.

---

### WP-6 — Dynamic Row Management

**Delivers:** Add and Remove row functionality with row limit enforcement.

Tasks:
- Implement `addLineItem()`: clone, ID-suffix all `id`/`for`/`aria-describedby` attributes with unique row index
- Implement `removeLineItem(rowElement)`: remove, re-number legends
- Disable Add button at 10 rows; re-enable below 10
- Update `aria-live` region on add/remove
- Move focus on add (to new row description) and remove (to Add button)

Done condition: Can add 10 rows; Add button disables at 10; each row removable; focus and ARIA announcements work (verified with browser screen reader or axe DevTools).

---

### WP-7 — On-Blur Field Validation

**Delivers:** Inline validation feedback as user moves between fields.

Tasks:
- Bind `blur` event on each field within `addLineItem` (use event delegation on `#line-items`)
- Implement `handleFieldBlur` routing to correct validator
- Implement `showFieldError` / `clearFieldError` per contract
- Bind `input` event to eagerly clear error on next keystroke

Done condition: Leaving an empty required field shows error below the field; typing corrects the error; aria-describedby links field to error span.

---

### WP-8 — Submit Validation and Storage Write

**Delivers:** Full submit path: holistic validation → storage write → success/failure feedback.

Tasks:
- Implement `handleSubmit`: call `validateForm(collectFormData())`
- On failure: render error summary list with anchor links to first invalid field per row; scroll + focus
- On success: build `Submission` object using `generateId`, current ISO timestamp, `CURRENCY` constant, sanitized line items; call `saveSubmission`; show success banner; reset form to single empty row

Done condition: Invalid form shows error summary; valid form writes to localStorage and shows success; form resets after success.

---

### WP-9 — Styles and Visual Polish

**Delivers:** Complete `src/styles.css` matching Section 3.6 specification.

Tasks:
- Layout tokens, card-style fieldset, responsive grid
- `.invalid` input state, `.field-error` typography
- Success banner and error summary visual styles
- Focus ring (≥3 px offset, high-contrast color)
- `@media (max-width: 600px)` reflow rules

Done condition: All states visually distinct; no layout shift when errors appear/disappear; passes axe DevTools at WCAG AA level.

---

### WP-10 — Accessibility Audit Pass

**Delivers:** WCAG 2.1 AA conformance verified.

Tasks:
- Run axe DevTools (or equivalent) on all states: empty form, validation errors, success
- Fix any flagged violations
- Manual keyboard-only navigation test: Tab through all fields, add/remove rows, submit
- Verify `aria-live` announcements in NVDA or VoiceOver

Done condition: Zero axe critical/serious violations in all form states; keyboard-only user can complete full submission.

---

## 9. HANDOFF_PACKETs

---

### HANDOFF_PACKET — Senior Software Engineer

```
HANDOFF_PACKET
From:    Solutions Architect
To:      Senior Software Engineer
Task:    Implement the client-side Expense Item Create Page per architecture
         document: .github/architecture/expense-item-create-page-architecture.md

Context:
  Single HTML page. No backend, no build toolchain, no framework.
  Pure HTML5 + CSS3 + vanilla JavaScript (ES2020 modules).
  5 hard-coded expense categories with per-category USD amount limits.
  Max 10 line items per submission. Attachments: file name only (no binary).
  Persistence via localStorage key "expenseSubmissions".

Decisions:
  - ADR-001: localStorage schema — append-only JSON array under single key.
  - ADR-002: Vanilla JS ES modules — zero dependencies, open in browser directly.
  - ADR-003: WCAG 2.1 AA baseline — aria attributes mandatory on all dynamic DOM.
  - ADR-004: On-blur individual + on-submit holistic validation.

Implementation Order:
  WP-1 scaffold → WP-2 constants → WP-3 validator → WP-4 storage →
  WP-5 static row → WP-6 dynamic rows → WP-7 blur validation →
  WP-8 submit path → WP-9 styles → WP-10 accessibility

Security Constraints (non-negotiable):
  - sanitizeFileName() must be called on every File object before storage.
  - All user-supplied strings must use textContent, never innerHTML.
  - localStorage reads must be wrapped in try/catch returning [] on failure.
  - No eval(), no dynamic script injection.

Open Questions:
  - None blocking. All OQs resolved in ADRs.

Risks for Engineer:
  - RISK-01 (Low): Row ID suffix collision if rows added/removed rapidly.
    Mitigation: Use a monotonically incrementing counter, not row count.
  - RISK-02 (Low): Safari type="date" returns empty string if user clears.
    Mitigation: validateDate treats empty as invalid and shows required message.

Acceptance Criteria (per WP):
  See Section 8 "Done Condition" for each work package.

Artifacts:
  - This document: .github/architecture/expense-item-create-page-architecture.md
  - Interface contracts: Section 5
  - localStorage schema: Section 4

Learning Note ID: SA-20260425-1
```

---

### HANDOFF_PACKET — Senior Database Administrator (Client-Side Data Model Owner)

```
HANDOFF_PACKET
From:    Solutions Architect
To:      Senior Database Administrator (acting as Client-Side Data Model Owner)
Task:    Review and validate the localStorage data schema for the Expense Item
         Create Page. Confirm the schema is forward-compatible with a future
         backend persistence migration.

Context:
  No relational database this sprint. All persistence is localStorage.
  The schema defined in Section 4 of the architecture document is the
  authoritative data contract for this sprint.

Schema Summary:
  Key:    "expenseSubmissions"
  Value:  JSON array of Submission objects
  Submission: { id, submittedAt (ISO-8601), currency ("USD"), lineItems[] }
  LineItem:   { id, description, category, amount (number), date (ISO date),
                attachmentFileName (string | null) }

Questions for DBA Review:
  DQ-1: Is the ID format ("sub-<epoch>-<4hex>") acceptable as a future
        primary key seed, or should we use a full UUID (RFC 4122)?
  DQ-2: Should `amount` be stored as a number or string to avoid
        floating-point precision issues at the DB layer?
        (Current decision: number — JavaScript number is IEEE 754 double,
        sufficient for currency up to $5,000 with 2 decimal places.
        Recommend DBA confirm or flag for Decimal type at migration.)
  DQ-3: Should `submittedAt` store UTC offset explicitly
        (e.g., "2026-04-25T10:30:00.000Z") — confirmed UTC via toISOString().

Migration Readiness:
  - All field names are snake_case-compatible and map 1:1 to SQL column names.
  - `id` fields can be retained as natural keys or replaced with surrogate keys.
  - `attachmentFileName` is a stub for a future `attachment_url` column.

Risks:
  - RISK-03 (Medium): localStorage is not transactional. Concurrent tabs could
    produce duplicate IDs if two submissions are saved within the same
    millisecond. Mitigation for this sprint: acceptable (single tab use assumed).
    Future: use UUID v4 or server-assigned IDs.

Artifacts:
  - Schema definition: Section 4 of this document
  - Field constraints table: Section 4, "Field constraints enforced at write time"

Learning Note ID: SA-20260425-1
```

---

### HANDOFF_PACKET — Senior UI UX Specialist

```
HANDOFF_PACKET
From:    Solutions Architect
To:      Senior UI UX Specialist
Task:    Review the interaction architecture and accessibility implementation
         plan for the Expense Item Create Page. Provide design validation and
         flag any UX gaps before the Engineer begins WP-9 (styles) and
         WP-10 (accessibility audit).

Context:
  Single-page form. Up to 10 dynamic line items. Vanilla HTML/CSS.
  WCAG 2.1 AA is a hard requirement.

Interaction Architecture Decisions:
  - Validation: on-blur per field, holistic on submit.
  - Error display: inline below each field (role="alert") + summary list on submit.
  - Row lifecycle: Add button (disabled at 10); Remove button per row.
  - Focus management: new row → description field; removed row → Add button.
  - Success: full-page success banner (role="status"); form resets.

Accessibility Commitments:
  - <fieldset>/<legend> per row.
  - aria-live="polite" on #line-items container.
  - aria-describedby linking each input to its error span.
  - Focus ring min 3 px, high-contrast.
  - Error never communicated by color alone (border + icon + text).
  - Responsive reflow at 320 px (WCAG 1.4.10).

UX Open Questions for Specialist:
  UQ-1: Should the "Remove" button be icon-only (with aria-label)
        or text + icon? Architecture assumes text "Remove" for accessibility
        baseline — confirm or override.
  UQ-2: Should the success state reset the form immediately or show the
        submitted summary before clearing? Architecture assumes immediate reset
        with success banner — validate this flow.
  UQ-3: Category limit hint: should the per-category dollar limit be displayed
        next to the category dropdown as helper text, or only shown as
        a validation error? Recommend: show as helper text (better affordance).
  UQ-4: File input: browser-native file picker has limited styling affordance.
        Confirm whether a custom-styled wrapper is in scope for this sprint
        (current architecture: use native <input type="file"> for simplicity).

Risks for UX Review:
  - RISK-04 (Medium): 10-row forms on mobile may require significant scrolling.
    Consider sticky "Add Line Item + Submit" action bar for mobile viewport.
    Architecture has not locked this; UX Specialist to advise.
  - RISK-05 (Low): Date input renders differently across browsers (Chrome calendar
    picker vs. Firefox text input). Confirm whether a polyfilled date picker
    is in scope.

Artifacts:
  - HTML structure: Section 3.5 (index.html)
  - CSS spec: Section 3.6 (styles.css)
  - WCAG coverage matrix: Section 7.1

Learning Note ID: SA-20260425-1
```

---

## 10. Learning Note

To be appended to `.github/agent-memory/solutions-architect.md`:

```
ID: SA-20260425-1
Task: Design client-side architecture for Expense Item Create Page
      (single sprint, no backend, vanilla JS, localStorage persistence).
Observation: When the entire stack is client-side (no API, no DB engine),
      the "database" role pivots from schema/query design to data contract
      and migration-readiness review. Framing the DBA handoff around
      forward-compatibility questions (ID format, numeric precision, UTC
      timestamps) produced more actionable feedback than a generic schema review.
Hypothesis: Explicitly resolving all Product Owner open questions (OQ-1 through
      OQ-4) as first-class ADRs — with alternatives considered and review
      triggers — prevents scope creep by eliminating ambiguity that engineers
      might otherwise resolve ad hoc.
Outcome: Produced 10 independently deliverable work packages, 3 HANDOFF_PACKETs,
      full interface contracts for 4 modules, localStorage schema, and complete
      WCAG 2.1 AA coverage mapping — all from a PO handoff with 4 open questions.
Action for Next Time: For browser-only sprints with file handling, proactively
      state in the architecture that virus scanning and server-side validation
      are out of scope (echoes SPO-20260425-1 lesson). Add a "deferred security
      controls" section to prevent reviewers from flagging known omissions as
      defects. Also: specify a row ID generation strategy (monotonic counter vs.
      timestamp) explicitly in form.js contract to prevent RISK-01 ambiguity.
```
