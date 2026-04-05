# TDD Sequence — Notion → Google Calendar Sync v1

## Goal
This sequence turns the PRD and test spec into the order that tests should fail, pass, and then stabilize. It is optimized for a public repo where contributors need readable intent and small feedback loops more than clever abstractions.

## TDD Rules for This Project
- Write the failing test before implementation for every sync rule change.
- Keep test names behavior-first, matching the acceptance matrix language.
- Prefer fixtures that mirror real Notion rows and Google events over hand-built ad hoc objects.
- Refactor only after green.
- Do not mix adapter SDK details into sync-unit tests.
- Preserve a visible trail from acceptance criteria -> test file -> implementation file.

## Phase Overview
| Phase | Target lane | First red test should prove | Green means |
| --- | --- | --- | --- |
| Phase 1 | Lane A | shared contracts and fallback date behavior exist | later lanes have stable scaffolding |
| Phase 2 | Lane B | raw Notion rows normalize into domain records correctly | Notion input is trustworthy |
| Phase 3 | Lane C | Google event identity and payload mapping are deterministic | event I/O is isolated and repeatable |
| Phase 4 | Lane D | reconcile logic chooses create/update/delete/no-op correctly | sync behavior is idempotent and readable |
| Phase 5 | Lane D | CLI exposes dry-run and write behavior correctly | one manual command can drive the whole flow |
| Phase 6 | Lane E | docs and smoke checks match the real tool | a newcomer can follow README and verify behavior |

---

## Phase 1 — Foundation and contracts (Lane A)
**Why first:** all later tests depend on consistent types, fixtures, and config parsing.

### Red tests to write first
1. `tests/unit/config/env-schema.test.ts`
   - rejects missing required env values
   - accepts the minimal valid env shape
2. `tests/unit/domain/notion-record.test.ts`
   - constructs the normalized record contract for title/date/description/deleted state
3. `tests/unit/shared/fallback-date.test.ts`
   - returns today's all-day date in `Asia/Seoul` when the Notion date is empty
4. `tests/fixtures/fixtures-sanity.test.ts`
   - confirms required fixture files exist and parse cleanly

### Green target
- The repo can run unit tests against config/domain helpers before any API client exists.

### Refactor guard
- Only extract shared helpers after at least two tests use the same setup pattern.

---

## Phase 2 — Notion adapter normalization (Lane B)
**Why second:** sync logic is only trustworthy if Notion rows are normalized once, in one place.

### Red tests to write first
1. `tests/integration/notion/map-title.test.ts`
   - maps `이름` into the normalized title field
2. `tests/integration/notion/map-date.test.ts`
   - handles date-only values
   - handles date-time values
   - preserves start/end range input when present
3. `tests/integration/notion/map-description.test.ts`
   - maps `설명` into normalized description text
4. `tests/integration/notion/fetch-rows.test.ts`
   - fetches all rows for the configured database
   - preserves archived/deleted state for downstream deletion handling

### Green target
- The adapter returns normalized `NotionRecord` objects with no raw-response leakage into sync code.

### Refactor guard
- Do not generalize property parsing beyond the three v1 fields until real second-use evidence appears.

---

## Phase 3 — Google adapter identity and CRUD mapping (Lane C)
**Why third:** idempotency depends on a stable lookup key before reconcile logic can be trusted.

### Red tests to write first
1. `tests/integration/google/find-existing-event.test.ts`
   - finds events by `extendedProperties.private.source=notion`
   - requires both `notionPageId` and `notionDatabaseId`
2. `tests/integration/google/create-event.test.ts`
   - maps normalized all-day input into a Google all-day payload
   - maps normalized timed input into a Google timed payload
3. `tests/integration/google/update-event.test.ts`
   - updates title/description/time fields without changing identity metadata
4. `tests/integration/google/delete-event.test.ts`
   - deletes the matched Google event for a removed/archived Notion record

### Green target
- CRUD operations and identity lookup are stable enough that duplicate prevention is testable in the sync engine.

### Refactor guard
- Keep Calendar API payload shaping adapter-local; sync tests should consume adapter-facing types, not raw Google payloads.

---

## Phase 4 — Sync engine decision table (Lane D)
**Why fourth:** this is the core behavior promised by the product, and it should be mostly pure logic.

### Red tests to write first
1. `tests/unit/sync/reconcile-create.test.ts`
   - creates when a Notion record has no matching Google event
2. `tests/unit/sync/reconcile-update.test.ts`
   - updates when content or time changed
3. `tests/unit/sync/reconcile-delete.test.ts`
   - deletes when the Notion row is archived/deleted
4. `tests/unit/sync/reconcile-noop.test.ts`
   - no-ops when normalized content already matches
5. `tests/unit/sync/prevent-duplicates.test.ts`
   - repeated runs with identical input do not create a second event
6. `tests/unit/sync/fallback-empty-date.test.ts`
   - empty Notion date produces today's all-day event in `Asia/Seoul`

### Green target
- The reconcile layer exposes explicit decisions and reasons suitable for dry-run summaries.

### Refactor guard
- Refactor only when decision-table duplication hides behavior; do not collapse cases so aggressively that acceptance criteria become hard to trace.

---

## Phase 5 — CLI orchestration and acceptance path (Lane D)
**Why fifth:** once decisions are stable, prove the manual execution path promised in v1.

### Red tests to write first
1. `tests/acceptance/sync-cli-dry-run.test.ts`
   - `sync --dry-run` prints planned create/update/delete/no-op actions
   - does not call mutating Google adapter methods
2. `tests/acceptance/sync-cli-write.test.ts`
   - `sync --write` executes the planned mutations once
3. `tests/acceptance/sync-cli-summary.test.ts`
   - output includes counts and identifiable reasons for each action
4. `tests/acceptance/sync-cli-idempotent-rerun.test.ts`
   - two identical runs do not create duplicates

### Green target
- One command path proves the end-to-end v1 story for manual execution.

### Refactor guard
- Keep CLI tests black-box where possible; do not couple them to internal helper names.

---

## Phase 6 — Docs and smoke verification (Lane E)
**Why last:** docs must describe the actual commands and real behavior, not a moving target.

### Red checks to write first
1. `tests/acceptance/readme-command-validity.test.ts`
   - README command examples match actual script names/flags
2. `tests/acceptance/fixture-walkthrough.test.ts`
   - sample fixtures still support the documented smoke path
3. `tests/acceptance/acceptance-matrix-coverage.test.ts`
   - each acceptance criterion is covered by at least one named test/check

### Green target
- A contributor can run setup, dry-run, and tests by following the repo docs.

### Refactor guard
- Avoid rewriting test names after docs land unless the matching acceptance language changes too.

---

## Acceptance-Criteria Trace
| Acceptance criterion | Earliest red test | Final proving layer |
| --- | --- | --- |
| AC1 title mapping | Phase 2 `map-title` | CLI acceptance summary/write tests |
| AC2 description mapping | Phase 2 `map-description` | CLI acceptance summary/write tests |
| AC3 date-only -> all-day | Phase 2 `map-date` | Google create mapping + CLI acceptance |
| AC4 time included -> timed | Phase 2 `map-date` | Google create mapping + CLI acceptance |
| AC5 empty date fallback | Phase 1 fallback-date | sync fallback + CLI acceptance |
| AC6 idempotent rerun | Phase 4 prevent-duplicates | CLI idempotent rerun acceptance |
| AC7 delete propagation | Phase 2 fetch deleted state + Phase 3 delete-event | reconcile-delete + CLI acceptance |
| AC8 dry-run mode | Phase 5 dry-run CLI test | acceptance dry-run test |

## Daily Execution Rhythm
1. Start with the smallest failing test in the active phase.
2. Make the minimal implementation change to turn it green.
3. Run only the most relevant test subset.
4. Once the local group is green, run the lane gate command set.
5. Refactor while still green.
6. Capture any new fixture or acceptance evidence before moving phases.

## Lane Handoff Rules
- Lane A hands off only after fixtures and config/domain tests are green.
- Lane B and Lane C can run in parallel after Lane A merges.
- Lane D starts only when Lane B and Lane C each expose stable contracts.
- Lane E waits until CLI flags and output wording are unlikely to churn.

## Minimal Gate Commands by Phase
- Phase 1: `npm run lint && npm run typecheck && npm run test:unit`
- Phase 2: `npm run test:integration -- notion`
- Phase 3: `npm run test:integration -- google`
- Phase 4: targeted sync unit tests + `npm run test:unit`
- Phase 5: `npm run test:acceptance`
- Phase 6: `npm run sync -- --dry-run` plus docs/acceptance checks

## Exit Condition
The TDD sequence is complete when contributors can point from each acceptance criterion to a red-first test path, then to a green implementation phase, with no critical sync rule introduced without an earlier failing test.
