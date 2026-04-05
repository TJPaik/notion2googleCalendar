# Contributing

## Local workflow
1. Install dependencies with `npm install`
2. Copy `.env.example` to `.env`
3. Run checks before opening a PR:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test`

## Branching
- Keep PRs small and single-purpose.
- Prefer `test -> implementation -> refactor` commits when practical.
- Follow the repository Lore commit protocol.

## Review expectations
Each PR should explain:
- what changed
- why it changed
- how it was verified
- any remaining risks
