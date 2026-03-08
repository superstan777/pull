# firebase

## Purpose

Initialises the Firebase app and exports `auth` and `db` singletons used across the codebase.

## Behaviour

- Initialisation is guarded by `hasConfig`: if any of `apiKey`, `authDomain`, or `projectId` env vars are absent, Firebase is **not** initialised and both exports are `null as any`
- The `null as any` cast is intentional — consumers (`useAuth`, `firestore.ts`) guard against `null` themselves; the cast avoids `null` check boilerplate everywhere
- Uses `getApps().length ? getApp() : initializeApp(...)` to prevent re-initialisation during Next.js hot-reload
- All six env vars are `NEXT_PUBLIC_*` — required at build time for client-side access

## Used by

- `lib/auth.ts`
- `lib/firestore.ts`
- `hooks/useAuth.ts`
