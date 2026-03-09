# app/history/page.tsx

## Purpose

History page — lists all past and in-progress workout sessions.

## Behaviour

- Fetches sessions on mount; shows `<LoadingSpinner />` while loading
- Displays a list of session cards with plan name, date, set count, duration, and status badge
- Empty state prompts the user to start their first workout
- Each session card links to `/history/[sessionId]` for full detail

## Used by

- `app/layout.tsx` (route `/history`)
