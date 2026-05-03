import { useState, useEffect, useCallback, useRef } from 'react'
import { FormFlowProvider, useFormFlow, usePersistedDraft } from '@epoch/react'
import type { OnboardingData } from './schema'
import { onboardingFlow } from './flow'
import { StepIndicator } from './components/StepIndicator'
import { WorkspaceStep } from './components/WorkspaceStep'
import { TeamStep } from './components/TeamStep'
import { InviteStep } from './components/InviteStep'
import { ReviewStep } from './components/ReviewStep'
import { SuccessScreen } from './components/SuccessScreen'

const stepOrder = ['workspace', 'team', 'invite', 'review']

function DraftBanner(): JSX.Element | null {
  const { shouldShowRestorePrompt, clearDraft, restoreDraft } =
    usePersistedDraft<OnboardingData>()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!shouldShowRestorePrompt) {
      setIsVisible(false)
      return undefined
    }

    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 300)

    return () => {
      clearTimeout(timer)
    }
  }, [shouldShowRestorePrompt])

  const handleRestore = useCallback((): void => {
    restoreDraft()
  }, [restoreDraft])

  const handleDismiss = useCallback((): void => {
    clearDraft()
  }, [clearDraft])

  if (!isVisible) return null

  return (
    <div
      className="mb-6 rounded-md bg-blue-50 p-4 transition-all duration-500 ease-out"
      data-testid="draft-banner"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start">
          <svg
            className="mt-0.5 h-5 w-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Draft found</h3>
            <p className="mt-1 text-sm text-blue-700">
              We saved your progress. Would you like to restore it?
            </p>
          </div>
        </div>
        <div className="ml-4 flex shrink-0 space-x-2">
          <button
            type="button"
            data-testid="restore-draft-button"
            onClick={handleRestore}
            className="rounded-md bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-800 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Restore
          </button>
          <button
            type="button"
            data-testid="dismiss-draft-button"
            onClick={handleDismiss}
            className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}

function StepContent(): JSX.Element {
  const { currentStep, data } = useFormFlow<OnboardingData>()
  const [animationKey, setAnimationKey] = useState(0)
  const previousStepRef = useRef(currentStep)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')

  useEffect(() => {
    const currentIndex = stepOrder.indexOf(currentStep)
    const previousIndex = stepOrder.indexOf(previousStepRef.current)

    setDirection(currentIndex >= previousIndex ? 'forward' : 'backward')
    previousStepRef.current = currentStep
    setAnimationKey((previous) => previous + 1)
  }, [currentStep])

  if (data !== null) {
    return <SuccessScreen />
  }

  const stepComponents: Record<string, JSX.Element> = {
    workspace: <WorkspaceStep />,
    team: <TeamStep />,
    invite: <InviteStep />,
    review: <ReviewStep />,
  }

  const component = stepComponents[currentStep] ?? <WorkspaceStep />

  return (
    <div
      key={animationKey}
      className={`transition-all duration-300 ease-out ${
        direction === 'forward'
          ? 'animate-fade-in-right'
          : 'animate-fade-in-left'
      }`}
      data-testid="step-content"
    >
      {component}
    </div>
  )
}

function Wizard(): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Epoch
          </h1>
          <p className="mt-2 text-lg text-gray-600">SaaS Onboarding Wizard</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-lg sm:p-8">
          <div className="mb-8">
            <StepIndicator />
          </div>

          <DraftBanner />

          <StepContent />
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Built with Epoch — draft-aware, typed multi-step forms
        </p>
      </div>
    </div>
  )
}

export default function App(): JSX.Element {
  return (
    <FormFlowProvider flow={onboardingFlow}>
      <Wizard />
    </FormFlowProvider>
  )
}
