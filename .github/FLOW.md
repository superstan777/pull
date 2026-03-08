# Automation Flow

Full end-to-end pipeline from idea to deployed code.

---

## Overview

```
Manager (Telegram)
    │
    │  writes precise task description
    ▼
VPS Bot
    │
    │  creates GitHub Issue [label: draft]
    ▼
LLM (GitHub Models API)
    │
    │  analyses issue, asks clarifying questions
    │  or challenges architectural decisions
    │  (max 3 rounds)
    ▼
GitHub Issue comments ◄──► Telegram (bidirectional via webhooks)
    │
    │  LLM satisfied: removes label draft, adds label copilot
    ▼
GitHub Action: auto-assign Copilot Agent
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
```

---

## Task Queue

Only **one active Copilot PR** at a time — no merge conflicts.

| State           | Label        | Behaviour                                     |
| --------------- | ------------ | --------------------------------------------- |
| Being clarified | `draft`      | LLM ↔ Manager loop active                     |
| Ready to start  | `copilot`    | Copilot Agent assigned immediately            |
| Waiting         | `queued`     | Active PR already open; starts after merge    |
| Blocked         | `needs-info` | Copilot asked a question; waiting for Manager |

When a PR is merged, GitHub Action scans for the oldest `queued` issue and promotes it to `copilot`.

---

## Clarification Loop (detail)

```
Issue created [draft]
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
    - Removes label: draft
    - Adds label: copilot
```

---

## Components to Build

### Etap 1 — Code Foundation (current)

- [ ] Vitest + React Testing Library setup
- [ ] First unit tests (ScrollPicker, RestTimer, LogSetDrawer)
- [ ] Playwright E2E setup + smoke test (session flow with mocked Firebase)
- [ ] GitHub Actions CI workflow (build + test + docs check)
- [ ] `docs/patterns/` — base pattern files
- [ ] Co-located `.md` for all existing components and hooks
- [ ] `.github/copilot-instructions.md` ✅

### Etap 2 — GitHub Automation

- [ ] Action: auto-assign Copilot when issue gets label `copilot`
- [ ] Action: task queue — label `queued` when PR already open
- [ ] Action: promote oldest `queued` issue after PR merge
- [ ] Action: auto-request Copilot review on Copilot PRs
- [ ] Action: auto-merge when CI green + review approved

### Etap 3 — Bot (Telegram ↔ GitHub ↔ LLM)

- [ ] VPS bot server (Node.js + Telegraf)
- [ ] Telegram → GitHub Draft Issue
- [ ] GitHub webhook → Telegram (issue comments forwarded)
- [ ] Telegram reply → GitHub Issue comment
- [ ] LLM clarification loop (GitHub Models API, max 3 rounds)
- [ ] LLM updates Issue body + swaps labels when ready

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
