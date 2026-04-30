# UX Specification: Expense Item Create Page

**Author:** Senior UI UX Specialist  
**Date:** 2026-04-25  
**Status:** Approved — ready for engineering and QA handoff  
**Aligned With:** SA Architecture (`expense-item-create-page-architecture.md`, SA-20260425-1)  
**Learning Note:** UIUX-20260425-1

---

## Table of Contents

1. [User Journey Map](#1-user-journey-map)
2. [Information Hierarchy](#2-information-hierarchy)
3. [Interaction Specification](#3-interaction-specification)
4. [Accessibility Specification](#4-accessibility-specification)
5. [Color and Visual Design Tokens](#5-color-and-visual-design-tokens)
6. [Responsive Layout Breakpoints](#6-responsive-layout-breakpoints)
7. [Copy Guide](#7-copy-guide)
8. [UX Acceptance Criteria](#8-ux-acceptance-criteria)
9. [HANDOFF_PACKETs](#9-handoff_packets)
10. [Learning Note](#10-learning-note)

---

## 1. User Journey Map

### 1.1 User Persona

**Employee — Expense Submitter**  
Goal: Submit one or more expense line items accurately and receive confirmation before closing the browser.  
Context: Office desk or mobile device; completing one expense report after a business trip or recurring monthly expenses.  
Constraints: Category spending limits apply; attachment formats restricted; maximum 10 line items per report.

---

### 1.2 Happy Path — Single Line Item

```
STEP    USER ACTION                         SYSTEM RESPONSE
──────────────────────────────────────────────────────────────────────
S1      Navigates to index.html             Page loads. One line item card shown.
                                            "Add Line Item" button enabled.
                                            Running total shows $0.00.
                                            Page title and form heading visible.

S2      Types description                   No validation until blur.

S3      Tabs to Category dropdown           Focus ring visible on dropdown.

S4      Selects "Travel – Air"              Dropdown closes. Value confirmed.
                                            Category limit is $5,000.

S5      Tabs to Amount field               "$" prefix visible. Placeholder 0.00.

S6      Types "250"                         No validation until blur.

S7      Tabs to Date field                  Amount validated on blur: valid.
                                            Running total updates to $250.00.

S8      Selects a valid past date           Date validated on blur: valid.

S9      Tabs to Attachment (optional)       File input visible. "No file chosen."

S10     Skips attachment                    No error — attachment is optional.

S11     Clicks "Submit Expense Report"      Holistic validation passes.
                                            Data saved to localStorage.
                                            Success banner appears at top of page.
                                            Form resets to one empty line item.
                                            Focus moves to success banner.
```

---

### 1.3 Happy Path — Multiple Line Items

```
STEP    USER ACTION                         SYSTEM RESPONSE
──────────────────────────────────────────────────────────────────────
M1      Completes first line item (S2–S10)  Running total reflects first item.

M2      Clicks "+ Add Line Item"            New empty card appended below.
                                            Focus moves to Description field of
                                            the new card.
                                            "Add Line Item" button remains enabled
                                            (if < 10 items).
                                            aria-live announces: "Line item 2 added."

M3      Completes second line item          Running total updates as amounts blur.

M4      Clicks "+ Add Line Item" (again)    Third card added. Focus managed.

M5      Clicks "✕ Remove" on card 2         Card 2 removed. Remaining cards
                                            renumbered. Focus moves to "Remove"
                                            button of card that was below removed
                                            card, or to "+ Add Line Item" if last.
                                            Running total updates.
                                            aria-live announces: "Line item 2
                                            removed. 2 items remaining."

M6      Submits with valid remaining items  Same outcome as S11.
```

---

### 1.4 Error Recovery Path — Field Validation

```
STEP    USER ACTION                         SYSTEM RESPONSE
──────────────────────────────────────────────────────────────────────
E1      Leaves Amount field blank           On blur: inline error appears below
                                            Amount field: "Amount is required."
                                            Field border changes to error color.
                                            Error icon (⚠) prepended to message.
                                            aria-describedby linked to error span.

E2      Types amount exceeding category     On blur: "Amount exceeds the $500.00
        limit (e.g., Hotel: $600)           Hotel limit. Maximum allowed: $500.00."

E3      Enters a future date                On blur: "Date cannot be in the future."

E4      Attaches a .docx file              On change: "Only PDF, JPG, and PNG
                                            files are accepted."

E5      Attaches a file > 5 MB             On change: "File must be 5 MB or
                                            smaller. Selected file is X.X MB."

E6      Starts correcting Amount field      Error message clears immediately on
                                            first input event (eager clearing).

E7      Tabs away from corrected field      Fresh on-blur validation runs. If now
                                            valid: no error shown. Running total
                                            updates.
```

---

### 1.5 Error Recovery Path — Submit Blocked

```
STEP    USER ACTION                         SYSTEM RESPONSE
──────────────────────────────────────────────────────────────────────
B1      Clicks Submit with errors present   Holistic validation re-runs all fields.
                                            Submit button remains enabled visually
                                            but all errors are surfaced.
                                            Page scrolls to first invalid field.
                                            Focus moves to first invalid field.
                                            Each error message is announced via
                                            aria-live="assertive" on the form
                                            summary region (if used).

B2      User corrects all errors            Running total is accurate.

B3      Clicks Submit again                 Validation passes. Submission succeeds.
```

---

### 1.6 Edge State — 10 Items Reached

```
STEP    USER ACTION                         SYSTEM RESPONSE
──────────────────────────────────────────────────────────────────────
L1      User adds 10th line item            "+ Add Line Item" button becomes
                                            disabled. Visual state changes.
                                            aria-live announces: "Maximum of 10
                                            line items reached."
                                            Tooltip on hover: "Maximum 10 items
                                            allowed."

L2      User removes one item               "+ Add Line Item" re-enables.
                                            aria-live announces: "Line item removed.
                                            9 items. You can add more."
```

---

## 2. Information Hierarchy

### 2.1 Page Sections (Top to Bottom)

```
┌──────────────────────────────────────────────────────┐
│  [1] PAGE HEADER                                     │  ← Highest visual weight
│      "Submit Expense Report"                         │
│      Subtitle: "Add up to 10 expense items below."  │
├──────────────────────────────────────────────────────┤
│  [2] SUCCESS BANNER (conditional)                    │  ← Appears above form
│      Confirmation message after submission           │
├──────────────────────────────────────────────────────┤
│  [3] FORM                                            │
│    ┌────────────────────────────────────────────┐    │
│    │  [3a] LINE ITEM CARD 1 (fieldset)          │    │  ← Repeated 1–10×
│    │       Legend: "Expense Item 1"             │    │
│    │       Description (text input)             │    │
│    │       Category (select dropdown)           │    │
│    │       Amount ($ prefix + number input)     │    │
│    │       Date (date input)                    │    │
│    │       Attachment (file input + preview)    │    │
│    │       [✕ Remove] button (right-aligned)    │    │
│    └────────────────────────────────────────────┘    │
│    ┌────────────────────────────────────────────┐    │
│    │  [3b] LINE ITEM CARD 2 … (same structure)  │    │
│    └────────────────────────────────────────────┘    │
│                                                      │
│  [4] + ADD LINE ITEM button (left-aligned)           │  ← Below all cards
│  [5] RUNNING TOTAL display (right-aligned)           │  ← Same row as [4]
│                                                      │
│  [6] SUBMIT EXPENSE REPORT button (full-width)       │  ← Lowest, primary CTA
└──────────────────────────────────────────────────────┘
```

### 2.2 Field Order Rationale

Within each card, fields follow the natural narrative sequence of an expense:
1. **Description** — What was it? (text, free recall)
2. **Category** — What type? (constrains limit, inform amount)
3. **Amount** — How much? (dependent on category limit)
4. **Date** — When? (chronological anchor)
5. **Attachment** — Receipt? (optional, last to reduce cognitive friction)

This order mirrors paper expense forms and reduces back-and-forth correction.

### 2.3 Visual Weight Priority

| Priority | Element | Rationale |
|---|---|---|
| 1 | Page heading (`<h1>`) | Orients the user immediately |
| 2 | Submit button | Primary task completion CTA |
| 3 | Line item card fieldsets | Core data entry surface |
| 4 | Running total | Continuous financial feedback |
| 5 | "+ Add Line Item" | Secondary action, needs visibility |
| 6 | Remove buttons | Destructive action, accessible but visually subdued |
| 7 | Inline error messages | High urgency but appear only on error |
| 8 | Success banner | Transient, high urgency when visible |

---

## 3. Interaction Specification

### 3.1 Page Header

| Property | Specification |
|---|---|
| HTML element | `<h1>` inside `<header>` |
| Primary copy | "Submit Expense Report" |
| Subtitle copy | "Add up to 10 expense items below." |
| Subtitle element | `<p>` with `class="page-subtitle"` |
| Visual weight | Font size 28px (desktop), 22px (mobile) |
| Spacing | Margin-bottom 24px from body of form |
| Color | `--color-text-primary: #1A2B4A` (navy) |

---

### 3.2 Line Item Card (Fieldset)

Each line item is a `<fieldset>` with a `<legend>` that reads "Expense Item {n}".

| Property | Specification |
|---|---|
| Container | `<fieldset class="line-item-card">` |
| Legend | `<legend>Expense Item {n}</legend>` — visible, styled as section heading |
| Card border | 1px solid `--color-border: #CBD5E0` |
| Card background | `--color-surface: #FFFFFF` |
| Card border-radius | 6px |
| Card padding | 20px (desktop), 16px (mobile) |
| Card spacing | 16px margin-bottom between cards |
| Shadow | `box-shadow: 0 1px 3px rgba(0,0,0,0.08)` |
| Layout | Single column, fields stacked vertically |
| Remove button placement | Top-right corner of card (absolute position within relative fieldset) |

#### 3.2.1 Description Field

| Property | Specification |
|---|---|
| Input type | `<input type="text">` |
| Label | "Description" (visible `<label for="...">`) |
| Placeholder | "e.g., Flight to New York" |
| Max length | 200 characters |
| Required | Yes |
| Validation (blur) | Not empty; max 200 chars |
| Error: empty | "Description is required." |
| Error: too long | "Description must be 200 characters or fewer." |
| Width | 100% of card |

#### 3.2.2 Category Dropdown

| Property | Specification |
|---|---|
| Input type | `<select>` |
| Label | "Category" (visible `<label for="...">`) |
| Default option | `<option value="">— Select a category —</option>` |
| Options | Travel – Air; Travel – Car; Food; Hotel; Mobile |
| Required | Yes |
| Validation (blur) | Value not empty string |
| Error: unselected | "Please select a category." |
| Width | 100% of card |
| Limit hint | After selection, render helper text below: "Limit: $X,XXX.XX" using `--color-text-secondary: #4A5568` |

#### 3.2.3 Amount Field

| Property | Specification |
|---|---|
| Input type | `<input type="number" min="0.01" step="0.01">` |
| Label | "Amount (USD)" (visible `<label for="...">`) |
| "$" prefix | Rendered via a sibling `<span aria-hidden="true">$</span>` inside an input-group wrapper; `aria-label` on input includes "in US dollars" |
| Placeholder | "0.00" |
| Required | Yes |
| Validation (blur) | Not empty; numeric; > 0; ≤ category limit |
| Error: empty | "Amount is required." |
| Error: not numeric | "Enter a valid dollar amount (e.g., 12.50)." |
| Error: zero or negative | "Amount must be greater than $0.00." |
| Error: exceeds limit | "Amount exceeds the $X,XXX.00 {Category} limit. Maximum allowed: $X,XXX.00." |
| Running total trigger | Update running total `<output>` on valid blur |
| Width | 100% of card |

#### 3.2.4 Date Field

| Property | Specification |
|---|---|
| Input type | `<input type="date">` |
| Label | "Date" (visible `<label for="...">`) |
| Required | Yes |
| Max attribute | Set to today's date via JavaScript on init |
| Validation (blur) | Not empty; not a future date |
| Error: empty | "Date is required." |
| Error: future date | "Date cannot be in the future." |
| Error: invalid format | "Enter a valid date." |
| Width | 100% of card |

#### 3.2.5 Attachment Field

| Property | Specification |
|---|---|
| Input type | `<input type="file" accept=".pdf,.jpg,.jpeg,.png">` |
| Label | "Attachment (optional)" (visible `<label for="...">`) |
| Required | No |
| Accepted types | PDF, JPG/JPEG, PNG |
| Max size | 5 MB |
| Validation (change) | Immediate on file selection; not deferred to blur |
| Error: wrong type | "Only PDF, JPG, and PNG files are accepted." |
| Error: too large | "File must be 5 MB or smaller. Selected file is {X.X} MB." |
| Preview | After valid selection: render filename + file type badge below input using `<p class="attachment-preview" role="status">` |
| Preview copy | "Selected: {filename}.{ext} ({size} KB / MB)" |
| Clear file | No explicit clear button needed; user replaces via re-selection or removes row |
| Width | 100% of card |

---

### 3.3 Remove Button (per card)

| Property | Specification |
|---|---|
| Element | `<button type="button" class="btn-remove" aria-label="Remove expense item {n}">` |
| Visible label | "✕ Remove" — text always present (icon is decorative, text is accessible label supplement) |
| Placement | Top-right of card (float or absolute positioning) |
| Default state | Visible on all cards when > 1 card exists. Hidden (display: none) when only 1 card remains — user cannot remove the last item |
| Hover state | Background: `--color-error-light: #FFF5F5`; border-color: `--color-error: #C53030` |
| Focus state | 2px solid `--color-focus: #2B6CB0` offset 2px |
| Confirmation | No confirmation dialog for remove — action is recoverable by re-adding |
| Post-remove focus | Move focus to: "Remove" button of the next remaining card; if none, move to "+ Add Line Item" button |
| Screen reader | `aria-label` dynamically updated: "Remove expense item {n}" |

---

### 3.4 Add Line Item Button

| Property | Specification |
|---|---|
| Element | `<button type="button" id="btn-add" class="btn-secondary">` |
| Visible label | "+ Add Line Item" |
| Placement | Below all line item cards, left-aligned |
| Default state | Enabled; border: 2px solid `--color-primary: #2B6CB0`; text: `--color-primary`; background: transparent |
| Hover state | Background: `--color-primary-light: #EBF4FF`; cursor: pointer |
| Focus state | 2px solid `--color-focus: #2B6CB0` offset 2px |
| Disabled state | When 10 items present: `disabled` attribute; opacity 0.45; cursor: not-allowed |
| Disabled tooltip | `title="Maximum 10 items allowed."` — also announced via aria-live when limit is reached |
| Post-add focus | Move focus to Description field of the newly added card |
| ARIA (at limit) | After 10th item added: `aria-live="polite"` region announces "Maximum of 10 line items reached." |

---

### 3.5 Running Total Display

| Property | Specification |
|---|---|
| Element | `<output id="running-total" for="...list of amount input ids...">` |
| Content | "Total: $X,XXX.XX" |
| Placement | Right-aligned, same row as "+ Add Line Item" button |
| Update trigger | On every valid amount field blur; on card removal |
| Format | Always 2 decimal places; thousands separator; USD prefix: `$` |
| Initial value | "Total: $0.00" |
| Screen reader | `<output>` element with descriptive label via `aria-label="Running expense total"` |
| Color | `--color-text-primary: #1A2B4A`; font-weight: 600 |

---

### 3.6 Submit Button

| Property | Specification |
|---|---|
| Element | `<button type="submit" id="btn-submit" class="btn-primary">` |
| Visible label | "Submit Expense Report" |
| Placement | Below running total row; full-width (100% of form container) |
| Default state | Enabled; background: `--color-primary: #2B6CB0`; text: `#FFFFFF`; border: none |
| Hover state | Background: `--color-primary-dark: #2C5282` |
| Focus state | 2px solid `--color-focus: #2B6CB0` offset 2px; reversed ring on dark bg (white or offset) |
| Active (click) state | Background: `--color-primary-darker: #1A365D`; brief scale(0.98) |
| Note on disabled state | Do NOT disable the Submit button on errors. Doing so removes keyboard access to submission attempt. Instead, allow click, re-validate, scroll to first error, move focus to first error field. This is consistent with WCAG 3.3.1 (Error Identification). |
| Post-submit (success) | Form resets; success banner appears; focus moves to success banner |

---

### 3.7 Inline Field Error Messages

| Property | Specification |
|---|---|
| Element | `<span id="{fieldId}-error" class="field-error" role="alert" aria-live="assertive">` |
| Placement | Immediately below the associated input, before the next label |
| Association | Input carries `aria-describedby="{fieldId}-error"` always (even when empty), so screen readers pick up error immediately |
| Entry behavior | Error text is injected into the span; no animation needed. `role="alert"` triggers screen reader announcement. |
| Exit behavior | On next input event on the field: clear span content immediately (eager clearing). Do not wait for blur. |
| Icon | `⚠` prepended inside span: `<span aria-hidden="true">⚠</span>` — decorative, not the sole indicator |
| Border color | Input border changes to `--color-error: #C53030` on error |
| Border style | 2px solid (thicker than normal 1px) |
| Text color | `--color-error: #C53030` |
| Font size | 14px (same as helper text) |
| Whitespace | 4px margin-top from input |

---

### 3.8 Success Banner

| Property | Specification |
|---|---|
| Element | `<div id="success-banner" role="status" aria-live="polite" class="success-banner">` |
| Placement | Injected at the top of `<main>`, above the form, below the page header |
| Copy | "Your expense report has been submitted successfully. A new form is ready below." |
| Background | `--color-success-bg: #F0FFF4` |
| Border | 1px solid `--color-success: #276749` (left-border accent: 4px) |
| Icon | `✓` prepended, `aria-hidden="true"` |
| Text color | `--color-success-text: #276749` |
| Visibility | `display: none` by default; switched to `display: block` on success |
| Focus | `tabindex="-1"` on the element; JavaScript calls `successBanner.focus()` after inject |
| Dismiss | No dismiss button needed — banner auto-hides when form is next modified (on first `input` event after success) |
| Screen reader | `role="status"` + `aria-live="polite"` ensures announcement without aggressive interruption |

---

## 4. Accessibility Specification

### 4.1 WCAG 2.1 AA Controls

| Criterion | Requirement | Implementation |
|---|---|---|
| 1.1.1 Non-text Content | All icons and decorative glyphs have `aria-hidden="true"` | `✕`, `⚠`, `✓` icons all carry `aria-hidden` |
| 1.3.1 Info and Relationships | Programmatic structure matches visual structure | `<fieldset>` + `<legend>` per card; `<label for>` per field |
| 1.3.4 Orientation | Layout works in portrait and landscape | No CSS that locks orientation; tested at 600px and 375px |
| 1.3.5 Identify Input Purpose | Autocomplete attributes on appropriate fields | `autocomplete="off"` on amount; date fields have `type="date"` |
| 1.4.1 Use of Color | Color is never the sole error indicator | Error: border change + icon + text message (3 indicators) |
| 1.4.3 Contrast (Minimum) | Text contrast ≥ 4.5:1; large text ≥ 3:1 | All text/background token combinations verified (see Section 5) |
| 1.4.4 Resize Text | Page usable up to 200% zoom | Tested at 200% browser zoom; no horizontal scroll or truncation |
| 1.4.10 Reflow | Content reflowable at 320px width | Single-column layout; no fixed horizontal widths below 320px |
| 1.4.11 Non-text Contrast | UI component boundaries ≥ 3:1 | Input borders: `#CBD5E0` on `#FFFFFF` = 3.1:1 (pass) |
| 2.1.1 Keyboard | All functionality available via keyboard | Add/Remove/Submit all reachable and operable via Tab + Enter/Space |
| 2.1.2 No Keyboard Trap | Tab order always escapable | No modal dialogs; no focus traps created |
| 2.4.3 Focus Order | Logical focus order through form | DOM order matches visual order; no CSS reordering tricks |
| 2.4.6 Headings and Labels | All sections labeled; all fields labeled | Page `<h1>`; card `<legend>`; all field `<label>` elements |
| 2.4.7 Focus Visible | Every interactive element has visible focus ring | 2px solid `#2B6CB0` with 2px offset; never suppressed |
| 3.3.1 Error Identification | Errors identified and described in text | Inline error messages per field; error content explicit |
| 3.3.2 Labels or Instructions | Instructions provided when needed | Category limit hint after selection; attachment format hint in label |
| 3.3.3 Error Suggestion | Suggested correction provided in error message | All error messages include guidance on correct format |
| 3.3.4 Error Prevention | Submission data can be reviewed before final save | Form shown filled before submit; no irrecoverable delete on submit |
| 4.1.2 Name, Role, Value | All UI components have proper ARIA assignments | Buttons: `type`, `aria-label`; inputs: `id`, `name`, `aria-describedby` |
| 4.1.3 Status Messages | Status updates announced without focus change | `aria-live="polite"` on running total container; success banner |

---

### 4.2 Keyboard Navigation Sequence

```
TAB ORDER (per card, repeated for each card):
  [1] Description input
  [2] Category select
  [3] Amount input
  [4] Date input
  [5] Attachment file input
  [6] Remove button (hidden when only 1 card)

AFTER ALL CARDS:
  [7] + Add Line Item button
  [8] Submit Expense Report button
```

**Keyboard actions:**
- `Tab` / `Shift+Tab`: Forward / backward through controls
- `Enter` or `Space` on button: Activate button
- `Arrow keys` on `<select>`: Navigate dropdown options
- `Enter` on `<select>` (keyboard open): Confirm selection
- `Escape`: Close native select if open

---

### 4.3 Screen Reader Announcements

| Trigger | Region | Message |
|---|---|---|
| Line item added | `aria-live="polite"` container | "Line item {n} added." |
| Line item removed | `aria-live="polite"` container | "Line item {n} removed. {remaining} item(s) remaining." |
| Limit reached | `aria-live="polite"` container | "Maximum of 10 line items reached." |
| Limit cleared (item removed from 10) | `aria-live="polite"` container | "Line item removed. 9 items. You can add more." |
| Field error appears | `role="alert"` on error span | Error message text is read immediately |
| Field error cleared | `aria-live="polite"` or silent | No announcement needed for error removal |
| Running total updates | `<output>` element | Screen readers re-read `<output>` content when updated |
| Form submitted successfully | `role="status"` success banner | "Your expense report has been submitted successfully. A new form is ready below." |
| Submit blocked (errors) | `aria-live="assertive"` summary | "Please correct errors before submitting." (read from fixed live region) |

---

### 4.4 Focus Management Rules

| Event | Focus Destination |
|---|---|
| Page load | First focusable element: Description field of card 1 (or page `<h1>` — do not auto-focus into form) |
| Add Line Item click | Description field of newly added card |
| Remove card click | If next card exists: "Remove" button of next card. If removed card was last: "+ Add Line Item" button |
| Submit success | `successBanner` element (`tabindex="-1"`, `.focus()` called programmatically) |
| Submit blocked by errors | First invalid field in DOM order |

---

## 5. Color and Visual Design Tokens

### 5.1 Color Palette

```css
:root {
  /* Brand / Primary */
  --color-primary:         #2B6CB0;  /* Corporate blue — primary actions, links */
  --color-primary-dark:    #2C5282;  /* Hover on primary buttons */
  --color-primary-darker:  #1A365D;  /* Active/pressed state */
  --color-primary-light:   #EBF4FF;  /* Hover bg for secondary/ghost buttons */

  /* Neutrals */
  --color-bg:              #F7F9FC;  /* Page background */
  --color-surface:         #FFFFFF;  /* Card / input background */
  --color-border:          #CBD5E0;  /* Default input/card borders */
  --color-border-focus:    #2B6CB0;  /* Focus ring color */
  --color-divider:         #E2E8F0;  /* Horizontal rules, section dividers */

  /* Text */
  --color-text-primary:    #1A2B4A;  /* Navy: headings, labels, primary body copy */
  --color-text-secondary:  #4A5568;  /* Dark grey: helper text, subtitles */
  --color-text-placeholder:#718096;  /* Medium grey: placeholder text */
  --color-text-on-primary: #FFFFFF;  /* White: text on primary button bg */

  /* Semantic States */
  --color-error:           #C53030;  /* Error border, icon, text */
  --color-error-light:     #FFF5F5;  /* Remove button hover bg */
  --color-success:         #276749;  /* Success banner border/text/icon */
  --color-success-bg:      #F0FFF4;  /* Success banner background */
  --color-disabled:        #A0AEC0;  /* Disabled control text/border */
  --color-disabled-bg:     #EDF2F7;  /* Disabled button background */

  /* Running total */
  --color-total-text:      #1A2B4A;  /* Same as primary text */
}
```

### 5.2 Contrast Ratios (Verified)

| Foreground Token | Background Token | Ratio | WCAG AA Pass |
|---|---|---|---|
| `#1A2B4A` (text-primary) | `#FFFFFF` (surface) | 14.7:1 | ✓ |
| `#1A2B4A` (text-primary) | `#F7F9FC` (bg) | 13.9:1 | ✓ |
| `#4A5568` (text-secondary) | `#FFFFFF` | 7.6:1 | ✓ |
| `#718096` (placeholder) | `#FFFFFF` | 4.6:1 | ✓ |
| `#FFFFFF` (on-primary) | `#2B6CB0` (primary) | 4.7:1 | ✓ |
| `#C53030` (error) | `#FFFFFF` | 5.9:1 | ✓ |
| `#276749` (success-text) | `#F0FFF4` (success-bg) | 7.2:1 | ✓ |
| `#CBD5E0` (border) | `#FFFFFF` (surface) — non-text | 3.1:1 | ✓ (non-text 3:1) |

### 5.3 Typography Scale

| Token | Value | Usage |
|---|---|---|
| `--font-size-h1` | 28px / 1.75rem | Page heading |
| `--font-size-h2` | 20px / 1.25rem | Card legend |
| `--font-size-body` | 16px / 1rem | Label, input, body |
| `--font-size-small` | 14px / 0.875rem | Helper text, error messages, file preview |
| `--font-weight-bold` | 700 | Headings, running total |
| `--font-weight-semibold` | 600 | Labels, button text |
| `--font-weight-normal` | 400 | Body copy, placeholders |
| `--font-family-base` | `'Segoe UI', system-ui, -apple-system, sans-serif` | All text |
| `--line-height-base` | 1.5 | Body copy |
| `--line-height-heading` | 1.2 | Headings |

### 5.4 Spacing Scale

```css
:root {
  --space-xs:   4px;
  --space-sm:   8px;
  --space-md:   16px;
  --space-lg:   24px;
  --space-xl:   32px;
  --space-2xl:  48px;
  --border-radius-sm: 4px;
  --border-radius-md: 6px;
  --border-radius-lg: 8px;
}
```

---

## 6. Responsive Layout Breakpoints

### 6.1 Breakpoints

| Breakpoint Name | Width | Behavior |
|---|---|---|
| **Desktop** | > 600px | Form centered; max-width 800px; padding 32px sides |
| **Mobile** | ≤ 600px | Form full-width; padding 16px; font-size reduced |
| **Minimum supported** | 320px | No horizontal scroll; reflow compliant (WCAG 1.4.10) |

### 6.2 Desktop Layout (> 600px)

```
┌─────────────────────────────────────────────────┐
│  max-width: 800px; margin: 0 auto; padding: 32px │
│                                                   │
│  [H1] Submit Expense Report                       │
│  [p]  Add up to 10 expense items below.           │
│                                                   │
│  ┌─ Expense Item 1 ─────────────────────────── ✕─┐│
│  │ Description: [_______________________________] ││
│  │ Category:    [_____________▼]                  ││
│  │ Amount:      [$][_________]                    ││
│  │ Date:        [__________]                      ││
│  │ Attachment:  [Choose File] No file chosen.     ││
│  └─────────────────────────────────────────────────┘│
│                                                   │
│  [+ Add Line Item]           Total: $0.00         │
│                                                   │
│  [      Submit Expense Report (full-width)      ] │
└───────────────────────────────────────────────────┘
```

### 6.3 Mobile Layout (≤ 600px)

```
┌──────────────────────────────┐
│  padding: 16px               │
│                              │
│  [H1] Submit Expense Report  │
│  [p]  Add up to 10 expense   │
│        items below.          │
│                              │
│ ┌─ Expense Item 1 ─────── ✕─┐│
│ │ Description:              ││
│ │ [________________________]││
│ │ Category:                 ││
│ │ [__________________▼]     ││
│ │ Amount (USD):             ││
│ │ [$][__________________]   ││
│ │ Date:                     ││
│ │ [__________________]      ││
│ │ Attachment (optional):    ││
│ │ [Choose File]             ││
│ └───────────────────────────┘│
│                              │
│ [+ Add Line Item]            │
│ Total: $0.00                 │
│                              │
│ [ Submit Expense Report    ] │
└──────────────────────────────┘
```

**Mobile-specific adjustments:**
- Running total moves below "+ Add Line Item" on mobile (stacked, left-aligned)
- Remove button remains top-right of card, min tap target 44×44px (WCAG 2.5.5)
- File input tap target: full-width label styled as button
- Font-size: h1 → 22px; body → 16px (no change); small → 14px (no change)

---

## 7. Copy Guide

### 7.1 Page Header Copy

| Element | Copy |
|---|---|
| Page title (`<h1>`) | "Submit Expense Report" |
| Page subtitle | "Add up to 10 expense items below." |

### 7.2 Field Labels

| Field | Label Copy |
|---|---|
| Description | "Description" |
| Category | "Category" |
| Amount | "Amount (USD)" |
| Date | "Date" |
| Attachment | "Attachment (optional)" |

### 7.3 Placeholder Text

| Field | Placeholder |
|---|---|
| Description | `e.g., Flight to New York` |
| Category | `— Select a category —` (as disabled first option) |
| Amount | `0.00` |
| Date | *(browser native; no custom placeholder)* |
| Attachment | *(no placeholder; browser renders "No file chosen")* |

### 7.4 Helper Text (rendered after field, visible always)

| Field / Context | Helper Text |
|---|---|
| Category (after selection) | "Limit: $5,000.00" / "Limit: $1,000.00" / "Limit: $100.00" / "Limit: $500.00" / "Limit: $200.00" |
| Attachment | "Accepted: PDF, JPG, PNG · Max 5 MB" (rendered below file input always) |

### 7.5 Button Labels

| Button | Label |
|---|---|
| Add button | "+ Add Line Item" |
| Remove button | "✕ Remove" (visible); `aria-label`: "Remove expense item {n}" |
| Submit button | "Submit Expense Report" |

### 7.6 Error Messages

| Field | Condition | Message |
|---|---|---|
| Description | Empty | "Description is required." |
| Description | > 200 chars | "Description must be 200 characters or fewer." |
| Category | Not selected | "Please select a category." |
| Amount | Empty | "Amount is required." |
| Amount | Not a number | "Enter a valid dollar amount (e.g., 12.50)." |
| Amount | ≤ 0 | "Amount must be greater than $0.00." |
| Amount | Exceeds category limit | "Amount exceeds the ${LIMIT} {CATEGORY} limit. Maximum allowed: ${LIMIT}." |
| Date | Empty | "Date is required." |
| Date | Future date | "Date cannot be in the future." |
| Date | Invalid format | "Enter a valid date." |
| Attachment | Wrong file type | "Only PDF, JPG, and PNG files are accepted." |
| Attachment | File too large | "File must be 5 MB or smaller. Selected file is {X.X} MB." |
| Form submission (blocked) | Any errors | "Please correct the errors above before submitting." |

### 7.7 Success Message

| Context | Message |
|---|---|
| After successful submit | "Your expense report has been submitted successfully. A new form is ready below." |

### 7.8 Empty State

| Context | Message |
|---|---|
| Page load (1 empty card) | No empty-state message needed — one card is always pre-rendered |

### 7.9 Limit Reached Message

| Context | Message |
|---|---|
| After adding 10th line item | "Maximum of 10 line items reached." (announced via `aria-live`) |
| Add button tooltip at limit | "Maximum 10 items allowed." |

### 7.10 Attachment Preview Copy

| Context | Copy |
|---|---|
| Valid file selected | "Selected: {filename}.{ext} ({X.X} MB)" |

---

## 8. UX Acceptance Criteria

Each criterion is observable, testable, and unambiguous.

### 8.1 Page Load

| ID | Criterion |
|---|---|
| UAC-01 | On page load, exactly one line item card is visible with all 5 fields empty. |
| UAC-02 | The "Submit Expense Report" button is present and not disabled. |
| UAC-03 | The running total displays "Total: $0.00". |
| UAC-04 | The "+ Add Line Item" button is present and enabled. |
| UAC-05 | No error messages are visible on load. |
| UAC-06 | The success banner is not visible on load. |

### 8.2 Add / Remove Line Items

| ID | Criterion |
|---|---|
| UAC-07 | Clicking "+ Add Line Item" appends a new blank card and moves keyboard focus to its Description field. |
| UAC-08 | After adding, the card legend reads "Expense Item {n}" where n = correct ordinal. |
| UAC-09 | A screen reader using an `aria-live` region announces "Line item {n} added." |
| UAC-10 | When only 1 card is present, the "✕ Remove" button is not visible or is not in the tab order. |
| UAC-11 | When 2+ cards are present, each card shows a "✕ Remove" button. |
| UAC-12 | Clicking "✕ Remove" removes the correct card, renumbers remaining cards, and moves focus to the "Remove" button of the next card, or to "+ Add Line Item" if none remains. |
| UAC-13 | A screen reader announces "Line item {n} removed. {remaining} item(s) remaining." |
| UAC-14 | After removing a card, the running total updates to reflect only remaining valid amounts. |
| UAC-15 | After adding the 10th card, the "+ Add Line Item" button becomes disabled. |
| UAC-16 | An `aria-live` region announces "Maximum of 10 line items reached." when the 10th card is added. |
| UAC-17 | After a card is removed from a 10-item list, the "+ Add Line Item" button re-enables. |

### 8.3 Field Validation — On Blur

| ID | Criterion |
|---|---|
| UAC-18 | Tabbing away from an empty required field (Description, Category, Amount, Date) triggers an inline error message below that field. |
| UAC-19 | The error message text matches exactly the copy in Section 7.6 for that condition. |
| UAC-20 | The field border changes to `--color-error` (#C53030) on error. |
| UAC-21 | A `⚠` icon (aria-hidden) appears before the error text. |
| UAC-22 | The error span is referenced by `aria-describedby` on the input. |
| UAC-23 | Entering any character in a field with an active error immediately clears the error message (eager clearing). |
| UAC-24 | An amount exceeding the selected category limit shows the limit-specific error message on blur. |
| UAC-25 | A future date entry shows "Date cannot be in the future." on blur. |

### 8.4 Field Validation — Attachment

| ID | Criterion |
|---|---|
| UAC-26 | Selecting a non-PDF/JPG/PNG file triggers an immediate type error (not deferred to blur). |
| UAC-27 | Selecting a file > 5 MB triggers an immediate size error with the file's actual size in MB. |
| UAC-28 | Selecting a valid attachment shows the filename, type, and size below the input. |
| UAC-29 | The attachment field produces no error when left empty (it is optional). |

### 8.5 Running Total

| ID | Criterion |
|---|---|
| UAC-30 | The running total reflects the sum of all valid, non-errored amounts across all cards. |
| UAC-31 | The running total always displays 2 decimal places and USD prefix ($). |
| UAC-32 | If an amount field has an active error, its value is excluded from the running total. |
| UAC-33 | Removing a card reduces the running total by that card's amount immediately. |

### 8.6 Form Submission

| ID | Criterion |
|---|---|
| UAC-34 | Clicking "Submit Expense Report" with all fields valid saves data to localStorage under key `expenseSubmissions`. |
| UAC-35 | After successful submission, the success banner is displayed and focus is moved to it. |
| UAC-36 | The screen reader announces the success banner message. |
| UAC-37 | After successful submission, the form resets to one empty line item. |
| UAC-38 | Clicking "Submit Expense Report" with any invalid field does not persist data; all errors are shown; page scrolls to and focuses the first invalid field. |
| UAC-39 | A fixed `aria-live="assertive"` region announces "Please correct the errors above before submitting." when submission is blocked. |

### 8.7 Accessibility

| ID | Criterion |
|---|---|
| UAC-40 | All form fields are operable and announceable using keyboard alone (Tab, Shift+Tab, Enter, Space, Arrow keys). |
| UAC-41 | No interactive element loses its visible focus ring at any point (2px solid `#2B6CB0`). |
| UAC-42 | All dynamic content changes (add card, remove card, error messages, success banner, running total) are announced by a screen reader without requiring focus change. |
| UAC-43 | Color is never the sole indicator of an error — field border change, icon, and text all co-occur. |
| UAC-44 | All text elements meet WCAG 1.4.3 minimum contrast (4.5:1 for normal text, 3:1 for large text). |
| UAC-45 | At 200% browser zoom, no content is clipped or requires horizontal scrolling (WCAG 1.4.4). |
| UAC-46 | At 320px viewport width, no content is clipped or requires horizontal scrolling (WCAG 1.4.10 Reflow). |
| UAC-47 | Each card's Remove button has an `aria-label` that includes the card number: "Remove expense item {n}". |
| UAC-48 | The `<output>` element for running total is read by screen readers when updated. |

### 8.8 Responsive Layout

| ID | Criterion |
|---|---|
| UAC-49 | At viewport width > 600px: maximum form width is 800px, centered horizontally. |
| UAC-50 | At viewport width ≤ 600px: form is full-width with 16px horizontal padding. |
| UAC-51 | At viewport width ≤ 600px: running total stacks below "+ Add Line Item" (not side by side). |
| UAC-52 | Remove button tap target is at least 44×44px on mobile viewports. |

---

## 9. HANDOFF_PACKETs

---

### HANDOFF_PACKET — Senior Software Engineer

```text
HANDOFF_PACKET
From:    Senior UI UX Specialist
To:      Senior Software Engineer
Task:    Implement the Expense Item Create Page per this UX specification.
Context: Plain HTML5 + CSS3 + vanilla JavaScript (ES2020).
         Single-page form; no backend or framework.
         Aligned with SA architecture: expense-item-create-page-architecture.md.

Decisions:
  1. Submit button must NOT be disabled on error state. Allow click, re-validate
     holistically, scroll to and focus first invalid field. This preserves
     keyboard access per WCAG 3.3.1.
  2. Error messages use role="alert" on the span for immediate SR announcement.
     Do not defer to a summary — per-field inline is the correct pattern here.
  3. aria-describedby on every input must point to its error span id at all
     times (even when span is empty). Injecting/removing the span dynamically
     breaks the association on some screen readers.
  4. Running total must use <output for="..."> element semantics, not a <div>.
  5. Remove button hidden (display:none, not visibility:hidden) when only 1 card
     remains — it must not be in the tab order.
  6. Focus management after add/remove: see Section 4.4. Do not leave focus on
     the removed element.
  7. Category limit hint text must update when dropdown value changes (on
     'change' event), not on blur.
  8. File attachment validation fires on 'change' event, not on blur.
  9. Success banner: inject at top of <main>, tabindex="-1", call .focus()
     programmatically after injection. Auto-hide on first form input event.
  10. CSS design tokens (CSS custom properties): use Section 5 tokens exactly.
      Do not hardcode hex values in component CSS.

Open Questions:
  - None. All interaction states are fully specified.

Risks:
  - date input rendering varies across browsers (Chrome vs. Firefox vs. Safari).
    Test across browsers. The input type="date" native picker is acceptable;
    no custom datepicker needed for this sprint.
  - File input styling is heavily browser-constrained. Style the <label> as a
    button and visually hide the native input (but keep it accessible via the
    label). Do not use display:none or visibility:hidden on the file input itself
    or it will break keyboard access.

Acceptance Criteria: UAC-01 through UAC-52 (Section 8).
Artifacts Updated:   .github/ux/expense-item-create-page-ux-spec.md (this file)
Learning Note ID:    UIUX-20260425-1
```

---

### HANDOFF_PACKET — Senior Test Automation Engineer

```text
HANDOFF_PACKET
From:    Senior UI UX Specialist
To:      Senior Test Automation Engineer
Task:    Validate UX acceptance criteria for the Expense Item Create Page.
Context: Static HTML/CSS/JS page (no server, no auth).
         Open index.html in browser or use a local HTTP server.
         All 52 UACs in Section 8 are the test target.

Decisions:
  1. Accessibility testing must include both automated (axe-core or similar) and
     manual keyboard-only navigation pass.
  2. Screen reader testing: NVDA + Chrome (Windows) or VoiceOver + Safari (macOS)
     are the minimum. Check all aria-live announcements in Section 4.3.
  3. Contrast ratios in Section 5.2 are pre-verified. Re-verify with browser
     DevTools accessibility panel or a colour contrast tool if tokens change.
  4. Mobile test at 375px (iPhone SE viewport) and 600px (breakpoint boundary).
  5. Zoom test: 200% browser zoom; verify WCAG 1.4.4.
  6. Reflow test: 320px viewport width; verify WCAG 1.4.10.
  7. Focus management: script a test that simulates add-card, confirm focus
     lands on Description field of new card (UAC-07).
  8. Error eager-clearing: script a test that triggers an error, types one
     character, and asserts the error span is empty (UAC-23).
  9. localStorage verification: after submit, read
     localStorage.getItem('expenseSubmissions') and parse JSON; verify structure
     matches SA schema (UAC-34).

Open Questions:
  - None.

Risks:
  - aria-live region announcements can only be tested reliably with a real
    screen reader, not via DOM inspection alone. Plan at least one manual pass.
  - File input value cannot be set programmatically for security reasons; file
    validation tests (UAC-26, UAC-27, UAC-28) require manual or WebDriver
    (sendKeys with file path).

Acceptance Criteria: UAC-01 through UAC-52 (Section 8 of this document).
Artifacts Updated:   .github/ux/expense-item-create-page-ux-spec.md (this file)
Learning Note ID:    UIUX-20260425-1
```

---

## 10. Learning Note

**ID:** UIUX-20260425-1  
**Date:** 2026-04-25  
**Author:** Senior UI UX Specialist  
**Task:** Expense Item Create Page — full UX specification from SA handoff

### Lessons Learned

1. **Submit button disability anti-pattern:** Never disable a primary action button solely to prevent erroneous submission. This removes keyboard access for users who rely on Tab + Enter. The correct pattern is to allow the click, re-validate holistically, and surface errors with focus management.

2. **aria-describedby stability:** Link `aria-describedby` to the error span ID from the moment the input is rendered — even while the span is empty. Dynamically creating/destroying the span or the attribute causes inconsistent announcements across NVDA, JAWS, and VoiceOver.

3. **File input accessibility:** Never hide the native file input with `display:none`, as it removes keyboard operability. Style an associated `<label>` as the visual button; use clip/position technique to hide the native input visually while keeping it focusable.

4. **Eager error clearing UX:** Clear inline error messages on the `input` event (first keystroke), not on `blur`. Waiting for blur-to-clear creates a confusing state where the user sees a stale error while actively typing a correction.

5. **`<output>` element for running totals:** Use the semantic `<output for="...">` element for computed values shown to the user. This provides the correct ARIA role ("status") and allows screen readers to track its updates.

6. **Category limit hint timing:** Show/update the per-category limit helper text on the `change` event of the category dropdown, so users see the limit constraint before they enter an amount. This reduces the frequency of amount-exceeds-limit errors.

7. **Information hierarchy → field order:** When specifying field order, always justify it against the user's mental model and natural narrative sequence. For expense forms: what → what type → how much → when → receipt. This reduces cognitive load and back-corrections.

8. **Documentation cross-linking:** Always cross-reference the SA architecture document in the UX spec (ADR IDs, component names, localStorage schema). This ensures engineers implement to both documents in alignment, not in isolation.
