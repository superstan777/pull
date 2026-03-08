# useAuth

## Purpose

Subscribes to Firebase auth state and exposes the current user with a loading flag.

## API

Returns `{ user: User | null, loading: boolean }`

## Behaviour

- `loading` starts `true` and becomes `false` after the first `onAuthStateChanged` callback fires — consumers must gate renders on `loading` to avoid flashing unauthenticated UI
- Guards against missing Firebase config: if `auth` is `null` (env vars absent at build time), sets `loading = false` immediately and skips subscription — prevents SSR crashes
- Unsubscribes from `onAuthStateChanged` on unmount

## Used by

- `components/AuthGuard.tsx`
- `app/login/page.tsx`
