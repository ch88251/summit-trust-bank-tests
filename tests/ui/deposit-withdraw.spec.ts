import { cents, currency, expect, loadData, test, type CashTransactionInput, type Scenario } from '@framework';

type CashInput = CashTransactionInput & { account: string; amount: string };

const data = loadData<{
  maxDeposit: number;
  deposit: CashInput;
  withdrawal: CashInput;
  depositAtLimit: CashInput;
  withdrawalOverBalance: CashTransactionInput & { account: string };
  nonCashAccount: string;
  invalidTransactions: Scenario<CashTransactionInput, { error: string }>[];
  messages: { overBalance: string };
}>('cash');

test.describe('Deposit & withdraw', () => {
  test.beforeEach(async ({ flows }) => {
    await flows.transferPay.openTransferPay('deposit');
  });

  test('deposits funds', async ({ api, flows, transferPayPage: { cash }, user }) => {
    const input = data.deposit;
    const account = user.accounts[input.account];
    const amount = Number(input.amount);
    await flows.transferPay.cashTransaction(input);

    await expect(cash.success).toContainText(`Deposit of ${currency(amount)} to ${account.nickname}`);
    const confirmation = (await cash.confirmation.textContent())!;
    expect(confirmation).toMatch(/^DEP-[0-9A-F]{8}$/);
    await expect(cash.row(confirmation)).toContainText(`+${currency(amount)}`);

    expect((await api.accountByNumber(account.number)).balance).toBe(cents(account.balance + amount));
  });

  test('withdraws funds', async ({ api, flows, transferPayPage: { cash }, user }) => {
    const input = data.withdrawal;
    const account = user.accounts[input.account];
    const amount = Number(input.amount);
    await flows.transferPay.cashTransaction(input);

    await expect(cash.success).toContainText(`Withdrawal of ${currency(amount)} from ${account.nickname}`);
    const confirmation = (await cash.confirmation.textContent())!;
    expect(confirmation).toMatch(/^WDL-[0-9A-F]{8}$/);
    await expect(cash.row(confirmation)).toContainText(`−${currency(amount)}`);

    expect((await api.accountByNumber(account.number)).balance).toBe(cents(account.balance - amount));
  });

  test('submit button and hint reflect the transaction type', async ({ flows, transferPayPage }) => {
    const { cash } = transferPayPage;
    await expect(cash.submit).toHaveText('Deposit Funds');
    await expect(transferPayPage.tabPanel('deposit')).toContainText(`Maximum ${currency(data.maxDeposit)} per deposit.`);

    await flows.transferPay.selectCashType('WITHDRAWAL');
    await expect(cash.submit).toHaveText('Withdraw Funds');
    await cash.account.selectOption({ index: 1 });
    await expect(transferPayPage.tabPanel('deposit')).toContainText('Available balance:');
  });

  test('brokerage accounts are not offered', async ({ transferPayPage: { cash }, user }) => {
    await expect(cash.accountOptions.filter({ hasText: user.accounts[data.nonCashAccount].nickname })).toHaveCount(0);
  });

  test('allows a deposit exactly at the limit', async ({ flows, transferPayPage: { cash } }) => {
    await flows.transferPay.cashTransaction(data.depositAtLimit);
    await expect(cash.success).toContainText(`Deposit of ${currency(Number(data.depositAtLimit.amount))}`);
  });

  test('rejects withdrawals over the balance', async ({ flows, transferPayPage: { cash }, user }) => {
    const input = data.withdrawalOverBalance;
    const { balance } = user.accounts[input.account];
    await flows.transferPay.cashTransaction({ ...input, amount: String(cents(balance + 0.01)) });
    await expect(cash.error).toHaveText(data.messages.overBalance);
  });

  for (const { scenario, input, expected } of data.invalidTransactions) {
    test(scenario, async ({ flows, transferPayPage: { cash } }) => {
      await flows.transferPay.cashTransaction(input);
      await expect(cash.error).toHaveText(expected.error);
    });
  }
});
