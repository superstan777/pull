# Prompt: Write Component & Hook Documentation (.md files)

## Context

This is a phone-first workout logging app. Full spec: `docs/prompts/INIT_PROMPT.md`.
Agent conventions: `.github/copilot-instructions.md`.

`.md` files are **mandatory** on this project — CI blocks merge if a changed `.tsx`/`.ts` has
no corresponding `.md` update. They are not API mirrors of the source code. Their purpose is
to capture _why_ things are built the way they are: UX constraints, non-obvious behaviours,
design decisions. As the project grows (workout creator, AI, trainer portal, chat), these files
are the primary context layer for Copilot Agent to navigate the codebase accurately without
reading every file from scratch.

Documentation inheritance model: the first component that establishes a pattern is the
canonical reference. Subsequent components of the same type use `extends:` pointing to
that component's `.md`.

---

## Your Task

Create a `.md` file co-located with every component and hook listed below.

### Rules

- Keep each file **under 40 lines** — no padding, no restating the obvious
- Describe **intent and non-obvious behaviour** — not what the code already shows clearly
- `extends:` is required when a component builds on another component's pattern
- `## Used by` lists direct consumers only (check actual imports in the codebase)
- Do not copy-paste prop types from TypeScript — describe them in plain English

---

## Files to Document

### Components

**`components/ScrollPicker/ScrollPicker.md`** ← establishes the scroll-picker pattern

**`components/LogSetDrawer/LogSetDrawer.md`**

- extends: `components/ScrollPicker/ScrollPicker.md`

**`components/RestTimer/RestTimer.md`** ← establishes the countdown-timer pattern

**`components/ExerciseCard/ExerciseCard.md`**

**`components/SetRow/SetRow.md`**

**`components/AuthGuard/AuthGuard.md`**

**`components/BottomNav/BottomNav.md`**

**`components/SessionSummary/SessionSummary.md`**

**`components/PhoneLoginForm/PhoneLoginForm.md`** ← establishes the auth-form pattern

**`components/OtpForm/OtpForm.md`**

- extends: `components/PhoneLoginForm/PhoneLoginForm.md`

**`components/ExerciseListView/ExerciseListView.md`**

**`components/ExerciseSetView/ExerciseSetView.md`**

### Hooks

**`hooks/useAuth.md`** ← establishes the firebase-listener hook pattern

**`hooks/useSession.md`**

- extends: `hooks/useAuth.md`

---

## Required Structure for Each File

```md
# ComponentName

extends: path/to/parent.md ← omit if no parent

## Purpose

One sentence. What problem does this solve?

## Props / API

- propName: plain-English description (include type only when not obvious)

## Behaviour

- Bullet list of non-obvious behaviours, edge cases, constraints

## Used by

- ComponentName or PageName
```

---

## Key Behaviours to Capture (reference while writing)

**ScrollPicker**

- ITEM_H = 44px, VISIBLE = 5, scroll-snap mandatory y-axis
- Selection highlight band sits in DOM before the scroll container so text renders above it
- `busy` ref prevents external `value` syncing while user is actively scrolling
- Fade gradients use CSS `--background` variable so they work in dark mode

**LogSetDrawer**

- KG_ITEMS: 0–200 step 0.5 (401 items), REPS_ITEMS: 1–50 (50 items)
- Default weight/reps come from `lastWeight`/`lastReps` tracked per exercise in parent
- Confirm button label is live: "Save — {weight} kg × {reps} reps"

**RestTimer**

- Fixed 90 second duration (DURATION constant)
- SVG arc drawn with `strokeDashoffset` — circle rotated -90° to start from top
- `onDone` fires 400ms after countdown hits 0 (user sees 0:00 briefly)
- Timer restarts when `key` prop changes (parent uses `exerciseIndex-setIndex` as key)

**ExerciseCard**

- Shows logged/total count in card header
- Passes exerciseIndex down to SetRow (needed for Firestore path)

**SetRow** (deprecated in new session flow — kept for history view only)

- Was used in old flat session view, replaced by LogSetDrawer + step-by-step flow
- Still used in `app/history/[sessionId]/page.tsx` read-only view

**AuthGuard**

- Renders loading spinner during auth resolution
- Redirects to `/login` using `router.replace` (no back-history entry)
- Renders `null` briefly between redirect trigger and navigation

**BottomNav**

- Active state: exact match for `/`, prefix match for `/history`
- Does not render on session pages (session page has its own header/back nav)

**useAuth**

- Returns `loading: true` until Firebase `onAuthStateChanged` fires
- Safe during SSR: checks `if (!auth)` before subscribing (auth is null when env vars missing)

**useSession**

- Subscribes to Firestore `onSnapshot` — real-time updates
- Unsubscribes on unmount or when uid/sessionId changes
- Does not write — read-only hook
