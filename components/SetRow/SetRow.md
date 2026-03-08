# SetRow

## Purpose

Inline editable row for a single set (weight + reps + log button) used in the read-only history view.

## Behaviour

- **Deprecated in the active session flow** — replaced by `LogSetDrawer` + step-by-step navigation
- Still used in `app/history/[sessionId]/page.tsx` for read-only display of past sessions
- Optimistic UI: row dims (`opacity-60`) immediately on tap; reverts on Firestore error
- Log button disabled for 200ms after tap to prevent double-submission
- On focus, the row scrolls itself into view (`scrollIntoView center`) so the keyboard doesn't cover it
- Uses `type="text" inputMode="decimal|numeric"` — never `type="number"` (avoids mobile stepper spinners)

## Used by

- `components/ExerciseCard.tsx`
