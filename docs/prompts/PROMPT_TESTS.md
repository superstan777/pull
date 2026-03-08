# Prompt: Write Tests for All Project Files

## Context

This is a phone-first workout logging app built with Next.js 16 (App Router), shadcn/ui,
Tailwind CSS v4, and Firebase (Firestore + Phone Auth).

Full product specification: `docs/prompts/INIT_PROMPT.md`
Architecture and conventions: `.github/copilot-instructions.md`

## Your Task

Set up the full test infrastructure and write tests for every file listed below.
Do not test files in `components/ui/` — those are shadcn-managed and tested upstream.

---

## Test Infrastructure to Set Up

### 1. Vitest + React Testing Library

Install and configure:

- `vitest`
- `@vitejs/plugin-react`
- `@testing-library/react`
- `@testing-library/user-event`
- `@testing-library/jest-dom`
- `jsdom`

Create `vitest.config.ts` at repo root. Add `"test": "vitest run"` and
`"test:watch": "vitest"` to `package.json` scripts.

### 2. Playwright

Install and configure:

- `@playwright/test`
- `playwright` browsers (chromium only — mobile viewport)

Create `playwright.config.ts` at repo root:

- Base URL: `http://localhost:3000`
- Viewport: 390×844 (iPhone 14)
- Single browser: chromium
- Add `"test:e2e": "playwright test"` to `package.json` scripts.

### 3. Firebase Mock

Create `tests/mocks/firebase.ts` — mock ALL Firebase modules used in the project:

- `firebase/auth` — mock `onAuthStateChanged`, `signInWithPhoneNumber`,
  `RecaptchaVerifier`, `signOut`
- `firebase/firestore` — mock `addDoc`, `getDocs`, `getDoc`, `updateDoc`,
  `onSnapshot`, `collection`, `doc`, `query`, `orderBy`, `serverTimestamp`,
  `Timestamp`
- `lib/firebase.ts` — export `auth: null`, `db: null` (safe SSR values)

Apply mocks globally in `vitest.config.ts` via `setupFiles`.

---

## Files to Test

### Components (Vitest + RTL)

**`components/ScrollPicker.tsx`**

- Renders correct number of items
- Scrolling to an item calls `onChange` with correct value
- Initial scroll position matches `value` prop
- Selected item has full opacity; adjacent items have reduced opacity

**`components/RestTimer.tsx`**

- Renders initial time as "1:30"
- Counts down each second (use `vi.useFakeTimers()`)
- Calls `onDone` after 90 seconds
- "Skip Rest" button calls `onDone` immediately

**`components/LogSetDrawer.tsx`**

- Renders when `open=true`, hidden when `open=false`
- Shows exercise name and set number / total sets
- Confirm button label includes current weight and reps
- Clicking confirm calls `onConfirm` with correct (weight, reps) values
- Default weight and reps are reflected in button label on open

**`components/ExerciseCard.tsx`**

- Renders exercise name
- Renders correct number of SetRows
- Shows logged count correctly (e.g. "1/2")

**`components/SetRow.tsx`**

- Renders set number label
- Weight and reps inputs are present
- Confirm button calls `onLog` with parsed values
- After logging: button is disabled, row appears muted

**`components/AuthGuard.tsx`**

- Shows loading state while auth is resolving
- Redirects to `/login` when user is null (mock `useRouter`)
- Renders children when user is authenticated

**`components/BottomNav.tsx`**

- Renders Home and History links
- Active link has different styling based on current pathname
  (mock `usePathname` from `next/navigation`)

**`components/SessionSummary.tsx`**

- Renders plan name
- Renders correct logged/total set count
- Renders "Finished" badge when `finishedAt` is set
- Renders "In Progress" badge when `finishedAt` is null

**`components/PhoneLoginForm.tsx`**

- Renders phone input and submit button
- Submit button is disabled when input is empty
- Shows loading state after submit

**`components/OtpForm.tsx`**

- Renders OTP input
- Confirm button disabled when fewer than 6 digits entered
- Confirm button enabled when exactly 6 digits entered
- Calls `onBack` when back button clicked

### Hooks (Vitest)

**`hooks/useAuth.ts`**

- Returns `{ user: null, loading: true }` initially
- Returns `{ user: mockUser, loading: false }` after `onAuthStateChanged` fires
- Returns `{ user: null, loading: false }` when signed out

**`hooks/useSession.ts`**

- Returns `{ session: null, loading: true }` initially
- Returns session data after `onSnapshot` fires
- Unsubscribes from snapshot on unmount

### Lib (Vitest)

**`lib/timeUtils.ts`**

- `formatDate`: returns formatted string for a known date
- `formatDuration`: returns "1h 30m" for 90 minutes, "45m" for 45 minutes,
  "0m" for 0 seconds

**`lib/mockPlan.ts`**

- `MOCK_PLAN` has id, name, and 3 exercises
- Each exercise has id, name, and sets count ≥ 1

**`lib/firestore.ts`** (all Firestore calls mocked)

- `createSession`: calls `addDoc` with correct shape (planId, planName,
  startedAt, finishedAt: null, exercises array)
- `logSet`: calls `updateDoc` with updated exercises array reflecting new
  weight/reps/loggedAt for correct exercise/set index
- `finishSession`: calls `updateDoc` with `finishedAt: serverTimestamp()`
- `getActiveSession`: returns first session where `finishedAt` is null
- `getSessions`: returns all sessions ordered by `startedAt`

### E2E (Playwright)

**`tests/e2e/session-flow.spec.ts`**

Mock Firebase auth — inject a fake authenticated user into the app
(override `lib/firebase.ts` and `hooks/useAuth.ts` in the test environment).
Use `page.route()` to intercept and mock all Firestore API calls.

Test the full happy-path session flow:

1. Navigate to `/`
2. Assert "Start Workout" button is visible
3. Click "Start Workout"
4. Assert redirect to `/session/[id]`
5. Assert exercise list renders 3 exercises (from MOCK_PLAN)
6. Click first exercise
7. Assert set view renders "Set 1 of 2" and "Done" button
8. Click "Done"
9. Assert LogSetDrawer opens
10. Assert confirm button is visible with weight and reps values
11. Click confirm button
12. Assert drawer closes
13. Assert RestTimer renders with "1:30"
14. Click "Skip Rest"
15. Assert set view advances to "Set 2 of 2"
16. Repeat steps 8–11 for set 2
17. Assert redirect back to exercise list
18. Assert first exercise shows ✓ (done state)

---

## Constraints

- All Firebase calls must be mocked — no real API calls, no emulators
- Tests must pass in CI with `npm test` (Vitest) and `npm run test:e2e` (Playwright)
- Use `vi.useFakeTimers()` for RestTimer tests
- Each test file co-located with source inside its component folder:
  `components/ScrollPicker/ScrollPicker.test.tsx`, `hooks/useAuth.test.ts` etc.
  E2E tests live in `tests/e2e/`
- No `any` types in test files
