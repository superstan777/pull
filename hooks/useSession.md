# useSession

extends: hooks/useAuth.md

## Purpose

Real-time Firestore subscription for a single session document.

## API

Takes `(uid: string | null, sessionId: string | null)` and returns `{ session: Session | null, loading: boolean }`

## Delta from useAuth

- Subscribes via `subscribeToSession` (Firestore `onSnapshot`) instead of `onAuthStateChanged`
- Accepts nullable `uid`/`sessionId`; resolves immediately with `loading = false` when either is absent
- Re-subscribes whenever `uid` or `sessionId` changes; previous listener is cleaned up before the new one attaches
- Read-only — does not write to Firestore

## Used by

- `app/session/[sessionId]/page.tsx`
- `app/history/[sessionId]/page.tsx`
