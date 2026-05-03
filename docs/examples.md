# Examples

> Common patterns and real-world use cases for Epoch.

---

## Example 1: SaaS Onboarding Wizard

A 4-step wizard with workspace creation, team info, optional invites, and review.

```typescript
import { z } from 'zod'
import { createFormFlow } from '@epoch/core'

const OnboardingSchema = z.object({
  workspaceName: z.string().min(1),
  urlSlug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  teamSize: z.enum(['1-5', '6-20', '21-50', '51-100', '100+']),
  useCase: z.string().min(1),
  teammateEmails: z.array(z.string().email()).optional(),
})

type OnboardingData = z.infer<typeof OnboardingSchema>

const flow = createFormFlow({
  schema: OnboardingSchema,
  steps: {
    workspace: ['workspaceName', 'urlSlug'],
    team: ['teamSize', 'useCase'],
    invite: ['teammateEmails'],
    review: [],
  },
  persist: { key: 'onboarding-draft', debounceMs: 800 },
  mutation: async (data) => {
    const response = await fetch('/api/workspaces', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response.json()
  },
})
```

See `apps/demo/` for the full React implementation with Tailwind styling.

---

## Example 2: Checkout Flow

A 3-step checkout with shipping, payment, and order review.

```typescript
import { z } from 'zod'

const CheckoutSchema = z.object({
  fullName: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  postalCode: z.string().length(5),
  country: z.string().min(1),
  cardNumber: z.string().regex(/^\d{16}$/),
  expiryDate: z.string().regex(/^\d{2}\/\d{2}$/),
  cvv: z.string().length(3),
})

const checkoutFlow = createFormFlow({
  schema: CheckoutSchema,
  steps: {
    shipping: ['fullName', 'addressLine1', 'addressLine2', 'city', 'postalCode', 'country'],
    payment: ['cardNumber', 'expiryDate', 'cvv'],
    review: [],
  },
  mutation: trpc.checkout.create,
})
```

**Pattern:** Empty step arrays (`review: []`) create review-only steps with no editable fields.

---

## Example 3: Multi-User Intake Form

A dynamic form where fields depend on a previous selection.

```typescript
const IntakeSchema = z.object({
  formType: z.enum(['personal', 'business']),
  personalName: z.string().optional(),
  personalEmail: z.string().email().optional(),
  businessName: z.string().optional(),
  businessTaxId: z.string().optional(),
})

const intakeFlow = createFormFlow({
  schema: IntakeSchema,
  steps: {
    type: ['formType'],
    details: ['personalName', 'personalEmail', 'businessName', 'businessTaxId'],
  },
})
```

In the `details` step component, conditionally render fields based on `values.formType`:

```tsx
function DetailsStep() {
  const { values, setValues } = useFormFlow<IntakeData>()

  return (
    <div>
      {values.formType === 'personal' ? (
        <>
          <input
            value={values.personalName ?? ''}
            onChange={(e) => setValues({ personalName: e.target.value })}
          />
          <input
            value={values.personalEmail ?? ''}
            onChange={(e) => setValues({ personalEmail: e.target.value })}
          />
        </>
      ) : (
        <>
          <input
            value={values.businessName ?? ''}
            onChange={(e) => setValues({ businessName: e.target.value })}
          />
          <input
            value={values.businessTaxId ?? ''}
            onChange={(e) => setValues({ businessTaxId: e.target.value })}
          />
        </>
      )}
    </div>
  )
}
```

---

## Example 4: Non-Linear Navigation

Jump directly to any step using `goTo()`.

```tsx
function StepIndicator() {
  const { currentStep, goTo, visitedSteps } = useFormFlow()
  const steps = ['personal', 'address', 'payment', 'review']

  return (
    <div>
      {steps.map((step, index) => (
        <button
          key={step}
          onClick={() => {
            // Only allow jumping to visited steps or the next available one
            if (visitedSteps.includes(step) || step === currentStep) {
              goTo(step)
            }
          }}
          disabled={
            !visitedSteps.includes(step) && step !== currentStep
          }
        >
          {index + 1}. {step}
        </button>
      ))}
    </div>
  )
}
```

---

## Example 5: Custom Validation Before Submit

Sometimes you need extra checks beyond Zod before calling the mutation.

```tsx
function ReviewStep() {
  const { values, submit, submitError } = useFormFlow()
  const [customError, setCustomError] = useState<string | null>(null)

  async function handleSubmit() {
    setCustomError(null)

    // Custom business logic
    if (values.teamSize === '100+' && !values.teammateEmails?.length) {
      setCustomError('Large teams must invite at least one teammate')
      return
    }

    const result = await submit()
    if (result !== null) {
      // Success
    }
  }

  return (
    <div>
      {customError && <p className="error">{customError}</p>}
      {submitError && <p className="error">{submitError.message}</p>}
      <button onClick={handleSubmit}>Submit</button>
    </div>
  )
}
```

---

## Example 6: tRPC Integration

Epoch works seamlessly with tRPC mutations.

```typescript
import { createFormFlow } from '@epoch/core'
import { trpc } from './trpc-client'

const LeadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
})

const flow = createFormFlow({
  schema: LeadSchema,
  steps: {
    personal: ['firstName', 'lastName', 'email'],
  },
  mutation: trpc.leads.create,
})
```

The mutation receives **fully typed** `LeadSchema` input automatically.

---

## Example 7: Headless Step Indicator

Build any UI you want using `useStepFields`.

```tsx
function ProgressDots() {
  const steps = ['workspace', 'team', 'invite', 'review']

  return (
    <div className="flex gap-2">
      {steps.map((step) => {
        const { isCurrent, isVisited } = useStepFields(step)

        return (
          <div
            key={step}
            className={
              isCurrent
                ? 'w-3 h-3 rounded-full bg-blue-600'
                : isVisited
                  ? 'w-3 h-3 rounded-full bg-green-500'
                  : 'w-3 h-3 rounded-full bg-gray-300'
            }
          />
        )
      })}
    </div>
  )
}
```

---

## Example 8: Conditional Step Skipping

Skip a step based on user input.

```tsx
function TeamStep() {
  const { values, next, goTo } = useFormFlow()

  function handleNext() {
    if (values.teamSize === '1-5') {
      // Skip invite step for solo/small teams
      goTo('review')
    } else {
      next()
    }
  }

  return <button onClick={handleNext}>Next</button>
}
```

---

## Example 9: Reset Form After Success

Clear everything and start over after submission.

```tsx
function SuccessScreen() {
  const { data } = useFormFlow()

  function handleReset() {
    window.location.reload()
  }

  return (
    <div>
      <h2>Success!</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <button onClick={handleReset}>Start New Form</button>
    </div>
  )
}
```

**Note:** Full programmatic reset will be added in a future version. For now, `window.location.reload()` clears both React state and localStorage drafts.

---

## Example 10: Multiple Forms on One Page

Use separate providers for independent flows.

```tsx
function App() {
  return (
    <div className="grid grid-cols-2 gap-8">
      <FormFlowProvider flow={onboardingFlow}>
        <OnboardingWizard />
      </FormFlowProvider>

      <FormFlowProvider flow={feedbackFlow}>
        <FeedbackForm />
      </FormFlowProvider>
    </div>
  )
}
```

Each flow has its own isolated state, persistence key, and lifecycle.
