import { useCallback, useState } from 'react'
import { useFormFlowContext } from './FormFlowProvider'

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Return type of the {@link usePersistedDraft} hook.
 */
export interface UsePersistedDraftReturn {
  /** Whether a persisted draft exists in localStorage. */
  hasDraft: boolean
  /**
   * Whether to show a restore affordance for the current {@link FormFlowProvider} mount.
   * Becomes `false` after `restoreDraft` applies a saved object, while `hasDraft` may stay
   * `true` because the snapshot remains in storage.
   */
  shouldShowRestorePrompt: boolean
  /** Manually saves the current form values as a draft. */
  saveDraft: () => void
  /** Restores the persisted draft values into the form state. */
  restoreDraft: () => void
  /** Removes the persisted draft from localStorage. */
  clearDraft: () => void
}

/**
 * Opt-in hook for building draft save / restore UI.
 *
 * Only works when `persist` is configured in `createFormFlow`.
 *
 * @typeParam T - The inferred type of the form schema.
 * @returns Draft status, restore-prompt visibility for this mount, and manual save/restore/clear actions.
 */
export function usePersistedDraft<T>(): UsePersistedDraftReturn {
  const flow = useFormFlowContext<T>()

  const [hasDraft, setHasDraft] = useState(() => {
    if (flow.persistEngine === null) return false
    const saved = flow.persistEngine.load()
    return saved !== null && saved !== undefined
  })

  const [restorePromptDismissed, setRestorePromptDismissed] = useState(false)

  const shouldShowRestorePrompt = hasDraft && !restorePromptDismissed

  const saveDraft = useCallback(() => {
    if (flow.persistEngine === null) return

    const currentValues = flow.store.getState().values
    flow.persistEngine.save(currentValues)
    setHasDraft(true)
  }, [flow])

  const restoreDraft = useCallback(() => {
    if (flow.persistEngine === null) return

    const saved = flow.persistEngine.load()
    if (isRecord(saved)) {
      flow.setValues(saved)
      setHasDraft(true)
      setRestorePromptDismissed(true)
    }
  }, [flow])

  const clearDraft = useCallback(() => {
    if (flow.persistEngine === null) return

    flow.persistEngine.clear()
    setHasDraft(false)
    setRestorePromptDismissed(false)
  }, [flow])

  return {
    hasDraft,
    shouldShowRestorePrompt,
    saveDraft,
    restoreDraft,
    clearDraft,
  }
}
