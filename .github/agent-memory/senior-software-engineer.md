# Senior Software Engineer Learning Log

Use append-only notes with this format:

```text
ID: SSE-YYYYMMDD-<n>
Task:
Observation:
Hypothesis:
Outcome:
Action for Next Time:
```

```text
ID: SSE-20260425-1
Task: Implement Expense Item Create Page (index.html, styles.css, constants.js,
      validator.js, storage.js, form.js) from architecture and UX specifications.

Observation:
  The data-tmpl-* attribute pattern in the <template> element requires careful
  coordination between HTML template markup and JS cloning logic. The
  aria-describedby rewriting must handle BOTH the error span (appended on error)
  and the hint span (set at clone time) to avoid overwriting one with the other.
  Using append-style aria-describedby management (add/remove individual IDs
  rather than replace) solves this cleanly.

Hypothesis:
  Using textContent exclusively for all user-supplied data output (never
  innerHTML) is the correct security discipline for a localStorage-backed
  form where description content is later re-rendered from stored data.

Outcome:
  Delivered 6 production-ready files. Key security controls implemented:
  textContent-only rendering, sanitizeFileName stripping path separators,
  file content never stored, try/catch on all localStorage calls with
  quarantine-on-corruption fallback.

Action for Next Time:
  When using <template> cloning with multiple aria cross-references
  (hint span + error span both referenced by one input), define the
  aria-describedby management strategy BEFORE coding so
  showFieldError/clearFieldError are written correctly from the start.
  Append-style management (not replace-style) is always safer.
```
