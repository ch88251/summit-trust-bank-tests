import { test as base, expect } from '@playwright/test';
import { BankApi } from './api/BankApi';
import { TOKEN_STORAGE_KEY } from './config';
import { defaultUserKey, getUser } from './data/loader';
import type { UserData } from './data/types';
import { createFlows, type Flows } from './flows';
import {
  accountDetailPage,
  accountsPage,
  header,
  loginPage,
  notFoundPage,
  tradePage,
  transferPayPage,
  type AccountDetailPage,
  type AccountsPage,
  type Header,
  type LoginPage,
  type NotFoundPage,
  type TradePage,
  type TransferPayPage,
} from './pages';

interface Options {
  /**
   * Key of the users.json user the browser starts logged in as, or `null` to start logged out.
   * Defaults to `defaultUser` from users.json. Override with `test.use({ loggedInAs: 'jane' })`.
   */
  loggedInAs: string | null;
}

interface Fixtures {
  /** Test data for `loggedInAs` (the default user when logged out). */
  user: UserData;
  /** Unauthenticated API client. */
  anonApi: BankApi;
  /** API client logged in as `user`. */
  api: BankApi;
  /** Returns an API client logged in as another users.json user. Contexts are disposed after the test. */
  apiAs: (userKey: string) => Promise<BankApi>;
  /** Business-level UI actions, with account aliases resolved against `user`. */
  flows: Flows;
  header: Header;
  loginPage: LoginPage;
  accountsPage: AccountsPage;
  accountDetailPage: AccountDetailPage;
  tradePage: TradePage;
  transferPayPage: TransferPayPage;
  notFoundPage: NotFoundPage;
}

interface AutoFixtures {
  /** Restores seed data before every test so tests are independent of each other. */
  resetData: void;
}

export const test = base.extend<Options & Fixtures & AutoFixtures>({
  loggedInAs: [defaultUserKey(), { option: true }],

  resetData: [
    async ({ request }, use) => {
      await new BankApi(request).resetDatabase();
      await use();
    },
    { auto: true },
  ],

  user: async ({ loggedInAs }, use) => {
    await use(getUser(loggedInAs ?? undefined));
  },

  apiAs: async ({ playwright, baseURL }, use) => {
    const contexts: Array<{ dispose(): Promise<void> }> = [];
    await use(async (userKey) => {
      // Own request context per user so tokens never leak between clients.
      const ctx = await playwright.request.newContext({ baseURL });
      contexts.push(ctx);
      const user = getUser(userKey);
      const api = new BankApi(ctx);
      await api.login(user.username, user.password);
      return api;
    });
    await Promise.all(contexts.map((ctx) => ctx.dispose()));
  },

  anonApi: async ({ request }, use) => {
    await use(new BankApi(request));
  },

  api: async ({ apiAs, user }, use) => {
    await use(await apiAs(user.key));
  },

  // Logs in through the API and hands the browser the same localStorage the app writes after a UI login.
  storageState: async ({ loggedInAs, apiAs, baseURL }, use) => {
    if (!loggedInAs) return use({ cookies: [], origins: [] });
    const api = await apiAs(loggedInAs);
    await use({
      cookies: [],
      origins: [{ origin: new URL(baseURL!).origin, localStorage: [{ name: TOKEN_STORAGE_KEY, value: api.accessToken! }] }],
    });
  },

  flows: async ({ page, user }, use) => use(createFlows(page, user)),

  header: async ({ page }, use) => use(header(page)),
  loginPage: async ({ page }, use) => use(loginPage(page)),
  accountsPage: async ({ page }, use) => use(accountsPage(page)),
  accountDetailPage: async ({ page }, use) => use(accountDetailPage(page)),
  tradePage: async ({ page }, use) => use(tradePage(page)),
  transferPayPage: async ({ page }, use) => use(transferPayPage(page)),
  notFoundPage: async ({ page }, use) => use(notFoundPage(page)),
});

export { expect };
