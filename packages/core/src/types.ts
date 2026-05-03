import type { z } from 'zod'

/**
 * Represents the reactive state of a multi-step form flow.
 *
 * @typeParam T - The inferred type of the complete form schema.
 */
export interface FlowState<T = unknown> {
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
}

/**
 * Configuration object used to create a form flow.
 *
 * @typeParam T - The inferred type of the Zod schema.
 */
export interface FlowConfig<T> {
  /** Zod schema defining the shape and validation rules of the form. */
  schema: z.ZodType<T>
  /** Mapping of step names to the fields they contain. */
  steps: Record<string, (keyof T)[]>
  /** Optional persistence config for auto-saving draft values to localStorage. */
  persist?: {
    /** localStorage key used to store the draft. */
    key: string
    /** Debounce delay in milliseconds before persisting changes. */
    debounceMs?: number
  }
  /** Optional async mutation called when the form is submitted. */
  mutation?: (input: T) => Promise<unknown>
}
