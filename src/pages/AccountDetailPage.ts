import type { Locator, Page } from '@playwright/test';
import type { Transaction } from '../api/BankApi';
import { BasePage } from './BasePage';

export class AccountDetailPage extends BasePage {
  readonly root: Locator;
  readonly backLink: Locator;
  readonly name: Locator;
  readonly number: Locator;
  readonly balance: Locator;
  readonly depositWithdrawLink: Locator;
  readonly filter: Locator;
  readonly transactionsTable: Locator;
  readonly transactionRows: Locator;
  readonly noTransactions: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    super(page);
    this.root = page.getByTestId('account-detail-page');
    this.backLink = page.getByTestId('back-to-accounts');
    this.name = page.getByTestId('account-name');
    this.number = this.root.locator('.page-header').getByTestId('account-number');
    this.balance = this.root.locator('.page-header').getByTestId('account-balance');
    this.depositWithdrawLink = page.getByTestId('deposit-withdraw-link');
    this.filter = page.getByTestId('transaction-filter');
    this.transactionsTable = page.getByTestId('transactions-table');
    this.transactionRows = this.transactionsTable.locator('[data-testid^="transaction-row-"]');
    this.noTransactions = page.getByTestId('no-transactions');
    this.error = page.getByTestId('account-error');
  }

  async goto(accountId: number) {
    await this.page.goto(`/accounts/${accountId}`);
  }

  async filterBy(category: Transaction['category'] | 'ALL') {
    await this.filter.selectOption(category === 'ALL' ? '' : category);
  }

  rowWithDescription(text: string) {
    return this.transactionRows.filter({ hasText: text });
  }
}
