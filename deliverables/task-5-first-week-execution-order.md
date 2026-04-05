# First-Week Execution Order — Notion → Google Calendar Sync v1

Source inputs:
- `.omx/plans/prd-notion-google-calendar-sync-v1.md`
- `.omx/plans/test-spec-notion-google-calendar-sync-v1.md`
- `deliverables/task-1-lane-by-lane-task-board.md`

## Operating intent for week 1

Use the first week to establish a mergeable vertical path without overbuilding:
1. freeze shared contracts and fixtures first,
2. finish both adapters in parallel,
3. wire the sync engine only after adapter contracts stabilize,
4. end the week with a dry-run/write-ready CLI plus public-repo docs and smoke evidence.

## Day-by-Day Order

### Day 1 — Foundation lock-in

**Morning**
- Open `PR 1 / lane/foundation-contracts`.
- Build only the baseline needed by later lanes:
  - repo scripts/toolchain,
  - `src/config/**`,
  - `src/domain/**`,
  - `tests/fixtures/**`,
  - starter `README.md` and `.env.example`.
- Write the failing tests/checks named in the test spec for Lane A:
  - env schema parsing,
  - domain record contract,
  - fallback date helper,
  - fixture loading sanity check.

**Afternoon**
- Make `PR 1` green and reviewable.
- Require merge evidence before EOD:
  - lint green,
  - typecheck green,
  - Lane A tests green,
  - fixture names confirmed for date-only, timed, empty-date, deleted-row, existing-event cases.

**Do not start**
- Lane D implementation,
- final README polish,
- any cron/webhook work.

### Day 2 — Parallel adapter start after PR 1 merge

**Morning**
- Merge `PR 1`.
- Immediately branch parallel work:
  - `PR 2 / lane/notion-adapter`
  - `PR 3 / lane/google-adapter`

**Lane B focus**
- Implement Notion client shell.
- Lock parsing for `이름`, `날짜`, `설명`.
- Preserve empty-date rows and archived/deleted row state.

**Lane C focus**
- Implement identity helper over `extendedProperties.private`.
- Add lookup/create/update/delete adapter surfaces.
- Keep result payloads structured enough for future dry-run summaries.

**Exit target for Day 2**
- Both adapter PRs have failing tests written and at least one implementation pass pushed for review comments.

### Day 3 — Adapter stabilization and merge

**Morning**
- Finish remaining integration tests for `PR 2` and `PR 3`.
- Explicitly verify:
  - date-only vs timed mapping survives normalization,
  - empty-date fallback is not dropped by Notion normalization,
  - identity lookup finds existing Google events,
  - delete path exists for archived/deleted source rows.

**Afternoon**
- Merge `PR 2` and `PR 3` once contracts stop moving.
- Hand Lane D a short adapter contract note:
  - exact `NotionRecord` shape consumed,
  - exact Google adapter return shape,
  - metadata keys used for event identity.

**Do not carry forward**
- adapter-local duplicate type definitions,
- sync decision logic inside either adapter.

### Day 4 — Sync engine and CLI integration

**Morning**
- Open `PR 4 / lane/sync-engine-cli` for reconcile logic.
- Start with failing tests for:
  - create/update/delete/no-op decisions,
  - duplicate prevention,
  - empty-date fallback behavior in `Asia/Seoul`.

**Afternoon**
- Add CLI orchestration only after the decision engine is stable:
  - `sync --dry-run`
  - `sync --write`
  - summary output suitable for PR evidence and manual runs.

**Exit target for Day 4**
- core acceptance scenarios run locally against fixtures,
- dry-run/write code paths share one decision engine,
- no SDK-specific logic leaks into `src/sync/**`.

### Day 5 — Docs, smoke evidence, and release-readiness pass

**Morning**
- Open/finalize `PR 5 / lane/verification-docs` (or equivalent final verification PR if docs were started earlier).
- Align README and `.env.example` to the implemented CLI:
  - setup,
  - auth/config,
  - dry-run,
  - write mode,
  - test commands.

**Afternoon**
- Collect the week-1 evidence package:
  - lint/typecheck/test results,
  - fixture-based dry-run output,
  - test-calendar smoke run notes,
  - rerun-without-duplicates evidence,
  - delete-propagation check.
- Perform leader integration review before merging to main.

**Week-1 done definition**
- One manual-run v1 sync flow is demonstrably shippable to a public repo reader.

## Merge/Gate Sequence

1. **Gate A:** `PR 1` merged before adapter work is allowed to land.
2. **Gate B:** `PR 2` + `PR 3` merged before `PR 4` finalizes.
3. **Gate C:** `PR 4` green before docs/smoke verification are declared final.
4. **Gate D:** docs + smoke evidence complete before merge to `main`.

## Concrete owner rhythm

| Time block | Primary lane(s) | Primary reviewer focus |
| --- | --- | --- |
| Day 1 | A | contract clarity, fixture completeness, script sanity |
| Day 2 | B + C | mapping correctness, identity/dedup design |
| Day 3 | B + C | integration stability, no cross-lane leakage |
| Day 4 | D | sync decisions, CLI boundaries, idempotency |
| Day 5 | E + leader | public-repo readability, smoke evidence, final gate package |

## Contingency rules

- If `PR 1` slips, do **not** let B/C invent replacement contracts; shift the whole schedule by one day.
- If only one adapter is ready by late Day 3, let Lane D start against the merged adapter but keep CLI work behind the missing adapter gate.
- If acceptance coverage is incomplete on Day 5, ship the docs/verif PR only after the missing acceptance cases are added; do not paper over gaps with README text.

## What to explicitly defer beyond week 1

- cron scheduling,
- webhook listener entrypoints,
- multi-database or multi-calendar support,
- bidirectional sync,
- subscription/iCal UX.
