import { test, expect } from '@playwright/test'

test.describe('SaaS Onboarding Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
    })
    await page.reload()
  })

  test('should render the first step', async ({ page }) => {
    await expect(page.getByTestId('workspace-name-input')).toBeVisible()
    await expect(page.getByTestId('url-slug-input')).toBeVisible()
  })

  test('should show validation errors when clicking next with empty fields', async ({
    page,
  }) => {
    await page.getByTestId('next-button').click()

    await expect(page.getByTestId('workspace-name-error')).toBeVisible()
    await expect(page.getByTestId('url-slug-error')).toBeVisible()
  })

  test('should navigate through all steps and submit successfully', async ({
    page,
  }) => {
    // Step 1: Workspace
    await page.getByTestId('workspace-name-input').fill('Acme Inc')
    await page.getByTestId('url-slug-input').fill('acme-inc')
    await page.getByTestId('next-button').click()

    // Step 2: Team
    await expect(page.getByTestId('team-size-select')).toBeVisible()
    await page.getByTestId('team-size-select').selectOption('6-20')
    await page
      .getByTestId('use-case-select')
      .selectOption('Software Development')
    await page.getByTestId('next-button').click()

    // Step 3: Invite
    await expect(page.getByTestId('teammate-email-input-0')).toBeVisible()
    await page
      .getByTestId('teammate-email-input-0')
      .fill('teammate@example.com')
    await page.getByTestId('next-button').click()

    // Step 4: Review
    await expect(page.getByTestId('submit-button')).toBeVisible()
    await expect(page.getByText('Acme Inc')).toBeVisible()
    await expect(page.getByText('app.com/acme-inc')).toBeVisible()
    await expect(page.getByText('6-20')).toBeVisible()
    await expect(page.getByText('Software Development')).toBeVisible()
    await expect(page.getByText('teammate@example.com')).toBeVisible()

    // Submit
    await page.getByTestId('submit-button').click()
    await expect(page.getByTestId('submit-button')).toBeDisabled()
    await expect(page.getByText('Creating workspace...')).toBeVisible()

    // Success screen
    await expect(page.getByText('Workspace created!')).toBeVisible()
    await expect(page.getByTestId('reset-button')).toBeVisible()
  })

  test('should navigate back to previous steps', async ({ page }) => {
    // Step 1
    await page.getByTestId('workspace-name-input').fill('Acme Inc')
    await page.getByTestId('url-slug-input').fill('acme-inc')
    await page.getByTestId('next-button').click()

    // Step 2
    await page.getByTestId('team-size-select').selectOption('6-20')
    await page
      .getByTestId('use-case-select')
      .selectOption('Software Development')
    await page.getByTestId('next-button').click()

    // Step 3 - go back to step 2
    await page.getByTestId('back-button').click()
    await expect(page.getByTestId('team-size-select')).toBeVisible()
    await expect(page.getByTestId('team-size-select')).toHaveValue('6-20')

    // Go back to step 1
    await page.getByTestId('back-button').click()
    await expect(page.getByTestId('workspace-name-input')).toBeVisible()
    await expect(page.getByTestId('workspace-name-input')).toHaveValue(
      'Acme Inc'
    )
  })

  test('should persist draft and restore after refresh', async ({ page }) => {
    // Fill step 1
    await page.getByTestId('workspace-name-input').fill('Persisted Workspace')
    await page.getByTestId('url-slug-input').fill('persisted')
    await page.getByTestId('next-button').click()

    // Fill step 2
    await page.getByTestId('team-size-select').selectOption('21-50')
    await page.getByTestId('use-case-select').selectOption('Marketing')

    // Wait for persistence debounce (800ms + buffer)
    await page.waitForTimeout(1200)

    // Refresh
    await page.reload()

    // Draft banner should appear
    await expect(page.getByTestId('draft-banner')).toBeVisible()
    await page.getByTestId('restore-draft-button').click()

    // Values should be restored
    await expect(page.getByTestId('workspace-name-input')).toHaveValue(
      'Persisted Workspace'
    )
    await expect(page.getByTestId('url-slug-input')).toHaveValue('persisted')
    await page.getByTestId('next-button').click()
    await expect(page.getByTestId('team-size-select')).toHaveValue('21-50')
    await expect(page.getByTestId('use-case-select')).toHaveValue('Marketing')
  })

  test('should allow skipping invite step with no teammates', async ({
    page,
  }) => {
    // Step 1
    await page.getByTestId('workspace-name-input').fill('Solo Workspace')
    await page.getByTestId('url-slug-input').fill('solo')
    await page.getByTestId('next-button').click()

    // Step 2
    await page.getByTestId('team-size-select').selectOption('1-5')
    await page.getByTestId('use-case-select').selectOption('Other')
    await page.getByTestId('next-button').click()

    // Step 3 - skip adding emails
    await page.getByTestId('next-button').click()

    // Step 4 - review should show no teammates
    await expect(page.getByText('No teammates invited yet')).toBeVisible()
  })

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    await expect(page.getByTestId('workspace-name-input')).toBeVisible()
    await expect(page.getByTestId('url-slug-input')).toBeVisible()
  })
})
