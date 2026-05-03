import { z } from 'zod'

export const OnboardingSchema = z.object({
  workspaceName: z.string().min(1, 'Workspace name is required'),
  urlSlug: z
    .string()
    .min(1, 'URL slug is required')
    .regex(
      /^[a-z0-9-]+$/,
      'Only lowercase letters, numbers, and hyphens are allowed'
    ),
  teamSize: z.enum(['1-5', '6-20', '21-50', '51-100', '100+'], {
    required_error: 'Please select a team size',
  }),
  useCase: z.string().min(1, 'Please select a use case'),
  teammateEmails: z.array(z.string().email('Invalid email address')).optional(),
})

export type OnboardingData = z.infer<typeof OnboardingSchema>
