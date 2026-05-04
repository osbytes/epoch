import React, { createContext, useContext } from 'react'
import type { FormFlow } from '@epochflow/core'

const FormFlowContext = createContext<unknown>(null)

function hasProperty<K extends string>(
  obj: object,
  key: K
): obj is Record<K, unknown> {
  return key in obj
}

function isFormFlow<T>(value: unknown): value is FormFlow<T> {
  if (value === null || typeof value !== 'object') return false

  if (
    !hasProperty(value, 'store') ||
    !hasProperty(value, 'stateMachine') ||
    !hasProperty(value, 'validator') ||
    !hasProperty(value, 'stepNames') ||
    !hasProperty(value, 'next') ||
    !hasProperty(value, 'back')
  ) {
    return false
  }

  return (
    typeof value.next === 'function' &&
    typeof value.back === 'function' &&
    Array.isArray(value.stepNames)
  )
}

/**
 * Provides a form flow instance to all descendant components via React context.
 *
 * @typeParam T - The inferred type of the form schema.
 * @param props - React children and the flow instance to share.
 * @returns A React provider element.
 */
export function FormFlowProvider<T>({
  children,
  flow,
}: {
  children: React.ReactNode
  flow: FormFlow<T>
}): JSX.Element {
  return (
    <FormFlowContext.Provider value={flow}>{children}</FormFlowContext.Provider>
  )
}

/**
 * Low-level hook that returns the flow instance from the nearest `FormFlowProvider`.
 *
 * @typeParam T - The inferred type of the form schema.
 * @returns The `FormFlow` instance.
 * @throws If called outside of a `FormFlowProvider`.
 */
export function useFormFlowContext<T>(): FormFlow<T> {
  const context = useContext(FormFlowContext)

  if (!isFormFlow<T>(context)) {
    throw new Error('useFormFlowContext must be used within a FormFlowProvider')
  }

  return context
}
