# Automation Flow

## Stage 1 — MVP (Current)

**Issue → Bot assigns Copilot → Copilot codes → Bot marks ready → CI → Review → Merge**

### Responsibility Split

| Actor                    | Responsible for                                                                                                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **VPS Bot (Playwright)** | Everything that requires a click as a human user: assign Copilot, mark PR ready. GitHub tokens cannot modify PRs owned by the Copilot bot — Playwright bypasses this restriction. |
| **GitHub Actions**       | Reacting to events: CI (build/test/docs), request review, auto-merge. Stateless and clean.                                                                                        |

```
1. Engineer creates Issue on GitHub
    ↓
2. GitHub Action (issue-webhook.yml) POSTs to VPS Bot
    ↓
3. VPS Bot (queue manager)
    ├── if no active issue
    │   ├── Playwright: clicks "Assign to Copilot"
    │   └── marks issue as active
    │
    └── if active issue exists
        └── enqueues (FIFO, persisted to disk)
    ↓
4. Copilot Agent
    ├── creates draft PR with [WIP] title
    ├── commits code + tests + .md docs
    └── changes PR title from [WIP] → final title when done
    ↓
5. GitHub webhook (pull_request: edited) → VPS Bot
    ├── detects title no longer starts with [WIP]
    └── Playwright: clicks "Ready for review" on PR page
    ↓  (GitHub emits ready_for_review event)
6. GitHub Actions (ci.yml) triggers on ready_for_review
    ├── npm run build
    ├── npm test (Vitest)
    ├── npm run test:e2e (Playwright)
    └── docs check (every .tsx/.ts has updated .md)
    ↓  (CI passes → workflow_run: completed)
7. GitHub Actions (copilot-review.yml) triggers on CI success
    └── requests review from Copilot reviewer
    ↓  (Copilot approves)
8. GitHub Actions (auto-merge.yml) triggers on approval
    ├── gh pr checks --watch (safety net)
    ├── squash-merges PR + deletes branch
    └── Vercel auto-deploys on merge to main
    ↓
9. GitHub Action (issue-webhook.yml) triggers on PR merge / issue close
    └── Bot dequeues next issue → loops to step 3
```

### Status

| Step | What                              | Who                                                 | Status          |
| ---- | --------------------------------- | --------------------------------------------------- | --------------- |
| 2    | Issue webhook                     | `issue-webhook.yml`                                 | ✅              |
| 3    | Bot queue + assign Copilot        | VPS Bot + Playwright                                | TODO            |
| 4    | Copilot codes                     | Copilot Agent                                       | ✅              |
| 5    | Watch [WIP] title → mark PR ready | VPS Bot + Playwright                                | TODO            |
| 6    | CI checks                         | `ci.yml` on `ready_for_review`                      | ✅              |
| 7    | Request Copilot review            | `copilot-review.yml` on CI success (`workflow_run`) | ✅              |
| 8    | Auto-merge on approval            | `auto-merge.yml`                                    | ✅              |
| 9    | Dequeue next issue                | `issue-webhook.yml` + VPS Bot                       | TODO (bot side) |

### Why Bot handles draft→ready (not Actions)

GitHub Actions tokens (`GITHUB_TOKEN`, PAT) cannot call `markPullRequestReadyForReview`
on PRs created by the Copilot bot — GitHub blocks this at the API level regardless of
permission scope. Playwright running as a logged-in user bypasses this restriction entirely.

---

## Bot Webhook Events

The bot must listen for these GitHub webhook events:

| Event                           | Condition                         | Action                                |
| ------------------------------- | --------------------------------- | ------------------------------------- |
| `issues: opened`                | no active issue                   | Playwright: click "Assign to Copilot" |
| `issues: opened`                | active issue exists               | enqueue                               |
| `pull_request: edited`          | title changed, no longer `[WIP]*` | Playwright: click "Ready for review"  |
| `pull_request: closed` (merged) | —                                 | dequeue next issue, assign Copilot    |

---

## Task Queue

Only **one active Copilot issue** at a time — no merge conflicts.

Queue state managed entirely by the VPS bot (persisted to disk).

| Bot state | Meaning                                  |
| --------- | ---------------------------------------- |
| `active`  | Copilot assigned, PR in progress         |
| `queued`  | Waiting; starts when active issue closes |

---

## Components to Build

### VPS Bot (Node.js + Express + Playwright)

- [ ] Webhook server — receives `issues` and `pull_request` events from GitHub
- [ ] Playwright session — login + click "Assign to Copilot"
- [ ] Playwright session — click "Ready for review" when [WIP] removed from title
- [ ] Queue manager — active issue + FIFO queue, persisted to disk

### GitHub Actions (all implemented)

- [x] `issue-webhook.yml` — POSTs to VPS bot on issue open/close
- [x] `ci.yml` — build + test + e2e + docs check on `ready_for_review`
- [x] `copilot-review.yml` — requests Copilot review on CI success (`workflow_run`)
- [x] `auto-merge.yml` — squash merge on Copilot approval

---

## Etap 2 — Full Flow (Future)

When MVP is battle-tested, add:

- Telegram bot (manager task entry point)
- GitHub ↔ Telegram bidirectional sync
- LLM clarification loop (max 3 rounds, updates issue body)

```
Manager writes task on Telegram
    ↓
Telegram Bot → creates GitHub Issue
    ↓
LLM analyzes issue → asks clarifying questions (if needed, max 3 rounds)
    ↓
GitHub Issue ↔ Telegram (bidirectional sync)
    ↓
LLM satisfied → updates Issue body, VPS Bot assigns Copilot
    ↓
[continues with MVP flow from step 4 onwards]
```

### Stage 2 Components

- [ ] Telegram bot (Telegraf)
- [ ] Telegram → GitHub Issue (bot creates issue via API)
- [ ] GitHub webhook → Telegram (issue comments forwarded)
- [ ] Telegram reply → GitHub Issue comment
- [ ] LLM clarification loop (GitHub Models API, max 3 rounds)
- [ ] LLM updates Issue body when ready, signals VPS bot to proceed

---

## Infrastructure

| Service           | Purpose                              | Notes                                     |
| ----------------- | ------------------------------------ | ----------------------------------------- |
| GitHub            | Repo, Issues, Actions, Copilot Agent | Central hub                               |
| Vercel            | Deployment                           | Auto on merge to `main`                   |
| VPS (self-hosted) | Bot server                           | Must be always online — receives webhooks |
| GitHub Models API | LLM for clarification loop           | Etap 2 only                               |
| Telegram          | Manager interface                    | Etap 2 only                               |

---

## Design Principles

**Bot = hands.** GitHub token restrictions are real and permanent. Playwright running as a
human user is the escape hatch for actions the API won't allow from automation tokens.

**Actions = reactions.** Stateless event handlers only. No Playwright, no queues, no state.

**No auto-merge without green CI.** Tests + docs check are the safety net.

**Sequential tasks, no parallel PRs.** Prevents merge conflicts.

**Documentation debt = code debt.** `.md` files are first-class citizens.
