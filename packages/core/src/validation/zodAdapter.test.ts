import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { zodAdapter } from './zodAdapter'

const TestSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be at least 18'),
})

type TestData = z.infer<typeof TestSchema>

describe('zodAdapter', () => {
  describe('validateStep', () => {
    it('should return null for valid step data', () => {
      const adapter = zodAdapter(TestSchema)
      const stepFields: (keyof TestData)[] = ['firstName', 'lastName']
      const values: Partial<TestData> = {
        firstName: 'John',
        lastName: 'Doe',
      }

      const result = adapter.validateStep(stepFields, values)

      expect(result).toBeNull()
    })

    it('should return errors for missing required step fields', () => {
      const adapter = zodAdapter(TestSchema)
      const stepFields: (keyof TestData)[] = ['firstName', 'lastName']
      const values: Partial<TestData> = {
        firstName: '',
      }

      const result = adapter.validateStep(stepFields, values)

      expect(result).not.toBeNull()
      expect(result?.firstName).toBeDefined()
      expect(result?.firstName?.[0]).toBe('First name is required')
    })

    it('should return errors for invalid step field types', () => {
      const adapter = zodAdapter(TestSchema)
      const stepFields: (keyof TestData)[] = ['email']
      const values: Partial<TestData> = {
        email: 'not-an-email',
      }

      const result = adapter.validateStep(stepFields, values)

      expect(result).not.toBeNull()
      expect(result?.email?.[0]).toBe('Invalid email')
    })

    it('should not validate fields outside the step', () => {
      const adapter = zodAdapter(TestSchema)
      const stepFields: (keyof TestData)[] = ['firstName']
      const values: Partial<TestData> = {
        firstName: 'John',
      }

      const result = adapter.validateStep(stepFields, values)

      expect(result).toBeNull()
    })

    it('should validate multiple errors in a step', () => {
      const adapter = zodAdapter(TestSchema)
      const stepFields: (keyof TestData)[] = ['firstName', 'lastName', 'email']
      const values: Partial<TestData> = {
        firstName: '',
        lastName: '',
        email: 'bad',
      }

      const result = adapter.validateStep(stepFields, values)

      expect(result).not.toBeNull()
      expect(Object.keys(result ?? {})).toHaveLength(3)
      expect(result?.firstName?.[0]).toBe('First name is required')
      expect(result?.lastName?.[0]).toBe('Last name is required')
      expect(result?.email?.[0]).toBe('Invalid email')
    })

    it('should return null for empty step fields array', () => {
      const adapter = zodAdapter(TestSchema)
      const values: Partial<TestData> = {}

      const result = adapter.validateStep([], values)

      expect(result).toBeNull()
    })

    it('should validate number constraints in a step', () => {
      const adapter = zodAdapter(TestSchema)
      const stepFields: (keyof TestData)[] = ['age']
      const values: Partial<TestData> = {
        age: 16,
      }

      const result = adapter.validateStep(stepFields, values)

      expect(result).not.toBeNull()
      expect(result?.age?.[0]).toBe('Must be at least 18')
    })
  })

  describe('validateAll', () => {
    it('should return success for valid complete data', () => {
      const adapter = zodAdapter(TestSchema)
      const values = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        age: 25,
      }

      const result = adapter.validateAll(values)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.firstName).toBe('John')
      }
    })

    it('should return errors for invalid complete data', () => {
      const adapter = zodAdapter(TestSchema)
      const values = {
        firstName: '',
        lastName: '',
        email: 'bad',
        age: 16,
      }

      const result = adapter.validateAll(values)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(Object.keys(result.errors)).toHaveLength(4)
      }
    })

    it('should return errors for missing fields', () => {
      const adapter = zodAdapter(TestSchema)
      const values = {}

      const result = adapter.validateAll(values)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(Object.keys(result.errors).length).toBeGreaterThanOrEqual(1)
      }
    })

    it('should return errors for wrong types', () => {
      const adapter = zodAdapter(TestSchema)
      const values = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        age: 'not-a-number',
      }

      const result = adapter.validateAll(values)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.age).toBeDefined()
      }
    })
  })

  describe('error format', () => {
    it('should format errors as Record<string, string[]>', () => {
      const adapter = zodAdapter(TestSchema)
      const values = {
        firstName: '',
      }

      const result = adapter.validateAll(values)

      expect(result.success).toBe(false)
      if (!result.success) {
        // Each field should have an array of messages
        for (const fieldErrors of Object.values(result.errors)) {
          expect(Array.isArray(fieldErrors)).toBe(true)
          expect(fieldErrors.length).toBeGreaterThan(0)
          expect(typeof fieldErrors[0]).toBe('string')
        }
      }
    })
  })

  describe('edge cases', () => {
    it('should handle optional fields', () => {
      const OptionalSchema = z.object({
        name: z.string().min(1),
        nickname: z.string().optional(),
      })
      const adapter = zodAdapter(OptionalSchema)

      const result = adapter.validateAll({ name: 'John' })

      expect(result.success).toBe(true)
    })

    it('should handle nested object schemas', () => {
      const NestedSchema = z.object({
        user: z.object({
          name: z.string().min(1),
        }),
      })
      const adapter = zodAdapter(NestedSchema)

      const result = adapter.validateAll({ user: { name: '' } })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors['user.name']).toBeDefined()
      }
    })

    it('should handle enum fields', () => {
      const EnumSchema = z.object({
        status: z.enum(['active', 'inactive']),
      })
      const adapter = zodAdapter(EnumSchema)

      const validResult = adapter.validateAll({ status: 'active' })
      expect(validResult.success).toBe(true)

      const invalidResult = adapter.validateAll({ status: 'unknown' })
      expect(invalidResult.success).toBe(false)
    })
  })
})
