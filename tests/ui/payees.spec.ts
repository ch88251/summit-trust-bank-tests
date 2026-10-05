import { expect, loadData, maskAccount, test, uniqueId, type PayeeInput, type Scenario } from '@framework';

const data = loadData<{
  newPayee: PayeeInput;
  payeeToRemove: string;
  invalidPayees: Scenario<PayeeInput, { error: string }>[];
}>('payees');

test.describe('Manage payees', () => {
  test.beforeEach(async ({ flows }) => {
    await flows.transferPay.openTransferPay('payees');
  });

  test('lists seeded payees with masked account numbers', async ({ transferPayPage: { payees }, user }) => {
    for (const payee of user.payees) {
      await expect(payees.row(payee.name)).toContainText(maskAccount(payee.accountNumber));
      if (payee.nickname) await expect(payees.row(payee.name)).toContainText(payee.nickname);
    }
  });

  test('adds a payee who can then be paid', async ({ flows, transferPayPage }) => {
    const { payees, payment } = transferPayPage;
    const payee = { ...data.newPayee, name: `${data.newPayee.name} ${uniqueId()}` };
    await flows.transferPay.addPayee(payee);

    await expect(payees.success).toContainText(`Payee “${payee.name}” added.`);
    await expect(payees.row(payee.name)).toContainText(maskAccount(payee.accountNumber));
    await expect(payees.nameInput).toHaveValue('');

    await flows.transferPay.switchTab('pay');
    await expect(payment.payeeOptions.filter({ hasText: payee.name })).toHaveCount(1);
  });

  test('removes a payee after confirmation', async ({ flows, transferPayPage: { payees } }) => {
    await flows.transferPay.removePayee(data.payeeToRemove);
    await expect(payees.success).toContainText(`Payee “${data.payeeToRemove}” removed.`);
    await expect(payees.row(data.payeeToRemove)).toHaveCount(0);
  });

  test('cancelling removal keeps the payee', async ({ flows, transferPayPage: { payees } }) => {
    await flows.transferPay.removePayee(data.payeeToRemove, { confirm: false });
    await expect(payees.row(data.payeeToRemove)).toBeVisible();
    await expect(payees.success).toBeHidden();
  });

  for (const { scenario, input, expected } of data.invalidPayees) {
    test(scenario, async ({ flows, transferPayPage: { payees } }) => {
      await flows.transferPay.addPayee(input);
      await expect(payees.error).toHaveText(expected.error);
    });
  }
});

test.describe('Transfer & Pay tabs', () => {
  test('defaults to Transfer Funds and switches tabs via the URL', async ({ page, flows, transferPayPage }) => {
    await page.goto(transferPayPage.path);
    await expect(transferPayPage.tab('transfer')).toHaveAttribute('aria-selected', 'true');
    await expect(transferPayPage.tabPanel('transfer')).toBeVisible();

    for (const tab of ['deposit', 'pay', 'payees'] as const) {
      await flows.transferPay.switchTab(tab);
      await expect(page).toHaveURL(new RegExp(`tab=${tab}`));
      await expect(transferPayPage.tab(tab)).toHaveAttribute('aria-selected', 'true');
    }
  });
});
