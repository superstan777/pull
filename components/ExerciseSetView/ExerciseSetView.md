# ExerciseSetView

## Purpose

Full-screen view for logging a single set; renders either the "active" set state or the rest timer between sets.

## Props / API

- `ex`: the current `ExerciseLog` (name, sets array)
- `view`: `{ exerciseIndex, setIndex, phase }` — phase is `"active"` or `"rest"`
- `drawerOpen` / `drawerConfig`: controls `LogSetDrawer`; config is built by parent from last-logged values
- `onBack`: returns to `ExerciseListView`
- `onOpenDrawer`: parent opens the drawer when user taps "Done"
- `onTimerDone`: fires when rest timer completes or is skipped; parent advances to next set
- `onDrawerOpenChange`: syncs drawer open state back to parent
- `onConfirmSet`: receives `(weight, reps)` from `LogSetDrawer`; parent writes to Firestore

## Behaviour

- **Phase `"active"`**: shows set counter + previous sets (completed sets for this exercise only, up to current index); large "Done" button fixed to viewport bottom
- **Phase `"rest"`**: hides the set UI entirely and renders `RestTimer`; "Next: Set N of M" label shown above the timer
- `RestTimer` key is `exerciseIndex-setIndex` — guarantees a full remount (timer reset) each time a new set starts
- "Done" button is disabled if `currentSet` is already logged (prevents double-log)
- Previous sets table gives context at a glance — avoids the user needing to remember what they just lifted
- No `BottomNav` — this is a focused, distraction-free logging screen

## Used by

- `app/session/[sessionId]/page.tsx`
