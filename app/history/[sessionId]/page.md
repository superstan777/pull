# app/history/[sessionId]/page.tsx

## Purpose

Session detail page — shows full breakdown of a single workout session.

## Behaviour

- Fetches session by ID on mount; shows `<LoadingSpinner />` while loading
- Displays session metadata (plan name, start time, finish time, duration, status badge)
- Lists each exercise with its sets, weight, reps, and logged status
- "Session not found" message if the ID does not resolve

## Used by

- `app/history/page.tsx` (linked from session list items)
