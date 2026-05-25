# Contributing to Nasnet Panel

Thanks for taking the time to contribute. This document covers how to get a development environment running, the conventions this repo uses, and what to expect from code review.

## Getting started

The fastest path is the "From source" section of the [README](README.md#3-from-source-development). In short:

```bash
git clone https://github.com/nasnet-community/nasnet-panel.git
cd nasnet-panel
npm install
npm run dev:all
```

Requires Node.js 20+ and Go 1.26+. The frontend runs on `http://localhost:3000`, the backend on `http://localhost:8080`.

## Branches

- Base your work on `dev`. Releases are cut from `main`; do not branch from `main`.
- Name branches descriptively, e.g. `wireless-client-table`, `fix-dhcp-lease-parse`.

## Commits

- Plain-prose subject lines. Keep them short and imperative ("add lease parser" rather than "added a parser for leases").
- No conventional-commit prefix on commit subjects. The conventional-commit scope (for example `feat(fe):`) belongs on the **PR title**, not on commits.
- Do not reference GitHub issue numbers in commit subjects. Issue links go in the PR description.

## Pull requests

- Target `dev` unless explicitly told otherwise.
- PR title uses a conventional-commit prefix and scope, e.g. `feat(fe): add WireGuard peer table`.
- If your PR closes a tracked issue, put `Closes #N` at the top of the description.
- Keep the description tight: a short summary and the bullet points that matter. The diff already shows what changed; the description explains why.
- Re-base or merge in the latest `dev` before opening the PR. This project prefers `git merge` over `git rebase` for syncing feature branches.

## What CI and the pre-push hook check

Husky runs the following on every `git push`, and CI re-runs them on the PR:

1. `npm run typecheck`
2. `npm run format`
3. `npm run lint`

Important: `npm run format` writes to disk but does not stage. **Always run `npm run format` and then `git add` before committing**, or CI will fail when its `format:check` step finds a diff.

For Go code, `golangci-lint` is the source of truth. See `backend/.golangci.yml`.

## Testing

End-to-end tests live in `frontend/tests/e2e/` and run under Playwright:

```bash
npm run e2e:install-browsers   # one-time
npm run e2e
npm run e2e:headed             # see the browser
```

There is no unit-test runner today. New tests go in the Playwright suite. Tests should be added or updated alongside the change they cover.

## Reporting bugs and requesting features

- **Bugs:** open a GitHub issue with reproduction steps, the version you saw it on (`docker inspect`, or the release tag), and the RouterOS version of any router involved.
- **Security bugs:** see [SECURITY.md](SECURITY.md). Do not open a public issue.
- **Feature requests:** open an issue describing the use case before sending a PR for anything non-trivial.

## Code review

A maintainer will pick up your PR. Reviews focus on:

- Correctness and edge cases (especially around RouterOS protocol fallback and batch rollback).
- Adherence to the linter and formatter (no skipping `--no-verify`).
- Tests for new behaviour where reasonably testable.
- Surface-area changes: API additions, env-var additions, install-script changes. These get extra scrutiny because they affect operators.

Be patient and be kind. We are.
