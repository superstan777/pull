# app/page.tsx

## Purpose

Home page — shows an active session card (if one exists) or a "Start Workout" button.

## Behaviour

- Logs `"home"` to the console on mount
- Fetches active session on mount; shows `<LoadingSpinner />` while loading
- If an active session exists, displays plan name, start time, and set progress with a "Continue Workout" button
- If no active session, displays a "Start Workout" button that creates a new session and navigates to it
- Sign-out button in the header; phone number shown on larger screens
- History navigation is accessible via `BottomNav` only (inline link removed)

## Used by

- `app/layout.tsx` (route `/`)
