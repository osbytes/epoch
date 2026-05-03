import { z } from 'zod'

function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {}

  for (const issue of error.issues) {
    const path = issue.path.join('.')
    if (formatted[path] === undefined) {
      formatted[path] = []
    }
    formatted[path].push(issue.message)
  }

  return formatted
}

function isZodObject(
  schema: z.ZodType<unknown>
): schema is z.ZodObject<Record<string, z.ZodType<unknown>>> {
  return schema instanceof z.ZodObject
}

/**
 * Adapter that validates form values against a Zod schema.
 *
 * @typeParam T - The inferred type of the Zod schema.
 */
export interface ValidationAdapter<T> {
  /**
   * Validates only the fields belonging to the current step.
   *
   * @param stepFields - Array of field names for the step.
   * @param values - Current partial form values.
   * @returns A record of field errors, or `null` if valid.
   */
  validateStep: (
    stepFields: (keyof T)[],
    values: Partial<T>
  ) => Record<string, string[]> | null
  /**
   * Validates the entire form payload.
   *
   * @param values - Complete or partial form values.
   * @returns Parsed data on success, or errors on failure.
   */
  validateAll: (
    values: unknown
  ) =>
    | { success: true; data: T }
    | { success: false; errors: Record<string, string[]> }
}

/**
 * Creates a Zod-based validation adapter for a form flow.
 *
 * @typeParam T - The inferred type of the Zod schema.
 * @param schema - The Zod schema to validate against.
 * @returns A `ValidationAdapter` with per-step and full validation.
 */
export function zodAdapter<T>(schema: z.ZodType<T>): ValidationAdapter<T> {
  function validateStep(
    stepFields: (keyof T)[],
    values: Partial<T>
  ): Record<string, string[]> | null {
    if (isZodObject(schema)) {
      const pickShape: Record<string, true> = {}
      for (const field of stepFields) {
        pickShape[String(field)] = true
      }

      const stepSchema = schema.pick(pickShape)
      const result = stepSchema.safeParse(values)

      if (result.success) return null
      return formatZodErrors(result.error)
    }

    // Fallback for non-object schemas: validate all and filter to step fields
    const result = schema.safeParse(values)
    if (result.success) return null

    const allErrors = formatZodErrors(result.error)
    const stepFieldKeys = stepFields.map((field) => String(field))

    const filteredErrors: Record<string, string[]> = {}
    for (const key of stepFieldKeys) {
      if (allErrors[key] !== undefined) {
        filteredErrors[key] = allErrors[key]
      }
    }

    return Object.keys(filteredErrors).length > 0 ? filteredErrors : null
  }

  function validateAll(
    values: unknown
  ):
    | { success: true; data: T }
    | { success: false; errors: Record<string, string[]> } {
    const result = schema.safeParse(values)
    if (result.success) return { success: true, data: result.data }
    return { success: false, errors: formatZodErrors(result.error) }
  }

  return { validateStep, validateAll }
}
