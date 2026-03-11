# Automation Flow

## Etap 1 — MVP (Current, Simplified)

Stripped-down workflow: **Issue → Bot assigns Copilot → Copilot codes → CI → Review → Merge**

```
1. Engineer creates Issue on GitHub
    ↓
2. GitHub Action (issue-webhook.yml) POSTs to VPS Bot
    ↓
3. VPS Bot (queue manager)
    ├── if no active issue
    │   ├── Playwright: clicks "Assign to Copilot"
    │   ├── marks issue as active
    │   └── triggers Copilot workflow
    │
    └── if active issue exists
        └── enqueues (FIFO, persisted to disk)
    ↓
4. Copilot Agent
    ├── creates draft PR (branch off issue number)
    ├── commits code + tests + .md docs
    └── pushes to GitHub
    ↓
5. GitHub Actions (pr-ready.yml)
    ├── detects Copilot as author + draft mode
    ├── converts draft → ready for review
    └── emits ready_for_review event
    ↓
6. GitHub Actions (ci.yml) triggers on ready_for_review
    ├── npm run build
    ├── npm test (Vitest)
    ├── npm run test:e2e (Playwright)
    └── docs check (every .tsx/.ts has updated .md)
    ↓
7. GitHub Actions (copilot-review.yml) triggers when CI passes
    ├── requests review from Copilot reviewer
    ↓
8. GitHub Actions (auto-merge.yml) triggers on Copilot approval
    ├── waits for CI to be green
    ├── squash-merges PR
    └── (Vercel auto-deploys on merge to main)
    ↓
9. GitHub Action (issue-webhook.yml) triggers on PR merge
    ├── POSTs closure event to VPS Bot
    └── Bot dequeues next issue → loops to step 3

```

### Key Mechanisms (MVP)

| Step | What               | How                                                 | Status             |
| ---- | ------------------ | --------------------------------------------------- | ------------------ |
| 2    | Issue webhook      | `issue-webhook.yml` — POST on issue opened + closed | ✅                 |
| 3    | Bot queue + assign | VPS bot + Playwright (always online)                | TODO               |
| 4    | Copilot codes      | Copilot Agent connected to GitHub issue             | ✅                 |
| 5    | Draft→Ready auto   | `pr-ready.yml` on opened (no sync turbo)            | TODO (fix trigger) |
| 6    | CI checks          | `ci.yml` on ready_for_review only                   | TODO (fix trigger) |
| 7    | Request review     | `copilot-review.yml` request Copilot reviewer       | ✅                 |
| 8    | Merge auto         | `auto-merge.yml` on approved review                 | ✅                 |

---

## MVP Fixes

### Problem 1: Duplicate CI runs

**Current:** `ci.yml` triggers on `ready_for_review` + `synchronize`  
**Issue:** Every Copilot push re-runs CI  
**Fix:** Trigger ONLY on `ready_for_review`

```yaml
on:
  pull_request:
    types:
      - ready_for_review
```

### Problem 2: pr-ready.yml turbo re-triggering

**Current:** `pr-ready.yml` triggers on `opened` + `synchronize`  
**Issue:** After converting draft→ready, if a new commit lands, unnecessary job runs  
**Fix:** Trigger ONLY on `opened`

```yaml
on:
  pull_request:
    types:
      - opened
```

### Problem 3: No concurrency control

**Problem:** Multiple CI runs can happen simultaneously (resource waste, race conditions on merge)  
**Fix:** Add `concurrency` to ci.yml (cancel older run when new one lands)

```yaml
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
```

### Problem 4: Review request fires on every ready_for_review

**Current:** `copilot-review.yml` triggers on `ready_for_review`  
**Issue:** If CI re-emits ready_for_review somehow, duplicate requests  
**Fix:** Add check: only request if no review exists yet (gh pr checks)

```yaml
if: >
  github.event.pull_request.requested_reviewers.*.login != 'copilot[bot]'
```

---

## Etap 2 — Full Flow (Future)

When MVP is **battle-tested**, add:

- Telegram bot (manager task entry point)
- GitHub ↔ Telegram bidirectional sync
- LLM clarification loop (max 3 rounds, updates issue body)
- Multiple concurrent Copilot workers (parallel queues)

```
Manager writes task on Telegram
    ↓
Telegram Bot → creates GitHub Issue
    ↓
LLM analyzes issue → asks clarifying questions (if needed, max 3 rounds)
    ↓
GitHub Issue ↔ Telegram (bidirectional sync)
    ↓
Once clarity achieved: LLM updates Issue body, VPS Bot assigns Copilot
    ↓
[continues with MVP flow from step 4 onwards]
```

---

## Old Full Flow (Reference)

See git history if needed.
GitHub Action: auto-request Copilot review
│
▼
Copilot Review Agent
│
├── approves → auto-merge to main
└── requests changes → Copilot Agent fixes → CI reruns
│
▼
Vercel: auto-deploy on merge to main
│
▼
GitHub Action: issue closed → POST /issue to VPS Bot
│
▼
VPS Bot: dequeues next issue → Playwright clicks "Assign to Copilot"

```

---

## Task Queue

Only **one active Copilot issue** at a time — no merge conflicts.

Queue state is managed entirely by the VPS bot — no GitHub labels involved.

| Bot state | Meaning                                      |
| --------- | -------------------------------------------- |
| `active`  | Copilot assigned, PR in progress             |
| `queued`  | Waiting; will start when active issue closes |

When an issue is closed, the bot automatically picks the oldest queued issue
and clicks "Assign to Copilot" — no human action required.

---

## Clarification Loop (detail)

```

Issue created
│
▼
LLM analyses:

- Is the task clear enough to implement?
- Are there architectural concerns?
- What is missing?
  │
  ├── clear + no concerns → skip to "Issue ready"
  │
  └── questions/concerns → post comment on Issue
  │
  Webhook → VPS Bot → Telegram
  │
  Manager replies on Telegram
  │
  Bot appends to reply:
  "Czy to wyjaśnia wątpliwości?
  Jeśli nie — zadaj kolejne pytanie.
  Jeśli tak — zaktualizuj issue i zacznij."
  │
  Bot posts reply as Issue comment
  │
  LLM evaluates again
  │
  (repeat, max 3 rounds total)
  │
  Round 3 exhausted → proceed regardless

Issue ready: - LLM updates Issue body with final, complete description - VPS Bot triggers Playwright "Assign to Copilot" (or queues if one active)

```

---

## Components to Build

### Etap 1 — Code Foundation (current)

- [ ] Vitest + React Testing Library setup
- [ ] First unit tests (ScrollPicker, RestTimer, LogSetDrawer)
- [ ] Playwright E2E setup + smoke test (session flow with mocked Firebase)
- [ ] GitHub Actions CI workflow (build + test + docs check)
- [ ] Co-located `.md` for all existing components and hooks
- [ ] `.github/copilot-instructions.md` ✅

### Etap 2 — GitHub Automation

- [ ] VPS Bot: webhook server (Express, Node.js)
- [ ] VPS Bot: Playwright session — login + "Assign to Copilot" click
- [ ] VPS Bot: internal queue (active issue + FIFO queue, persisted to disk)
- [ ] VPS Bot: `/issue` endpoint — handles `opened` and `closed` events
- [ ] Action: `issue-webhook.yml` ✅ — POSTs to VPS bot on issue open/close
- [ ] Action: auto-request Copilot review on ready PR ✅
- [ ] Action: auto-merge when CI green + review approved ✅
- [ ] Action: convert draft PR to ready (pr-ready.yml) ✅
- [ ] Action: CI (build + test + docs check) ✅

### Etap 3 — Bot (Telegram ↔ GitHub ↔ LLM)

- [ ] Telegram bot (Telegraf)
- [ ] Telegram → GitHub Issue (bot creates issue via API)
- [ ] GitHub webhook → Telegram (issue comments forwarded)
- [ ] Telegram reply → GitHub Issue comment
- [ ] LLM clarification loop (GitHub Models API, max 3 rounds)
- [ ] LLM updates Issue body when ready, signals VPS bot to proceed

---

## Infrastructure

| Service           | Purpose                              | Notes                                            |
| ----------------- | ------------------------------------ | ------------------------------------------------ |
| GitHub            | Repo, Issues, Actions, Copilot Agent | Central hub                                      |
| Vercel            | Deployment                           | Auto on merge to `main`                          |
| VPS (self-hosted) | Bot server                           | Must be always online — receives webhooks        |
| GitHub Models API | LLM for clarification loop           | GPT-4o / Claude — one token, in GitHub ecosystem |
| Telegram          | Manager interface                    | Bot created via BotFather                        |

---

## Design Principles

**Manager = sets direction and priorities.** Precise task descriptions. Knows how to break
large features into small, focused issues that don't overwhelm the developer.

**Copilot = senior developer.** Executes but thinks. Will push back on bad decisions.
Will ask before writing wrong code. Quality is non-negotiable.

**No auto-merge without green CI.** Tests + docs check are the safety net. One developer
(human or AI) skipping them poisons the culture for the whole team.

**Sequential tasks, no parallel PRs.** Prevents merge conflicts. If a task is urgent,
current PR can be manually merged fast-tracked — queue moves immediately.

**Documentation debt = code debt.** An undocumented component is a liability for every
future LLM working in this codebase. `.md` files are first-class citizens.
```
