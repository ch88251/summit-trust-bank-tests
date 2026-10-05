import { expect, getUser, loadData, test, type Credentials, type Scenario } from '@framework';

const data = loadData<{
  demoCredentialsHint: string;
  loginAs: string[];
  usernameNormalization: { username: string; user: string };
  invalidCredentials: Scenario<Credentials>[];
  messages: { invalidCredentials: string; missingCredentials: string; loggedOut: string };
}>('auth');

test.describe('Login', () => {
  test.use({ loggedInAs: null });

  test.beforeEach(async ({ flows }) => {
    await flows.auth.openLogin();
  });

  test('shows the login form and demo credentials', async ({ loginPage, header }) => {
    await expect(loginPage.form).toBeVisible();
    await expect(loginPage.username).toBeFocused();
    await expect(loginPage.demoCredentials).toContainText(data.demoCredentialsHint);
    await expect(header.navLogin).toBeVisible();
  });

  for (const key of data.loginAs) {
    test(`logs in as ${key} and lands on accounts`, async ({ page, flows, accountsPage, header }) => {
      const user = getUser(key);
      await flows.auth.login(user);

      await expect(page).toHaveURL(/\/accounts$/);
      await expect(accountsPage.welcomeMessage).toHaveText(`Welcome back, ${user.fullName.split(' ')[0]}`);
      await expect(header.profileName).toHaveText(user.fullName);
    });
  }

  test('username is case-insensitive and trimmed', async ({ page, flows }) => {
    const { username, user } = data.usernameNormalization;
    await flows.auth.login({ username, password: getUser(user).password });
    await expect(page).toHaveURL(/\/accounts$/);
  });

  for (const { scenario, input } of data.invalidCredentials) {
    test(`rejects ${scenario}`, async ({ page, flows, loginPage }) => {
      await flows.auth.login(input);
      await expect(loginPage.error).toHaveText(data.messages.invalidCredentials);
      await expect(page).toHaveURL(/\/login$/);
    });
  }

  test('requires both username and password', async ({ flows, loginPage, user }) => {
    await flows.auth.login({});
    await expect(loginPage.error).toHaveText(data.messages.missingCredentials);

    await flows.auth.login({ username: user.username });
    await expect(loginPage.error).toHaveText(data.messages.missingCredentials);
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

  test('redirects protected pages to login and back after signing in', async ({ page, flows, tradePage, user }) => {
    await flows.trade.openTrade();
    await expect(page).toHaveURL(/\/login$/);

    await flows.auth.login(user);
    await expect(page).toHaveURL(/\/trade$/);
    await expect(tradePage.root).toBeVisible();
  });
});

test.describe('Logout', () => {
  test.beforeEach(async ({ flows }) => {
    await flows.accounts.openAccounts();
  });

  test('logs out from the profile menu', async ({ page, flows, header, loginPage, user }) => {
    await flows.auth.openProfileMenu();
    await expect(header.profileDropdown).toBeVisible();
    await expect(header.profileEmail).toHaveText(user.email);

    await header.logoutButton.click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(loginPage.form).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('stb_token'))).toBeNull();

    await flows.accounts.openAccounts();
    await expect(page).toHaveURL(/\/login$/);
  });

  // Known app bug: logout() clears the user before navigating, so the protected route's
  // <Navigate to="/login"> usually wins the race and drops the { loggedOut: true } state.
  test.fixme('shows a logged-out confirmation message', async ({ flows, loginPage }) => {
    await flows.auth.logout();
    await expect(loginPage.logoutMessage).toHaveText(data.messages.loggedOut);
  });

  test('closes the profile menu with Escape', async ({ page, flows, header }) => {
    await flows.auth.openProfileMenu();
    await expect(header.profileDropdown).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(header.profileDropdown).toBeHidden();
  });
});

test.describe('Session', () => {
  test.use({ loggedInAs: null });

  test('an invalid token sends the user back to login', async ({ page, flows }) => {
    await page.addInitScript(() => localStorage.setItem('stb_token', 'not-a-real-token'));
    await flows.accounts.openAccounts();
    await expect(page).toHaveURL(/\/login$/);
  });
});
