import type { Page } from '@playwright/test';

export type TransferPayTab = 'transfer' | 'deposit' | 'pay' | 'payees';

/** Transfer & Pay, grouped by tab: `transfer`, `cash` (Deposit & Withdraw), `payment` (Pay Bills), `payees`. */
export const transferPayPage = (page: Page) => {
  const payeesTable = page.getByTestId('payees-table');
  const payeeRow = (name: string) =>
    payeesTable.locator('[data-testid^="payee-row-"]').filter({
      has: page.getByTestId('payee-name').getByText(name, { exact: true }),
    });

  return {
    path: '/transfer-pay',
    root: page.getByTestId('transfer-pay-page'),
    tab: (tab: TransferPayTab) => page.getByTestId(`tab-${tab}`),
    tabPanel: (tab: TransferPayTab) => page.getByTestId(`${tab}-tab`),

    transfer: {
      from: page.getByTestId('transfer-from'),
      fromOptions: page.getByTestId('transfer-from').locator('option'),
      to: page.getByTestId('transfer-to'),
      toOptions: page.getByTestId('transfer-to').locator('option'),
      amount: page.getByTestId('transfer-amount'),
      memo: page.getByTestId('transfer-memo'),
      submit: page.getByTestId('transfer-submit'),
      error: page.getByTestId('transfer-error'),
      success: page.getByTestId('transfer-success'),
      confirmation: page.getByTestId('transfer-confirmation'),
      table: page.getByTestId('transfers-table'),
      row: (confirmationNumber: string) => page.getByTestId(`transfer-row-${confirmationNumber}`),
    },

    cash: {
      // The radio inputs are visually hidden inside styled labels; interact with the label.
      deposit: page.locator('label', { has: page.getByTestId('cash-type-deposit') }),
      withdraw: page.locator('label', { has: page.getByTestId('cash-type-withdrawal') }),
      account: page.getByTestId('cash-account'),
      accountOptions: page.getByTestId('cash-account').locator('option'),
      amount: page.getByTestId('cash-amount'),
      memo: page.getByTestId('cash-memo'),
      submit: page.getByTestId('cash-submit'),
      error: page.getByTestId('cash-error'),
      success: page.getByTestId('cash-success'),
      confirmation: page.getByTestId('cash-confirmation'),
      table: page.getByTestId('cash-table'),
      row: (confirmationNumber: string) => page.getByTestId(`cash-row-${confirmationNumber}`),
    },

    payment: {
      from: page.getByTestId('payment-from'),
      fromOptions: page.getByTestId('payment-from').locator('option'),
      payee: page.getByTestId('payment-payee'),
      payeeOptions: page.getByTestId('payment-payee').locator('option'),
      amount: page.getByTestId('payment-amount'),
      memo: page.getByTestId('payment-memo'),
      submit: page.getByTestId('payment-submit'),
      error: page.getByTestId('payment-error'),
      success: page.getByTestId('payment-success'),
      confirmation: page.getByTestId('payment-confirmation'),
      table: page.getByTestId('payments-table'),
      row: (confirmationNumber: string) => page.getByTestId(`payment-row-${confirmationNumber}`),
      noPayeesMessage: page.getByTestId('no-payees-message'),
    },

    payees: {
      table: payeesTable,
      row: payeeRow,
      deleteButton: (name: string) => payeeRow(name).locator('[data-testid^="payee-delete-"]'),
      confirmDelete: (name: string) => payeeRow(name).locator('[data-testid^="payee-delete-confirm-"]'),
      cancelDelete: (name: string) => payeeRow(name).locator('[data-testid^="payee-delete-cancel-"]'),
      nameInput: page.getByTestId('payee-name-input'),
      accountInput: page.getByTestId('payee-account-input'),
      nicknameInput: page.getByTestId('payee-nickname-input'),
      submit: page.getByTestId('payee-submit'),
      error: page.getByTestId('payee-error'),
      success: page.getByTestId('payee-success'),
    },
  };
};

export type TransferPayPage = ReturnType<typeof transferPayPage>;
