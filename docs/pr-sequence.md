# PR Sequence — Notion → Google Calendar Sync v1

## Purpose
This sequence turns the approved PRD and test spec into a reviewable delivery order for a public repo. The goal is to keep each PR small, lane-owned, and safe to merge without blocking later work.

## Ground Rules
- One PR = one main idea.
- Prefer `test -> impl -> refactor` commit flow inside each PR.
- Do not merge a later PR until the previous dependency gate is green.
- Keep adapter SDK details out of sync/domain files.
- Every PR description should include: what changed, why, verification, remaining risk.

## Branch Model
- Integration branch: `feat/notion-google-sync-v1`
- Lane branches:
  - `lane/foundation-contracts`
  - `lane/notion-adapter`
  - `lane/google-adapter`
  - `lane/sync-engine-cli`
  - `lane/verification-docs`

## PR Order Overview
| PR | Title | Primary owner | Depends on | Why it exists |
| --- | --- | --- | --- | --- |
| PR 1 | Foundation scaffold and contracts | Lane A | none | Lock repo shape, shared types, fixtures, and baseline tooling first |
| PR 2 | Notion adapter mapping and fetch path | Lane B | PR 1 | Isolate Notion API reading and row normalization |
| PR 3 | Google adapter identity and CRUD path | Lane C | PR 1 | Isolate calendar lookup/upsert/delete mechanics |
| PR 4 | Sync engine reconcile logic | Lane D | PR 2, PR 3 | Decide create/update/delete/no-op in pure sync logic |
| PR 5 | CLI orchestration and dry-run/write flow | Lane D | PR 4 | Expose a manual-run entrypoint that matches v1 runtime |
| PR 6 | Docs, smoke checks, and verification hardening | Lane E | PR 5 | Make the public repo runnable and reviewable by newcomers |

---

## PR 1 — Foundation scaffold and contracts
**Owner:** Lane A
**Branch:** `lane/foundation-contracts`

### Scope
- Create initial project structure under:
  - `src/config/**`
  - `src/domain/**`
  - `tests/fixtures/**`
  - baseline repo files such as `README.md`, `.env.example`, package/tooling manifests
- Establish strict TypeScript baseline and script entrypoints.
- Add fixture files for date-only, timed, empty-date, deleted-row, and existing-event cases.

### Required tests/checks before merge
- failing then passing tests for:
  - env schema validation
  - domain type contract
  - fallback date logic
  - fixture loading sanity check
- commands expected green:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test:unit`

### Review focus
- Is the repo understandable in 10 minutes?
- Are file boundaries obvious enough for later parallel lanes?
- Are the fixtures readable and named by behavior?

### Merge gate
- No adapter logic yet.
- No sync engine decisions yet.
- Shared types and config contracts must be stable enough for PR 2/3 to build on.

---

## PR 2 — Notion adapter mapping and fetch path
**Owner:** Lane B
**Branch:** `lane/notion-adapter`

### Scope
- Add `src/adapters/notion/**`.
- Implement Notion client wrapper and row normalization.
- Map Notion properties:
  - `이름` → normalized title
  - `날짜` → normalized date/date-time input
  - `설명` → normalized description
- Return deleted/archived state in the domain model instead of hiding it.

### Required tests/checks before merge
- failing then passing tests for:
  - `이름` parsing
  - `날짜` parsing
  - `설명` parsing
  - full row fetch path
  - timezone-aware normalization input handling
- commands expected green:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test:unit`
  - `npm run test:integration -- notion`

### Review focus
- Is adapter code the only place that knows raw Notion response shapes?
- Are partial/missing values normalized predictably?
- Does archived/deleted data remain visible to the sync engine?

### Merge gate
- Must build cleanly against PR 1 contracts.
- Must not depend on Google adapter implementation details.

---

## PR 3 — Google adapter identity and CRUD path
**Owner:** Lane C
**Branch:** `lane/google-adapter`

### Scope
- Add `src/adapters/google/**`.
- Implement event lookup by `extendedProperties.private` with:
  - `source=notion`
  - `notionPageId=<page_id>`
  - `notionDatabaseId=<database_id>`
- Add create/update/delete mapping helpers.
- Keep Google Calendar payload shaping inside the adapter.

### Required tests/checks before merge
- failing then passing tests for:
  - existing event lookup by extended properties
  - create mapping
  - update mapping
  - delete mapping
- commands expected green:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test:unit`
  - `npm run test:integration -- google`

### Review focus
- Is dedup identity explicit and stable?
- Are all-day vs timed payloads expressed clearly?
- Does deletion stay adapter-owned instead of leaking into CLI logic?

### Merge gate
- Must build cleanly against PR 1 contracts.
- Must not contain reconcile decisions that belong in PR 4.

---

## PR 4 — Sync engine reconcile logic
**Owner:** Lane D
**Branch:** `lane/sync-engine-cli`

### Scope
- Add `src/sync/**` pure logic.
- Implement decision table for:
  - create
  - update
  - delete
  - no-op
- Handle empty-date fallback to today's all-day event in `Asia/Seoul`.
- Prevent duplicate creation when identity already exists.

### Required tests/checks before merge
- failing then passing tests for:
  - create/update/delete/no-op decision table
  - duplicate prevention
  - empty-date fallback behavior
  - deleted/archive propagation to delete decision
- commands expected green:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test:unit`
  - targeted sync-unit tests

### Review focus
- Is the sync logic readable without knowing SDK internals?
- Are decision reasons explicit enough for dry-run summaries?
- Is idempotency enforced in the core logic instead of only by adapter accident?

### Merge gate
- PR 2 and PR 3 already merged or rebased in.
- Acceptance-critical decision cases are green before CLI wiring begins.

---

## PR 5 — CLI orchestration and dry-run/write flow
**Owner:** Lane D
**Branch:** `lane/sync-engine-cli`

### Scope
- Add `src/cli/**` entrypoint.
- Wire config + adapters + sync engine for one-shot manual execution.
- Support:
  - `sync --dry-run`
  - `sync --write`
- Print a summary that makes create/update/delete/no-op easy to review.

### Required tests/checks before merge
- failing then passing tests for:
  - `sync --dry-run`
  - `sync --write`
  - result summary output
- commands expected green:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test:unit`
  - `npm run test:acceptance`

### Review focus
- Is the CLI only orchestration, not business logic?
- Is dry-run guaranteed non-mutating?
- Can a maintainer tell what will happen before using write mode?

### Merge gate
- PR 4 decision table is already stable.
- Acceptance tests demonstrate end-to-end flow for the core matrix.

---

## PR 6 — Docs, smoke checks, and verification hardening
**Owner:** Lane E
**Branch:** `lane/verification-docs`

### Scope
- Expand `README.md` with:
  - project purpose
  - structure explanation
  - setup steps
  - manual run steps
  - dry-run usage
  - test commands
- Finalize `.env.example`.
- Add smoke test notes or scripts for fixture walkthrough and test-calendar run.
- Verify command examples match the actual CLI.

### Required tests/checks before merge
- failing then passing checks for:
  - README command example validity
  - smoke fixture walkthrough
  - acceptance matrix completeness
- commands expected green:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test:acceptance`
  - `npm run sync -- --dry-run`

### Review focus
- Can a new contributor run the project from README alone?
- Are known risks and manual prerequisites stated honestly?
- Is the acceptance evidence easy to audit?

### Merge gate
- PR 5 merged.
- Final docs reflect the real commands and file structure, not planned names.

---

## Reviewer Checklist Per PR
- Scope stayed inside the PR's intended lane.
- Tests fail for the right reason before implementation and pass afterward.
- New files are named by responsibility, not by vague phase labels.
- No later-phase behavior was smuggled into an earlier PR.
- Verification commands in the PR body match repo scripts.
- Remaining risks are explicit rather than implied.

## Recommended Merge Rhythm
1. Merge PR 1 alone.
2. Run a quick rebase window for PR 2 and PR 3 once PR 1 lands.
3. Merge PR 2 and PR 3 independently after integration tests are green.
4. Start PR 4 only when both adapters are settled.
5. Merge PR 5 immediately after PR 4 if acceptance tests stay green.
6. Use PR 6 as the final public-repo polish and evidence pass.

## Exit Condition
The PR sequence is complete when the repo can be reviewed as six small, legible changesets that build from shared contracts to adapters to sync logic to CLI to public-facing docs, with no PR carrying more than one major idea.
