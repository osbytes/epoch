import { useCallback, useSyncExternalStore } from 'react'
import { useFormFlowContext } from './FormFlowProvider'

/**
 * Return type of the {@link useFormFlow} hook.
 *
 * @typeParam T - The inferred type of the form schema.
 */
export interface UseFormFlowReturn<T> {
  /** Partial form values collected so far. */
  values: Partial<T>
  /** Validation errors keyed by field name. */
  errors: Record<string, string[]>
  /** Name of the currently active step. */
  currentStep: string
  /** List of steps the user has already visited. */
  visitedSteps: string[]
  /** Whether any field has been modified since initialization. */
  isDirty: boolean
  /** Whether the form is currently submitting. */
  isSubmitting: boolean
  /** Whether the current step is being validated. */
  isValidating: boolean
  /** Error thrown during the last submit attempt, if any. */
  submitError: Error | null
  /** Response data returned from a successful mutation. */
  data: unknown | null
  /** Advances to the next step. */
  next: () => string | null
  /** Goes back to the previous step. */
  back: () => string | null
  /** Jumps directly to a named step. */
  goTo: (stepName: string) => string | null
  /** Whether the user can advance to the next step. */
  canNext: boolean
  /** Whether the user can go back to the previous step. */
  canBack: boolean
  /** Whether the user is on the final step and can submit. */
  canSubmit: boolean
  /** Merges new values into the existing form state. */
  setValues: (values: Record<string, unknown>) => void
  /** Validates fields for the current step only. */
  validateCurrentStep: () => Record<string, string[]> | null
  /** Validates the entire form payload. */
  validateAll: () => Record<string, string[]> | null
  /** Validates all fields and calls the configured mutation if valid. */
  submit: () => Promise<unknown | null>
}

/**
 * Primary React hook for consuming a form flow.
 *
 * Returns the current state, navigation helpers, validation, and submit
 * bound to the nearest {@link FormFlowProvider}.
 *
 * @typeParam T - The inferred type of the form schema.
 * @returns Reactive form flow state and actions.
 */
export function useFormFlow<T>(): UseFormFlowReturn<T> {
  const flow = useFormFlowContext<T>()

  const state = useSyncExternalStore(
    flow.store.subscribe,
    flow.store.getState,
    flow.store.getState
  )

  const next = useCallback(() => flow.next(), [flow])
  const back = useCallback(() => flow.back(), [flow])
  const goTo = useCallback((stepName: string) => flow.goTo(stepName), [flow])

  const setValues = useCallback(
    (values: Record<string, unknown>) => flow.setValues(values),
    [flow]
  )

  const validateCurrentStep = useCallback(
    () => flow.validateCurrentStep(),
    [flow]
  )

  const validateAll = useCallback(() => flow.validateAll(), [flow])

  const submit = useCallback(() => flow.submit(), [flow])

  return {
    values: state.values,
    errors: state.errors,
    currentStep: state.currentStep,
    visitedSteps: state.visitedSteps,
    isDirty: state.isDirty,
    isSubmitting: state.isSubmitting,
    isValidating: state.isValidating,
    submitError: state.submitError,
    data: state.data,
    next,
    back,
    goTo,
    canNext: flow.canNext(),
    canBack: flow.canBack(),
    canSubmit: flow.canSubmit(),
    setValues,
    validateCurrentStep,
    validateAll,
    submit,
  }
}
