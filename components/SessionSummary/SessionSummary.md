# SessionSummary

## Purpose

Read-only summary block showing plan name, status badge, date, duration, and set completion count for a session.

## Props / API

- `session`: full `Session` object from Firestore

## Behaviour

- Logged/total set counts are computed by reducing across all exercises (`loggedAt !== null`)
- Duration is derived from `startedAt` and `finishedAt` Firestore timestamps — not shown if `finishedAt` is absent (session in progress)
- Shows "In Progress" badge when `finishedAt` is null, "Finished" otherwise
- Pure display component — no state, no writes

## Used by

- `app/history/page.tsx`
- `app/history/[sessionId]/page.tsx`
