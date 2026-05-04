# Architecture

> How Epoch Flow works under the hood.

---

## Design Principles

1. **Headless** — No UI opinions. Epoch Flow is data + logic only.
2. **Framework-agnostic core** — The state machine, store, and validation run in vanilla JS.
3. **Composable** — Works with React Hook Form, Zod, and tRPC without replacing them.
4. **Type-safe end-to-end** — Your Zod schema type flows through every layer.

---

## System Overview

```
┌─────────────────────────────────────────┐
│           React Components              │
│  ┌─────────────┐    ┌────────────────┐  │
│  │useFormFlow  │    │usePersistedDraft│  │
│  └──────┬──────┘    └────────────────┘  │
│         │                                │
│  ┌──────▼──────┐                        │
│  │FormFlowProvider                      │
│  └──────┬──────┘                        │
└─────────┼───────────────────────────────┘
          │ React Context
┌─────────▼───────────────────────────────┐
│         @epochflow/core                     │
│  ┌──────────────┐  ┌─────────────────┐  │
│  │ createStore  │  │ createStateMachine│ │
│  │ (observable) │  │ (navigation)     │  │
│  └───────┬──────┘  └────────┬────────┘  │
│          │                  │            │
│  ┌───────▼──────────────────▼────────┐  │
│  │         createFormFlow            │  │
│  │  ┌─────────┐    ┌──────────────┐ │  │
│  │  │ zodAdapter│   │persistEngine │ │  │
│  │  └─────────┘    └──────────────┘ │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## The Store (`createStore`)

A minimal reactive store with no external dependencies.

```typescript
function createStore<T>(initialState: FlowState<T>) {
  let state = { ...initialState }
  const listeners = new Set<() => void>()

  return {
    getState: () => state,
    setState: (partial) => {
      state = { ...state, ...partial }
      listeners.forEach((fn) => fn())
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
```

**Why not Zustand / Redux / Valtio?**

- Zero dependencies keeps the core lightweight.
- The surface area is tiny (get, set, subscribe).
- React integration happens via `useSyncExternalStore`, not a framework-specific binding.

---

## The State Machine (`createStateMachine`)

Manages linear step progression with guards.

```typescript
function createStateMachine(steps: string[]) {
  let currentIndex = 0

  return {
    get currentStep() { return steps[currentIndex] ?? '' },
    canNext: () => currentIndex < steps.length - 1,
    canBack: () => currentIndex > 0,
    canSubmit: () => currentIndex === steps.length - 1,
    next: () => { /* advance if possible */ },
    back: () => { /* retreat if possible */ },
    goTo: (name) => { /* jump to named step */ },
  }
}
```

**Design decision:** Linear by default. Non-linear navigation is supported via `goTo()`, but the state machine doesn't track a graph of allowed transitions. This keeps v1 simple while covering 90% of form wizards.

---

## Validation (`zodAdapter`)

### Per-Step Validation

When `validateCurrentStep()` is called:

1. Look up the fields for `currentStep` from `config.steps`.
2. If the schema is a `ZodObject`, create a `.pick()` schema with only those fields.
3. Run `.safeParse()` against current values.
4. Return formatted errors or `null`.

```typescript
const stepSchema = schema.pick({ workspaceName: true, urlSlug: true })
const result = stepSchema.safeParse(values)
```

**Why `.pick()`?**

- It preserves Zod's full validation logic (custom refinements, transforms, etc.) for just the visible fields.
- It naturally handles optionality — if a step has no required fields, `.pick()` still validates whatever is present.

### Full Validation

`validateAll()` and `submit()` run `.safeParse()` against the **entire** schema. This catches cross-field validations (e.g., "if country is US, state is required") that step-level validation might miss.

---

## Persistence (`createPersistEngine`)

### How It Works

1. **Load** on initialization — reads `localStorage` and hydrates `initialState.values`.
2. **Auto-save** via store subscription — every `setState` triggers a debounced write.
3. **Clear** on successful submit — removes the draft so users don't see stale data on return.

```typescript
const engine = createPersistEngine({ key: 'draft', debounceMs: 1000 })

// Auto-wire to store
engine.connectToStore(store)
```

**Why debounce?**

- Prevents excessive `localStorage` writes on every keystroke.
- Default 1s is a good balance between durability and performance.

**Serialization:**

- Uses `JSON.stringify` / `JSON.parse`.
- Dates are serialized as ISO strings — document this caveat if your schema uses `z.date()`.

---

## React Integration

### `useSyncExternalStore`

React hooks subscribe to the vanilla store via `useSyncExternalStore` (React 18+):

```typescript
const state = useSyncExternalStore(
  flow.store.subscribe,
  flow.store.getState,
  flow.store.getState
)
```

This is the official React pattern for external stores. It:
- Supports concurrent features (Suspense, transitions).
- Prevents tearing during rapid updates.
- Works in SSR (server snapshot = client snapshot in our case).

### Why Not Context + `useReducer`?

- Context re-renders all consumers on every change. With `useSyncExternalStore`, only components calling the hook re-render.
- The store is framework-agnostic — future Vue/Svelte adapters can reuse the same core.

### Draft restore UI (`usePersistedDraft`)

`usePersistedDraft` reports `hasDraft` when storage holds a snapshot, and `shouldShowRestorePrompt` for whether to show a restore affordance on the current `FormFlowProvider` mount. Calling `restoreDraft()` keeps `hasDraft` true (the snapshot remains) but clears the prompt until the draft is cleared and saved again or the provider remounts—so apps do not need parallel visibility state for the common “restore once per visit” pattern.

---

## Package Boundaries

```
epoch/
├── packages/
│   ├── core/          # Zero React dependencies
│   │   ├── store/
│   │   ├── navigation/
│   │   ├── validation/
│   │   └── types.ts
│   └── react/         # Only React dependency
│       ├── FormFlowProvider.tsx
│       ├── useFormFlow.ts
│       ├── useStepFields.ts
│       └── usePersistedDraft.ts
```

**Rule:** `core` never imports from `react`. `react` only imports types and `core` exports. No circular dependencies.

---

## Data Flow

### User Types → Value Update

```
User types in input
    ↓
onChange calls setValues({ field: value })
    ↓
Store merges partial → new state
    ↓
Subscribers notified (useSyncExternalStore)
    ↓
React re-renders component with new values
    ↓
Persist engine debounce-saves to localStorage
```

### User Clicks Next

```
Button onClick calls validateCurrentStep()
    ↓
Validator picks fields for current step
    ↓
Zod .safeParse() runs
    ↓
If errors: store.errors updated, component shows errors
    ↓
If valid: stateMachine.next() → new step name
    ↓
Store.currentStep updated
    ↓
Component re-renders with new step
```

### User Clicks Submit

```
Button onClick calls submit()
    ↓
validateAll() runs full Zod schema
    ↓
If errors: store.errors updated, return null
    ↓
If valid: store.isSubmitting = true
    ↓
mutation(config.values) called with typed payload
    ↓
On success: store.data = result, clear persist, return result
    ↓
On error: store.submitError = error, return null
```

---

## Future Architecture Directions

- **URL sync** — Sync `currentStep` to `?step=workspace` for back-button support.
- **Branching steps** — DAG instead of linear array for conditional flows.
- **Server-side rendering** — Hydrate drafts from cookies instead of localStorage.
- **Vue / Svelte adapters** — Reuse `core` with framework-specific bindings.

---

## File Size Budget

| Package | Approximate Size (gzipped) |
|---------|---------------------------|
| `@epochflow/core` | ~1.7 KB |
| `@epochflow/react` | ~7 KB |
| **Total** | **~9 KB** |

These are rough estimates from the build output. The core stays small because it has zero runtime dependencies.
