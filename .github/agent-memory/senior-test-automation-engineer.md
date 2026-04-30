# Senior Test Automation Engineer Learning Log

Use append-only notes with this format:

```text
ID: STAE-YYYYMMDD-<n>
Task:
Observation:
Hypothesis:
Outcome:
Action for Next Time:
```

---

```
ID: STAE-20260425-1
Task: Test strategy for Expense Item Create Page (HTML5/JS, localStorage, no backend).
Observation:
  - A single-source-of-truth constants file (constants.js) makes boundary tests
    extremely reliable: both production and test code derive limits from the same
    import. No risk of drift between UI and test fixture values.
  - The absence of a backend means all P0 tests rely on localStorage stubs.
    SecurityError and QuotaExceededError paths must be unit-tested via global
    stubs — they cannot be reliably triggered in E2E without controlled browser
    flags.
  - MIME type + file extension dual-check (validateAttachment) creates a subtle
    risk: if a browser reports an unexpected MIME for a valid extension (e.g.,
    old IE reporting "image/pjpeg" for JPG), the validator will reject it.
    Recommend broadening ALLOWED_MIME_TYPES or normalising MIME on input if
    additional browser targets are added.
  - Floating-point arithmetic: Math.round(n * 100) / 100 is a fragile pattern
    for financial rounding. It handles standard cases but fails for inputs like
    1.005 in some JS engines. Recommend switching to a decimal library or
    integer-cent arithmetic before adding a backend.
Hypothesis:
  The three-layer strategy (unit + integration + E2E) at 43 tests achieves
  sufficient coverage for a client-side-only MVP without over-investing in
  automation infrastructure that would be replaced when a backend is added.
Outcome: Confidence score 91/100. Conditional Go issued.
Action for Next Time:
  - Add axe-core to Playwright E2E suite at project outset — retrofitting is
    expensive and tends to be deferred indefinitely.
  - When localStorage is replaced by a real API, migrate storage unit tests to
    HTTP mock layer (MSW) at the same time to avoid orphaned stubs.
  - For financial amount validation, establish a "currency precision" policy
    at sprint 1 and encode it in constants.js alongside CATEGORY_LIMITS.
```
