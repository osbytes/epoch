import type { FlowState } from '../types'

/**
 * Creates a minimal reactive store for form flow state.
 *
 * @typeParam T - The shape of the form values.
 * @param initialState - The starting state of the store.
 * @returns An object with `getState`, `setState`, and `subscribe` methods.
 */
export function createStore<T>(initialState: FlowState<T>) {
  let state = { ...initialState }
  const listeners = new Set<() => void>()

  const notify = () => listeners.forEach((fn) => fn())

  return {
    /** Returns the current snapshot of the store state. */
    getState: () => state,
    /** Merges a partial state update and notifies all subscribers. */
    setState: (partial: Partial<FlowState<T>>) => {
      state = { ...state, ...partial }
      notify()
    },
    /** Registers a listener and returns an unsubscribe function. */
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
