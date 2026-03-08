# utils

## Purpose

`cn()` utility — merges Tailwind class names with conflict resolution.

## Behaviour

- Combines `clsx` (conditional/array class handling) with `tailwind-merge` (removes conflicting Tailwind utilities, e.g. `p-2 p-4` → `p-4`)
- Shadcn/ui convention — all components use `cn()` for className composition

## Used by

- All components that conditionally apply Tailwind classes
