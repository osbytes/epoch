import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { z } from 'zod'
import { createFormFlow } from '@epoch/core'
import {
  FormFlowProvider,
  useFormFlow,
  useStepFields,
  usePersistedDraft,
} from './index'

const TestSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
})

type TestData = z.infer<typeof TestSchema>

function createTestFlow(persistKey?: string) {
  return createFormFlow<TestData>({
    schema: TestSchema,
    steps: {
      personal: ['firstName', 'lastName'],
      contact: ['email'],
    },
    persist: persistKey ? { key: persistKey } : undefined,
  })
}

function TestComponent() {
  const flow = useFormFlow<TestData>()

  return (
    <div>
      <div data-testid="current-step">{flow.currentStep}</div>
      <div data-testid="is-dirty">{flow.isDirty ? 'dirty' : 'clean'}</div>
      <div data-testid="can-next">{flow.canNext ? 'yes' : 'no'}</div>
      <div data-testid="can-back">{flow.canBack ? 'yes' : 'no'}</div>
      <div data-testid="values">{JSON.stringify(flow.values)}</div>
      <div data-testid="errors">{JSON.stringify(flow.errors)}</div>
      <button data-testid="next-btn" onClick={flow.next}>
        Next
      </button>
      <button data-testid="back-btn" onClick={flow.back}>
        Back
      </button>
      <button
        data-testid="set-values-btn"
        onClick={() => flow.setValues({ firstName: 'John' })}
      >
        Set Values
      </button>
      <button data-testid="validate-btn" onClick={flow.validateCurrentStep}>
        Validate
      </button>
    </div>
  )
}

describe('FormFlowProvider', () => {
  it('should render children without errors', () => {
    const flow = createTestFlow()

    render(
      <FormFlowProvider flow={flow}>
        <div data-testid="child">Child Content</div>
      </FormFlowProvider>
    )

    expect(screen.getByTestId('child')).toHaveTextContent('Child Content')
  })

  it('should throw when hook is used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    function BadComponent() {
      const flow = useFormFlow<TestData>()
      return <div>{flow.currentStep}</div>
    }

    expect(() => render(<BadComponent />)).toThrow(
      'useFormFlowContext must be used within a FormFlowProvider'
    )

    consoleError.mockRestore()
  })
})

describe('useFormFlow', () => {
  it('should read initial state from the flow', () => {
    const flow = createTestFlow()

    render(
      <FormFlowProvider flow={flow}>
        <TestComponent />
      </FormFlowProvider>
    )

    expect(screen.getByTestId('current-step')).toHaveTextContent('personal')
    expect(screen.getByTestId('is-dirty')).toHaveTextContent('clean')
    expect(screen.getByTestId('can-next')).toHaveTextContent('yes')
    expect(screen.getByTestId('can-back')).toHaveTextContent('no')
  })

  it('should update state when next is called', () => {
    const flow = createTestFlow()

    render(
      <FormFlowProvider flow={flow}>
        <TestComponent />
      </FormFlowProvider>
    )

    fireEvent.click(screen.getByTestId('next-btn'))

    expect(screen.getByTestId('current-step')).toHaveTextContent('contact')
    expect(screen.getByTestId('can-next')).toHaveTextContent('no')
    expect(screen.getByTestId('can-back')).toHaveTextContent('yes')
  })

  it('should update state when back is called', () => {
    const flow = createTestFlow()

    render(
      <FormFlowProvider flow={flow}>
        <TestComponent />
      </FormFlowProvider>
    )

    fireEvent.click(screen.getByTestId('next-btn'))
    fireEvent.click(screen.getByTestId('back-btn'))

    expect(screen.getByTestId('current-step')).toHaveTextContent('personal')
  })

  it('should set values and mark dirty', () => {
    const flow = createTestFlow()

    render(
      <FormFlowProvider flow={flow}>
        <TestComponent />
      </FormFlowProvider>
    )

    fireEvent.click(screen.getByTestId('set-values-btn'))

    expect(screen.getByTestId('is-dirty')).toHaveTextContent('dirty')
    expect(screen.getByTestId('values')).toHaveTextContent('"firstName":"John"')
  })

  it('should validate current step and show errors', () => {
    const flow = createTestFlow()

    render(
      <FormFlowProvider flow={flow}>
        <TestComponent />
      </FormFlowProvider>
    )

    fireEvent.click(screen.getByTestId('validate-btn'))

    expect(screen.getByTestId('errors')).toHaveTextContent('firstName')
  })
})

describe('useStepFields', () => {
  function StepFieldsComponent() {
    const personal = useStepFields<TestData>('personal')
    const contact = useStepFields<TestData>('contact')

    return (
      <div>
        <div data-testid="personal-fields">{personal.fields.join(',')}</div>
        <div data-testid="personal-current">
          {personal.isCurrent ? 'yes' : 'no'}
        </div>
        <div data-testid="personal-visited">
          {personal.isVisited ? 'yes' : 'no'}
        </div>
        <div data-testid="contact-fields">{contact.fields.join(',')}</div>
        <div data-testid="contact-current">
          {contact.isCurrent ? 'yes' : 'no'}
        </div>
      </div>
    )
  }

  it('should return step fields and status', () => {
    const flow = createTestFlow()

    render(
      <FormFlowProvider flow={flow}>
        <StepFieldsComponent />
      </FormFlowProvider>
    )

    expect(screen.getByTestId('personal-fields')).toHaveTextContent(
      'firstName,lastName'
    )
    expect(screen.getByTestId('personal-current')).toHaveTextContent('yes')
    expect(screen.getByTestId('personal-visited')).toHaveTextContent('yes')
    expect(screen.getByTestId('contact-fields')).toHaveTextContent('email')
    expect(screen.getByTestId('contact-current')).toHaveTextContent('no')
  })
})

describe('usePersistedDraft', () => {
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

  beforeEach(() => {
    globalThis.localStorage = new MockStorage()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function DraftComponent() {
    const draft = usePersistedDraft<TestData>()

    return (
      <div>
        <div data-testid="has-draft">{draft.hasDraft ? 'yes' : 'no'}</div>
        <div data-testid="show-restore-prompt">
          {draft.shouldShowRestorePrompt ? 'yes' : 'no'}
        </div>
        <button data-testid="save-draft" onClick={draft.saveDraft}>
          Save
        </button>
        <button data-testid="clear-draft" onClick={draft.clearDraft}>
          Clear
        </button>
        <button data-testid="restore-draft" onClick={draft.restoreDraft}>
          Restore
        </button>
      </div>
    )
  }

  it('should detect existing draft on mount', () => {
    globalThis.localStorage.setItem(
      'draft-test',
      JSON.stringify({ firstName: 'Saved' })
    )

    const flow = createTestFlow('draft-test')

    render(
      <FormFlowProvider flow={flow}>
        <DraftComponent />
      </FormFlowProvider>
    )

    expect(screen.getByTestId('has-draft')).toHaveTextContent('yes')
    expect(screen.getByTestId('show-restore-prompt')).toHaveTextContent('yes')
  })

  it('should save draft', () => {
    const flow = createTestFlow('draft-test')

    render(
      <FormFlowProvider flow={flow}>
        <DraftComponent />
      </FormFlowProvider>
    )

    flow.setValues({ firstName: 'John' })
    vi.advanceTimersByTime(1000)

    fireEvent.click(screen.getByTestId('save-draft'))

    expect(screen.getByTestId('has-draft')).toHaveTextContent('yes')
  })

  it('should clear draft', () => {
    globalThis.localStorage.setItem(
      'draft-test',
      JSON.stringify({ firstName: 'Saved' })
    )

    const flow = createTestFlow('draft-test')

    render(
      <FormFlowProvider flow={flow}>
        <DraftComponent />
      </FormFlowProvider>
    )

    expect(screen.getByTestId('has-draft')).toHaveTextContent('yes')

    fireEvent.click(screen.getByTestId('clear-draft'))

    expect(screen.getByTestId('has-draft')).toHaveTextContent('no')
    expect(screen.getByTestId('show-restore-prompt')).toHaveTextContent('no')
  })

  it('should set shouldShowRestorePrompt false after restoreDraft while hasDraft stays true', () => {
    globalThis.localStorage.setItem(
      'draft-test',
      JSON.stringify({ firstName: 'Saved', lastName: 'User', email: 'a@b.co' })
    )

    const flow = createTestFlow('draft-test')

    render(
      <FormFlowProvider flow={flow}>
        <DraftComponent />
      </FormFlowProvider>
    )

    expect(screen.getByTestId('show-restore-prompt')).toHaveTextContent('yes')

    fireEvent.click(screen.getByTestId('restore-draft'))

    expect(screen.getByTestId('has-draft')).toHaveTextContent('yes')
    expect(screen.getByTestId('show-restore-prompt')).toHaveTextContent('no')
  })

  it('should show restore prompt again after clearDraft then saveDraft', () => {
    globalThis.localStorage.setItem(
      'draft-test',
      JSON.stringify({ firstName: 'Saved' })
    )

    const flow = createTestFlow('draft-test')

    render(
      <FormFlowProvider flow={flow}>
        <DraftComponent />
      </FormFlowProvider>
    )

    fireEvent.click(screen.getByTestId('clear-draft'))
    expect(screen.getByTestId('show-restore-prompt')).toHaveTextContent('no')

    flow.setValues({ firstName: 'John', lastName: 'Doe', email: 'john@example.com' })
    fireEvent.click(screen.getByTestId('save-draft'))

    expect(screen.getByTestId('has-draft')).toHaveTextContent('yes')
    expect(screen.getByTestId('show-restore-prompt')).toHaveTextContent('yes')
  })

  it('should return false for hasDraft and restore prompt when no persist config', () => {
    const flow = createTestFlow()

    render(
      <FormFlowProvider flow={flow}>
        <DraftComponent />
      </FormFlowProvider>
    )

    expect(screen.getByTestId('has-draft')).toHaveTextContent('no')
    expect(screen.getByTestId('show-restore-prompt')).toHaveTextContent('no')
  })
})

describe('hook composition', () => {
  function ComposedComponent() {
    const flow = useFormFlow<TestData>()
    const personal = useStepFields<TestData>('personal')

    return (
      <div>
        <div data-testid="step">{flow.currentStep}</div>
        <div data-testid="fields">{personal.fields.join(',')}</div>
        <button data-testid="next" onClick={flow.next}>
          Next
        </button>
      </div>
    )
  }

  it('should work when multiple hooks are used together', () => {
    const flow = createTestFlow()

    render(
      <FormFlowProvider flow={flow}>
        <ComposedComponent />
      </FormFlowProvider>
    )

    expect(screen.getByTestId('step')).toHaveTextContent('personal')
    expect(screen.getByTestId('fields')).toHaveTextContent('firstName,lastName')

    fireEvent.click(screen.getByTestId('next'))

    expect(screen.getByTestId('step')).toHaveTextContent('contact')
    expect(screen.getByTestId('fields')).toHaveTextContent('firstName,lastName')
  })
})

describe('useFormFlow submit', () => {
  function SubmitComponent() {
    const flow = useFormFlow<TestData>()

    return (
      <div>
        <div data-testid="is-submitting">
          {flow.isSubmitting ? 'submitting' : 'idle'}
        </div>
        <div data-testid="data">{JSON.stringify(flow.data)}</div>
        <div data-testid="submit-error">
          {flow.submitError ? flow.submitError.message : 'none'}
        </div>
        <div data-testid="is-dirty">{flow.isDirty ? 'dirty' : 'clean'}</div>
        <button
          data-testid="set-values-btn"
          onClick={() =>
            flow.setValues({
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com',
            })
          }
        >
          Set Values
        </button>
        <button data-testid="submit-btn" onClick={() => flow.submit()}>
          Submit
        </button>
      </div>
    )
  }

  it('should call mutation and show data on successful submit', async () => {
    const mockMutation = vi.fn().mockResolvedValue({ id: '123' })

    const flow = createFormFlow<TestData>({
      schema: TestSchema,
      steps: {
        personal: ['firstName', 'lastName'],
        contact: ['email'],
      },
      mutation: mockMutation,
    })

    render(
      <FormFlowProvider flow={flow}>
        <SubmitComponent />
      </FormFlowProvider>
    )

    fireEvent.click(screen.getByTestId('set-values-btn'))
    fireEvent.click(screen.getByTestId('submit-btn'))

    expect(screen.getByTestId('is-submitting')).toHaveTextContent('submitting')

    await vi.waitFor(() => {
      expect(screen.getByTestId('is-submitting')).toHaveTextContent('idle')
      expect(screen.getByTestId('data')).toHaveTextContent('"id":"123"')
      expect(screen.getByTestId('is-dirty')).toHaveTextContent('clean')
    })

    expect(mockMutation).toHaveBeenCalledWith({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    })
  })

  it('should show error on failed submit', async () => {
    const mockMutation = vi.fn().mockRejectedValue(new Error('Server error'))

    const flow = createFormFlow<TestData>({
      schema: TestSchema,
      steps: {
        personal: ['firstName'],
      },
      mutation: mockMutation,
    })

    render(
      <FormFlowProvider flow={flow}>
        <SubmitComponent />
      </FormFlowProvider>
    )

    fireEvent.click(screen.getByTestId('set-values-btn'))
    fireEvent.click(screen.getByTestId('submit-btn'))

    await vi.waitFor(() => {
      expect(screen.getByTestId('submit-error')).toHaveTextContent(
        'Server error'
      )
      expect(screen.getByTestId('is-dirty')).toHaveTextContent('dirty')
    })
  })

  it('should not submit when validation fails', async () => {
    const mockMutation = vi.fn().mockResolvedValue({ id: '123' })

    const flow = createFormFlow<TestData>({
      schema: TestSchema,
      steps: {
        personal: ['firstName'],
      },
      mutation: mockMutation,
    })

    render(
      <FormFlowProvider flow={flow}>
        <SubmitComponent />
      </FormFlowProvider>
    )

    fireEvent.click(screen.getByTestId('submit-btn'))

    await vi.waitFor(() => {
      expect(mockMutation).not.toHaveBeenCalled()
      expect(screen.getByTestId('is-submitting')).toHaveTextContent('idle')
    })
  })
})
