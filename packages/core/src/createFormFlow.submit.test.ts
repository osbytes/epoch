import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { z } from 'zod'
import { createFormFlow } from './createFormFlow'

const TestSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
})

type TestData = z.infer<typeof TestSchema>

function getValidValues(): Record<string, unknown> {
  return {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
  }
}

describe('createFormFlow submit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should call mutation with validated data on successful submit', async () => {
    const mockMutation = vi.fn().mockResolvedValue({ id: '123' })

    const flow = createFormFlow<TestData>({
      schema: TestSchema,
      steps: {
        personal: ['firstName', 'lastName'],
        contact: ['email'],
      },
      mutation: mockMutation,
    })

    flow.setValues(getValidValues())

    const result = await flow.submit()

    expect(mockMutation).toHaveBeenCalledTimes(1)
    expect(mockMutation).toHaveBeenCalledWith({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    })
    expect(result).toEqual({ id: '123' })
    expect(flow.store.getState().data).toEqual({ id: '123' })
    expect(flow.store.getState().isSubmitting).toBe(false)
    expect(flow.store.getState().submitError).toBeNull()
  })

  it('should not call mutation when validation fails', async () => {
    const mockMutation = vi.fn().mockResolvedValue({ id: '123' })

    const flow = createFormFlow<TestData>({
      schema: TestSchema,
      steps: {
        personal: ['firstName', 'lastName'],
        contact: ['email'],
      },
      mutation: mockMutation,
    })

    const result = await flow.submit()

    expect(mockMutation).not.toHaveBeenCalled()
    expect(result).toBeNull()
    expect(flow.store.getState().errors).not.toEqual({})
  })

  it('should handle mutation error', async () => {
    const testError = new Error('Network error')
    const mockMutation = vi.fn().mockRejectedValue(testError)

    const flow = createFormFlow<TestData>({
      schema: TestSchema,
      steps: {
        personal: ['firstName', 'lastName'],
        contact: ['email'],
      },
      mutation: mockMutation,
    })

    flow.setValues(getValidValues())

    const result = await flow.submit()

    expect(result).toBeNull()
    expect(flow.store.getState().submitError).toEqual(testError)
    expect(flow.store.getState().isSubmitting).toBe(false)
    expect(flow.store.getState().data).toBeNull()
  })

  it('should set isSubmitting during mutation', async () => {
    const mutationDeferred: {
      resolve: (value: unknown) => void
      reject: (reason: unknown) => void
    } = {
      resolve: () => {},
      reject: () => {},
    }

    const mutationPromise = new Promise<unknown>((resolve, reject) => {
      mutationDeferred.resolve = resolve
      mutationDeferred.reject = reject
    })

    const mockMutation = vi.fn().mockReturnValue(mutationPromise)

    const flow = createFormFlow<TestData>({
      schema: TestSchema,
      steps: {
        personal: ['firstName', 'lastName'],
        contact: ['email'],
      },
      mutation: mockMutation,
    })

    flow.setValues(getValidValues())

    const submitPromise = flow.submit()

    expect(flow.store.getState().isSubmitting).toBe(true)

    mutationDeferred.resolve({ success: true })
    await submitPromise

    expect(flow.store.getState().isSubmitting).toBe(false)
  })

  it('should throw when mutation is not configured', async () => {
    const flow = createFormFlow<TestData>({
      schema: TestSchema,
      steps: {
        personal: ['firstName', 'lastName'],
        contact: ['email'],
      },
    })

    flow.setValues(getValidValues())

    await expect(flow.submit()).rejects.toThrow('No mutation configured')
  })

  it('should clear persistence on successful submit', async () => {
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

    globalThis.localStorage = new MockStorage()

    const mockMutation = vi.fn().mockResolvedValue({ id: '123' })

    const flow = createFormFlow<TestData>({
      schema: TestSchema,
      steps: {
        personal: ['firstName', 'lastName'],
        contact: ['email'],
      },
      mutation: mockMutation,
      persist: {
        key: 'test-submit-clear',
      },
    })

    flow.setValues(getValidValues())
    vi.advanceTimersByTime(1000)

    expect(globalThis.localStorage.getItem('test-submit-clear')).not.toBeNull()

    await flow.submit()

    expect(globalThis.localStorage.getItem('test-submit-clear')).toBeNull()
  })

  it('should mark isDirty as false after successful submit', async () => {
    const mockMutation = vi.fn().mockResolvedValue({ id: '123' })

    const flow = createFormFlow<TestData>({
      schema: TestSchema,
      steps: {
        personal: ['firstName', 'lastName'],
        contact: ['email'],
      },
      mutation: mockMutation,
    })

    flow.setValues(getValidValues())

    expect(flow.store.getState().isDirty).toBe(true)

    await flow.submit()

    expect(flow.store.getState().isDirty).toBe(false)
  })

  it('should keep isDirty true after failed submit', async () => {
    const mockMutation = vi.fn().mockRejectedValue(new Error('Failed'))

    const flow = createFormFlow<TestData>({
      schema: TestSchema,
      steps: {
        personal: ['firstName', 'lastName'],
        contact: ['email'],
      },
      mutation: mockMutation,
    })

    flow.setValues(getValidValues())

    await flow.submit()

    expect(flow.store.getState().isDirty).toBe(true)
  })

  it('should wrap non-Error throws in Error', async () => {
    const mockMutation = vi.fn().mockRejectedValue('string error')

    const flow = createFormFlow<TestData>({
      schema: TestSchema,
      steps: {
        personal: ['firstName', 'lastName'],
        contact: ['email'],
      },
      mutation: mockMutation,
    })

    flow.setValues(getValidValues())

    await flow.submit()

    expect(flow.store.getState().submitError).toBeInstanceOf(Error)
    expect(flow.store.getState().submitError?.message).toBe('string error')
  })
})
