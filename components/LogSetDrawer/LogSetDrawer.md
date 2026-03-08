# LogSetDrawer

extends: components/ScrollPicker.md

## Purpose

Bottom-sheet drawer for logging a single set — weight and reps — using two side-by-side scroll pickers.

## Props / API

- `open` / `onOpenChange`: controlled drawer visibility
- `exerciseName`: displayed in the drawer header
- `setNumber` / `totalSets`: shown as "Set X of Y" subtitle
- `defaultWeight`: pre-selects the kg picker (carries forward the last logged weight for this exercise)
- `defaultReps`: pre-selects the reps picker (carries forward the last logged reps)
- `onConfirm`: receives `(weight: number, reps: number)` when the save button is tapped

## Behaviour

- `KG_ITEMS`: 401 values, 0–200 in 0.5 steps; integers rendered without decimal, halves as `"X.5"`
- `REPS_ITEMS`: 50 values, 1–50
- Picker state is local; default values are resolved once on mount via `useState` initialisers — changing `defaultWeight`/`defaultReps` after open does not reset pickers
- Confirm button label is live: **"Save — {weight} kg × {reps} reps"** so the user can verify before tapping
- `pb-[env(safe-area-inset-bottom)]` on `DrawerContent` prevents the button from hiding behind the iPhone home indicator

## Used by

- `app/session/[sessionId]/page.tsx`
