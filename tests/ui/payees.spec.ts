import { expect, test } from '../../src/fixtures';
import { users } from '../../src/data/testData';
import { uniqueId } from '../../src/utils/format';

test.describe('Manage payees', () => {
  test.beforeEach(async ({ transferPayPage }) => {
    await transferPayPage.goto('payees');
  });

  test('lists seeded payees with masked account numbers', async ({ transferPayPage }) => {
    for (const name of users.demo.payees) {
      await expect(transferPayPage.payeeRow(name)).toBeVisible();
    }
    await expect(transferPayPage.payeeRow('Summit Visa Card')).toContainText('••••4444');
    await expect(transferPayPage.payeeRow('Summit Visa Card')).toContainText('Credit Card');
  });

  test('adds a payee who can then be paid', async ({ transferPayPage }) => {
    const name = `Gym ${uniqueId()}`;
    await transferPayPage.addPayee(name, '123456789', 'Membership');

    await expect(transferPayPage.payeeSuccess).toContainText(`Payee “${name}” added.`);
    await expect(transferPayPage.payeeRow(name)).toContainText('••••6789');
    await expect(transferPayPage.payeeNameInput).toHaveValue('');

    await transferPayPage.openTab('pay');
    await expect(transferPayPage.paymentPayee.locator('option', { hasText: name })).toHaveCount(1);
  });

  test('removes a payee after confirmation', async ({ transferPayPage }) => {
    await transferPayPage.removePayee('Metro Water');
    await expect(transferPayPage.payeeSuccess).toContainText('Payee “Metro Water” removed.');
    await expect(transferPayPage.payeeRow('Metro Water')).toHaveCount(0);
  });

  test('cancelling removal keeps the payee', async ({ transferPayPage }) => {
    await transferPayPage.removePayee('Metro Water', false);
    await expect(transferPayPage.payeeRow('Metro Water')).toBeVisible();
    await expect(transferPayPage.payeeSuccess).toBeHidden();
  });

  test('rejects duplicate payees', async ({ transferPayPage }) => {
    await transferPayPage.addPayee('city electric', '88442211');
    await expect(transferPayPage.payeeError).toHaveText('A payee with this name and account number already exists');
  });

  test('requires a name', async ({ transferPayPage }) => {
    await transferPayPage.addPayee('   ', '12345');
    await expect(transferPayPage.payeeError).toHaveText('Payee name is required.');
  });

  for (const accountNumber of ['123', 'abcd1234', '']) {
    test(`rejects account number "${accountNumber}"`, async ({ transferPayPage }) => {
      await transferPayPage.addPayee('Some Payee', accountNumber);
      await expect(transferPayPage.payeeError).toHaveText('Account number must be 4–17 digits.');
    });
  }
});

test.describe('Transfer & Pay tabs', () => {
  test('defaults to Transfer Funds and switches tabs via the URL', async ({ page, transferPayPage }) => {
    await page.goto('/transfer-pay');
    await expect(transferPayPage.tab('transfer')).toHaveAttribute('aria-selected', 'true');
    await expect(transferPayPage.tabPanel('transfer')).toBeVisible();

    for (const tab of ['deposit', 'pay', 'payees'] as const) {
      await transferPayPage.openTab(tab);
      await expect(page).toHaveURL(new RegExp(`tab=${tab}`));
      await expect(transferPayPage.tab(tab)).toHaveAttribute('aria-selected', 'true');
    }
  });
});
