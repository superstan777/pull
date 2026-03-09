# app/session/[sessionId]/page.tsx

## Purpose

Active workout session page — lets the user log sets for each exercise in real time.

## Behaviour

- Loads session via `useSession` hook; shows `<LoadingSpinner />` while loading
- Switches between `ExerciseListView` (overview) and `ExerciseSetView` (per-set logging)
- Optimistic UI: local state updated immediately, Firestore synced in background
- Rest timer shown between sets; auto-advances to next set when timer completes
- "Finish Workout" writes `finishedAt` to Firestore and redirects to history detail

## Used by

- `app/page.tsx` (navigated to on session start or continue)
