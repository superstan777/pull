# Session Detail Page (app/history/[sessionId]/page.tsx)

## Purpose

Displays a read-only summary of a completed or in-progress workout session, including all exercises and sets logged.

## Behaviour

- Protected by `AuthGuard`
- Receives `sessionId` via dynamic route params
- Fetches session data via `getSession(user.uid, sessionId)` on mount
- While loading, displays a centered `LoadingSpinner`
- If session is not found, shows a "Session not found" message
- Shows session metadata: plan name, status badge, start/finish times, duration
- Lists each exercise with per-set details (weight, reps, logged indicator)

## Used by

- Route `/history/[sessionId]`
