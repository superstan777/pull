# ExerciseListView

## Purpose

Full-screen list of all exercises in a session; the landing view a user sees when a workout starts or when they navigate back from a set.

## Props / API

- `session`: used for the plan name in the header
- `exercises`: live array of `ExerciseLog`; drives completion state per row
- `loggedSets` / `totalSets`: pre-computed by parent for the header subtitle
- `allDone`: when `true`, reveals the sticky "Finish Workout" CTA above `BottomNav`
- `finishing`: disables the finish button while the Firestore write is in-flight
- `onSelectExercise`: called with `(exerciseIndex, setIndex)` — parent drives navigation to `ExerciseSetView`
- `onFinish`: triggers session completion

## Behaviour

- Tapping an exercise card jumps to the **first incomplete set** (`firstIncompleteSet` helper), not always set 0 — resumes mid-exercise after navigating back
- Completed exercises are `opacity-50` and `disabled`; tapping them does nothing
- Progress subtitle per card: shows "Set N of M" for started exercises, "M sets" for untouched, "Done" when complete
- "Finish Workout" floats above `BottomNav` (`bottom-16`) only when `allDone` — avoids premature finish taps
- `BottomNav` is rendered here (not on `ExerciseSetView`) — session still feels part of the main app shell

## Used by

- `app/session/[sessionId]/page.tsx`
