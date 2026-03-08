# AuthGuard

## Purpose

Wraps authenticated pages; redirects unauthenticated users to `/login` and shows a loading state during auth resolution.

## Props / API

- `children`: page content rendered only when a valid Firebase user is present

## Behaviour

- Renders a pulsing "Loading…" text while `useAuth` resolves (prevents flash of protected content)
- Uses `router.replace("/login")` — no entry is added to browser history so the user cannot back-navigate into a protected page
- Returns `null` in the window between `redirect` being triggered and navigation completing — avoids a brief flash of children
- Safe to use at page level; does not render `BottomNav` or any chrome

## Used by

- `app/page.tsx`
- `app/history/page.tsx`
- `app/history/[sessionId]/page.tsx`
- `app/session/[sessionId]/page.tsx`
