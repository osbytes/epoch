import { useCallback } from 'react'
import { useFormFlow } from '@epochflow/react'
import type { OnboardingData } from '../schema'

const TEAM_SIZE_OPTIONS = ['1-5', '6-20', '21-50', '51-100', '100+'] as const

const USE_CASE_OPTIONS = [
  'Project Management',
  'Software Development',
  'Sales & CRM',
  'Marketing',
  'Design & Creative',
  'Other',
] as const

export function TeamStep(): JSX.Element {
  const { values, errors, setValues, validateCurrentStep, next, back } =
    useFormFlow<OnboardingData>()

  const handleNext = useCallback((): void => {
    const stepErrors = validateCurrentStep()
    if (stepErrors === null) {
      next()
    }
  }, [validateCurrentStep, next])

  const updateTeamSize = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>): void => {
      setValues({ teamSize: event.target.value })
    },
    [setValues]
  )

  const updateUseCase = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>): void => {
      setValues({ useCase: event.target.value })
    },
    [setValues]
  )

  const teamSizeError = errors.teamSize?.[0]
  const useCaseError = errors.useCase?.[0]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Tell us about your team
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          This helps us tailor your experience.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="teamSize"
            className="block text-sm font-medium text-gray-700"
          >
            Team size
          </label>
          <select
            id="teamSize"
            data-testid="team-size-select"
            value={values.teamSize ?? ''}
            onChange={updateTeamSize}
            className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              teamSizeError
                ? 'border-red-300 focus:border-red-500'
                : 'border-gray-300 focus:border-blue-500'
            }`}
          >
            <option value="" disabled>
              Select team size
            </option>
            {TEAM_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size} people
              </option>
            ))}
          </select>
          {teamSizeError && (
            <p
              className="mt-1 text-sm text-red-600"
              data-testid="team-size-error"
            >
              {teamSizeError}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="useCase"
            className="block text-sm font-medium text-gray-700"
          >
            Primary use case
          </label>
          <select
            id="useCase"
            data-testid="use-case-select"
            value={values.useCase ?? ''}
            onChange={updateUseCase}
            className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              useCaseError
                ? 'border-red-300 focus:border-red-500'
                : 'border-gray-300 focus:border-blue-500'
            }`}
          >
            <option value="" disabled>
              Select a use case
            </option>
            {USE_CASE_OPTIONS.map((useCase) => (
              <option key={useCase} value={useCase}>
                {useCase}
              </option>
            ))}
          </select>
          {useCaseError && (
            <p
              className="mt-1 text-sm text-red-600"
              data-testid="use-case-error"
            >
              {useCaseError}
            </p>
          )}
        </div>
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
