import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export type TransferPayTab = 'transfer' | 'deposit' | 'pay' | 'payees';

export class TransferPayPage extends BasePage {
  readonly root: Locator;

  // Transfer Funds
  readonly transferFrom: Locator;
  readonly transferTo: Locator;
  readonly transferAmount: Locator;
  readonly transferMemo: Locator;
  readonly transferSubmit: Locator;
  readonly transferError: Locator;
  readonly transferSuccess: Locator;
  readonly transferConfirmation: Locator;
  readonly transfersTable: Locator;

  // Deposit & Withdraw
  readonly cashDeposit: Locator;
  readonly cashWithdraw: Locator;
  readonly cashAccount: Locator;
  readonly cashAmount: Locator;
  readonly cashMemo: Locator;
  readonly cashSubmit: Locator;
  readonly cashError: Locator;
  readonly cashSuccess: Locator;
  readonly cashConfirmation: Locator;
  readonly cashTable: Locator;

  // Pay Bills
  readonly paymentFrom: Locator;
  readonly paymentPayee: Locator;
  readonly paymentAmount: Locator;
  readonly paymentMemo: Locator;
  readonly paymentSubmit: Locator;
  readonly paymentError: Locator;
  readonly paymentSuccess: Locator;
  readonly paymentConfirmation: Locator;
  readonly paymentsTable: Locator;
  readonly noPayeesMessage: Locator;

  // Manage Payees
  readonly payeesTable: Locator;
  readonly payeeNameInput: Locator;
  readonly payeeAccountInput: Locator;
  readonly payeeNicknameInput: Locator;
  readonly payeeSubmit: Locator;
  readonly payeeError: Locator;
  readonly payeeSuccess: Locator;

  constructor(page: Page) {
    super(page);
    this.root = page.getByTestId('transfer-pay-page');

    this.transferFrom = page.getByTestId('transfer-from');
    this.transferTo = page.getByTestId('transfer-to');
    this.transferAmount = page.getByTestId('transfer-amount');
    this.transferMemo = page.getByTestId('transfer-memo');
    this.transferSubmit = page.getByTestId('transfer-submit');
    this.transferError = page.getByTestId('transfer-error');
    this.transferSuccess = page.getByTestId('transfer-success');
    this.transferConfirmation = page.getByTestId('transfer-confirmation');
    this.transfersTable = page.getByTestId('transfers-table');

    // The radio inputs are visually hidden inside styled labels; interact with the label.
    this.cashDeposit = page.locator('label', { has: page.getByTestId('cash-type-deposit') });
    this.cashWithdraw = page.locator('label', { has: page.getByTestId('cash-type-withdrawal') });
    this.cashAccount = page.getByTestId('cash-account');
    this.cashAmount = page.getByTestId('cash-amount');
    this.cashMemo = page.getByTestId('cash-memo');
    this.cashSubmit = page.getByTestId('cash-submit');
    this.cashError = page.getByTestId('cash-error');
    this.cashSuccess = page.getByTestId('cash-success');
    this.cashConfirmation = page.getByTestId('cash-confirmation');
    this.cashTable = page.getByTestId('cash-table');

    this.paymentFrom = page.getByTestId('payment-from');
    this.paymentPayee = page.getByTestId('payment-payee');
    this.paymentAmount = page.getByTestId('payment-amount');
    this.paymentMemo = page.getByTestId('payment-memo');
    this.paymentSubmit = page.getByTestId('payment-submit');
    this.paymentError = page.getByTestId('payment-error');
    this.paymentSuccess = page.getByTestId('payment-success');
    this.paymentConfirmation = page.getByTestId('payment-confirmation');
    this.paymentsTable = page.getByTestId('payments-table');
    this.noPayeesMessage = page.getByTestId('no-payees-message');

    this.payeesTable = page.getByTestId('payees-table');
    this.payeeNameInput = page.getByTestId('payee-name-input');
    this.payeeAccountInput = page.getByTestId('payee-account-input');
    this.payeeNicknameInput = page.getByTestId('payee-nickname-input');
    this.payeeSubmit = page.getByTestId('payee-submit');
    this.payeeError = page.getByTestId('payee-error');
    this.payeeSuccess = page.getByTestId('payee-success');
  }

  async goto(tab: TransferPayTab = 'transfer', params: Record<string, string> = {}) {
    const query = new URLSearchParams({ tab, ...params });
    await this.page.goto(`/transfer-pay?${query}`);
    await this.tabPanel(tab).waitFor();
  }

  tab(tab: TransferPayTab) {
    return this.page.getByTestId(`tab-${tab}`);
  }

  tabPanel(tab: TransferPayTab) {
    return this.page.getByTestId(`${tab}-tab`);
  }

  async openTab(tab: TransferPayTab) {
    await this.tab(tab).click();
    await this.tabPanel(tab).waitFor();
  }

  // --- Transfer Funds -------------------------------------------------------

  async fillTransfer(from: string, to: string, amount: string, memo?: string) {
    await this.selectOptionContaining(this.transferFrom, from);
    await this.selectOptionContaining(this.transferTo, to);
    await this.transferAmount.fill(amount);
    if (memo) await this.transferMemo.fill(memo);
  }

  async transfer(from: string, to: string, amount: string, memo?: string) {
    await this.fillTransfer(from, to, amount, memo);
    await this.transferSubmit.click();
  }

  transferRow(confirmationNumber: string) {
    return this.page.getByTestId(`transfer-row-${confirmationNumber}`);
  }

  // --- Deposit & Withdraw ---------------------------------------------------

  async cashTransaction(type: 'DEPOSIT' | 'WITHDRAWAL', account: string, amount: string, memo?: string) {
    await (type === 'DEPOSIT' ? this.cashDeposit : this.cashWithdraw).click();
    await this.selectOptionContaining(this.cashAccount, account);
    await this.cashAmount.fill(amount);
    if (memo) await this.cashMemo.fill(memo);
    await this.cashSubmit.click();
  }

  cashRow(confirmationNumber: string) {
    return this.page.getByTestId(`cash-row-${confirmationNumber}`);
  }

  // --- Pay Bills ------------------------------------------------------------

  async payBill(from: string, payee: string, amount: string, memo?: string) {
    await this.selectOptionContaining(this.paymentFrom, from);
    await this.selectOptionContaining(this.paymentPayee, payee);
    await this.paymentAmount.fill(amount);
    if (memo) await this.paymentMemo.fill(memo);
    await this.paymentSubmit.click();
  }

  paymentRow(confirmationNumber: string) {
    return this.page.getByTestId(`payment-row-${confirmationNumber}`);
  }

  // --- Manage Payees --------------------------------------------------------

  payeeRow(name: string) {
    return this.payeesTable.locator('[data-testid^="payee-row-"]').filter({
      has: this.page.getByTestId('payee-name').getByText(name, { exact: true }),
    });
  }

  async addPayee(name: string, accountNumber: string, nickname?: string) {
    await this.payeeNameInput.fill(name);
    await this.payeeAccountInput.fill(accountNumber);
    if (nickname) await this.payeeNicknameInput.fill(nickname);
    await this.payeeSubmit.click();
  }

  async removePayee(name: string, confirm = true) {
    const row = this.payeeRow(name);
    await row.locator('[data-testid^="payee-delete-"]').click();
    await row.locator(`[data-testid^="payee-delete-${confirm ? 'confirm' : 'cancel'}-"]`).click();
  }
}
