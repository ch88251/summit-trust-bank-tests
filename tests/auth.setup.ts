import { expect, test as setup } from '@playwright/test';
import { DEMO_STORAGE_STATE } from '../playwright.config';
import { users } from '../src/data/testData';
import { LoginPage } from '../src/pages/LoginPage';

// Logs in once through the UI and saves the token (localStorage "stb_token") so
// UI tests start authenticated. Database resets keep user ids stable, so the token stays valid.
setup('authenticate as demo user', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(users.demo.username, users.demo.password);
  await expect(page).toHaveURL(/\/accounts$/);
  await expect(page.getByTestId('welcome-message')).toBeVisible();
  await page.context().storageState({ path: DEMO_STORAGE_STATE });
});
