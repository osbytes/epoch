# Contributing to Epoch

Thanks for your interest in contributing! This guide covers project setup, common workflows, and how to open issues and pull requests.

## Project Setup

Epoch is a pnpm monorepo. Make sure you have **Node.js 20+** and **pnpm** installed.

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
