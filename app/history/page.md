# History Page (app/history/page.tsx)

## Purpose

Lists all of the authenticated user's past and in-progress workout sessions.

## Behaviour

- Protected by `AuthGuard`
- Fetches sessions via `getSessions(user.uid)` on mount
- While loading, displays a centered `LoadingSpinner`
- If no sessions exist, shows an empty-state message with a link to start the first workout
- Each session is rendered as a tappable list item linking to `/history/[sessionId]`
- Badges indicate session status: "Done" or "In Progress"
- Shows date, sets logged, and duration where available

## Used by

- Route `/history`
