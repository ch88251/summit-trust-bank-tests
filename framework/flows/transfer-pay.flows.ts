import type { Page } from '@playwright/test';
import { accountOf } from '../data/loader';
import type { UserData } from '../data/types';
import { transferPayPage, type TransferPayTab } from '../pages/transfer-pay.page';
import { selectOptionContaining } from '../utils/select';

/** Account fields are aliases from users.json (e.g. "checking"). Omitted fields are left untouched. */
export interface TransferInput {
  from?: string;
  to?: string;
  amount?: string;
  memo?: string;
}

export interface CashTransactionInput {
  type: 'DEPOSIT' | 'WITHDRAWAL';
  account?: string;
  amount?: string;
  memo?: string;
}

export interface BillPaymentInput {
  from?: string;
  /** Payee name as shown in the dropdown. */
  payee?: string;
  amount?: string;
  memo?: string;
}

export interface PayeeInput {
  name: string;
  accountNumber: string;
  nickname?: string;
}

export const transferPayFlows = (page: Page, user: UserData) => {
  const tp = transferPayPage(page);
  const nickname = (alias: string) => accountOf(user, alias).nickname;

  const fillTransfer = async ({ from, to, amount, memo }: TransferInput) => {
    if (from) await selectOptionContaining(tp.transfer.from, nickname(from));
    if (to) await selectOptionContaining(tp.transfer.to, nickname(to));
    if (amount !== undefined) await tp.transfer.amount.fill(amount);
    if (memo) await tp.transfer.memo.fill(memo);
  };

  const selectCashType = async (type: CashTransactionInput['type']) => {
    await (type === 'DEPOSIT' ? tp.cash.deposit : tp.cash.withdraw).click();
  };

  return {
    async openTransferPay(tab: TransferPayTab = 'transfer', params: Record<string, string> = {}) {
      await page.goto(`${tp.path}?${new URLSearchParams({ tab, ...params })}`);
      await tp.tabPanel(tab).waitFor();
    },

    async switchTab(tab: TransferPayTab) {
      await tp.tab(tab).click();
      await tp.tabPanel(tab).waitFor();
    },

    fillTransfer,

    async transfer(input: TransferInput) {
      await fillTransfer(input);
      await tp.transfer.submit.click();
    },

    selectCashType,

    async cashTransaction({ type, account, amount, memo }: CashTransactionInput) {
      await selectCashType(type);
      if (account) await selectOptionContaining(tp.cash.account, nickname(account));
      if (amount !== undefined) await tp.cash.amount.fill(amount);
      if (memo) await tp.cash.memo.fill(memo);
      await tp.cash.submit.click();
    },

    async payBill({ from, payee, amount, memo }: BillPaymentInput) {
      if (from) await selectOptionContaining(tp.payment.from, nickname(from));
      if (payee) await selectOptionContaining(tp.payment.payee, payee);
      if (amount !== undefined) await tp.payment.amount.fill(amount);
      if (memo) await tp.payment.memo.fill(memo);
      await tp.payment.submit.click();
    },

    async addPayee({ name, accountNumber, nickname }: PayeeInput) {
      await tp.payees.nameInput.fill(name);
      await tp.payees.accountInput.fill(accountNumber);
      if (nickname) await tp.payees.nicknameInput.fill(nickname);
      await tp.payees.submit.click();
    },

    async removePayee(name: string, { confirm = true } = {}) {
      await tp.payees.deleteButton(name).click();
      await (confirm ? tp.payees.confirmDelete(name) : tp.payees.cancelDelete(name)).click();
    },
  };
};
