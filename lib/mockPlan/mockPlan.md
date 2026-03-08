# mockPlan

## Purpose

Hardcoded workout plan used as the sole session template until a workout creator is built.

## Behaviour

- `MOCK_PLAN` is a plain object — not fetched from Firestore; changing it only affects **new** sessions, not existing ones
- `firestore.ts` calls `buildInitialExercises()` (internal) to expand each exercise's `sets` count into `SetLog` rows when creating a session
- Replace this with a Firestore-backed plan lookup once the workout creator milestone ships

## Used by

- `lib/firestore.ts`
