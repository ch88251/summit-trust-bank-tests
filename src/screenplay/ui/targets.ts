import type { Answerable } from '@serenity-js/core';
import { includes } from '@serenity-js/assertions';
import { By, PageElement, PageElements, Text } from '@serenity-js/web';

/** Matches the app's `data-testid` attributes, like Playwright's `getByTestId()`. */
export const byTestId = (id: string) => By.css(`[data-testid="${id}"]`);

const element = (id: string, description: string) => PageElement.located(byTestId(id)).describedAs(description);

export const LoginForm = {
  username: () => element('login-username', 'username field'),
  password: () => element('login-password', 'password field'),
  submitButton: () => element('login-submit', 'Sign In button'),
  error: () => element('login-error', 'login error message'),
};

export const AccountsOverview = {
  welcomeMessage: () => element('welcome-message', 'welcome message'),
  totalBalance: () => element('total-balance', 'total balance'),

  rows: () => PageElements.located(By.css('[data-testid^="account-row-"]')).describedAs('account rows'),

  rowFor: (nickname: Answerable<string>) => AccountsOverview.rows().where(Text, includes(nickname)).first(),

  numberOf: (nickname: Answerable<string>) =>
    element('account-number', 'account number').of(AccountsOverview.rowFor(nickname)),

  balanceOf: (nickname: Answerable<string>) =>
    element('account-balance', 'account balance').of(AccountsOverview.rowFor(nickname)),
};

export const TransferForm = {
  panel: () => element('transfer-tab', 'Transfer Funds tab'),
  from: () => element('transfer-from', '"From" account dropdown'),
  to: () => element('transfer-to', '"To" account dropdown'),
  amount: () => element('transfer-amount', 'transfer amount field'),
  memo: () => element('transfer-memo', 'transfer memo field'),
  submitButton: () => element('transfer-submit', 'Transfer button'),
  success: () => element('transfer-success', 'transfer success message'),
  error: () => element('transfer-error', 'transfer error message'),
};

/**
 * The <option> of `select` whose label contains `text`. Account dropdowns render
 * "Nickname (••••1234) — $1,234.56", so callers can pass just the nickname.
 */
export const optionContaining = (select: Answerable<PageElement>, text: Answerable<string>) =>
  PageElements.located(By.css('option')).of(select).where(Text, includes(text)).first();
