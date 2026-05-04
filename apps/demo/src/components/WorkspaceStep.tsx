import { useCallback } from 'react'
import { useFormFlow } from '@epochflow/react'
import type { OnboardingData } from '../schema'

export function WorkspaceStep(): JSX.Element {
  const { values, errors, setValues, validateCurrentStep, next } =
    useFormFlow<OnboardingData>()

  const handleNext = useCallback((): void => {
    const stepErrors = validateCurrentStep()
    if (stepErrors === null) {
      next()
    }
  }, [validateCurrentStep, next])

  const updateWorkspaceName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      setValues({ workspaceName: event.target.value })
    },
    [setValues]
  )

  const updateUrlSlug = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      setValues({ urlSlug: event.target.value })
    },
    [setValues]
  )

  const workspaceNameError = errors.workspaceName?.[0]
  const urlSlugError = errors.urlSlug?.[0]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Create your workspace
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Start by giving your workspace a name and a unique URL.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="workspaceName"
            className="block text-sm font-medium text-gray-700"
          >
            Workspace name
          </label>
          <input
            id="workspaceName"
            type="text"
            data-testid="workspace-name-input"
            value={values.workspaceName ?? ''}
            onChange={updateWorkspaceName}
            placeholder="Acme Inc."
            className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              workspaceNameError
                ? 'border-red-300 focus:border-red-500'
                : 'border-gray-300 focus:border-blue-500'
            }`}
          />
          {workspaceNameError && (
            <p
              className="mt-1 text-sm text-red-600"
              data-testid="workspace-name-error"
            >
              {workspaceNameError}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="urlSlug"
            className="block text-sm font-medium text-gray-700"
          >
            URL slug
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
              app.com/
            </span>
            <input
              id="urlSlug"
              type="text"
              data-testid="url-slug-input"
              value={values.urlSlug ?? ''}
              onChange={updateUrlSlug}
              placeholder="acme"
              className={`block w-full flex-1 rounded-none rounded-r-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                urlSlugError
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-gray-300 focus:border-blue-500'
              }`}
            />
          </div>
          {urlSlugError && (
            <p
              className="mt-1 text-sm text-red-600"
              data-testid="url-slug-error"
            >
              {urlSlugError}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
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
