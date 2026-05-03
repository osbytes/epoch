import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPersistEngine } from './persist'
import { createStore } from './createStore'

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

describe('createPersistEngine', () => {
  let mockStorage: MockStorage

  beforeEach(() => {
    mockStorage = new MockStorage()
    globalThis.localStorage = mockStorage
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('save', () => {
    it('should save data to localStorage after debounce', () => {
      const engine = createPersistEngine({ key: 'test-draft' })
      const data = { firstName: 'John' }

      engine.save(data)
      expect(mockStorage.getItem('test-draft')).toBeNull()

      vi.advanceTimersByTime(1000)

      expect(mockStorage.getItem('test-draft')).toBe(JSON.stringify(data))
    })

    it('should use custom debounce time', () => {
      const engine = createPersistEngine({ key: 'test-draft', debounceMs: 500 })
      const data = { firstName: 'John' }

      engine.save(data)
      vi.advanceTimersByTime(499)
      expect(mockStorage.getItem('test-draft')).toBeNull()

      vi.advanceTimersByTime(1)
      expect(mockStorage.getItem('test-draft')).toBe(JSON.stringify(data))
    })

    it('should reset debounce on rapid saves', () => {
      const engine = createPersistEngine({ key: 'test-draft' })

      engine.save({ firstName: 'John' })
      vi.advanceTimersByTime(500)
      engine.save({ firstName: 'Jane' })
      vi.advanceTimersByTime(500)

      expect(mockStorage.getItem('test-draft')).toBeNull()

      vi.advanceTimersByTime(500)
      expect(mockStorage.getItem('test-draft')).toBe(
        JSON.stringify({ firstName: 'Jane' })
      )
    })
  })

  describe('load', () => {
    it('should load saved data', () => {
      const engine = createPersistEngine({ key: 'test-draft' })
      const data = { firstName: 'John' }

      mockStorage.setItem('test-draft', JSON.stringify(data))
      const loaded = engine.load()

      expect(loaded).toEqual(data)
    })

    it('should return null for missing key', () => {
      const engine = createPersistEngine({ key: 'missing-key' })
      const loaded = engine.load()

      expect(loaded).toBeNull()
    })

    it('should return null for malformed JSON', () => {
      const engine = createPersistEngine({ key: 'test-draft' })
      mockStorage.setItem('test-draft', 'not-valid-json{')

      const loaded = engine.load()

      expect(loaded).toBeNull()
    })

    it('should return null for empty string', () => {
      const engine = createPersistEngine({ key: 'test-draft' })
      mockStorage.setItem('test-draft', '')

      const loaded = engine.load()

      expect(loaded).toBeNull()
    })
  })

  describe('clear', () => {
    it('should remove data from localStorage', () => {
      const engine = createPersistEngine({ key: 'test-draft' })
      mockStorage.setItem('test-draft', JSON.stringify({ firstName: 'John' }))

      engine.clear()

      expect(mockStorage.getItem('test-draft')).toBeNull()
    })

    it('should cancel pending debounced save', () => {
      const engine = createPersistEngine({ key: 'test-draft' })

      engine.save({ firstName: 'John' })
      engine.clear()
      vi.advanceTimersByTime(1000)

      expect(mockStorage.getItem('test-draft')).toBeNull()
    })
  })

  describe('connectToStore', () => {
    it('should auto-save on store changes', () => {
      const engine = createPersistEngine({ key: 'test-draft' })
      const store = createStore<unknown>({
        values: {},
        errors: {},
        currentStep: 'personal',
        visitedSteps: [],
        isDirty: false,
        isSubmitting: false,
        isValidating: false,
        submitError: null,
        data: null,
      })

      engine.connectToStore(store)

      store.setState({ values: { firstName: 'John' } })
      expect(mockStorage.getItem('test-draft')).toBeNull()

      vi.advanceTimersByTime(1000)
      expect(mockStorage.getItem('test-draft')).toBe(
        JSON.stringify({ firstName: 'John' })
      )
    })

    it('should debounce multiple store changes', () => {
      const engine = createPersistEngine({ key: 'test-draft' })
      const store = createStore<unknown>({
        values: {},
        errors: {},
        currentStep: 'personal',
        visitedSteps: [],
        isDirty: false,
        isSubmitting: false,
        isValidating: false,
        submitError: null,
        data: null,
      })

      engine.connectToStore(store)

      store.setState({ values: { firstName: 'John' } })
      vi.advanceTimersByTime(500)
      store.setState({ values: { firstName: 'Jane' } })
      vi.advanceTimersByTime(500)
      store.setState({ values: { firstName: 'Bob' } })
      vi.advanceTimersByTime(1000)

      expect(mockStorage.getItem('test-draft')).toBe(
        JSON.stringify({ firstName: 'Bob' })
      )
    })

    it('should return an unsubscribe function', () => {
      const engine = createPersistEngine({ key: 'test-draft' })
      const store = createStore<unknown>({
        values: {},
        errors: {},
        currentStep: 'personal',
        visitedSteps: [],
        isDirty: false,
        isSubmitting: false,
        isValidating: false,
        submitError: null,
        data: null,
      })

      const unsubscribe = engine.connectToStore(store)

      expect(typeof unsubscribe).toBe('function')

      unsubscribe()
      store.setState({ values: { firstName: 'John' } })
      vi.advanceTimersByTime(1000)

      expect(mockStorage.getItem('test-draft')).toBeNull()
    })

    it('should save nested values correctly', () => {
      const engine = createPersistEngine({ key: 'test-draft' })
      const store = createStore<unknown>({
        values: {},
        errors: {},
        currentStep: 'personal',
        visitedSteps: [],
        isDirty: false,
        isSubmitting: false,
        isValidating: false,
        submitError: null,
        data: null,
      })

      engine.connectToStore(store)

      store.setState({
        values: {
          user: { name: 'John', email: 'john@example.com' },
          preferences: { theme: 'dark' },
        },
      })
      vi.advanceTimersByTime(1000)

      const saved = mockStorage.getItem('test-draft')
      expect(saved).toBe(
        JSON.stringify({
          user: { name: 'John', email: 'john@example.com' },
          preferences: { theme: 'dark' },
        })
      )
    })
  })
})
