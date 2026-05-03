# API Reference

> Complete documentation of every public export from `@epoch/core` and `@epoch/react`.

---

## Table of Contents

- [@epoch/core](#epoch-core)
  - [`createFormFlow`](#createformflow)
  - [`FlowConfig`](#flowconfig)
  - [`FlowState`](#flowstate)
  - [`FormFlow`](#formflow)
  - [`createStore`](#createstore)
  - [`createPersistEngine`](#createpersistengine)
  - [`PersistConfig`](#persistconfig)
  - [`PersistEngine`](#persistengine)
  - [`zodAdapter`](#zodadapter)
  - [`ValidationAdapter`](#validationadapter)
  - [`createStateMachine`](#createstatemachine)
  - [`FlowStatus`](#flowstatus)
- [@epoch/react](#epoch-react)
  - [`FormFlowProvider`](#formflowprovider)
  - [`useFormFlow`](#useformflow)
  - [`useFormFlowContext`](#useformflowcontext)
  - [`useStepFields`](#usestepfields)
  - [`usePersistedDraft`](#usepersisteddraft)

---

## `@epoch/core` {#epoch-core}

### `createFormFlow`

```typescript
function createFormFlow<T>(config: FlowConfig<T>): FormFlow<T>
```

Creates a typed, multi-step form flow with validation, persistence, and optional mutation support.

**Example:**

```typescript
const flow = createFormFlow({
  schema: MySchema,
  steps: {
    personal: ['firstName', 'lastName', 'email'],
    address: ['street', 'city', 'state'],
    review: [],
  },
  persist: { key: 'my-draft', debounceMs: 1000 },
  mutation: trpc.leads.create,
})
```

---

### `FlowConfig`

```typescript
interface FlowConfig<T> {
  schema: z.ZodType<T>
  steps: Record<string, (keyof T)[]>
  persist?: { key: string; debounceMs?: number }
  mutation?: (input: T) => Promise<unknown>
}
```

| Property | Required | Description |
|----------|----------|-------------|
| `schema` | ✅ | Zod schema defining the shape and validation rules |
| `steps` | ✅ | Maps step names → arrays of field names |
| `persist` | ❌ | Configures localStorage draft persistence |
| `mutation` | ❌ | Async function called when `submit()` succeeds validation |

---

### `FlowState`

```typescript
interface FlowState<T = unknown> {
  values: Partial<T>
  errors: Record<string, string[]>
  currentStep: string
  visitedSteps: string[]
  isDirty: boolean
  isSubmitting: boolean
  isValidating: boolean
  submitError: Error | null
  data: unknown | null
}
```

The reactive state shape held by the internal store. React hooks return slices of this state.

---

### `FormFlow`

```typescript
interface FormFlow<T> {
  config: FlowConfig<T>
  store: ReturnType<typeof createStore<T>>
  stateMachine: ReturnType<typeof createStateMachine>
  validator: ValidationAdapter<T>
  persistEngine: PersistEngine | null
  stepNames: string[]
  next: () => string | null
  back: () => string | null
  goTo: (stepName: string) => string | null
  canNext: () => boolean
  canBack: () => boolean
  canSubmit: () => boolean
  validateCurrentStep: () => Record<string, string[]> | null
  validateAll: () => Record<string, string[]> | null
  setValues: (values: Record<string, unknown>) => void
  submit: () => Promise<unknown | null>
}
```

The central instance returned by `createFormFlow`. You typically access these methods through React hooks rather than calling them directly.

**Navigation methods:**

| Method | Returns | Description |
|--------|---------|-------------|
| `next()` | `string \| null` | Advances to the next step; returns new step name or `null` |
| `back()` | `string \| null` | Goes to previous step; returns new step name or `null` |
| `goTo(name)` | `string \| null` | Jumps to named step; returns name or `null` if invalid |
| `canNext()` | `boolean` | Whether current step is not the last |
| `canBack()` | `boolean` | Whether current step is not the first |
| `canSubmit()` | `boolean` | Whether on the final step |

**Validation & mutation:**

| Method | Returns | Description |
|--------|---------|-------------|
| `validateCurrentStep()` | `Record<string, string[]> \| null` | Validates only fields in `steps[currentStep]` |
| `validateAll()` | `Record<string, string[]> \| null` | Validates entire schema against current values |
| `setValues(partial)` | `void` | Merges new values into form state |
| `submit()` | `Promise<unknown \| null>` | Validates all, then calls `mutation`; returns result or `null` |

---

### `createStore`

```typescript
function createStore<T>(initialState: FlowState<T>): {
  getState: () => FlowState<T>
  setState: (partial: Partial<FlowState<T>>) => void
  subscribe: (listener: () => void) => () => void
}
```

A minimal reactive store. Used internally by `createFormFlow`; exposed for advanced use cases.

---

### `createPersistEngine`

```typescript
function createPersistEngine(config: PersistConfig): PersistEngine
```

Creates a `localStorage`-backed persistence engine.

---

### `PersistConfig`

```typescript
interface PersistConfig {
  key: string
  debounceMs?: number
}
```

| Property | Default | Description |
|----------|---------|-------------|
| `key` | — | `localStorage` key |
| `debounceMs` | `1000` | Milliseconds to wait before persisting |

---

### `PersistEngine`

```typescript
interface PersistEngine {
  save: (data: unknown) => void
  load: () => unknown | null
  clear: () => void
  connectToStore: <T>(store: {
    getState: () => { values: Partial<T> }
    subscribe: (listener: () => void) => () => void
  }) => () => void
}
```

Handles saving, loading, and clearing persisted draft values. `connectToStore` auto-wires persistence to a reactive store.

---

### `zodAdapter`

```typescript
function zodAdapter<T>(schema: z.ZodType<T>): ValidationAdapter<T>
```

Creates a Zod-based validation adapter. Used internally by `createFormFlow`.

---

### `ValidationAdapter`

```typescript
interface ValidationAdapter<T> {
  validateStep: (
    stepFields: (keyof T)[],
    values: Partial<T>
  ) => Record<string, string[]> | null
  validateAll: (values: unknown) => Record<string, string[]> | null
}
```

| Method | Description |
|--------|-------------|
| `validateStep(fields, values)` | Validates only the given fields against a `.pick()` of the schema |
| `validateAll(values)` | Validates the full schema |

Both return `null` on success, or a `Record<string, string[]>` of field → error messages on failure.

---

### `createStateMachine`

```typescript
function createStateMachine(steps: string[]): {
  get status(): FlowStatus
  get currentStep(): string
  canNext: () => boolean
  canBack: () => boolean
  canSubmit: () => boolean
  next: () => string | null
  back: () => string | null
  goTo: (stepName: string) => string | null
  setStatus: (status: FlowStatus) => void
}
```

A linear navigation state machine. Used internally; exposed for framework adapters (Vue, Svelte, etc.).

---

### `FlowStatus`

```typescript
type FlowStatus = 'idle' | 'validating' | 'navigating' | 'submitting' | 'success' | 'error'
```

High-level status of the form flow.

---

## `@epoch/react` {#epoch-react}

### `FormFlowProvider`

```tsx
function FormFlowProvider<T>({
  children,
  flow,
}: {
  children: React.ReactNode
  flow: FormFlow<T>
}): JSX.Element
```

Provides a form flow instance to all descendant components via React context.

**Example:**

```tsx
<FormFlowProvider flow={onboardingFlow}>
  <App />
</FormFlowProvider>
```

---

### `useFormFlow`

```typescript
function useFormFlow<T>(): UseFormFlowReturn<T>
```

Primary hook for consuming form state and actions.

**Returns:**

```typescript
interface UseFormFlowReturn<T> {
  values: Partial<T>
  errors: Record<string, string[]>
  currentStep: string
  visitedSteps: string[]
  isDirty: boolean
  isSubmitting: boolean
  isValidating: boolean
  submitError: Error | null
  data: unknown | null
  next: () => string | null
  back: () => string | null
  goTo: (stepName: string) => string | null
  canNext: boolean
  canBack: boolean
  canSubmit: boolean
  setValues: (values: Record<string, unknown>) => void
  validateCurrentStep: () => Record<string, string[]> | null
  validateAll: () => Record<string, string[]> | null
  submit: () => Promise<unknown | null>
}
```

**Important:** Always pass your schema type as a generic for full type inference:

```typescript
const { values } = useFormFlow<OnboardingData>()
// values.workspaceName is typed as string | undefined
```

---

### `useFormFlowContext`

```typescript
function useFormFlowContext<T>(): FormFlow<T>
```

Returns the raw `FormFlow` instance from context. Useful for building custom hooks or framework adapters.

**Throws** if called outside of a `FormFlowProvider`.

---

### `useStepFields`

```typescript
function useStepFields<T>(stepName: string): UseStepFieldsReturn
```

Returns metadata about a specific step.

```typescript
interface UseStepFieldsReturn {
  fields: string[]
  isCurrent: boolean
  isVisited: boolean
}
```

**Use case:** Building a step indicator / progress bar.

```tsx
function StepIndicator() {
  const steps = ['personal', 'address', 'review']

  return (
    <div>
      {steps.map((step) => {
        const { isCurrent, isVisited } = useStepFields(step)
        return (
          <span
            key={step}
            className={isCurrent ? 'active' : isVisited ? 'completed' : 'pending'}
          >
            {step}
          </span>
        )
      })}
    </div>
  )
}
```

---

### `usePersistedDraft`

```typescript
function usePersistedDraft<T>(): UsePersistedDraftReturn
```

Opt-in hook for building draft save / restore UI.

```typescript
interface UsePersistedDraftReturn {
  hasDraft: boolean
  shouldShowRestorePrompt: boolean
  saveDraft: () => void
  restoreDraft: () => void
  clearDraft: () => void
}
```

Only works when `persist` is configured in `createFormFlow`. The store auto-persists on every value change; this hook exposes manual controls, the `hasDraft` flag, and `shouldShowRestorePrompt` (whether to show a restore affordance for the current provider mount—`false` after a successful `restoreDraft`, even when `hasDraft` stays `true`).

**Example:**

```tsx
function DraftBanner() {
  const { shouldShowRestorePrompt, restoreDraft, clearDraft } = usePersistedDraft()

  if (!shouldShowRestorePrompt) return null

  return (
    <div>
      <p>Draft found</p>
      <button onClick={restoreDraft}>Restore</button>
      <button onClick={clearDraft}>Dismiss</button>
    </div>
  )
}
```

---

## Type Inference Chain

Epoch's type safety flows from your Zod schema through every layer:

```
Zod Schema
    ↓
createFormFlow<T>({ schema, steps, ... })
    ↓
FormFlowProvider flow={flow}
    ↓
useFormFlow<YourType>()  →  typed values, errors, submit, etc.
```

If you skip the generic (`useFormFlow()` without `<YourType>`), values will be `Partial<unknown>` and you'll lose autocomplete and type checking.
