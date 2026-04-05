# notion2googleCalendar

A maintainable, manual-run CLI for syncing one Notion database into one Google Calendar.

## v1 scope
- One-way sync: **Notion -> Google Calendar**
- Manual execution from a Linux machine
- One Notion database and one Google Calendar
- Source-of-truth is Notion
- Property mapping:
  - title: `이름`
  - date: `날짜`
  - description: `설명`

## What is implemented now
- configuration validation
- Notion page -> domain record mapping
- Google Calendar event identity + payload mapping
- sync decision engine (`create` / `update` / `delete` / `noop`)
- manual CLI entrypoint
- dry-run/write execution path
- unit + integration + acceptance-oriented test baseline

## Planned structure
```txt
src/
  cli/
  config/
  domain/
  adapters/
  sync/
  shared/

tests/
  fixtures/
  unit/
  integration/
  acceptance/
```

## Setup
```bash
npm install
cp .env.example .env
```

## Google auth setup modes
### Option A — installed-app OAuth for local use
1. Create a desktop OAuth client in Google Cloud.
2. Save the credentials JSON locally.
3. Put its path in `GOOGLE_OAUTH_CREDENTIALS_PATH`.
4. Run:
```bash
npm run sync -- --init-auth
```
This opens the browser once and stores the token at `GOOGLE_OAUTH_TOKEN_PATH`.

### Option B — refresh-token auth
Set:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`

## Commands
```bash
npm run lint
npm run typecheck
npm run test
npm run test:unit
npm run test:integration
npm run test:acceptance
npm run build
npm run sync -- --dry-run
npm run sync -- --write
npm run sync -- --init-auth
```

## CLI behavior
- `--dry-run`: reads Notion + Google state and prints planned changes
- `--write`: applies the sync decisions to Google Calendar
- `--json`: prints the summary as JSON
- `--init-auth`: completes the local Google OAuth login flow

## Current limitations
- real external API runs still require your own Notion integration access and Google auth files/tokens
- webhook/cron automation is intentionally out of scope for v1
- multi-database, multi-calendar, and bidirectional sync are not implemented

## Manual smoke-test checklist
1. Put your Notion integration token in `.env`.
2. Put your test calendar ID in `.env`.
3. For local OAuth, set `GOOGLE_OAUTH_CREDENTIALS_PATH` and run `npm run sync -- --init-auth`.
4. Run `npm run sync -- --dry-run` and confirm the planned create/update/delete summary looks correct.
5. Run `npm run sync -- --write` only against your test calendar first.

## Testing philosophy
This project uses test-first development:
- contracts and fixtures first
- adapter tests before sync logic changes
- acceptance checks before changing operator behavior

## Public-repo goals
- readable file layout
- small responsibilities per file
- easy onboarding from README
- maintainability over clever abstractions
