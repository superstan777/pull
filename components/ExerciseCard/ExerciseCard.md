# ExerciseCard

## Purpose

Card displaying a single exercise and all its set rows; used in the legacy flat session view and history.

## Props / API

- `exercise`: `ExerciseLog` data (name + array of sets)
- `exerciseIndex`: position in the session's exercise array — threaded down to `SetRow` for Firestore writes
- `onLog`: async callback `(exerciseIndex, setIndex, weight, reps)` that writes to Firestore

## Behaviour

- Header shows logged/total count (e.g. "2/4") computed locally from `loggedAt !== null`
- Delegates all set-level interaction to `SetRow`; is itself stateless

## Used by

- `app/history/[sessionId]/page.tsx`
