import { useSyncExternalStore } from 'react'
import { useFormFlowContext } from './FormFlowProvider'

/**
 * Return type of the {@link useStepFields} hook.
 */
export interface UseStepFieldsReturn {
  /** Field names assigned to this step. */
  fields: string[]
  /** Whether this step is currently active. */
  isCurrent: boolean
  /** Whether the user has already visited this step. */
  isVisited: boolean
}

/**
 * Returns metadata about a specific step without exposing the full form state.
 *
 * Useful for building step indicators or conditional UI.
 *
 * @typeParam T - The inferred type of the form schema.
 * @param stepName - The name of the step to inspect.
 * @returns Field list, current status, and visited status for the step.
 */
export function useStepFields<T>(stepName: string): UseStepFieldsReturn {
  const flow = useFormFlowContext<T>()

  const state = useSyncExternalStore(
    flow.store.subscribe,
    flow.store.getState,
    flow.store.getState
  )

  const stepFields = flow.config.steps[stepName] ?? []
  const isCurrent = state.currentStep === stepName
  const isVisited = state.visitedSteps.includes(stepName)

  return {
    fields: stepFields.map((field) => String(field)),
    isCurrent,
    isVisited,
  }
}
