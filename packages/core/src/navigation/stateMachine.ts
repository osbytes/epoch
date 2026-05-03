/**
 * High-level status of the form flow.
 */
export type FlowStatus =
  | 'idle'
  | 'validating'
  | 'navigating'
  | 'submitting'
  | 'success'
  | 'error'

/**
 * Creates a linear navigation state machine for stepping through form pages.
 *
 * @param steps - Ordered list of step names.
 * @returns A state machine with navigation guards and direct access.
 */
export function createStateMachine(steps: string[]) {
  let currentIndex = 0
  let status: FlowStatus = 'idle'

  return {
    get status() {
      return status
    },
    get currentStep() {
      return steps[currentIndex] ?? ''
    },
    canNext: () => currentIndex < steps.length - 1,
    canBack: () => currentIndex > 0,
    canSubmit: () => currentIndex === steps.length - 1,
    next: () => {
      if (currentIndex < steps.length - 1) {
        currentIndex++
        return steps[currentIndex]
      }
      return null
    },
    back: () => {
      if (currentIndex > 0) {
        currentIndex--
        return steps[currentIndex]
      }
      return null
    },
    goTo: (stepName: string) => {
      const index = steps.indexOf(stepName)
      if (index >= 0) {
        currentIndex = index
        return steps[currentIndex]
      }
      return null
    },
    setStatus: (newStatus: FlowStatus) => {
      status = newStatus
    },
  }
}
