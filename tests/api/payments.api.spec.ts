import { accountOf, cents, expect, loadData, test, uniqueId, type BankApi, type PayeeInput, type UserData } from '@framework';

const transfers = loadData<{
  api: {
    transfer: { from: string; to: string; amount: string; memo: string };
    sameAccount: { account: string; amount: string; error: string };
    insufficientFunds: { from: string; to: string; amount: string; error: string };
    invalidAmounts: string[];
  };
}>('transfers').api;
const cash = loadData<{
  api: {
    deposit: { account: string; amount: string };
    withdrawal: { account: string; amount: string };
    depositOverLimit: { account: string; amount: string; error: string };
    nonCashAccount: { account: string; amount: string };
  };
}>('cash').api;
const payees = loadData<{
  api: { newPayee: Required<PayeeInput>; duplicate: PayeeInput; invalidAccountNumbers: string[] };
}>('payees').api;
const billPay = loadData<{
  api: {
    payment: { from: string; payee: string; amount: string };
    nonPayingAccount: { from: string; amount: string };
    unknownPayeeId: number;
  };
}>('bill-pay').api;

/** The live account behind a users.json account alias. */
const live = (api: BankApi, user: UserData, alias: string) => api.accountByNumber(accountOf(user, alias).number);

test.describe('Transfers API', () => {
  test('creates a transfer and posts both ledger entries', async ({ api, user }) => {
    const { from: fromAlias, to: toAlias, amount, memo } = transfers.transfer;
    const from = await live(api, user, fromAlias);
    const to = await live(api, user, toAlias);
    const value = Number(amount);

    const transfer = await api.transfer(from.id, to.id, amount, memo);
    expect(transfer.confirmation_number).toMatch(/^TRF-[0-9A-F]{8}$/);
    expect(transfer.amount).toBe(value);

    expect((await api.account(from.id)).balance).toBe(cents(accountOf(user, fromAlias).balance - value));
    expect((await api.account(to.id)).balance).toBe(cents(accountOf(user, toAlias).balance + value));
    const [debit] = await api.transactions(from.id, 'TRANSFER');
    const [credit] = await api.transactions(to.id, 'TRANSFER');
    expect(debit.amount).toBe(-value);
    expect(credit.amount).toBe(value);

    const history = await (await api.get('/transfers')).json();
    expect(history[0].confirmation_number).toBe(transfer.confirmation_number);
  });

  test('same from/to account is 400', async ({ api, user }) => {
    const { account: alias, amount, error } = transfers.sameAccount;
    const account = await live(api, user, alias);
    const res = await api.post('/transfers', { from_account_id: account.id, to_account_id: account.id, amount });
    expect(res.status()).toBe(400);
    expect((await res.json()).detail).toBe(error);
  });

  test('insufficient funds is 400 and changes nothing', async ({ api, user }) => {
    const { from: fromAlias, to: toAlias, amount, error } = transfers.insufficientFunds;
    const from = await live(api, user, fromAlias);
    const to = await live(api, user, toAlias);
    const res = await api.post('/transfers', { from_account_id: from.id, to_account_id: to.id, amount });
    expect(res.status()).toBe(400);
    expect((await res.json()).detail).toBe(error);
    expect((await api.account(from.id)).balance).toBe(accountOf(user, fromAlias).balance);
  });

  for (const amount of transfers.invalidAmounts) {
    test(`amount ${amount} is 422`, async ({ api, user }) => {
      const from = await live(api, user, transfers.transfer.from);
      const to = await live(api, user, transfers.transfer.to);
      const res = await api.post('/transfers', { from_account_id: from.id, to_account_id: to.id, amount });
      expect(res.status()).toBe(422);
    });
  }
});

test.describe('Cash transactions API', () => {
  test('deposit and withdrawal', async ({ api, user }) => {
    const account = await live(api, user, cash.deposit.account);
    const dep = await api.post('/cash-transactions', { account_id: account.id, type: 'DEPOSIT', amount: cash.deposit.amount });
    expect(dep.status()).toBe(201);
    expect((await dep.json()).confirmation_number).toMatch(/^DEP-/);

    const wdl = await api.post('/cash-transactions', { account_id: account.id, type: 'WITHDRAWAL', amount: cash.withdrawal.amount });
    expect(wdl.status()).toBe(201);
    expect((await wdl.json()).confirmation_number).toMatch(/^WDL-/);

    const net = Number(cash.deposit.amount) - Number(cash.withdrawal.amount);
    expect((await api.account(account.id)).balance).toBe(cents(accountOf(user, cash.deposit.account).balance + net));
  });

  test('deposit over the limit is 400', async ({ api, user }) => {
    const { account: alias, amount, error } = cash.depositOverLimit;
    const account = await live(api, user, alias);
    const res = await api.post('/cash-transactions', { account_id: account.id, type: 'DEPOSIT', amount });
    expect(res.status()).toBe(400);
    expect((await res.json()).detail).toBe(error);
  });

  test('brokerage account is 400', async ({ api, user }) => {
    const account = await live(api, user, cash.nonCashAccount.account);
    const res = await api.post('/cash-transactions', { account_id: account.id, type: 'DEPOSIT', amount: cash.nonCashAccount.amount });
    expect(res.status()).toBe(400);
  });
});

test.describe('Payees & payments API', () => {
  test('creates, lists and deletes a payee', async ({ api }) => {
    const { accountNumber, nickname } = payees.newPayee;
    const name = `${payees.newPayee.name} ${uniqueId()}`;
    const payee = await api.addPayee(name, accountNumber, nickname);
    expect(payee).toMatchObject({ name, account_number: accountNumber, nickname });
    expect((await api.payees()).map((p) => p.name)).toContain(name);

    expect((await api.delete(`/payees/${payee.id}`)).status()).toBe(204);
    expect((await api.payees()).map((p) => p.name)).not.toContain(name);
    expect((await api.delete(`/payees/${payee.id}`)).status()).toBe(404);
  });

  test('duplicate payee is 409', async ({ api }) => {
    const { name, accountNumber } = payees.duplicate;
    const res = await api.post('/payees', { name, account_number: accountNumber });
    expect(res.status()).toBe(409);
  });

  for (const account_number of payees.invalidAccountNumbers) {
    test(`payee account number "${account_number}" is 422`, async ({ api }) => {
      expect((await api.post('/payees', { name: 'X', account_number })).status()).toBe(422);
    });
  }

  test('pays a payee', async ({ api, user }) => {
    const { from: alias, payee: payeeName, amount } = billPay.payment;
    const from = await live(api, user, alias);
    const payee = (await api.payees()).find((p) => p.name === payeeName)!;
    const res = await api.post('/payments', { from_account_id: from.id, payee_id: payee.id, amount });
    expect(res.status()).toBe(201);
    const payment = await res.json();
    expect(payment).toMatchObject({ payee_name: payeeName, amount: Number(amount) });
    expect(payment.confirmation_number).toMatch(/^PAY-/);
    expect((await api.account(from.id)).balance).toBe(cents(accountOf(user, alias).balance - Number(amount)));
  });

  test('payment from brokerage is 400', async ({ api, user }) => {
    const from = await live(api, user, billPay.nonPayingAccount.from);
    const payee = (await api.payees())[0];
    const res = await api.post('/payments', { from_account_id: from.id, payee_id: payee.id, amount: billPay.nonPayingAccount.amount });
    expect(res.status()).toBe(400);
  });

  test('payment to unknown payee is 404', async ({ api, user }) => {
    const from = await live(api, user, billPay.payment.from);
    const res = await api.post('/payments', { from_account_id: from.id, payee_id: billPay.unknownPayeeId, amount: '1' });
    expect(res.status()).toBe(404);
  });
});
