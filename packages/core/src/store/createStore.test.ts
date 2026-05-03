import { describe, it, expect, vi } from 'vitest'
import { createStore } from './createStore'
import type { FlowState } from '../types'

function createMockState(): FlowState<{ name: string }> {
  return {
    values: {},
    errors: {},
    currentStep: 'personal',
    visitedSteps: [],
    isDirty: false,
    isSubmitting: false,
    isValidating: false,
    submitError: null,
    data: null,
  }
}

describe('createStore', () => {
  it('should return the initial state', () => {
    const initialState = createMockState()
    const store = createStore(initialState)

    expect(store.getState()).toEqual(initialState)
  })

  it('should update state with partial updates', () => {
    const store = createStore(createMockState())

    store.setState({ isDirty: true, currentStep: 'address' })

    const state = store.getState()
    expect(state.isDirty).toBe(true)
    expect(state.currentStep).toBe('address')
    expect(state.isSubmitting).toBe(false)
  })

  it('should not mutate the previous state object', () => {
    const initialState = createMockState()
    const store = createStore(initialState)

    store.setState({ isDirty: true })

    expect(initialState.isDirty).toBe(false)
    expect(store.getState()).not.toBe(initialState)
  })

  it('should notify subscribers on state change', () => {
    const store = createStore(createMockState())
    const listener = vi.fn()

    store.subscribe(listener)
    store.setState({ isDirty: true })

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('should support multiple subscribers', () => {
    const store = createStore(createMockState())
    const listenerOne = vi.fn()
    const listenerTwo = vi.fn()

    store.subscribe(listenerOne)
    store.subscribe(listenerTwo)
    store.setState({ currentStep: 'review' })

    expect(listenerOne).toHaveBeenCalledTimes(1)
    expect(listenerTwo).toHaveBeenCalledTimes(1)
  })

  it('should allow unsubscribing', () => {
    const store = createStore(createMockState())
    const listener = vi.fn()

    const unsubscribe = store.subscribe(listener)
    store.setState({ isDirty: true })
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    store.setState({ isSubmitting: true })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('should not notify subscribers if state values are identical', () => {
    const store = createStore(createMockState())
    const listener = vi.fn()

    store.subscribe(listener)
    store.setState({ currentStep: 'personal' })

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('should return an unsubscribe function from subscribe', () => {
    const store = createStore(createMockState())
    const unsubscribe = store.subscribe(() => {})

    expect(typeof unsubscribe).toBe('function')
  })
})
