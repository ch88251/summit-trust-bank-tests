import { BankApi } from '../../src/api/BankApi';
import { expect, test } from '../../src/fixtures';
import { users } from '../../src/data/testData';

test.describe('Accounts API', () => {
  test('lists the seeded accounts', async ({ api }) => {
    const accounts = await api.accounts();
    expect(accounts.map(({ account_number, account_type, nickname, balance }) => ({
      number: account_number,
      type: account_type,
      nickname,
      balance,
    }))).toEqual(Object.values(users.demo.accounts));
  });

  test('transaction balances reconcile with the account balance', async ({ api }) => {
    for (const account of await api.accounts()) {
      const txns = await api.transactions(account.id);
      expect(txns[0].balance_after).toBe(account.balance);
      const sum = txns.reduce((total, t) => total + t.amount, 0);
      expect(Math.round(sum * 100) / 100).toBe(account.balance);
    }
  });

  test('filters transactions by category', async ({ api }) => {
    const checking = await api.accountByType('CHECKING');
    const deposits = await api.transactions(checking.id, 'DEPOSIT');
    expect(deposits.length).toBeGreaterThan(0);
    expect(deposits.every((t) => t.category === 'DEPOSIT')).toBe(true);
  });

  test('rejects an invalid category', async ({ api }) => {
    const checking = await api.accountByType('CHECKING');
    expect((await api.get(`/accounts/${checking.id}/transactions`, { category: 'BOGUS' })).status()).toBe(422);
  });

  test('limits transactions', async ({ api }) => {
    const checking = await api.accountByType('CHECKING');
    const res = await api.get(`/accounts/${checking.id}/transactions`, { limit: 3 });
    expect(await res.json()).toHaveLength(3);
  });

  test("another user's account is 404", async ({ api, playwright, baseURL }) => {
    const ctx = await playwright.request.newContext({ baseURL });
    const jane = new BankApi(ctx);
    await jane.login(users.jane.username, users.jane.password);
    const janeChecking = await jane.accountByType('CHECKING');
    await ctx.dispose();

    expect((await api.get(`/accounts/${janeChecking.id}`)).status()).toBe(404);
    expect((await api.get(`/accounts/${janeChecking.id}/transactions`)).status()).toBe(404);
  });

  test('demo account cannot withdraw money from jane account', async ({ api, playwright, baseURL }) => {
    const ctx = await playwright.request.newContext({ baseURL });
    const jane = new BankApi(ctx);
    await jane.login(users.jane.username, users.jane.password);
    const janeChecking = await jane.accountByType('CHECKING');
    await ctx.dispose();

    const checking = await api.accountByType('CHECKING');
    const res = await api.post('/transfers', {
      from_account_id: checking.id,
      to_account_id: janeChecking.id,
      amount: '100.00',
    });

    // Expect a 404 status because the demo account cannot withdraw from Jane's account
    expect(res.status()).toBe(404);
  });

  test('reset endpoint restores seed data', async ({ api }) => {
    const checking = await api.accountByType('CHECKING');
    const savings = await api.accountByType('SAVINGS');
    await api.transfer(checking.id, savings.id, '100.00');
    expect((await api.account(checking.id)).balance).not.toBe(users.demo.accounts.checking.balance);

    await api.resetDatabase();
    expect((await api.accountByType('CHECKING')).balance).toBe(users.demo.accounts.checking.balance);
  });


});
