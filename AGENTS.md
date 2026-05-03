# Epoch — Agent Instructions

> This document contains mandatory rules for AI coding assistants working on the Epoch project.
> **Read this entire file before making any changes.**

---

## 1. TypeScript Quality Standards (Non-Negotiable)

### 1.1 No Single-Character Variables
- **NEVER** use single-character variable names.
- **Exception:** Loop indices (`i`, `j`, `k`) and coordinate pairs (`x`, `y`) only.
- **Bad:** `const n = getName()` — **Good:** `const userName = getName()`
- **Bad:** `const d = new Date()` — **Good:** `const currentDate = new Date()`
- **Bad:** `const e = event` — **Good:** `const clickEvent = event`

### 1.2 No `any` Type
- **NEVER** use the `any` type. Ever.
- Use `unknown` when the type is genuinely unknown at compile time.
- Use proper generics (`T`, `K`, `V`) with meaningful constraints.
- Use discriminated unions or branded types when needed.
- **Bad:** `function parse(data: any)` — **Good:** `function parse<T>(data: unknown): T`
- If you encounter `any` in existing code, refactor it as part of your change.

### 1.3 No `as` Keyword (Type Assertions)
- **NEVER** use the `as` keyword for type assertions.
- **Never:** `value as string`, `element as HTMLInputElement`, `data as MyType`
- Use type guards (`typeof`, `instanceof`, custom predicates) instead.
- Use proper type narrowing with `if` statements.
- Fix the underlying type issue rather than asserting around it.
- **Bad:** `const input = event.target as HTMLInputElement`
- **Good:**
  ```typescript
  if (event.target instanceof HTMLInputElement) {
    const input = event.target
  }
  ```

### 1.4 Strict TypeScript
- All packages use `strict: true` in `tsconfig.json`.
- Enable `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`.
- Explicit return types on all exported functions and public class methods.
- Prefer `interface` over `type` for object shapes. Use `type` for unions, mapped types, and utility types.

### 1.5 Code Clarity
- Write code that is self-documenting. Prefer clear variable names over comments explaining what a variable does.
- Keep functions small and focused (< 20 lines when possible).
- Avoid nested ternaries. Use early returns.
- Prefer `const` over `let`. Never use `var`.

---

## 2. Documentation Rules

### 2.1 Update Docs Directory
- **ALWAYS** update files in the `docs/` directory when implementing or changing features.
- Mark tasks as complete (`- [x]`) in the relevant day document as you finish them.
- If a task doesn't exist in the docs, add it before implementing.

### 2.2 Keep Feature Docs Current
- When you change the public API, update:
  - The relevant `docs/day-X-*.md` file
  - `spike.md` high-level checkboxes
  - `docs/README.md` status table if phases complete
- When adding new concepts, add them to the appropriate architecture section in docs.

### 2.3 Code Documentation
- All exported functions must have TSDoc comments with `@param` and `@returns`.
- Complex internal functions should have inline comments explaining the "why", not the "what".
- Keep `README.md` accurate if it references specific APIs or examples.

---

## 3. Testing Rules (Mandatory)

### 3.1 Unit Tests
- **EVERY** new function, utility, or logic change must include unit tests.
- Use **Vitest** for unit tests in `packages/core/` and `packages/react/`.
- Tests must cover:
  - Happy path
  - Error cases
  - Edge cases (empty input, null/undefined, boundary values)
- Test files live next to source files: `foo.ts` → `foo.test.ts`.
- Aim for descriptive test names: `it('should return null when schema validation fails')`.

### 3.2 E2E Tests
- **ALL** user-facing flows must have Playwright E2E tests.
- E2E tests live in `apps/demo/e2e/`.
- Test critical user journeys:
  - Full form submission flow
  - Step navigation (next, back, go-to)
  - Draft persistence (refresh page, data returns)
  - Validation errors per step
  - Mobile responsiveness (viewport testing)
- Use `data-testid` attributes for selectors, never rely on CSS classes or text content.

### 3.3 Test Running
- Run `pnpm test` before declaring any task complete.
- Fix failing tests immediately. Do not skip or ignore failing tests.
- If you add a new test framework (like Playwright), ensure CI runs it.

---

## 4. Architecture Rules

### 4.1 Monorepo Boundaries
- `packages/core/` is framework-agnostic. No React, no DOM APIs.
- `packages/react/` is the only React-aware package. It depends on `core`.
- `apps/demo/` is the only app. It depends on `react`.
- Never create circular dependencies between packages.

### 4.2 Headless Library
- Epoch is headless. **Never** add UI components, CSS, or styling to `packages/core/` or `packages/react/`.
- The demo app (`apps/demo/`) is the only place for UI and styling.

### 4.3 Peer Dependencies
- `zod`, `react`, `react-dom`, `react-hook-form`, `@trpc/*` are peer dependencies.
- Never bundle peer dependencies. Mark them as `external` in Vite configs.

---

## 5. Workflow Rules

### 5.1 Before Starting Work
1. Read the relevant `docs/day-X-*.md` file.
2. Understand the current state by reading existing code.
3. Update the todo list in your response.

### 5.2 While Working
1. Make the smallest change that achieves the goal.
2. Run tests frequently (`pnpm test --run` for speed).
3. Run typecheck (`pnpm typecheck`) before finishing.

### 5.3 Before Finishing
1. Verify all tests pass: `pnpm test`
2. Verify types pass: `pnpm typecheck`
3. Verify build passes: `pnpm build`
4. Update documentation in `docs/` and `spike.md`.
5. Review your diff for:
   - No `any` types
   - No `as` assertions
   - No single-character variables
   - No missing tests

---

## 6. Anti-Patterns (Never Do These)

- ❌ `const x = ...` — use descriptive names
- ❌ `function foo(a: any, b: any)` — use proper types
- ❌ `const value = something as string` — use type guards
- ❌ `let` when `const` would work
- ❌ Changing code without updating `docs/`
- ❌ Submitting code without tests
- ❌ Adding UI components to `packages/core/` or `packages/react/`
- ❌ Using `@ts-ignore` or `@ts-expect-error`

---

## 7. Examples of Good Patterns

```typescript
// ✅ Good: Descriptive names, no any, no as, proper types
interface UserProfile {
  displayName: string
  emailAddress: string
  accountCreatedAt: Date
}

function formatUserProfile(profile: UserProfile): string {
  const formattedDate = profile.accountCreatedAt.toLocaleDateString()
  return `${profile.displayName} (${profile.emailAddress}) — ${formattedDate}`
}

// ✅ Good: Type guard instead of as
function isValidInputElement(target: EventTarget | null): target is HTMLInputElement {
  return target instanceof HTMLInputElement
}

function handleInputEvent(event: Event): void {
  if (isValidInputElement(event.target)) {
    const inputValue = event.target.value
    processInputValue(inputValue)
  }
}

// ✅ Good: Generics instead of any
function createStore<T>(initialValue: T): { get: () => T; set: (value: T) => void } {
  let currentValue = initialValue
  return {
    get: () => currentValue,
    set: (value: T) => { currentValue = value },
  }
}
```

---

## 8. Verification Checklist

Before completing any task, confirm:

- [ ] No single-character variables (except `i`, `j`, `k`, `x`, `y` in appropriate contexts)
- [ ] No `any` types used
- [ ] No `as` keyword used
- [ ] All functions have explicit return types
- [ ] Unit tests added and passing
- [ ] E2E tests added for user-facing changes
- [ ] `docs/` updated with task progress
- [ ] `spike.md` checkboxes updated
- [ ] `pnpm test` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` passes

---

**These rules are mandatory. Do not bypass them for convenience.**
