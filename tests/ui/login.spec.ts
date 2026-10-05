import { expect, test } from '../../src/fixtures';
import { users } from '../../src/data/testData';

test.describe('Login', () => {
  // These tests start logged out.
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('shows the login form and demo credentials', async ({ loginPage, header }) => {
    await expect(loginPage.form).toBeVisible();
    await expect(loginPage.username).toBeFocused();
    await expect(loginPage.demoCredentials).toContainText('demo / Demo@123');
    await expect(header.navLogin).toBeVisible();
  });

  for (const key of ['demo', 'jane'] as const) {
    test(`logs in as ${key} and lands on accounts`, async ({ page, loginPage, accountsPage, header }) => {
      const user = users[key];
      await loginPage.login(user.username, user.password);

      await expect(page).toHaveURL(/\/accounts$/);
      await expect(accountsPage.welcomeMessage).toHaveText(`Welcome back, ${user.fullName.split(' ')[0]}`);
      await expect(header.profileName).toHaveText(user.fullName);
    });
  }

  test('username is case-insensitive and trimmed', async ({ page, loginPage }) => {
    await loginPage.login('  DEMO  ', users.demo.password);
    await expect(page).toHaveURL(/\/accounts$/);
  });

  test('rejects an invalid password', async ({ page, loginPage }) => {
    await loginPage.login(users.demo.username, 'wrong-password');
    await expect(loginPage.error).toHaveText('Invalid username or password');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('rejects an unknown user', async ({ loginPage }) => {
    await loginPage.login('nobody', 'whatever');
    await expect(loginPage.error).toHaveText('Invalid username or password');
  });

  test('requires both username and password', async ({ loginPage }) => {
    await loginPage.submit.click();
    await expect(loginPage.error).toHaveText('Please enter your username and password.');

    await loginPage.username.fill(users.demo.username);
    await loginPage.submit.click();
    await expect(loginPage.error).toHaveText('Please enter your username and password.');
  });

  test('toggles password visibility', async ({ loginPage }) => {
    await loginPage.password.fill('secret');
    await expect(loginPage.password).toHaveAttribute('type', 'password');
    await loginPage.togglePassword.click();
    await expect(loginPage.password).toHaveAttribute('type', 'text');
    await expect(loginPage.togglePassword).toHaveText('Hide');
    await loginPage.togglePassword.click();
    await expect(loginPage.password).toHaveAttribute('type', 'password');
  });

  test('redirects protected pages to login and back after signing in', async ({ page, loginPage, tradePage }) => {
    await page.goto('/trade');
    await expect(page).toHaveURL(/\/login$/);

    await loginPage.login(users.demo.username, users.demo.password);
    await expect(page).toHaveURL(/\/trade$/);
    await expect(tradePage.root).toBeVisible();
  });
});

test.describe('Logout', () => {
  test('logs out from the profile menu', async ({ page, header, loginPage }) => {
    await page.goto('/accounts');
    await header.openProfileMenu();
    await expect(header.profileDropdown).toBeVisible();
    await expect(header.profileEmail).toHaveText(users.demo.email);

    await header.logoutButton.click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(loginPage.form).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('stb_token'))).toBeNull();

    await page.goto('/accounts');
    await expect(page).toHaveURL(/\/login$/);
  });

  // Known app bug: logout() clears the user before navigating, so the protected route's
  // <Navigate to="/login"> usually wins the race and drops the { loggedOut: true } state.
  test.fixme('shows a logged-out confirmation message', async ({ page, header, loginPage }) => {
    await page.goto('/accounts');
    await header.logout();
    await expect(loginPage.logoutMessage).toHaveText('You have been logged out successfully.');
  });

  test('closes the profile menu with Escape', async ({ page, header }) => {
    await page.goto('/accounts');
    await header.openProfileMenu();
    await expect(header.profileDropdown).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(header.profileDropdown).toBeHidden();
  });

  test('an invalid token sends the user back to login', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('stb_token', 'not-a-real-token'));
    await page.goto('/accounts');
    await expect(page).toHaveURL(/\/login$/);
  });
});
