import { useCallback } from 'react'
import { useFormFlow } from '@epoch/react'
import type { OnboardingData } from '../schema'

export function ReviewStep(): JSX.Element {
  const {
    values,
    errors,
    isSubmitting,
    submitError,
    validateCurrentStep,
    submit,
    back,
  } = useFormFlow<OnboardingData>()

  const handleSubmit = useCallback((): void => {
    const stepErrors = validateCurrentStep()
    if (stepErrors === null) {
      submit().catch((error: unknown) => {
        console.error('Submit failed:', error)
      })
    }
  }, [validateCurrentStep, submit])

  const teammateEmails: string[] = Array.isArray(values.teammateEmails)
    ? values.teammateEmails
    : []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Review your setup
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Double-check everything before creating your workspace.
        </p>
      </div>

      <div className="rounded-md bg-gray-50 p-4 space-y-4">
        <div className="flex justify-between border-b border-gray-200 pb-3">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Workspace
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {values.workspaceName ?? '—'}
            </p>
            <p className="text-sm text-gray-500">
              app.com/{values.urlSlug ?? '—'}
            </p>
          </div>
        </div>

        <div className="flex justify-between border-b border-gray-200 pb-3">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Team
            </p>
            <p className="mt-1 text-sm text-gray-900">
              <span className="font-semibold">{values.teamSize ?? '—'}</span>{' '}
              people
            </p>
            <p className="text-sm text-gray-500">{values.useCase ?? '—'}</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Teammates
          </p>
          {teammateEmails.length > 0 ? (
            <ul className="mt-1 space-y-1">
              {teammateEmails.map((email, index) => (
                <li key={index} className="text-sm text-gray-900">
                  {email}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-gray-500 italic">
              No teammates invited yet
            </p>
          )}
        </div>
      </div>

      {submitError !== null && (
        <div className="rounded-md bg-red-50 p-3" data-testid="submit-error">
          <p className="text-sm text-red-700">{submitError.message}</p>
        </div>
      )}

      {Object.keys(errors).length > 0 && (
        <div
          className="rounded-md bg-yellow-50 p-3"
          data-testid="validation-summary"
        >
          <p className="text-sm text-yellow-800">
            Some fields are missing or invalid. Please go back and fix them.
          </p>
        </div>
      )}

      <div className="flex justify-between">
        <button
          type="button"
          data-testid="back-button"
          onClick={back}
          disabled={isSubmitting}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          <svg
            className="mr-2 -ml-1 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>
        <button
          type="button"
          data-testid="submit-button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <svg
                className="mr-2 -ml-1 h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Creating workspace...
            </>
          ) : (
            <>
              Create workspace
              <svg
                className="ml-2 -mr-1 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
