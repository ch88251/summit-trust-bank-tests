import { accountOf, cents, expect, loadData, test, type Transaction } from '@framework';

const { otherUser, api: data } = loadData<{
  otherUser: string;
  api: {
    filterCategory: { account: string; category: Transaction['category'] };
    invalidCategory: string;
    transactionLimit: number;
    resetCheck: { from: string; to: string; amount: string };
  };
}>('accounts');

test.describe('Accounts API', () => {
  test('lists the seeded accounts', async ({ api, user }) => {
    const accounts = await api.accounts();
    expect(accounts.map(({ account_number, account_type, nickname, balance }) => ({
      number: account_number,
      type: account_type,
      nickname,
      balance,
    }))).toEqual(Object.values(user.accounts));
  });

  test('transaction balances reconcile with the account balance', async ({ api }) => {
    for (const account of await api.accounts()) {
      const txns = await api.transactions(account.id);
      expect(txns[0].balance_after).toBe(account.balance);
      expect(cents(txns.reduce((total, t) => total + t.amount, 0))).toBe(account.balance);
    }
  });

  test('filters transactions by category', async ({ api, user }) => {
    const { account: alias, category } = data.filterCategory;
    const account = await api.accountByNumber(accountOf(user, alias).number);
    const matching = await api.transactions(account.id, category);
    expect(matching.length).toBeGreaterThan(0);
    expect(matching.every((t) => t.category === category)).toBe(true);
  });

  test('rejects an invalid category', async ({ api, user }) => {
    const checking = await api.accountByNumber(user.accounts.checking.number);
    expect((await api.get(`/accounts/${checking.id}/transactions`, { category: data.invalidCategory })).status()).toBe(422);
  });

  test('limits transactions', async ({ api, user }) => {
    const checking = await api.accountByNumber(user.accounts.checking.number);
    const res = await api.get(`/accounts/${checking.id}/transactions`, { limit: data.transactionLimit });
    expect(await res.json()).toHaveLength(data.transactionLimit);
  });

  test("another user's account is 404", async ({ api, apiAs }) => {
    const otherChecking = await (await apiAs(otherUser)).accountByType('CHECKING');

    expect((await api.get(`/accounts/${otherChecking.id}`)).status()).toBe(404);
    expect((await api.get(`/accounts/${otherChecking.id}/transactions`)).status()).toBe(404);
  });

  test('reset endpoint restores seed data', async ({ api, user }) => {
    const { from, to, amount } = data.resetCheck;
    const fromSeed = accountOf(user, from);
    const fromAccount = await api.accountByNumber(fromSeed.number);
    const toAccount = await api.accountByNumber(accountOf(user, to).number);
    await api.transfer(fromAccount.id, toAccount.id, amount);
    expect((await api.account(fromAccount.id)).balance).not.toBe(fromSeed.balance);

    await api.resetDatabase();
    expect((await api.accountByNumber(fromSeed.number)).balance).toBe(fromSeed.balance);
  });
});
