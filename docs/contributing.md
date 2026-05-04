# Contributing to Epoch Flow

Thanks for your interest in contributing! This guide covers project setup, common workflows, and how to open issues and pull requests.

## Project Setup

Epoch Flow is a pnpm monorepo. Make sure you have **Node.js 20+** and **pnpm** installed.

```bash
# Clone the repo
git clone https://github.com/osbytes/epoch.git
cd epoch

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run typecheck
pnpm typecheck
```

## Monorepo Structure

```
epoch/
├── packages/
│   ├── core/          # Framework-agnostic state machine + persistence
│   └── react/         # React provider and hooks
├── apps/
│   └── demo/          # SaaS onboarding wizard demo
├── docs/              # VitePress docs site (guides, API reference)
└── .github/           # CI/CD workflows and templates
```

The project logo (stepped-path mark for multi-step flows) lives at `docs/public/logo.svg`. VitePress serves it as `/logo.svg`; the repository `README.md` links to the same file under `docs/public/`.

## Development Workflow

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make your changes** in the relevant package(s).

3. **Run the verification commands** before committing:
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm build
   ```

4. **Add a changeset** if your change affects a published package:
   ```bash
   pnpm changeset
   ```

5. **Open a pull request** and fill out the PR template.

## Releasing to npm (maintainers)

The [Release workflow](https://github.com/osbytes/epoch/blob/main/.github/workflows/release.yml) runs on pushes to `main`. It uses [Changesets](https://github.com/changesets/changesets) to version packages and publish `@epochflow/core` and `@epochflow/react`.

For publishes to succeed:

1. **GitHub secret `NPM_TOKEN`** — Create an [npm automation token](https://docs.npmjs.com/creating-and-viewing-access-tokens) with permission to publish packages under the `@epochflow` scope. Add it as repository secret `NPM_TOKEN` (Organization secrets work if the repo belongs to an org).
2. **`@epochflow` on npm** — Create a free [npm organization](https://docs.npmjs.com/organizations) named **`epochflow`** (npm scopes cannot contain spaces; this matches the **Epoch Flow** product name). Add the token’s npm user as an owner or member with publish access.

If `NPM_TOKEN` is missing, the Changesets action logs `No NPM_TOKEN or OIDC available`. If the secret is set but **`npm publish` still fails with `E404 Not Found` on `PUT .../@epochflow%2f...`**, npm is usually rejecting the publish (and returning a misleading 404): the token’s user must be allowed to publish **`@epochflow/core`** and **`@epochflow/react`** (org membership or a granular token that lists those packages). Confirm locally with `npm whoami` after `npm config set //registry.npmjs.org/:_authToken "$NPM_TOKEN"`.

## TypeScript Standards

- `strict: true` is enforced everywhere.
- No `any` types — use `unknown` or proper generics.
- No `as` assertions — use type guards.
- No single-character variable names (except loop indices and coordinates).
- Explicit return types on all exported functions.

## Testing

- **Unit tests** use Vitest and live next to source files (`foo.ts` → `foo.test.ts`).
- **E2E tests** use Playwright and live in `apps/demo/e2e/`.
- Every new feature or bug fix should include tests.

## Commit Messages

We don't enforce a strict format, but please:

- Use the imperative mood (`Add feature` not `Added feature`).
- Keep the first line under 72 characters.
- Reference issues when applicable (`Fixes #123`).

## Code of Conduct

This project adopts the [Contributor Covenant](https://github.com/osbytes/epoch/blob/main/CODE_OF_CONDUCT.md). Please read it before participating.

## Security

See [SECURITY.md](https://github.com/osbytes/epoch/blob/main/SECURITY.md) for how to report vulnerabilities privately.

## Questions?

Open a [GitHub Discussion](https://github.com/osbytes/epoch/discussions) or ping us in an issue.
