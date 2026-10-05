import type { Page } from '@playwright/test';
import type { UserData } from '../data/types';
import { accountsFlows } from './accounts.flows';
import { authFlows } from './auth.flows';
import { tradeFlows } from './trade.flows';
import { transferPayFlows } from './transfer-pay.flows';

export type { Credentials } from './auth.flows';
export type { OrderInput } from './trade.flows';
export type { BillPaymentInput, CashTransactionInput, PayeeInput, TransferInput } from './transfer-pay.flows';

/**
 * Business-level UI actions. Account aliases in the inputs are resolved against `user`
 * (the user the test is logged in as).
 */
export const createFlows = (page: Page, user: UserData) => ({
  auth: authFlows(page),
  accounts: accountsFlows(page, user),
  transferPay: transferPayFlows(page, user),
  trade: tradeFlows(page),
});

export type Flows = ReturnType<typeof createFlows>;
