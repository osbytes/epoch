import { useFormFlow } from '@epochflow/react'
import type { OnboardingData } from '../schema'

const STEP_LABELS: Record<string, string> = {
  workspace: 'Workspace',
  team: 'Team',
  invite: 'Invite',
  review: 'Review',
}

const STEP_ORDER = ['workspace', 'team', 'invite', 'review']

export function StepIndicator(): JSX.Element {
  const { currentStep, visitedSteps } = useFormFlow<OnboardingData>()

  const currentIndex = STEP_ORDER.indexOf(currentStep)

  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-center w-full">
        {STEP_ORDER.map((step, index) => {
          const isCompleted =
            visitedSteps.includes(step) && step !== currentStep
          const isCurrent = step === currentStep

          return (
            <li
              key={step}
              className={`flex items-center ${
                index < STEP_ORDER.length - 1 ? 'flex-1' : ''
              }`}
            >
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors duration-300 ${
                    isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <svg
                      className="w-4 h-4"
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
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium transition-colors duration-300 ${
                    isCurrent
                      ? 'text-blue-600'
                      : isCompleted
                        ? 'text-green-600'
                        : 'text-gray-400'
                  }`}
                >
                  {STEP_LABELS[step]}
                </span>
              </div>
              {index < STEP_ORDER.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 transition-colors duration-300 ${
                    index < currentIndex ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
