import { useCallback, useState } from 'react'
import { useFormFlow } from '@epochflow/react'
import type { OnboardingData } from '../schema'

export function InviteStep(): JSX.Element {
  const { values, errors, setValues, validateCurrentStep, next, back } =
    useFormFlow<OnboardingData>()

  const existingEmails: string[] = Array.isArray(values.teammateEmails)
    ? values.teammateEmails
    : []

  const [emails, setEmails] = useState<string[]>(
    existingEmails.length > 0 ? existingEmails : ['']
  )

  const syncEmailsToStore = useCallback(
    (nextEmails: string[]): void => {
      const validEmails = nextEmails.filter((email) => email.trim() !== '')
      setValues({
        teammateEmails: validEmails.length > 0 ? validEmails : undefined,
      })
    },
    [setValues]
  )

  const handleNext = useCallback((): void => {
    const stepErrors = validateCurrentStep()
    if (stepErrors === null) {
      next()
    }
  }, [validateCurrentStep, next])

  const updateEmail = useCallback(
    (index: number, value: string): void => {
      setEmails((previous) => {
        const updated = [...previous]
        updated[index] = value
        syncEmailsToStore(updated)
        return updated
      })
    },
    [syncEmailsToStore]
  )

  const addEmailField = useCallback((): void => {
    setEmails((previous) => {
      const updated = [...previous, '']
      syncEmailsToStore(updated)
      return updated
    })
  }, [syncEmailsToStore])

  const removeEmailField = useCallback(
    (index: number): void => {
      setEmails((previous) => {
        const updated = previous.filter((_, idx) => idx !== index)
        syncEmailsToStore(updated)
        return updated
      })
    },
    [syncEmailsToStore]
  )

  const teammateEmailsError = errors.teammateEmails?.[0]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Invite teammates
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Add teammates now or skip and invite them later.
        </p>
      </div>

      <div className="space-y-3">
        {emails.map((email, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="email"
              data-testid={`teammate-email-input-${index}`}
              value={email}
              onChange={(event) => {
                updateEmail(index, event.target.value)
              }}
              placeholder="colleague@company.com"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {emails.length > 1 && (
              <button
                type="button"
                data-testid={`remove-email-button-${index}`}
                onClick={() => {
                  removeEmailField(index)
                }}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white p-2 text-gray-500 hover:bg-gray-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        ))}

        {teammateEmailsError && (
          <p
            className="text-sm text-red-600"
            data-testid="teammate-emails-error"
          >
            {teammateEmailsError}
          </p>
        )}

        <button
          type="button"
          data-testid="add-email-button"
          onClick={addEmailField}
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <svg
            className="mr-1 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add another teammate
        </button>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          data-testid="back-button"
          onClick={back}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
          data-testid="next-button"
          onClick={handleNext}
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Next
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
