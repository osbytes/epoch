import { describe, it, expect, vi } from 'vitest'
import { z } from 'zod'
import { createFormFlow } from './createFormFlow'

const TestSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  street: z.string(),
  city: z.string(),
})

describe('createFormFlow', () => {
  it('should create a flow with store and state machine', () => {
    const flow = createFormFlow({
      schema: TestSchema,
      steps: {
        personal: ['firstName', 'lastName'],
        address: ['street', 'city'],
        review: [],
      },
    })

    expect(flow.store).toBeDefined()
    expect(flow.stateMachine).toBeDefined()
  })

  it('should set initial currentStep to the first step in the store', () => {
    const flow = createFormFlow({
      schema: TestSchema,
      steps: {
        personal: ['firstName'],
        address: ['street'],
      },
    })

    expect(flow.store.getState().currentStep).toBe('personal')
  })

  it('should advance to the next step and update the store', () => {
    const flow = createFormFlow({
      schema: TestSchema,
      steps: {
        personal: ['firstName'],
        address: ['street'],
        review: [],
      },
    })

    const result = flow.next()

    expect(result).toBe('address')
    expect(flow.store.getState().currentStep).toBe('address')
    expect(flow.stateMachine.currentStep).toBe('address')
  })

  it('should go back and update the store', () => {
    const flow = createFormFlow({
      schema: TestSchema,
      steps: {
        personal: ['firstName'],
        address: ['street'],
      },
    })

    flow.next()
    const result = flow.back()

    expect(result).toBe('personal')
    expect(flow.store.getState().currentStep).toBe('personal')
  })

  it('should navigate to a specific step with goTo', () => {
    const flow = createFormFlow({
      schema: TestSchema,
      steps: {
        personal: ['firstName'],
        address: ['street'],
        review: [],
      },
    })

    const result = flow.goTo('review')

    expect(result).toBe('review')
    expect(flow.store.getState().currentStep).toBe('review')
  })

  it('should track visited steps in the store', () => {
    const flow = createFormFlow({
      schema: TestSchema,
      steps: {
        personal: ['firstName'],
        address: ['street'],
        review: [],
      },
    })

    expect(flow.store.getState().visitedSteps).toEqual(['personal'])

    flow.next()
    expect(flow.store.getState().visitedSteps).toEqual(['personal', 'address'])

    flow.next()
    expect(flow.store.getState().visitedSteps).toEqual([
      'personal',
      'address',
      'review',
    ])
  })

  it('should not duplicate visited steps when navigating back and forth', () => {
    const flow = createFormFlow({
      schema: TestSchema,
      steps: {
        personal: ['firstName'],
        address: ['street'],
      },
    })

    flow.next()
    flow.back()
    flow.next()

    expect(flow.store.getState().visitedSteps).toEqual(['personal', 'address'])
  })

  it('should expose canNext, canBack, canSubmit from state machine', () => {
    const flow = createFormFlow({
      schema: TestSchema,
      steps: {
        personal: ['firstName'],
        address: ['street'],
      },
    })

    expect(flow.canNext()).toBe(true)
    expect(flow.canBack()).toBe(false)
    expect(flow.canSubmit()).toBe(false)

    flow.goTo('address')
    expect(flow.canNext()).toBe(false)
    expect(flow.canBack()).toBe(true)
    expect(flow.canSubmit()).toBe(true)
  })

  it('should notify subscribers when navigation changes state', () => {
    const flow = createFormFlow({
      schema: TestSchema,
      steps: {
        personal: ['firstName'],
        address: ['street'],
      },
    })

    const listener = vi.fn()
    flow.store.subscribe(listener)

    flow.next()

    expect(listener).toHaveBeenCalled()
  })

  it('should expose step names in order', () => {
    const flow = createFormFlow({
      schema: TestSchema,
      steps: {
        personal: ['firstName'],
        address: ['street'],
        review: [],
      },
    })

    expect(flow.stepNames).toEqual(['personal', 'address', 'review'])
  })

  it('should return null from next when on the last step', () => {
    const flow = createFormFlow({
      schema: TestSchema,
      steps: {
        personal: ['firstName'],
      },
    })

    const result = flow.next()

    expect(result).toBeNull()
  })

  it('should return null from back when on the first step', () => {
    const flow = createFormFlow({
      schema: TestSchema,
      steps: {
        personal: ['firstName'],
      },
    })

    const result = flow.back()

    expect(result).toBeNull()
  })

  it('should return null from goTo with invalid step name', () => {
    const flow = createFormFlow({
      schema: TestSchema,
      steps: {
        personal: ['firstName'],
      },
    })

    const result = flow.goTo('nonexistent')

    expect(result).toBeNull()
    expect(flow.store.getState().currentStep).toBe('personal')
  })
})
