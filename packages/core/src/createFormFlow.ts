import type { FlowConfig, FlowState } from './types'
import type { ValidationAdapter } from './validation/zodAdapter'
import type { PersistEngine } from './store/persist'
import { createStore } from './store/createStore'
import { createStateMachine } from './navigation/stateMachine'
import { zodAdapter } from './validation/zodAdapter'
import { createPersistEngine } from './store/persist'

/**
 * The central form flow instance returned by {@link createFormFlow}.
 *
 * @typeParam T - The inferred type of the Zod schema.
 */
export interface FormFlow<T> {
  /** Original configuration used to create this flow. */
  config: FlowConfig<T>
  /** Reactive store holding the full form state. */
  store: ReturnType<typeof createStore<T>>
  /** Navigation state machine controlling step order. */
  stateMachine: ReturnType<typeof createStateMachine>
  /** Zod validation adapter for per-step and full validation. */
  validator: ValidationAdapter<T>
  /** Persistence engine, or `null` if persistence is disabled. */
  persistEngine: PersistEngine | null
  /** Ordered list of step names. */
  stepNames: string[]
  /** Advances to the next step. Returns the new step name, or `null` if at the end. */
  next: () => string | null
  /** Goes back to the previous step. Returns the new step name, or `null` if at the start. */
  back: () => string | null
  /** Jumps directly to a named step. Returns the step name, or `null` if not found. */
  goTo: (stepName: string) => string | null
  /** Whether the current step is not the last one. */
  canNext: () => boolean
  /** Whether the current step is not the first one. */
  canBack: () => boolean
  /** Whether the user is on the final step (eligible to submit). */
  canSubmit: () => boolean
  /** Validates fields for the current step only. */
  validateCurrentStep: () => Record<string, string[]> | null
  /** Validates the entire form payload against the Zod schema. */
  validateAll: () => Record<string, string[]> | null
  /** Merges new values into the existing form state. */
  setValues: (values: Record<string, unknown>) => void
  /** Validates all fields and calls the configured mutation if valid. */
  submit: () => Promise<unknown | null>
}

function isValidPartial<T>(value: unknown): value is Partial<T> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Creates a typed, multi-step form flow with validation, persistence, and mutation support.
 *
 * @typeParam T - The inferred type of the Zod schema.
 * @param config - Flow configuration including schema, steps, persistence, and mutation.
 * @returns A `FormFlow` instance with navigation, validation, and reactive state.
 */
export function createFormFlow<T>(config: FlowConfig<T>): FormFlow<T> {
  const stepNames = Object.keys(config.steps)
  const stateMachine = createStateMachine(stepNames)
  const validator = zodAdapter(config.schema)

  let persistEngine: PersistEngine | null = null
  let restoredValues: Partial<T> = {}

  if (config.persist !== undefined) {
    persistEngine = createPersistEngine(config.persist)
    const saved = persistEngine.load()

    if (isValidPartial<T>(saved)) {
      restoredValues = saved
    }
  }

  const initialState: FlowState<T> = {
    values: restoredValues,
    errors: {},
    currentStep: stateMachine.currentStep,
    visitedSteps: stateMachine.currentStep ? [stateMachine.currentStep] : [],
    isDirty: false,
    isSubmitting: false,
    isValidating: false,
    submitError: null,
    data: null,
  }

  const store = createStore(initialState)

  if (persistEngine !== null) {
    persistEngine.connectToStore(store)
  }

  function updateCurrentStep(stepName: string | null): string | null {
    if (!stepName) return null

    store.setState({ currentStep: stepName })

    const currentVisited = store.getState().visitedSteps
    if (!currentVisited.includes(stepName)) {
      store.setState({ visitedSteps: [...currentVisited, stepName] })
    }

    return stepName
  }

  function validateCurrentStep(): Record<string, string[]> | null {
    const currentStepName = store.getState().currentStep
    const stepFields = config.steps[currentStepName] ?? []
    const currentValues = store.getState().values

    store.setState({ isValidating: true, errors: {} })

    const errors = validator.validateStep(stepFields, currentValues)

    store.setState({ isValidating: false, errors: errors ?? {} })

    return errors
  }

  function validateAll(): Record<string, string[]> | null {
    const currentValues = store.getState().values

    store.setState({ isValidating: true, errors: {} })

    const result = validator.validateAll(currentValues)

    if (!result.success) {
      store.setState({ isValidating: false, errors: result.errors })
      return result.errors
    }

    store.setState({ isValidating: false })
    return null
  }

  function setValues(values: Record<string, unknown>): void {
    const currentValues = store.getState().values
    store.setState({
      values: { ...currentValues, ...values },
      isDirty: true,
    })
  }

  async function submit(): Promise<unknown | null> {
    if (config.mutation === undefined) {
      throw new Error(
        'No mutation configured. Provide a mutation in createFormFlow config.'
      )
    }

    const errors = validateAll()

    if (errors !== null) {
      return null
    }

    store.setState({ isSubmitting: true, submitError: null })

    try {
      const currentValues = store.getState().values
      const validationResult = validator.validateAll(currentValues)

      if (!validationResult.success) {
        store.setState({
          isSubmitting: false,
          errors: validationResult.errors,
        })
        return null
      }

      const result = await config.mutation(validationResult.data)

      store.setState({
        isSubmitting: false,
        data: result,
        isDirty: false,
      })

      if (persistEngine !== null) {
        persistEngine.clear()
      }

      return result
    } catch (error: unknown) {
      const submitError =
        error instanceof Error ? error : new Error(String(error))

      store.setState({
        isSubmitting: false,
        submitError,
      })

      return null
    }
  }

  return {
    config,
    store,
    stateMachine,
    validator,
    persistEngine,
    stepNames,
    next: () => updateCurrentStep(stateMachine.next()),
    back: () => updateCurrentStep(stateMachine.back()),
    goTo: (stepName: string) => {
      const result = stateMachine.goTo(stepName)
      return updateCurrentStep(result)
    },
    canNext: () => stateMachine.canNext(),
    canBack: () => stateMachine.canBack(),
    canSubmit: () => stateMachine.canSubmit(),
    validateCurrentStep,
    validateAll,
    setValues,
    submit,
  }
}
