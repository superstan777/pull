# LoadingSpinner

## Purpose

Centered spinner for full-page loading states. Replaces skeleton pulse animations.

## Props

None

## Behaviour

- Centered vertically and horizontally with `min-h-[200px]` to ensure proper centering on small screens
- Classic rotating border spinner using Tailwind's `animate-spin`
- 48px diameter (`h-12 w-12`)

## Used by

- app/page.tsx
- app/history/page.tsx
- app/history/[sessionId]/page.tsx
- app/session/[sessionId]/page.tsx
