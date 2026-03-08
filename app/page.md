# Home Page (app/page.tsx)

## Purpose

Main entry point for authenticated users. Shows either an active session card or a "Start Workout" button.

## Behaviour

- Protected by `AuthGuard` — redirects unauthenticated users to `/login`
- On load, fetches the user's active session from Firestore
- While loading, displays a centered `LoadingSpinner`
- If an active session exists, shows a card with session details and a "Continue Workout" button
- If no active session, shows a "Start Workout" button that creates a new session and navigates to it
- Sign-out button in header calls `signOut()` and redirects to `/login`
- History navigation is available via the `BottomNav` tab (no inline link)

## Used by

- Root route `/`
