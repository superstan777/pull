# Automation Flow

Full end-to-end pipeline from idea to deployed code — zero manual steps.

---

## Overview

```
Manager (Telegram)
    │
    │  writes precise task description
    ▼
VPS Bot
    │
    │  creates GitHub Issue
    ▼
LLM (GitHub Models API)
    │
    │  analyses issue, asks clarifying questions
    │  or challenges architectural decisions
    │  (max 3 rounds)
    ▼
GitHub Issue comments ◄──► Telegram (bidirectional via webhooks)
    │
    │  LLM satisfied: updates Issue body with final description
    ▼
GitHub Action: issue opened → POST /issue to VPS Bot
    │
    ▼
VPS Bot (queue manager)
    │
    ├── no active issue → Playwright clicks "Assign to Copilot"
    │                     marks issue as active in local state
    │
    └── issue already active → adds to internal queue
    │
    ▼
Copilot Agent
    │
    │  creates branch, writes code + tests + .md docs, opens PR
    ▼
GitHub Actions CI
    ├── npm run build          (must pass)
    ├── npm test               (Vitest — must pass)
    ├── npm run test:e2e       (Playwright — must pass)
    └── docs check             (every changed .tsx/.ts has updated .md — must pass)
    │
    │  all checks green
    ▼
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

| Bot state  | Meaning                                     |
| ---------- | ------------------------------------------- |
| `active`   | Copilot assigned, PR in progress            |
| `queued`   | Waiting; will start when active issue closes |

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

Issue ready:
    - LLM updates Issue body with final, complete description
    - VPS Bot triggers Playwright "Assign to Copilot" (or queues if one active)
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
