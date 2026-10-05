import { expect, test } from '../../src/fixtures';
import { users } from '../../src/data/testData';
import { cents, currency, uniqueId } from '../../src/utils/format';

const { checking, savings } = users.demo.accounts;

test.describe('Transfer funds', () => {
  test.beforeEach(async ({ transferPayPage }) => {
    await transferPayPage.goto('transfer');
  });

  test('transfers money between own accounts', async ({ api, transferPayPage }) => {
    const memo = `Rainy day ${uniqueId()}`;
    await transferPayPage.transfer(checking.nickname, savings.nickname, '250.75', memo);

    await expect(transferPayPage.transferSuccess).toContainText('Transfer of $250.75 completed.');
    const confirmation = (await transferPayPage.transferConfirmation.textContent())!;
    expect(confirmation).toMatch(/^TRF-[0-9A-F]{8}$/);
    await expect(transferPayPage.transferRow(confirmation)).toContainText('$250.75');

    // Form resets after success
    await expect(transferPayPage.transferAmount).toHaveValue('');
    await expect(transferPayPage.transferFrom).toHaveValue('');

    // Balances and ledger updated
    const from = await api.accountByType('CHECKING');
    const to = await api.accountByType('SAVINGS');
    expect(from.balance).toBe(cents(checking.balance - 250.75));
    expect(to.balance).toBe(cents(savings.balance + 250.75));
    const [latest] = await api.transactions(from.id);
    expect(latest).toMatchObject({ category: 'TRANSFER', amount: -250.75 });
    expect(latest.description).toContain(memo);
  });

  test('updated balances appear in the account dropdowns', async ({ transferPayPage }) => {
    await transferPayPage.transfer(checking.nickname, savings.nickname, '100');
    await expect(transferPayPage.transferSuccess).toBeVisible();
    await expect(transferPayPage.transferFrom.locator('option', { hasText: checking.nickname })).toContainText(
      currency(cents(checking.balance - 100)),
    );
  });

  test('excludes the From account from the To list', async ({ transferPayPage }) => {
    await transferPayPage.transferFrom.locator('option', { hasText: checking.nickname }).waitFor({ state: 'attached' });
    const fromValue = await transferPayPage.transferFrom.locator('option', { hasText: checking.nickname }).getAttribute('value');
    await transferPayPage.transferFrom.selectOption(fromValue!);
    await expect(transferPayPage.transferTo.locator(`option[value="${fromValue}"]`)).toHaveCount(0);
  });

  const invalid: Array<[string, string, string]> = [
    ['', 'empty amount', 'Please enter an amount.'],
    ['abc', 'non-numeric amount', 'Enter a valid amount (up to 2 decimal places).'],
    ['10.123', 'more than 2 decimals', 'Enter a valid amount (up to 2 decimal places).'],
    ['0', 'zero amount', 'Amount must be greater than $0.00.'],
    ['999999', 'amount over balance', 'Amount exceeds the available balance.'],
  ];
  for (const [amount, name, message] of invalid) {
    test(`validates ${name}`, async ({ transferPayPage }) => {
      await transferPayPage.transfer(checking.nickname, savings.nickname, amount);
      await expect(transferPayPage.transferError).toHaveText(message);
      await expect(transferPayPage.transferSuccess).toBeHidden();
    });
  }

  test('requires both accounts', async ({ transferPayPage }) => {
    await transferPayPage.transferAmount.fill('10');
    await transferPayPage.transferSubmit.click();
    await expect(transferPayPage.transferError).toHaveText('Please select both a From and To account.');
  });
});
