# app/history/[sessionId]/page.tsx

## Purpose
Session detail page. Read-only view of a completed or in-progress workout session.

## Behaviour
- Fetches the session by ID for the authenticated user on mount
- While loading, renders `<LoadingSpinner />` (centered spinner, replaces skeleton)
- Shows session metadata: plan name, status badge, start/finish dates, and duration
- Lists each exercise with its sets (weight, reps, logged indicator)
- Logged sets are shown at full opacity; unlogged sets at reduced opacity
- Back button returns to the history list
- No bottom navigation (detail page)

## Used by
Route `/history/[sessionId]`
