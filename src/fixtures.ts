import { test as base, expect } from '@playwright/test';
import { BankApi } from './api/BankApi';
import { users } from './data/testData';
import { AccountDetailPage } from './pages/AccountDetailPage';
import { AccountsPage } from './pages/AccountsPage';
import { Header } from './pages/Header';
import { LoginPage } from './pages/LoginPage';
import { TradePage } from './pages/TradePage';
import { TransferPayPage } from './pages/TransferPayPage';

interface Fixtures {
  /** Unauthenticated API client. */
  anonApi: BankApi;
  /** API client logged in as the "demo" user (the same user the UI project is logged in as). */
  api: BankApi;
  header: Header;
  loginPage: LoginPage;
  accountsPage: AccountsPage;
  accountDetailPage: AccountDetailPage;
  tradePage: TradePage;
  transferPayPage: TransferPayPage;
}

interface AutoFixtures {
  /** Restores seed data before every test so tests are independent of each other. */
  resetData: void;
}

export const test = base.extend<Fixtures & AutoFixtures>({
  resetData: [
    async ({ request }, use) => {
      await new BankApi(request).resetDatabase();
      await use();
    },
    { auto: true },
  ],

  anonApi: async ({ request }, use) => {
    await use(new BankApi(request));
  },

  api: async ({ playwright, baseURL }, use) => {
    // Own request context so the token never leaks into `anonApi`.
    const ctx = await playwright.request.newContext({ baseURL });
    const api = new BankApi(ctx);
    await api.login(users.demo.username, users.demo.password);
    await use(api);
    await ctx.dispose();
  },

  header: async ({ page }, use) => use(new Header(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  accountsPage: async ({ page }, use) => use(new AccountsPage(page)),
  accountDetailPage: async ({ page }, use) => use(new AccountDetailPage(page)),
  tradePage: async ({ page }, use) => use(new TradePage(page)),
  transferPayPage: async ({ page }, use) => use(new TransferPayPage(page)),
});

export { expect };
