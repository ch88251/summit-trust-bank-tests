import { cents, expect, loadData, test, type BillPaymentInput, type Scenario } from '@framework';

const data = loadData<{
  payBill: Scenario<BillPaymentInput & { from: string; amount: string }, { message: string; ledgerDescription: string }>;
  nonPayingAccount: string;
  invalidPayments: Scenario<BillPaymentInput, { error: string }>[];
}>('bill-pay');

test.describe('Pay bills', () => {
  test.beforeEach(async ({ flows }) => {
    await flows.transferPay.openTransferPay('pay');
  });

  test(data.payBill.scenario, async ({ api, flows, transferPayPage: { payment }, user }) => {
    const { input, expected } = data.payBill;
    const from = user.accounts[input.from];
    const amount = Number(input.amount);
    await flows.transferPay.payBill(input);

    await expect(payment.success).toContainText(expected.message);
    const confirmation = (await payment.confirmation.textContent())!;
    expect(confirmation).toMatch(/^PAY-[0-9A-F]{8}$/);
    await expect(payment.row(confirmation)).toContainText(input.payee!);

    const account = await api.accountByNumber(from.number);
    expect(account.balance).toBe(cents(from.balance - amount));
    const [latest] = await api.transactions(account.id);
    expect(latest).toMatchObject({ category: 'PAYMENT', description: expected.ledgerDescription, amount: -amount });
  });

  test('lists all seeded payees', async ({ transferPayPage: { payment }, user }) => {
    for (const { name } of user.payees) {
      await expect(payment.payeeOptions.filter({ hasText: name })).toHaveCount(1);
    }
  });

  test('brokerage accounts cannot pay bills', async ({ transferPayPage: { payment }, user }) => {
    await expect(payment.fromOptions.filter({ hasText: user.accounts[data.nonPayingAccount].nickname })).toHaveCount(0);
  });

  for (const { scenario, input, expected } of data.invalidPayments) {
    test(scenario, async ({ flows, transferPayPage: { payment } }) => {
      await flows.transferPay.payBill(input);
      await expect(payment.error).toHaveText(expected.error);
    });
  }

  test('prompts to add a payee when there are none', async ({ api, flows, transferPayPage: { payment } }) => {
    for (const payee of await api.payees()) {
      expect((await api.delete(`/payees/${payee.id}`)).status()).toBe(204);
    }
    await flows.transferPay.openTransferPay('pay');
    await expect(payment.noPayeesMessage).toBeVisible();
  });
});
