import type { Page } from '@playwright/test';

export const accountDetailPage = (page: Page) => {
  const root = page.getByTestId('account-detail-page');
  const pageHeader = root.locator('.page-header');
  const transactionRows = page.getByTestId('transactions-table').locator('[data-testid^="transaction-row-"]');

  return {
    path: (accountId: number) => `/accounts/${accountId}`,
    root,
    backLink: page.getByTestId('back-to-accounts'),
    name: page.getByTestId('account-name'),
    number: pageHeader.getByTestId('account-number'),
    balance: pageHeader.getByTestId('account-balance'),
    depositWithdrawLink: page.getByTestId('deposit-withdraw-link'),
    filter: page.getByTestId('transaction-filter'),
    transactionRows,
    transactionDescriptions: transactionRows.getByTestId('transaction-description'),
    transactionRow: (description: string) => transactionRows.filter({ hasText: description }),
    noTransactions: page.getByTestId('no-transactions'),
    error: page.getByTestId('account-error'),
  };
};

export type AccountDetailPage = ReturnType<typeof accountDetailPage>;
