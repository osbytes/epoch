import { useFormFlow } from '@epoch/react'
import type { OnboardingData } from '../schema'

interface WorkspaceResponse {
  success: boolean
  workspaceId: string
}

function hasProperty<K extends string>(
  obj: object,
  key: K
): obj is Record<K, unknown> {
  return key in obj
}

function isWorkspaceResponse(value: unknown): value is WorkspaceResponse {
  if (value === null || typeof value !== 'object') return false

  if (!hasProperty(value, 'success') || !hasProperty(value, 'workspaceId')) {
    return false
  }

  return (
    typeof value.success === 'boolean' && typeof value.workspaceId === 'string'
  )
}

export function SuccessScreen(): JSX.Element {
  const { data } = useFormFlow<OnboardingData>()

  const response = isWorkspaceResponse(data) ? data : null

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <svg
          className="h-8 w-8 text-green-600"
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
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Workspace created!</h2>
        <p className="mt-2 text-sm text-gray-500">
          Your workspace is ready. You can start inviting your team and setting
          up projects.
        </p>
      </div>

      {response !== null && (
        <div className="rounded-md bg-gray-50 px-4 py-3">
          <p className="text-sm text-gray-600">
            Workspace ID:{' '}
            <span className="font-mono font-medium text-gray-900">
              {response.workspaceId}
            </span>
          </p>
        </div>
      )}

      <button
        type="button"
        data-testid="reset-button"
        onClick={() => {
          window.location.reload()
        }}
        className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Start over
      </button>
    </div>
  )
}
