import { expect, test } from '@playwright/test'

test('publishes to the feed and opens the coach', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('jules@hearth.example')
  await page.getByLabel('Password').fill('hearth-demo-member')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Feed' })).toBeVisible()

  const post = `Evening walk habit ${Date.now()}`
  await page.getByRole('button', { name: 'Write a post' }).click()
  await page.getByRole('textbox', { name: 'Post', exact: true }).fill(post)
  await page.getByRole('button', { name: 'Publish' }).click()
  await expect(page.getByText(post)).toBeVisible()

  await page.getByRole('link', { name: 'Coach' }).click()
  await expect(page.getByRole('note')).toContainText(/not medical advice/i)
  await page.getByLabel('Habit question').fill('Help me keep a short evening walk')
  await page.getByRole('button', { name: 'Ask the coach' }).click()
  await expect(page.getByText(/leave your shoes by the door/i)).toBeVisible()
})
