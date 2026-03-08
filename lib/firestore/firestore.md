# firestore

## Purpose

All Firestore read/write operations for sessions; the single data-access layer for the app.

## API

- `createSession(uid)`: creates a new session document pre-populated from `MOCK_PLAN`; returns the new session ID
- `getActiveSession(uid)`: fetches the most recent session without a `finishedAt` timestamp (one-time read, newest-first)
- `subscribeToSession(uid, sessionId, onData, onError)`: real-time `onSnapshot` listener; returns the unsubscribe function
- `logSet(uid, sessionId, exerciseIndex, setIndex, weight, reps, currentExercises)`: writes the full `exercises` array back to Firestore with the target set updated; returns the updated array for optimistic UI
- `finishSession(uid, sessionId)`: sets `finishedAt` to `serverTimestamp()`
- `getSession(uid, sessionId)`: one-time fetch of a single session document
- `getSessions(uid)`: fetches all sessions ordered by `startedAt` descending

## Behaviour

- Data path: `users/{uid}/sessions/{sessionId}` — all session data is scoped per user
- `logSet` uses a full array replace (not `arrayUnion`) because Firestore doesn't support updating nested array elements by index; caller must pass the current `exercises` snapshot
- `Timestamp.now()` (client-side) is used for `loggedAt` on individual sets; `serverTimestamp()` is used for `startedAt`/`finishedAt` to avoid clock skew on session-level timestamps

## Used by

- `lib/firestore.ts` exports are consumed by `hooks/useSession.ts`, `app/session/[sessionId]/page.tsx`, `app/history/page.tsx`, `app/history/[sessionId]/page.tsx`, `app/page.tsx`
