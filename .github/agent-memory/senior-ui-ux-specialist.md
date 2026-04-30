# Senior UI UX Specialist Learning Log

Use append-only notes with this format:

```text
ID: UIUX-YYYYMMDD-<n>
Task:
Observation:
Hypothesis:
Outcome:
```

---

## UIUX-20260425-1

```text
ID:          UIUX-20260425-1
Date:        2026-04-25
Task:        Expense Item Create Page — full UX specification from SA handoff

Observation: Eight patterns emerged as high-value and non-obvious during
             this specification exercise.

1. Submit button disability anti-pattern: Disabling the submit button on
   error state removes keyboard access. Correct pattern: allow click,
   re-validate holistically, move focus to first error field.

2. aria-describedby stability: Wire aria-describedby from the moment the
   input renders (even to an empty span). Dynamic wiring/unwiring causes
   inconsistent SR announcements across NVDA / JAWS / VoiceOver.

3. File input accessibility: Never hide native file input via display:none.
   Use clip/position technique on the input; style the associated <label>
   as the visual button.

4. Eager error clearing: Clear inline errors on the 'input' event (first
   keystroke), not on blur. Blur-to-clear leaves a confusing stale error
   visible while the user corrects.

5. <output> element: Use semantic <output for="..."> for running totals
   and computed values. Provides ARIA role="status" and SR tracking.

6. Category limit hint timing: Show limit hint on dropdown 'change' event,
   before the user enters an amount. Reduces limit-exceeded error frequency.

7. Field order justification: Always tie field order to the user's natural
   narrative sequence (what → type → amount → when → receipt). Reduces
   cognitive load and back-corrections.

8. Cross-document alignment: Explicitly reference SA architecture ADR IDs
   in the UX spec. Prevents engineers implementing each document in isolation.

Hypothesis: Applying these patterns consistently across all future multi-field
            forms will reduce error-recovery failure rates.

Outcome:     Full UX spec delivered to .github/ux/expense-item-create-page-ux-spec.md.
             52 UACs defined. HANDOFF_PACKETs issued to Software Engineer and
             Test Automation Engineer.
```
Action for Next Time:
```
