# app/history/page.tsx

## Purpose
History list page. Displays all past and in-progress workout sessions for the authenticated user.

## Behaviour
- Fetches all sessions for the authenticated user on mount
- While loading, renders `<LoadingSpinner />` (centered spinner, replaces skeleton)
- Empty state shown when the user has no sessions
- Each session shows plan name, status badge (Done / In Progress), date, sets logged, and duration
- Tapping a session navigates to its detail page
- Bottom navigation via `<BottomNav />`

## Used by
Route `/history`
