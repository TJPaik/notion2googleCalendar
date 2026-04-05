# Lane-by-Lane Task Board — Notion → Google Calendar Sync v1

Source inputs:
- `.omx/plans/prd-notion-google-calendar-sync-v1.md`
- `.omx/plans/test-spec-notion-google-calendar-sync-v1.md`

Planning assumptions:
- This is a work-breakdown artifact only; no implementation is implied here.
- `Lane A` must merge first because every later lane depends on the shared contracts, fixtures, and script baseline it defines.
- `Lane B` and `Lane C` can run in parallel after `Lane A` is merged.
- `Lane D` should start only after the adapter contracts from `Lane B` and `Lane C` are stable enough to consume without churn.
- `Lane E` starts early for review pressure, but its final acceptance/doc pass should land after `Lane D`.

## Cross-Lane Working Rules

| Rule | Concrete application |
| --- | --- |
| Keep files single-responsibility | Do not combine CLI orchestration, sync rules, and SDK details in one file. |
| Lock behavior with tests before refactors | Every lane opens with failing tests/checks from the test spec before implementation. |
| Prefer explicit contracts over implicit coupling | Shared types live in `src/domain/**` or `src/config/**`, not redefined inside adapters. |
| Preserve public-repo readability | README/example/env changes must explain only the current scope, not future automation. |
| Gate merges with visible evidence | Each lane hands off test/lint/typecheck output plus a short risk note. |

## Board Summary

| Lane | Branch | Entry gate | Exit gate | Primary outputs |
| --- | --- | --- | --- | --- |
| A — Foundation & Contracts | `lane/foundation-contracts` | None | Contracts + fixtures + tooling baseline merged | scaffold, env schema, domain types, fixture harness |
| B — Notion Adapter | `lane/notion-adapter` | Lane A merged | adapter mapping + integration tests green | Notion client, row parsing, normalization |
| C — Google Adapter | `lane/google-adapter` | Lane A merged | adapter CRUD + identity tests green | Google client, identity lookup, event mapping |
| D — Sync Engine + CLI | `lane/sync-engine-cli` | Lane B/C contracts stable | reconciliation + CLI acceptance tests green | sync engine, dry-run/write flow, summaries |
| E — Verification + Docs | `lane/verification-docs` | Lane A can start; final pass after D | docs + smoke evidence + acceptance checklist complete | README, `.env.example`, smoke notes, final verification pack |

## Lane A — Foundation & Contracts

| Card | Status | Depends on | Owner focus | Deliverable | Verification |
| --- | --- | --- | --- | --- | --- |
| A1. Toolchain scaffold | Planned | — | repo baseline | `package.json`, TS config, lint/test scripts, folder skeleton | lint/typecheck scripts execute without missing-path failures |
| A2. Config schema contract | Planned | A1 | config boundary | `src/config/schema.ts`, `src/config/env.ts` interface shape | failing+passing tests for required env and timezone handling |
| A3. Domain model freeze | Planned | A1 | shared types | `NotionRecord`, `CalendarEventInput`, `SyncDecision` types | unit tests or contract fixtures prove required fields |
| A4. Fixture harness | Planned | A1 | test data | `tests/fixtures/**` sample Notion rows + Google events | fixture load sanity check |
| A5. Contributor bootstrap docs | Planned | A1 | public repo onboarding | starter `README.md`, `.env.example` | command examples reference actual scripts |

### Lane A handoff checklist
- Shared file layout matches the PRD exactly enough that later lanes do not invent alternate directories.
- Fixture names already cover date-only, timed, empty-date, deleted-row, and existing-event cases.
- `Asia/Seoul` is represented in config defaults or documented env requirements.
- Lane B/C/D owners receive exact shared type names and fixture filenames from this lane.

## Lane B — Notion Adapter

| Card | Status | Depends on | Owner focus | Deliverable | Verification |
| --- | --- | --- | --- | --- | --- |
| B1. Notion client shell | Planned | A1, A2 | API boundary | client wrapper with auth/config input contract | integration test can construct client with fixture env |
| B2. Property parsing: `이름` | Planned | A3, A4 | mapping | title extraction logic | targeted mapping test |
| B3. Property parsing: `날짜` | Planned | A3, A4 | mapping | date/date-time normalization into domain record | date-only + timed + empty-date tests |
| B4. Property parsing: `설명` | Planned | A3, A4 | mapping | description extraction logic | targeted mapping test |
| B5. Row fetch + normalization path | Planned | B1-B4 | integration | DB query -> normalized `NotionRecord[]` path | integration test over sample rows |

### Lane B handoff checklist
- Output type is the Lane A `NotionRecord`; no adapter-local clone types.
- Empty `날짜` rows are preserved, not filtered out.
- Deleted/archived rows are surfaced distinctly so Lane D can propagate deletions.
- Normalization rules are documented inline in tests, not hidden only in implementation.

## Lane C — Google Adapter

| Card | Status | Depends on | Owner focus | Deliverable | Verification |
| --- | --- | --- | --- | --- | --- |
| C1. Event identity helper | Planned | A3, A4 | idempotency | `extendedProperties.private` read/write helper | lookup tests against existing event fixture |
| C2. Existing event lookup | Planned | C1 | matching | search by `source`, `notionPageId`, `notionDatabaseId` | integration lookup test |
| C3. Create/update mapping | Planned | A3, C1 | write path | domain input -> Google event payload mapping | create/update mapping tests |
| C4. Delete path | Planned | C1 | removal | delete operation wrapper for archived/deleted source rows | delete integration test |
| C5. Adapter summary surface | Planned | C2-C4 | observability | normalized return shape for create/update/delete/no-op reporting | test asserts result payload is lane-D-friendly |

### Lane C handoff checklist
- All create/update payloads preserve title, description, date-only, and timed-event distinctions from domain inputs.
- Identity helper is the single source for dedup metadata keys.
- Adapter returns enough structured information for dry-run summaries later.
- No sync-decision logic leaks into this lane.

## Lane D — Sync Engine + CLI

| Card | Status | Depends on | Owner focus | Deliverable | Verification |
| --- | --- | --- | --- | --- | --- |
| D1. Reconcile decision table | Planned | A3, B5, C5 | core logic | create/update/delete/no-op engine | unit tests for decision matrix |
| D2. Calendar input builder | Planned | A3, B5 | event formation | domain record -> calendar input transformation | tests for title/description/date semantics |
| D3. Duplicate prevention path | Planned | C1, D1 | idempotency | rerun-safe sync flow | acceptance test for repeated execution |
| D4. Dry-run mode | Planned | D1-D3 | safe preview | plan-only execution mode with summary output | `sync --dry-run` acceptance test |
| D5. Write mode + CLI entrypoint | Planned | D4 | operator UX | `sync` command orchestration and exit codes | `sync --write` acceptance test |

### Lane D handoff checklist
- CLI contains orchestration only; comparison rules stay in `src/sync/**`.
- Dry-run and write share the same decision engine.
- Empty-date fallback uses “today in Asia/Seoul” consistently.
- Result summaries are readable enough to paste into PR evidence.

## Lane E — Verification + Docs

| Card | Status | Depends on | Owner focus | Deliverable | Verification |
| --- | --- | --- | --- | --- | --- |
| E1. Acceptance matrix tracking | Planned | A4 | coverage bookkeeping | traceability from AC1-AC9 to tests | checklist review against test spec |
| E2. README execution guide | Planned | A5, D5 | contributor UX | setup, dry-run, write, test commands | docs walk-through against actual CLI |
| E3. `.env.example` hardening | Planned | A5, B1, C3 | config clarity | env template with required variables and notes | doc/config consistency check |
| E4. Smoke test notes | Planned | C4, D5 | operator confidence | manual test-calendar runbook and evidence notes | smoke-run rehearsal checklist |
| E5. Final verification pack | Planned | B5, C5, D5 | release readiness | lint/typecheck/test/smoke evidence bundle | final gate review before merge |

### Lane E handoff checklist
- README reflects the real manual-run v1 story, not hypothetical cron/webhook support.
- Examples use the same property names fixed in the PRD: `이름`, `날짜`, `설명`.
- Smoke notes include duplicate-prevention rerun and delete-propagation checks.
- Final verification bundle is compact enough for a reviewer to scan in one PR session.

## Dependency View

```text
Lane A
 ├─> Lane B
 ├─> Lane C
 └─> Lane E (initial docs baseline)

Lane B ─┐
        ├─> Lane D
Lane C ─┘

Lane D ──> Lane E final pass
```

## Suggested Review Cadence

1. Review `Lane A` as a blocking foundation PR.
2. Review `Lane B` and `Lane C` in parallel once foundation types/fixtures are stable.
3. Review `Lane D` only after adapter outputs stop changing.
4. Use `Lane E` as the final “public repo readiness” review before merge to main.
