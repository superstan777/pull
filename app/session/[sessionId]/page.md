# Session Page (app/session/[sessionId]/page.tsx)

## Purpose

Active workout session view — lets users log sets for each exercise.

## Behaviour

- Protected by `AuthGuard`
- Receives `sessionId` via dynamic route params
- Uses `useSession` hook to load session data; shows `LoadingSpinner` while loading
- Switches between two sub-views via `ViewState`:
  - `list`: `ExerciseListView` — overview of all exercises
  - `exercise`: `ExerciseSetView` — logging a specific set, with rest timer
- Optimistic UI: local state updated immediately, Firestore write happens in background
- On Firestore write failure, rolls back to previous local state with a toast error
- "Finish Workout" calls `finishSession` and navigates to `/history/[sessionId]`

## Used by

- Route `/session/[sessionId]`
