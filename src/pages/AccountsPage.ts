import type { Locator, Page } from '@playwright/test';
import type { AccountType } from '../data/testData';
import { BasePage } from './BasePage';

export class AccountsPage extends BasePage {
  readonly root: Locator;
  readonly welcomeMessage: Locator;
  readonly totalBalance: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    super(page);
    this.root = page.getByTestId('accounts-page');
    this.welcomeMessage = page.getByTestId('welcome-message');
    this.totalBalance = page.getByTestId('total-balance');
    this.error = page.getByTestId('accounts-error');
  }

  async goto() {
    await this.page.goto('/accounts');
  }

  group(type: AccountType) {
    return this.page.getByTestId(`account-group-${type.toLowerCase()}`);
  }

  /** The table row for the account with this nickname. */
  row(nickname: string) {
    return this.page.locator('[data-testid^="account-row-"]').filter({ hasText: nickname });
  }

  balanceOf(nickname: string) {
    return this.row(nickname).getByTestId('account-balance');
  }

  numberOf(nickname: string) {
    return this.row(nickname).getByTestId('account-number');
  }

  async openAccount(nickname: string) {
    await this.row(nickname).getByRole('link', { name: nickname }).click();
  }
}
