import { expect, test } from '../../src/fixtures';
import { users } from '../../src/data/testData';
import { cents } from '../../src/utils/format';

const { checking, brokerage } = users.demo.accounts;

test.describe('Pay bills', () => {
  test.beforeEach(async ({ transferPayPage }) => {
    await transferPayPage.goto('pay');
  });

  test('pays a bill from checking', async ({ api, transferPayPage }) => {
    await transferPayPage.payBill(checking.nickname, 'City Electric', '96.40', 'October bill');

    await expect(transferPayPage.paymentSuccess).toContainText('Payment of $96.40 to City Electric sent.');
    const confirmation = (await transferPayPage.paymentConfirmation.textContent())!;
    expect(confirmation).toMatch(/^PAY-[0-9A-F]{8}$/);
    await expect(transferPayPage.paymentRow(confirmation)).toContainText('City Electric');

    const account = await api.accountByType('CHECKING');
    expect(account.balance).toBe(cents(checking.balance - 96.4));
    const [latest] = await api.transactions(account.id);
    expect(latest).toMatchObject({ category: 'PAYMENT', description: 'Bill Pay - City Electric', amount: -96.4 });
  });

  test('lists all seeded payees', async ({ transferPayPage }) => {
    for (const name of users.demo.payees) {
      await expect(transferPayPage.paymentPayee.locator('option', { hasText: name })).toHaveCount(1);
    }
  });

  test('brokerage accounts cannot pay bills', async ({ transferPayPage }) => {
    await expect(transferPayPage.paymentFrom.locator('option', { hasText: brokerage.nickname })).toHaveCount(0);
  });

  test('requires an account and a payee', async ({ transferPayPage }) => {
    await transferPayPage.paymentSubmit.click();
    await expect(transferPayPage.paymentError).toHaveText('Please select an account to pay from.');

    await transferPayPage.paymentFrom.selectOption({ index: 1 });
    await transferPayPage.paymentSubmit.click();
    await expect(transferPayPage.paymentError).toHaveText('Please select a payee.');
  });

  test('rejects payments over the balance', async ({ transferPayPage }) => {
    await transferPayPage.payBill(checking.nickname, 'Metro Water', '50000');
    await expect(transferPayPage.paymentError).toHaveText('Amount exceeds the available balance.');
  });

  test('prompts to add a payee when there are none', async ({ api, transferPayPage }) => {
    for (const payee of await api.payees()) {
      expect((await api.delete(`/payees/${payee.id}`)).status()).toBe(204);
    }
    await transferPayPage.goto('pay');
    await expect(transferPayPage.noPayeesMessage).toBeVisible();
  });
});
