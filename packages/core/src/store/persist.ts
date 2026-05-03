/**
 * Configuration for the localStorage persistence engine.
 */
export interface PersistConfig {
  /** localStorage key used to store the draft. */
  key: string
  /** Debounce delay in milliseconds before writing to localStorage. Defaults to 1000. */
  debounceMs?: number
}

/**
 * Engine that handles saving, loading, and clearing persisted draft values.
 */
export interface PersistEngine {
  /** Serializes and debounce-saves data to localStorage. */
  save: (data: unknown) => void
  /** Loads and parses data from localStorage. Returns `null` if missing or invalid. */
  load: () => unknown | null
  /** Removes the persisted draft from localStorage and cancels pending saves. */
  clear: () => void
  /** Connects the engine to a reactive store so changes are auto-persisted. */
  connectToStore: <T>(store: {
    getState: () => { values: Partial<T> }
    subscribe: (listener: () => void) => () => void
  }) => () => void
}

/**
 * Creates a persistence engine backed by `localStorage`.
 *
 * @param config - Persistence configuration.
 * @returns A `PersistEngine` instance.
 */
export function createPersistEngine(config: PersistConfig): PersistEngine {
  const { key, debounceMs = 1000 } = config
  let timeout: ReturnType<typeof setTimeout> | null = null

  const engine: PersistEngine = {
    save: (data: unknown) => {
      if (timeout !== null) clearTimeout(timeout)
      timeout = setTimeout(() => {
        localStorage.setItem(key, JSON.stringify(data))
      }, debounceMs)
    },

    load: (): unknown | null => {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      try {
        return JSON.parse(raw)
      } catch {
        return null
      }
    },

    clear: () => {
      if (timeout !== null) clearTimeout(timeout)
      localStorage.removeItem(key)
    },

    connectToStore: <T>(store: {
      getState: () => { values: Partial<T> }
      subscribe: (listener: () => void) => () => void
    }): (() => void) => {
      const unsubscribe = store.subscribe(() => {
        const state = store.getState()
        engine.save(state.values)
      })

      return unsubscribe
    },
  }

  return engine
}
