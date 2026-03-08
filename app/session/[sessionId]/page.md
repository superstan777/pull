# app/session/[sessionId]/page.tsx

## Purpose
Active workout session page. The main screen used during a workout.

## Behaviour
- Uses `useSession` hook to subscribe to live session data
- While loading, renders `<LoadingSpinner />` (centered spinner, replaces skeleton)
- Two views controlled by local state:
  - **List view** (`ExerciseListView`): shows all exercises and set progress; allows selecting an exercise to log
  - **Exercise view** (`ExerciseSetView`): focused view for a single set with rest timer and log-set drawer
- Optimistic UI: local state updated immediately, Firestore synced in background
- Tracks last logged weight/reps per exercise as drawer defaults
- Finish session button navigates to session detail on success
- All errors surfaced via `toast.error`

## Used by
Route `/session/[sessionId]`
