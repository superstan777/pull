# BottomNav

## Purpose

Persistent bottom navigation bar with Home and History tabs.

## Behaviour

- Active state uses **exact match** for `/` and **prefix match** for `/history` — prevents Home being active on all routes
- Fixed to viewport bottom; respects `env(safe-area-inset-bottom)` for iPhone home indicator
- Not rendered on session pages (`/session/...`) — those pages have their own header/back navigation
- Each link is `min-h-14` (56px) to meet the 48px+ touch-target requirement with margin

## Used by

- `app/layout.tsx` (conditionally, based on route)
