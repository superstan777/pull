# app/page.tsx

## Purpose
Home page. Shows the user's active workout session or a "Start Workout" button when no session is in progress.

## Behaviour
- Fetches the active session for the authenticated user on mount
- While loading, renders `<LoadingSpinner />` (centered spinner, replaces skeleton)
- If an active session exists, shows session info (plan name, start time, sets progress) with a "Continue Workout" button
- If no active session, shows a "Start Workout" button that creates a new session and navigates to it
- Sign-out button in the sticky header
- Bottom navigation via `<BottomNav />`
- History navigation is accessible via `BottomNav` only (inline "View History" link removed)

## Used by
Root route `/`
