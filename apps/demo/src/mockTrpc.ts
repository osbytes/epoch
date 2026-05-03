import type { OnboardingData } from './schema'

export interface CreateWorkspaceResponse {
  success: boolean
  workspaceId: string
}

export async function createWorkspace(
  input: OnboardingData
): Promise<CreateWorkspaceResponse> {
  await new Promise((resolve) => {
    setTimeout(resolve, 1200)
  })

  const workspaceId = `ws_${Math.random().toString(36).slice(2, 10)}`

  console.log('Workspace created:', { ...input, workspaceId })

  return { success: true, workspaceId }
}

export const trpc = {
  workspace: {
    create: createWorkspace,
  },
}
