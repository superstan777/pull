# Init Prompt – Training Notes App (MVP)

## Project Overview

Build a **phone-first training notes web application** using **Next.js 15 (App Router)**, **shadcn/ui**, and **Firebase**. The app is **used exclusively on a mobile phone, at the gym, during a workout** — with sweaty hands, bright lighting, and under time pressure between sets. Every design and implementation decision must reflect this real-world context.

The app allows a user to log workout sessions: for each exercise in a predefined plan, the user records the number of reps and the weight used per set.

This is an **alpha/MVP build for a single user**. The architecture must be forward-compatible with:

- A full plan creator (custom exercises, number of sets) — added later
- Progress charts and statistics — added later (collect all necessary data now)

---

## Tech Stack

| Layer         | Technology                               |
| ------------- | ---------------------------------------- |
| Framework     | Next.js 15 (App Router, TypeScript)      |
| UI Components | shadcn/ui (Tailwind CSS)                 |
| Backend / DB  | Firebase (Firestore + Authentication)    |
| Auth method   | Firebase Phone Authentication (SMS only) |
| Deployment    | Vercel (optional, mention in README)     |

---

## Authentication

- **SMS-only login** via Firebase Phone Authentication.
- Show a phone number input field + OTP confirmation step.
- Use `firebase/auth` with `RecaptchaVerifier` (invisible recaptcha).
- After login, the user is redirected to the main app.
- Protect all routes — unauthenticated users are redirected to `/login`.
- Store `uid` from Firebase Auth; all Firestore documents are scoped to `uid`.

---

## Mock Training Plan (Hardcoded for MVP)

The training plan is a static constant — **no UI to edit it in MVP**.

```ts
// lib/mockPlan.ts
export const MOCK_PLAN = {
  id: "mock-plan-v1",
  name: "Push Day",
  exercises: [
    { id: "ex-1", name: "Bench Press", sets: 2 },
    { id: "ex-2", name: "Lateral Raises", sets: 2 },
    { id: "ex-3", name: "Lat Pulldown", sets: 2 },
  ],
};
```

> The data model must support variable number of sets per exercise so the future plan creator can reuse the same schema without migration.

---

## Firestore Data Model

```
users/{uid}/
  sessions/{sessionId}/
    planId:       string         // "mock-plan-v1" for now
    startedAt:    Timestamp
    finishedAt:   Timestamp | null
    exercises:    ExerciseLog[]

ExerciseLog {
  exerciseId:   string           // matches plan exercise id
  exerciseName: string           // denormalized for display
  sets: SetLog[]
}

SetLog {
  setNumber:  number             // 1-based
  reps:       number | null      // null = not yet logged
  weight:     number | null      // kg, null = not yet logged
  loggedAt:   Timestamp | null
}
```

> Storing `exerciseName` as a denormalized field ensures history displays correctly even if plan names change in the future.

---

## Application Routes

| Route                  | Description                                     |
| ---------------------- | ----------------------------------------------- |
| `/login`               | Phone number input + OTP verification           |
| `/`                    | Home — active session or "Start Workout" button |
| `/session/[sessionId]` | Active workout logging screen                   |
| `/history`             | List of past sessions (most recent first)       |
| `/history/[sessionId]` | Read-only detail view of a completed session    |

---

## Page & Feature Specifications

### `/login`

- Two-step form: (1) enter phone number with country prefix selector, (2) enter 6-digit OTP.
- Invisible reCAPTCHA attached to the submit button.
- Show loading states and error messages (e.g. wrong OTP, too many attempts).
- After successful login, redirect to `/`.

---

### `/` — Home

- If there is an **active (unfinished) session**: show a "Continue Workout" card with the session start time and a progress summary (X of Y sets logged). Clicking navigates to `/session/[sessionId]`.
- If no active session: show a "Start Workout" button. On click, create a new session document in Firestore using `MOCK_PLAN` and redirect to `/session/[sessionId]`.
- Show a "View History" link to `/history`.
- Show user phone number and a "Sign Out" button in the header.

---

### `/session/[sessionId]` — Active Workout

- Load the session document from Firestore in real-time (`onSnapshot`).
- Display exercises as stacked full-width cards, scrollable vertically.
- For each exercise card:
  - Exercise name as a large card header (`text-xl font-bold`).
  - For each set: a single full-width row with:
    - Set label ("Set 1", "Set 2") — left-aligned, `text-sm text-muted-foreground`
    - Weight input — `type="text" inputMode="decimal"`, placeholder `"kg"`, `h-12 text-lg`
    - Reps input — `type="text" inputMode="numeric"`, placeholder `"reps"`, `h-12 text-lg`
    - A large confirm/checkmark button (`h-12`, min 48px wide) to log the set
  - Logged sets turn visually muted with a green checkmark — clearly distinct from pending sets at a glance.
- **Optimistic UI**: update the set row to "logged" state immediately on tap; sync to Firestore in background.
- Prevent accidental double-taps: disable the confirm button briefly (200ms) after tapping.
- When all sets in the session are done, a **sticky "Finish Workout" button** appears fixed at the bottom of the screen (above the safe-area inset on iOS):
  - Sets `finishedAt` timestamp in Firestore.
  - Redirects to `/history/[sessionId]`.
- Allow partial saves — user can log one set, close the app, and come back to continue (session persists in Firestore).

---

### `/history` — Session List

- Fetch all sessions for the current user ordered by `startedAt` desc.
- Each item shows: date, plan name, duration (if finished), completion status (finished / in progress).
- Clicking an item navigates to `/history/[sessionId]`.

---

### `/history/[sessionId]` — Session Detail (Read-only)

- Show all exercises and their logged sets (weight + reps).
- Show session date, start time, end time, total duration.
- "Back to History" navigation link.

---

## Mobile-First Design Requirements (CRITICAL)

This application is **used exclusively on a phone, at the gym, mid-workout**. Treat it as a native mobile app that happens to run in a browser. Every layout, interaction, and component choice must reflect this — desktop is a bonus, never the target.

### Viewport & Layout

- Add `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">` — prevents unwanted zoom when tapping inputs on iOS.
- All screens must be full-width on mobile with no horizontal overflow.
- On desktop: center content at max-width `480px` with a subtle card border to simulate a phone frame.
- No sidebars, no hover-only menus, no multi-column layouts.

### Touch Targets

- Every tappable element (button, input, icon button) must have a **minimum touch area of 48×48px**.
- Buttons must have generous padding — at least `py-3 px-6` (`h-12` preferred for primary actions).
- The "log set" confirm button on each set row must be prominently large and easy to hit with a thumb.

### Thumb Zone

- Primary actions (save set, finish workout) must be reachable **one-handed**, in the bottom half of the screen.
- The "Finish Workout" button must be **sticky at the bottom** of the viewport once available — never buried at the end of a long scroll.
- Avoid placing critical controls at the very top of the screen.

### Inputs

- Weight field: `type="text" inputMode="decimal"` — triggers the decimal numeric keyboard on both iOS and Android.
- Reps field: `type="text" inputMode="numeric"` — triggers the integer numeric keyboard.
- Do **not** use `type="number"` — it causes iOS/Android spinner and UX quirks.
- Input fields: minimum `h-12`, `text-lg` so they are easy to tap and read.
- After the keyboard appears, the active set row must remain visible — scroll it into view if needed.

### Performance & Feel

- The session screen must feel **instant**. Use optimistic UI: update local state immediately on set save, then write to Firestore in the background.
- No full-page reloads; use client-side navigation throughout.
- Avoid long blocking operations on the main thread between sets.
- Debounce Firestore writes if values change rapidly.

### Visual Design

- Default to **dark mode** — easier to read in a bright gym environment. Use the shadcn dark theme by default; respect `prefers-color-scheme` as a fallback.
- **High contrast** — text and icons must be readable in harsh gym lighting.
- Minimum font sizes: body `text-base` (16px), labels `text-sm` (14px). Never smaller.
- Logged sets must be **immediately visually distinct** from pending sets (muted color + green checkmark icon) — the user must know at a glance what's done without reading carefully.

### Navigation

- Use a **bottom navigation bar** or sticky footer for primary page-level navigation — not a top hamburger menu.
- Back navigation via a top-left arrow (standard mobile pattern) is fine for drill-down screens.
- Toast notifications from `sonner` must be positioned at the **top** of the screen — the keyboard and sticky buttons may cover the bottom.

### iOS Specific

- Account for the **safe area inset** on notched iPhones: use `pb-safe` or `env(safe-area-inset-bottom)` for any sticky bottom elements.
- Prevent the page from bouncing/overscrolling: set `overscroll-behavior: none` on the `<body>`.

---

## UI / UX Guidelines

- Every screen is designed for a **390px-wide phone screen** first.
- Use **shadcn/ui** components: `Card`, `Button`, `Input`, `Badge`, `Separator`.
- Dark mode as default (shadcn dark theme); respect `prefers-color-scheme`.
- Toast notifications (`sonner` via shadcn): position at top. Use for: set saved, workout finished, auth errors, network errors.
- Loading skeletons for async data fetches — never show a blank screen.

---

## Firebase Setup Instructions (include in README)

1. Create a Firebase project at https://console.firebase.google.com
2. Enable **Phone Authentication** in Authentication → Sign-in method.
3. Enable **Firestore Database** in production mode.
4. Add Firestore security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

5. Copy Firebase config to `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## File Structure (suggested)

```
app/
  layout.tsx
  page.tsx                        # Home
  login/
    page.tsx
  session/
    [sessionId]/
      page.tsx
  history/
    page.tsx
    [sessionId]/
      page.tsx

lib/
  firebase.ts                     # Firebase app init
  auth.ts                         # Auth helpers
  firestore.ts                    # Firestore helpers (createSession, logSet, finishSession)
  mockPlan.ts                     # MOCK_PLAN constant

components/
  ExerciseCard.tsx
  SetRow.tsx
  SessionSummary.tsx
  PhoneLoginForm.tsx
  OtpForm.tsx

hooks/
  useAuth.ts                      # Auth state listener
  useSession.ts                   # Real-time session listener
```

---

## MVP Scope Boundaries (explicitly OUT of scope)

- No plan editor / exercise creator (future feature)
- No progress charts or statistics (future feature — but collect all data now)
- No social/sharing features
- No push notifications
- No offline mode / PWA
- Single user only (no multi-user plan sharing)

---

## Future-Proofing Notes for the Developer

- **Plan storage**: When the plan creator is built, plans will be stored in `users/{uid}/plans/{planId}`. The session document already stores `planId` and denormalized exercise names, so history remains intact.
- **Charts**: The `SetLog.weight`, `SetLog.reps`, and `SetLog.loggedAt` fields are sufficient to render progress-over-time charts per exercise. No schema changes needed.
- **Multiple workouts per day**: `sessionId` is a Firestore auto-ID, so multiple sessions on the same day are supported.
