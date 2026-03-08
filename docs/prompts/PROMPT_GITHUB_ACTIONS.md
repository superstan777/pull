# Prompt: GitHub Actions Workflows

## Context

Full pipeline spec: `.github/FLOW.md`
Agent conventions: `.github/copilot-instructions.md`

This project uses GitHub Copilot Agent to implement tasks from GitHub Issues. Workflows must
support the full automation loop: issue labelling → Copilot assigns → PR → CI → review → merge.

All workflows live in `.github/workflows/`.

---

## Workflows to Create

### 1. `ci.yml` — Continuous Integration

**Triggers:** `pull_request` targeting `main`

**Jobs (run in sequence, each blocks the next):**

#### Job: `build`

```
- actions/checkout@v4
- actions/setup-node@v4 (node 20, npm cache)
- npm ci
- npm run build
```

#### Job: `test` (needs: build)

```
- actions/checkout@v4
- actions/setup-node@v4 (node 20, npm cache)
- npm ci
- npm test
```

Required env vars (from repository secrets):

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

Note: Firebase is mocked in tests — these vars are passed but irrelevant for test correctness.
They must exist to satisfy `process.env` checks during import.

#### Job: `e2e` (needs: build)

```
- actions/checkout@v4
- actions/setup-node@v4 (node 20, npm cache)
- npm ci
- npx playwright install chromium --with-deps
- npm run build
- npm run test:e2e
```

Same env vars as `test` job.

#### Job: `docs-check` (needs: nothing — runs in parallel)

Check that every changed `.tsx` or `.ts` file in `components/`, `hooks/`, `app/`, or `lib/`
(excluding `components/ui/**`, `types/**`, `*.test.*`, `*.spec.*`) has a corresponding `.md`
file that was also modified in the same PR.

Implementation:

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0

- name: Check .md coverage
  run: |
    BASE=${{ github.event.pull_request.base.sha }}
    HEAD=${{ github.event.pull_request.head.sha }}

    # All changed .tsx/.ts files (excluding ui/, tests, node_modules)
    CHANGED=$(git diff --name-only "$BASE" "$HEAD" \
      | grep -E '\.(tsx|ts)$' \
      | grep -v 'components/ui/' \
      | grep -v '/index\.ts' \
      | grep -v '\.test\.' \
      | grep -v '\.spec\.' \
      | grep -v 'node_modules/')

    # components/, hooks/, app/, lib/ require .md — types/ is exempt (pure type defs)
    NEED_DOCS=$(echo "$CHANGED" | grep -E '^(components|hooks|app|lib)/' | grep -v 'components/ui/')

    MISSING=""
    for f in $NEED_DOCS; do
      md="${f%.tsx}.md"
      md="${md%.ts}.md"
      if ! git diff --name-only "$BASE" "$HEAD" | grep -qF "$md"; then
        MISSING="$MISSING\n  $f → missing updated $md"
      fi
    done

    if [ -n "$MISSING" ]; then
      echo "::error::Missing .md updates for changed files:"
      printf "$MISSING"
      exit 1
    fi

    echo "✓ All changed files have updated .md files"
```

---

### 2. `copilot-assign.yml` — Auto-assign Copilot on Label

**Triggers:** `issues` → `labeled`

**Condition:** `github.event.label.name == 'copilot'`

**Job:**

- Check if there is already an open PR whose head branch starts with `copilot/`
  (use `gh pr list --label copilot --state open` or search by branch prefix)
- **If open PR exists:**
  - Remove label `copilot` from the issue
  - Add label `queued`
  - Post comment on issue: "A Copilot PR is already open. This issue has been queued and will start automatically after the current PR is merged."
- **If no open PR:**
  - Assign `Copilot` to the issue (via `gh issue edit --add-assignee @copilot`)
  - Post comment: "Copilot has been assigned and will start shortly."

Requires: `github-token` with `issues: write`, `pull-requests: read`

---

### 3. `queue-advance.yml` — Promote Queued Issue After Merge

**Triggers:** `pull_request` → `closed` with `merged == true` targeting `main`

**Condition:** PR head branch starts with `copilot/` (i.e., was a Copilot PR)

**Job:**

- Find the oldest open issue with label `queued` (lowest issue number)
  (`gh issue list --label queued --state open --sort created --limit 1`)
- If found:
  - Remove label `queued`
  - Add label `copilot`
  - Post comment: "Previous PR merged. Copilot has been assigned to this issue."
- If none found: do nothing (no-op)

Requires: `github-token` with `issues: write`

---

### 4. `copilot-review.yml` — Auto-request Copilot Review

**Triggers:** `pull_request` → `opened` or `reopened`

**Condition:** PR head branch starts with `copilot/`

**Job:**

- Request a review from `Copilot`
  (`gh pr edit $PR_NUMBER --add-reviewer Copilot`)

Requires: `github-token` with `pull-requests: write`

---

### 5. `auto-merge.yml` — Merge When CI Green + Review Approved

**Triggers:** `pull_request_review` → `submitted` with `review.state == 'approved'`

**Condition:**

- PR head branch starts with `copilot/`
- Review submitted by `Copilot` (or `github-actions[bot]`)

**Job:**

- Verify all required CI checks are green (wait if pending):
  use `gh pr checks $PR_NUMBER --watch --fail-fast`
- If all pass: merge with squash
  `gh pr merge $PR_NUMBER --squash --auto`

Requires: `github-token` with `pull-requests: write`, `contents: write`

---

## Permissions

Every workflow needs explicit `permissions:` block. Use principle of least privilege:

```yaml
permissions:
  contents: read # default, always include
  issues: write # copilot-assign, queue-advance
  pull-requests: write # copilot-review, auto-merge
```

---

## Secrets

No new secrets needed beyond the Firebase env vars (already in repo secrets for CI).
All GitHub API operations use the built-in `secrets.GITHUB_TOKEN`.

---

## Constraints

- Use `actions/checkout@v4` and `actions/setup-node@v4` throughout
- Node version: `20`
- Use `npm ci` not `npm install`
- All `gh` CLI commands are available in GitHub-hosted runners by default
- Branch naming convention for Copilot PRs: `copilot/**` — enforce this assumption
  in condition checks with `startsWith(github.head_ref, 'copilot/')`
- Workflow files must have clear `name:` and per-step `name:` fields for readable CI UI
