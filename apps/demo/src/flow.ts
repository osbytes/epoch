import { createFormFlow } from '@epochflow/core'
import { OnboardingSchema } from './schema'
import { trpc } from './mockTrpc'

export const onboardingFlow = createFormFlow({
  schema: OnboardingSchema,
  steps: {
    workspace: ['workspaceName', 'urlSlug'],
    team: ['teamSize', 'useCase'],
    invite: ['teammateEmails'],
    review: [],
  },
  persist: {
    key: 'onboarding-draft',
    debounceMs: 800,
  },
  mutation: trpc.workspace.create,
})
