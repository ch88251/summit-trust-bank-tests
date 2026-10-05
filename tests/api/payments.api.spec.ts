import { expect, test } from '../../src/fixtures';
import { users } from '../../src/data/testData';
import { cents, uniqueId } from '../../src/utils/format';

const seed = users.demo.accounts;

test.describe('Transfers API', () => {
  test('creates a transfer and posts both ledger entries', async ({ api }) => {
    const checking = await api.accountByType('CHECKING');
    const savings = await api.accountByType('SAVINGS');

    const transfer = await api.transfer(checking.id, savings.id, '123.45', 'api test');
    expect(transfer.confirmation_number).toMatch(/^TRF-[0-9A-F]{8}$/);
    expect(transfer.amount).toBe(123.45);

    expect((await api.account(checking.id)).balance).toBe(cents(seed.checking.balance - 123.45));
    expect((await api.account(savings.id)).balance).toBe(cents(seed.savings.balance + 123.45));
    const [debit] = await api.transactions(checking.id, 'TRANSFER');
    const [credit] = await api.transactions(savings.id, 'TRANSFER');
    expect(debit.amount).toBe(-123.45);
    expect(credit.amount).toBe(123.45);

    const history = await (await api.get('/transfers')).json();
    expect(history[0].confirmation_number).toBe(transfer.confirmation_number);
  });

  test('same from/to account is 400', async ({ api }) => {
    const checking = await api.accountByType('CHECKING');
    const res = await api.post('/transfers', { from_account_id: checking.id, to_account_id: checking.id, amount: '1' });
    expect(res.status()).toBe(400);
    expect((await res.json()).detail).toBe('From and To accounts must be different');
  });

  test('insufficient funds is 400 and changes nothing', async ({ api }) => {
    const checking = await api.accountByType('CHECKING');
    const savings = await api.accountByType('SAVINGS');
    const res = await api.post('/transfers', { from_account_id: checking.id, to_account_id: savings.id, amount: '99999.00' });
    expect(res.status()).toBe(400);
    expect((await res.json()).detail).toBe('Insufficient funds');
    expect((await api.account(checking.id)).balance).toBe(seed.checking.balance);
  });

  for (const amount of ['0', '-5', '1.234']) {
    test(`amount ${amount} is 422`, async ({ api }) => {
      const checking = await api.accountByType('CHECKING');
      const savings = await api.accountByType('SAVINGS');
      const res = await api.post('/transfers', { from_account_id: checking.id, to_account_id: savings.id, amount });
      expect(res.status()).toBe(422);
    });
  }
});

test.describe('Cash transactions API', () => {
  test('deposit and withdrawal', async ({ api }) => {
    const savings = await api.accountByType('SAVINGS');
    const dep = await api.post('/cash-transactions', { account_id: savings.id, type: 'DEPOSIT', amount: '200.00' });
    expect(dep.status()).toBe(201);
    expect((await dep.json()).confirmation_number).toMatch(/^DEP-/);

    const wdl = await api.post('/cash-transactions', { account_id: savings.id, type: 'WITHDRAWAL', amount: '50.00' });
    expect(wdl.status()).toBe(201);
    expect((await wdl.json()).confirmation_number).toMatch(/^WDL-/);

    expect((await api.account(savings.id)).balance).toBe(cents(seed.savings.balance + 150));
  });

  test('deposit over $10,000 is 400', async ({ api }) => {
    const checking = await api.accountByType('CHECKING');
    const res = await api.post('/cash-transactions', { account_id: checking.id, type: 'DEPOSIT', amount: '10000.01' });
    expect(res.status()).toBe(400);
    expect((await res.json()).detail).toBe('Deposits are limited to $10,000.00 per transaction');
  });

  test('brokerage account is 400', async ({ api }) => {
    const brokerage = await api.accountByType('BROKERAGE');
    const res = await api.post('/cash-transactions', { account_id: brokerage.id, type: 'DEPOSIT', amount: '1' });
    expect(res.status()).toBe(400);
  });
});

test.describe('Payees & payments API', () => {
  test('creates, lists and deletes a payee', async ({ api }) => {
    const name = `Landlord ${uniqueId()}`;
    const payee = await api.addPayee(name, '99887766', 'Rent');
    expect(payee).toMatchObject({ name, account_number: '99887766', nickname: 'Rent' });
    expect((await api.payees()).map((p) => p.name)).toContain(name);

    expect((await api.delete(`/payees/${payee.id}`)).status()).toBe(204);
    expect((await api.payees()).map((p) => p.name)).not.toContain(name);
    expect((await api.delete(`/payees/${payee.id}`)).status()).toBe(404);
  });

  test('duplicate payee is 409', async ({ api }) => {
    const res = await api.post('/payees', { name: 'CITY ELECTRIC', account_number: '88442211' });
    expect(res.status()).toBe(409);
  });

  for (const account_number of ['123', '123456789012345678', '12ab']) {
    test(`payee account number "${account_number}" is 422`, async ({ api }) => {
      expect((await api.post('/payees', { name: 'X', account_number })).status()).toBe(422);
    });
  }

  test('pays a payee', async ({ api }) => {
    const checking = await api.accountByType('CHECKING');
    const payee = (await api.payees()).find((p) => p.name === 'Metro Water')!;
    const res = await api.post('/payments', { from_account_id: checking.id, payee_id: payee.id, amount: '54.20' });
    expect(res.status()).toBe(201);
    const payment = await res.json();
    expect(payment).toMatchObject({ payee_name: 'Metro Water', amount: 54.2 });
    expect(payment.confirmation_number).toMatch(/^PAY-/);
    expect((await api.account(checking.id)).balance).toBe(cents(seed.checking.balance - 54.2));
  });

  test('payment from brokerage is 400', async ({ api }) => {
    const brokerage = await api.accountByType('BROKERAGE');
    const payee = (await api.payees())[0];
    const res = await api.post('/payments', { from_account_id: brokerage.id, payee_id: payee.id, amount: '1' });
    expect(res.status()).toBe(400);
  });

  test('payment to unknown payee is 404', async ({ api }) => {
    const checking = await api.accountByType('CHECKING');
    const res = await api.post('/payments', { from_account_id: checking.id, payee_id: 999999, amount: '1' });
    expect(res.status()).toBe(404);
  });
});
