import { describe, it, expect } from 'vitest'
import { createStateMachine } from './stateMachine'

describe('createStateMachine', () => {
  describe('linear progression', () => {
    it('should start at the first step', () => {
      const machine = createStateMachine(['personal', 'address', 'review'])

      expect(machine.currentStep).toBe('personal')
      expect(machine.status).toBe('idle')
    })

    it('should advance to the next step', () => {
      const machine = createStateMachine(['personal', 'address', 'review'])

      const result = machine.next()

      expect(result).toBe('address')
      expect(machine.currentStep).toBe('address')
    })

    it('should go back to the previous step', () => {
      const machine = createStateMachine(['personal', 'address', 'review'])
      machine.next()

      const result = machine.back()

      expect(result).toBe('personal')
      expect(machine.currentStep).toBe('personal')
    })

    it('should navigate to a specific step with goTo', () => {
      const machine = createStateMachine(['personal', 'address', 'review'])

      const result = machine.goTo('review')

      expect(result).toBe('review')
      expect(machine.currentStep).toBe('review')
    })
  })

  describe('guards', () => {
    it('should allow next when not on the last step', () => {
      const machine = createStateMachine(['personal', 'address', 'review'])

      expect(machine.canNext()).toBe(true)
    })

    it('should prevent next on the last step', () => {
      const machine = createStateMachine(['personal', 'address', 'review'])
      machine.goTo('review')

      expect(machine.canNext()).toBe(false)
    })

    it('should prevent back on the first step', () => {
      const machine = createStateMachine(['personal', 'address', 'review'])

      expect(machine.canBack()).toBe(false)
    })

    it('should allow back when not on the first step', () => {
      const machine = createStateMachine(['personal', 'address', 'review'])
      machine.next()

      expect(machine.canBack()).toBe(true)
    })

    it('should only allow submit on the last step', () => {
      const machine = createStateMachine(['personal', 'address', 'review'])

      expect(machine.canSubmit()).toBe(false)

      machine.goTo('review')
      expect(machine.canSubmit()).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should return null when next is called on the last step', () => {
      const machine = createStateMachine(['personal', 'address'])
      machine.goTo('address')

      const result = machine.next()

      expect(result).toBeNull()
      expect(machine.currentStep).toBe('address')
    })

    it('should return null when back is called on the first step', () => {
      const machine = createStateMachine(['personal', 'address'])

      const result = machine.back()

      expect(result).toBeNull()
      expect(machine.currentStep).toBe('personal')
    })

    it('should return null when goTo is called with an invalid step name', () => {
      const machine = createStateMachine(['personal', 'address'])

      const result = machine.goTo('nonexistent')

      expect(result).toBeNull()
      expect(machine.currentStep).toBe('personal')
    })

    it('should handle a single-step flow', () => {
      const machine = createStateMachine(['review'])

      expect(machine.currentStep).toBe('review')
      expect(machine.canNext()).toBe(false)
      expect(machine.canBack()).toBe(false)
      expect(machine.canSubmit()).toBe(true)
    })

    it('should handle an empty steps array', () => {
      const machine = createStateMachine([])

      expect(machine.currentStep).toBe('')
      expect(machine.canNext()).toBe(false)
      expect(machine.canBack()).toBe(false)
      expect(machine.canSubmit()).toBe(false)
    })

    it('should update status with setStatus', () => {
      const machine = createStateMachine(['personal', 'address'])

      machine.setStatus('validating')

      expect(machine.status).toBe('validating')
    })
  })
})
