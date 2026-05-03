import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { z } from 'zod'
import { createFormFlow } from './createFormFlow'

const TestSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
})

type TestData = z.infer<typeof TestSchema>

class MockStorage implements Storage {
  private data: Record<string, string> = {}

  get length(): number {
    return Object.keys(this.data).length
  }

  getItem(key: string): string | null {
    return this.data[key] ?? null
  }

  setItem(key: string, value: string): void {
    this.data[key] = value
  }

  removeItem(key: string): void {
    delete this.data[key]
  }

  clear(): void {
    this.data = {}
  }

  key(index: number): string | null {
    return Object.keys(this.data)[index] ?? null
  }
}

describe('createFormFlow with validation and persistence', () => {
  let mockStorage: MockStorage

  beforeEach(() => {
    mockStorage = new MockStorage()
    globalThis.localStorage = mockStorage
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('validation integration', () => {
    it('should validate current step and update store errors', () => {
      const flow = createFormFlow<TestData>({
        schema: TestSchema,
        steps: {
          personal: ['firstName', 'lastName'],
          contact: ['email'],
        },
      })

      flow.setValues({ firstName: '' })
      const errors = flow.validateCurrentStep()

      expect(errors).not.toBeNull()
      expect(flow.store.getState().errors.firstName).toBeDefined()
      expect(flow.store.getState().isValidating).toBe(false)
    })

    it('should return null and clear errors for valid step', () => {
      const flow = createFormFlow<TestData>({
        schema: TestSchema,
        steps: {
          personal: ['firstName', 'lastName'],
        },
      })

      flow.setValues({ firstName: 'John', lastName: 'Doe' })
      const errors = flow.validateCurrentStep()

      expect(errors).toBeNull()
      expect(flow.store.getState().errors).toEqual({})
    })

    it('should validate entire form', () => {
      const flow = createFormFlow<TestData>({
        schema: TestSchema,
        steps: {
          personal: ['firstName', 'lastName'],
          contact: ['email'],
        },
      })

      const errors = flow.validateAll()

      expect(errors).not.toBeNull()
      if (errors !== null) {
        expect(Object.keys(errors)).toHaveLength(3)
      }
    })

    it('should set isValidating during validation', () => {
      const flow = createFormFlow<TestData>({
        schema: TestSchema,
        steps: {
          personal: ['firstName'],
        },
      })

      flow.setValues({ firstName: '' })
      flow.validateCurrentStep()

      // After validation completes, isValidating should be false
      expect(flow.store.getState().isValidating).toBe(false)
    })
  })

  describe('persistence integration', () => {
    it('should restore values from localStorage on init', () => {
      mockStorage.setItem(
        'test-flow',
        JSON.stringify({ firstName: 'Restored', lastName: 'User' })
      )

      const flow = createFormFlow<TestData>({
        schema: TestSchema,
        steps: {
          personal: ['firstName', 'lastName'],
        },
        persist: {
          key: 'test-flow',
        },
      })

      expect(flow.store.getState().values).toEqual({
        firstName: 'Restored',
        lastName: 'User',
      })
    })

    it('should not restore malformed localStorage data', () => {
      mockStorage.setItem('test-flow', 'not-valid-json')

      const flow = createFormFlow<TestData>({
        schema: TestSchema,
        steps: {
          personal: ['firstName'],
        },
        persist: {
          key: 'test-flow',
        },
      })

      expect(flow.store.getState().values).toEqual({})
    })

    it('should auto-save values to localStorage', () => {
      const flow = createFormFlow<TestData>({
        schema: TestSchema,
        steps: {
          personal: ['firstName'],
        },
        persist: {
          key: 'test-flow',
        },
      })

      flow.setValues({ firstName: 'AutoSaved' })
      vi.advanceTimersByTime(1000)

      const saved = mockStorage.getItem('test-flow')
      expect(saved).toBe(JSON.stringify({ firstName: 'AutoSaved' }))
    })

    it('should create flow without persistence when persist config is absent', () => {
      const flow = createFormFlow<TestData>({
        schema: TestSchema,
        steps: {
          personal: ['firstName'],
        },
      })

      expect(flow.persistEngine).toBeNull()
      expect(flow.store.getState().values).toEqual({})
    })

    it('should persist across flow instances', () => {
      const flowOne = createFormFlow<TestData>({
        schema: TestSchema,
        steps: {
          personal: ['firstName'],
        },
        persist: {
          key: 'shared-flow',
        },
      })

      flowOne.setValues({ firstName: 'Shared' })
      vi.advanceTimersByTime(1000)

      // Create a new flow instance with the same key
      const flowTwo = createFormFlow<TestData>({
        schema: TestSchema,
        steps: {
          personal: ['firstName'],
        },
        persist: {
          key: 'shared-flow',
        },
      })

      expect(flowTwo.store.getState().values).toEqual({ firstName: 'Shared' })
    })
  })

  describe('setValues', () => {
    it('should update values in the store', () => {
      const flow = createFormFlow<TestData>({
        schema: TestSchema,
        steps: {
          personal: ['firstName', 'lastName'],
        },
      })

      flow.setValues({ firstName: 'John' })

      expect(flow.store.getState().values.firstName).toBe('John')
    })

    it('should merge values with existing ones', () => {
      const flow = createFormFlow<TestData>({
        schema: TestSchema,
        steps: {
          personal: ['firstName', 'lastName'],
        },
      })

      flow.setValues({ firstName: 'John' })
      flow.setValues({ lastName: 'Doe' })

      expect(flow.store.getState().values).toEqual({
        firstName: 'John',
        lastName: 'Doe',
      })
    })

    it('should set isDirty to true when values change', () => {
      const flow = createFormFlow<TestData>({
        schema: TestSchema,
        steps: {
          personal: ['firstName'],
        },
      })

      expect(flow.store.getState().isDirty).toBe(false)

      flow.setValues({ firstName: 'John' })

      expect(flow.store.getState().isDirty).toBe(true)
    })

    it('should overwrite existing values', () => {
      const flow = createFormFlow<TestData>({
        schema: TestSchema,
        steps: {
          personal: ['firstName'],
        },
      })

      flow.setValues({ firstName: 'John' })
      flow.setValues({ firstName: 'Jane' })

      expect(flow.store.getState().values.firstName).toBe('Jane')
    })
  })

  describe('validator exposure', () => {
    it('should expose the validator adapter', () => {
      const flow = createFormFlow<TestData>({
        schema: TestSchema,
        steps: {
          personal: ['firstName'],
        },
      })

      expect(flow.validator).toBeDefined()
      expect(typeof flow.validator.validateStep).toBe('function')
      expect(typeof flow.validator.validateAll).toBe('function')
    })
  })

  describe('persistEngine exposure', () => {
    it('should expose persistEngine when configured', () => {
      const flow = createFormFlow<TestData>({
        schema: TestSchema,
        steps: {
          personal: ['firstName'],
        },
        persist: {
          key: 'test',
        },
      })

      expect(flow.persistEngine).not.toBeNull()
    })

    it('should expose null persistEngine when not configured', () => {
      const flow = createFormFlow<TestData>({
        schema: TestSchema,
        steps: {
          personal: ['firstName'],
        },
      })

      expect(flow.persistEngine).toBeNull()
    })
  })
})
