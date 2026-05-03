# Getting Started with Epoch

> A step-by-step guide from zero to your first multi-step form.

---

## Prerequisites

- Node.js 20 or later
- A React 18+ project (Vite, Next.js, Remix, etc.)
- A Zod schema defining your form shape

## Installation

```bash
npm install @epoch/react zod react react-dom
# or
pnpm add @epoch/react zod react react-dom
```

`@epoch/core` is included automatically as a dependency.

If you plan to submit data via tRPC, also install your tRPC client packages:

```bash
npm install @trpc/client @trpc/server
```

### Compatibility

| Package | Supported versions |
|---------|--------------------|
| React | `^18.0.0 \| ^19.0.0` |
| Zod | `^3.22.0` |
| tRPC | `^10.0.0 \| ^11.0.0` (optional) |

> **React Server Components (RSC):** Epoch is currently client-only. Use it inside `"use client"` boundaries in Next.js App Router.

---

### What about React Hook Form?

Epoch provides its own lightweight controlled-state form handling (`values` / `setValues`). You can use it **alongside** React Hook Form if you prefer — for example, using RHF inside individual steps for advanced field-level validation — but **React Hook Form is not required**.

---

## Step 1: Define Your Schema

Epoch uses **Zod** to define the shape of your form and validate each step.

```typescript
import { z } from 'zod'

export const OnboardingSchema = z.object({
  workspaceName: z.string().min(1, 'Workspace name is required'),
  urlSlug: z
    .string()
    .min(1, 'URL slug is required')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  teamSize: z.enum(['1-5', '6-20', '21-50', '51-100', '100+'], {
    required_error: 'Please select a team size',
  }),
  useCase: z.string().min(1, 'Please select a use case'),
})

export type OnboardingData = z.infer<typeof OnboardingSchema>
```

**Key points:**
- The schema must represent the **entire** form, not just one step.
- Error messages defined here are what users see when validation fails.

---

## Step 2: Create the Flow

Use `createFormFlow` to wire your schema, steps, persistence, and optional mutation together.

```typescript
import { createFormFlow } from '@epoch/core'
import { OnboardingSchema } from './schema'

export const onboardingFlow = createFormFlow({
  schema: OnboardingSchema,
  steps: {
    workspace: ['workspaceName', 'urlSlug'],
    team: ['teamSize', 'useCase'],
    review: [],
  },
  persist: {
    key: 'onboarding-draft',
    debounceMs: 1000,
  },
  mutation: async (data) => {
    // Your submit logic — tRPC, REST, GraphQL, etc.
    const response = await fetch('/api/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response.json()
  },
})
```

**What each option does:**

| Option | Required | Description |
|--------|----------|-------------|
| `schema` | ✅ | Zod schema for the full form |
| `steps` | ✅ | Maps step names → array of field keys |
| `persist` | ❌ | Auto-saves draft to `localStorage` |
| `mutation` | ❌ | Async function called on `submit()` |

---

## Step 3: Provide the Flow to Your App

Wrap your component tree (or just the wizard) in `FormFlowProvider`.

```tsx
import { FormFlowProvider } from '@epoch/react'
import { onboardingFlow } from './flow'

function App() {
  return (
    <FormFlowProvider flow={onboardingFlow}>
      <OnboardingWizard />
    </FormFlowProvider>
  )
}
```

---

## Step 4: Build Step Components

Use `useFormFlow` inside each step to read state, set values, and navigate.

```tsx
import { useFormFlow } from '@epoch/react'
import type { OnboardingData } from './schema'

export function WorkspaceStep() {
  const { values, errors, setValues, validateCurrentStep, next } =
    useFormFlow<OnboardingData>()

  function handleNext() {
    const stepErrors = validateCurrentStep()
    if (stepErrors === null) {
      next()
    }
  }

  return (
    <div>
      <label>
        Workspace name
        <input
          value={values.workspaceName ?? ''}
          onChange={(e) => setValues({ workspaceName: e.target.value })}
        />
      </label>
      {errors.workspaceName && (
        <p className="error">{errors.workspaceName[0]}</p>
      )}

      <label>
        URL slug
        <input
          value={values.urlSlug ?? ''}
          onChange={(e) => setValues({ urlSlug: e.target.value })}
        />
      </label>
      {errors.urlSlug && <p className="error">{errors.urlSlug[0]}</p>}

      <button onClick={handleNext}>Next</button>
    </div>
  )
}
```

**Important patterns:**

1. **Always call `validateCurrentStep()` before `next()`** — this runs Zod validation only on the fields for the current step.
2. **Pass partial objects to `setValues`** — it merges with existing state rather than replacing.
3. **Type `useFormFlow<OnboardingData>()`** — this gives you typed `values` and errors.

---

## Step 5: Wire Up a Router

Render the correct step based on `currentStep`.

```tsx
import { useFormFlow } from '@epoch/react'
import { WorkspaceStep } from './WorkspaceStep'
import { TeamStep } from './TeamStep'
import { ReviewStep } from './ReviewStep'

export function OnboardingWizard() {
  const { currentStep, data } = useFormFlow()

  // Show success screen after submission
  if (data !== null) {
    return <SuccessScreen />
  }

  const steps: Record<string, JSX.Element> = {
    workspace: <WorkspaceStep />,
    team: <TeamStep />,
    review: <ReviewStep />,
  }

  return (
    <div>
      <ProgressIndicator />
      {steps[currentStep] ?? <WorkspaceStep />}
    </div>
  )
}
```

---

## Step 6: Add Persistence UI (Optional)

If you configured `persist`, use `usePersistedDraft` to show a "restore draft" banner. Gate the banner on `shouldShowRestorePrompt` (not only `hasDraft`) so it hides after the user restores while the snapshot can stay in storage.

```tsx
import { usePersistedDraft } from '@epoch/react'
import type { OnboardingData } from './schema'

export function DraftBanner() {
  const { shouldShowRestorePrompt, restoreDraft, clearDraft } =
    usePersistedDraft<OnboardingData>()

  if (!shouldShowRestorePrompt) return null

  return (
    <div className="draft-banner">
      <p>You have a saved draft. Would you like to restore it?</p>
      <button onClick={restoreDraft}>Restore</button>
      <button onClick={clearDraft}>Start fresh</button>
    </div>
  )
}
```

---

## Step 7: Submit the Form

On your final step, call `submit()` after validating.

```tsx
import { useFormFlow } from '@epoch/react'

export function ReviewStep() {
  const { values, isSubmitting, submitError, submit, back } = useFormFlow()

  async function handleSubmit() {
    const result = await submit()
    if (result !== null) {
      // Success! The form will re-render with `data !== null`
    }
  }

  return (
    <div>
      <h2>Review</h2>
      <pre>{JSON.stringify(values, null, 2)}</pre>

      {submitError && (
        <p className="error">{submitError.message}</p>
      )}

      <button onClick={back} disabled={isSubmitting}>
        Back
      </button>
      <button onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </div>
  )
}
```

---

## Next Steps

- **Add more steps** — just add keys to the `steps` config and new components.
- **Skip steps conditionally** — use `goTo('stepName')` for non-linear navigation.
- **Style the step indicator** — see `useStepFields()` in the API reference.
- **Read the architecture guide** — understand how the vanilla store and state machine work.

---

## Common Pitfalls

| Problem | Cause | Fix |
|---------|-------|-----|
| "Validation not working" | Forgetting to call `validateCurrentStep()` before `next()` | Add the validation call |
| "Values reset on refresh" | Not configuring `persist` | Add `persist: { key: '...' }` to `createFormFlow` |
| "Type errors on `values`" | Missing generic on `useFormFlow` | Use `useFormFlow<YourDataType>()` |
| "Submit button does nothing" | No `mutation` configured | Pass a `mutation` function to `createFormFlow` |
