import type { Page } from '@playwright/test';
import type { AccountType } from '../data/types';

export const accountsPage = (page: Page) => {
  /** The table row for the account with this nickname. */
  const row = (nickname: string) => page.locator('[data-testid^="account-row-"]').filter({ hasText: nickname });

  return {
    path: '/accounts',
    root: page.getByTestId('accounts-page'),
    welcomeMessage: page.getByTestId('welcome-message'),
    totalBalance: page.getByTestId('total-balance'),
    error: page.getByTestId('accounts-error'),
    group: (type: AccountType) => page.getByTestId(`account-group-${type.toLowerCase()}`),
    row,
    link: (nickname: string) => row(nickname).getByRole('link', { name: nickname }),
    balanceOf: (nickname: string) => row(nickname).getByTestId('account-balance'),
    numberOf: (nickname: string) => row(nickname).getByTestId('account-number'),
  };
};

export type AccountsPage = ReturnType<typeof accountsPage>;
