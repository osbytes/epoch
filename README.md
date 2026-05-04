# Epoch Flow

<p align="center">
  <img
    src="docs/public/logo.svg"
    alt="Epoch Flow — multi-step form flow"
    width="160"
    height="160"
  />
</p>

> Draft-aware, end-to-end typed multi-step form flows for React + tRPC + Zod.

<!-- Org set to osbytes -->
[![CI](https://github.com/osbytes/epoch/actions/workflows/ci.yml/badge.svg)](https://github.com/osbytes/epoch/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@epochflow/core)](https://www.npmjs.com/package/@epochflow/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Epoch Flow is a thin, headless workflow orchestrator that composes **Zod** and **tRPC** into typed, persistent, multi-step form flows — without replacing either of them.

## Features

- **Step-based navigation** — Linear `next` / `back` / `goTo` with built-in guards
- **Per-step Zod validation** — Only validate the fields visible on the current step
- **Draft persistence** — Auto-save to `localStorage` with debounce; restore on return
- **Typed tRPC mutations** — Submit flows directly to your tRPC router with full inference
- **Headless by design** — Bring your own UI; zero styling opinions
- **Framework-agnostic core** — Vanilla JS state machine + store; React bindings in a separate package
- **Lightweight** — ~9 KB total (gzipped) including React bindings

## Install

```bash
npm install @epochflow/react zod react react-dom
# or
pnpm add @epochflow/react zod react react-dom
```

> `@epochflow/core` is included automatically as a dependency of `@epochflow/react`.

If you plan to submit data via tRPC, also install your tRPC client packages:

```bash
npm install @trpc/client @trpc/server
```

## Compatibility

| Package         | Supported versions |
|-----------------|--------------------|
| React           | `^18.0.0 \| ^19.0.0` |
| React DOM       | `^18.0.0 \| ^19.0.0` |
| Zod             | `^3.22.0`          |
| tRPC Client     | `^10.0.0 \| ^11.0.0` (optional) |
| tRPC Server     | `^10.0.0 \| ^11.0.0` (optional) |

> **React Server Components (RSC):** Epoch Flow is currently client-only. It works inside `"use client"` boundaries in Next.js App Router.

## 30-Second Example

```tsx
import { z } from 'zod'
import { createFormFlow } from '@epochflow/core'
import { FormFlowProvider, useFormFlow } from '@epochflow/react'

const LeadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
})

type LeadData = z.infer<typeof LeadSchema>

const flow = createFormFlow({
  schema: LeadSchema,
  steps: {
    personal: ['firstName', 'lastName'],
    contact: ['email'],
  },
  persist: { key: 'lead-draft', debounceMs: 1000 },
  mutation: async (data) => {
    const response = await fetch('/api/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response.json()
  },
})

function PersonalStep() {
  const { values, errors, setValues, next, validateCurrentStep } =
    useFormFlow<LeadData>()

  function handleNext() {
    if (validateCurrentStep() === null) next()
  }

  return (
    <>
      <input
        value={values.firstName ?? ''}
        onChange={(event) => setValues({ firstName: event.target.value })}
      />
      {errors.firstName && <span>{errors.firstName}</span>}
      <button onClick={handleNext}>Next</button>
    </>
  )
}

function App() {
  return (
    <FormFlowProvider flow={flow}>
      <PersonalStep />
    </FormFlowProvider>
  )
}
```

## What about React Hook Form?

Epoch Flow provides its own lightweight controlled-state form handling (`values` / `setValues`). You can use it **alongside** React Hook Form if you prefer — for example, using RHF inside individual steps for advanced field-level validation — but **React Hook Form is not required**.

## Packages

| Package | Purpose | Install |
|---------|---------|---------|
| `@epochflow/core` | Framework-agnostic state machine, store, validation, persistence | Included with `@epochflow/react` |
| `@epochflow/react` | React provider, hooks (`useFormFlow`, `useStepFields`, `usePersistedDraft`) | `npm i @epochflow/react` |

## Compared to...

| Tool | What it does | How Epoch Flow differs |
|------|-------------|---------------------|
| **React Hook Form** | Performant form validation with uncontrolled inputs | Epoch Flow focuses on multi-step orchestration, persistence, and tRPC submission — not field-level performance. Use both together if you like. |
| **[Wizzard](https://github.com/ZizzX/wizzard-packages)** | Modular headless wizard engine with multiple framework bindings | Epoch Flow is smaller and more opinionated: one factory (`createFormFlow`), one validation strategy (Zod), and first-class tRPC typing. |
| **Rolling your own** | `useReducer` + `zodResolver` + `localStorage` | Epoch Flow saves you from writing and maintaining the same glue code in every project. |

## Demo

A polished SaaS onboarding wizard lives in `apps/demo/`. It showcases:

- Step transitions with animations
- Draft persistence (refresh the page, data returns)
- Per-step validation
- Typed tRPC mutation (mocked backend)
- Mobile-responsive layout

```bash
cd apps/demo
pnpm dev
```

## Documentation

- **Docs site** — Run locally with `pnpm docs:dev`. When published to GitHub Pages from this repo, the site is served under the `/epoch/` base path (see `docs/.vitepress/config.mts`).
- [Getting Started](./docs/getting-started.md) — Step-by-step tutorial
- [API Reference](./docs/api-reference.md) — Complete API documentation
- [Examples](./docs/examples.md) — Common patterns and recipes
- [Architecture](./docs/architecture.md) — How it works under the hood
- [Contributing](./CONTRIBUTING.md) — Development workflow
- [Changelog](./CHANGELOG.md) — Release history (per-package via Changesets)
- [Security](./SECURITY.md) — Vulnerability disclosure
- [Code of Conduct](./CODE_OF_CONDUCT.md) — Community guidelines

## License

MIT © Epoch Flow Contributors