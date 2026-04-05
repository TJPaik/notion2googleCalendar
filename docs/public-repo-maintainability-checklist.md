# Public Repo Maintainability Checklist

This checklist turns the PRD/test-spec maintainability goals into a small set of public-repo rules for `notion2googleCalendar`.

## Why this exists

The repo is greenfield, but the project already has strong constraints:
- a new contributor should understand the shape of the project within 10 minutes
- core sync logic should stay readable and test-protected
- setup and manual execution should be possible from README alone
- v1 should stay simple even if future automation is added later

Use this checklist before opening the repo publicly and again before merging any feature that touches sync behavior.

---

## 1) Baseline public-repo files

### Must exist before public launch
- [ ] `README.md` explains purpose, architecture, setup, manual sync, dry-run, and test commands
- [ ] `.env.example` documents every required environment variable with safe placeholder values
- [ ] `LICENSE` is committed
- [ ] `CONTRIBUTING.md` explains local setup, branch/PR expectations, and verification commands
- [ ] `SECURITY.md` explains how to report vulnerabilities privately
- [ ] `.gitignore` excludes secrets, build output, and local credentials

### Should exist early
- [ ] `docs/architecture.md` or equivalent lightweight structure overview exists
- [ ] example fixture inputs/outputs are committed for fast contributor orientation
- [ ] PR/issue templates exist once outside contributors are expected

---

## 2) Codebase shape and ownership rules

### Directory boundaries
- [ ] `src/config/` only handles configuration/schema loading
- [ ] `src/domain/` contains pure domain types and rules
- [ ] `src/adapters/notion/` contains Notion SDK/API details only
- [ ] `src/adapters/google/` contains Google Calendar SDK/API details only
- [ ] `src/sync/` owns reconciliation/build/run orchestration logic
- [ ] `src/cli/` only wires commands/options to application services
- [ ] `tests/` mirrors unit/integration/acceptance intent from the test spec

### Maintainability guardrails
- [ ] no single file becomes the “smart everything” file
- [ ] new abstractions are added only after duplication or complexity clearly justifies them
- [ ] named exports are preferred over default exports
- [ ] comments explain **why**, not obvious **what**
- [ ] future automation hooks (cron/webhook) do not complicate the v1 manual path

---

## 3) Testing and regression protection

### Required before changing core sync logic
- [ ] unit tests cover the changed rule or mapping behavior
- [ ] fixture inputs exist for the scenario being changed
- [ ] at least one acceptance/integration path proves the behavior in context
- [ ] duplicate-prevention behavior is preserved or extended with explicit tests
- [ ] delete propagation behavior is preserved or extended with explicit tests

### Expected verification commands
- [ ] lint passes
- [ ] typecheck passes
- [ ] unit tests pass
- [ ] integration tests pass
- [ ] acceptance tests pass
- [ ] dry-run example output is still understandable to a new contributor

---

## 4) Documentation quality bar

A contributor who only reads the docs should be able to answer these questions quickly.

- [ ] What problem does this project solve?
- [ ] Why is Notion the source of truth?
- [ ] Which Notion properties are required (`이름`, `날짜`, `설명`)?
- [ ] How do all-day vs timed events work?
- [ ] What happens when `날짜` is empty?
- [ ] How are deletions/archives propagated?
- [ ] How do I run a safe dry-run?
- [ ] How do I run the real sync against a test calendar?
- [ ] Where do I look first if I want to change mapping logic?
- [ ] Which tests should I run before opening a PR?

If any answer is hard to find, the docs are not yet public-repo ready.

---

## 5) Review checklist for every PR

### Scope and readability
- [ ] change is small enough to review without reconstructing the whole system
- [ ] filenames and function names reveal intent clearly
- [ ] new code follows existing boundaries instead of creating cross-layer coupling
- [ ] README/docs were updated when behavior or setup changed

### Safety
- [ ] no secrets or real credentials were committed
- [ ] no dead code/debug logging remains
- [ ] dry-run/write behavior is still clearly separated
- [ ] idempotent rerun behavior is still covered by tests/evidence

### Evidence package
- [ ] verification output is attached in the PR description or issue comment
- [ ] manual smoke-test notes are included when external APIs are involved
- [ ] known gaps are listed explicitly instead of implied away

---

## 6) “Ready to share publicly” gate

The repo is ready for broader public use only when all of the following are true.

- [ ] a first-time contributor can follow the README without private tribal knowledge
- [ ] local setup does not require guessing hidden environment variables
- [ ] sync rules are backed by readable tests and fixtures
- [ ] core logic is separated from adapter/API code
- [ ] contributor/security/license basics are present
- [ ] the project still feels like a simple manual-sync CLI, not a prematurely generalized platform

---

## 7) Suggested first implementation order for maintainability

1. Create the public-facing docs/files: `README.md`, `.env.example`, `.gitignore`, `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`
2. Land `src/config`, `src/domain`, and `tests/fixtures` before adapter complexity grows
3. Add sync logic only behind tests that lock the acceptance criteria
4. Keep dry-run output human-readable from the start
5. Delay automation/scheduler/webhook concerns until the manual CLI path is solid

This ordering keeps the project understandable while the feature surface grows.
