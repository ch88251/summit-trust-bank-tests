import { expect, test } from '../../src/fixtures';
import { MAX_DEPOSIT, users } from '../../src/data/testData';
import { cents, currency } from '../../src/utils/format';

const { checking, savings, brokerage } = users.demo.accounts;

test.describe('Deposit & withdraw', () => {
  test.beforeEach(async ({ transferPayPage }) => {
    await transferPayPage.goto('deposit');
  });

  test('deposits funds into checking', async ({ api, transferPayPage }) => {
    await transferPayPage.cashTransaction('DEPOSIT', checking.nickname, '1500.00', 'Bonus');

    await expect(transferPayPage.cashSuccess).toContainText(`Deposit of $1,500.00 to ${checking.nickname}`);
    const confirmation = (await transferPayPage.cashConfirmation.textContent())!;
    expect(confirmation).toMatch(/^DEP-[0-9A-F]{8}$/);
    await expect(transferPayPage.cashRow(confirmation)).toContainText('+$1,500.00');

    expect((await api.accountByType('CHECKING')).balance).toBe(cents(checking.balance + 1500));
  });

  test('withdraws funds from savings', async ({ api, transferPayPage }) => {
    await transferPayPage.cashTransaction('WITHDRAWAL', savings.nickname, '44.42');

    await expect(transferPayPage.cashSuccess).toContainText(`Withdrawal of $44.42 from ${savings.nickname}`);
    const confirmation = (await transferPayPage.cashConfirmation.textContent())!;
    expect(confirmation).toMatch(/^WDL-[0-9A-F]{8}$/);
    await expect(transferPayPage.cashRow(confirmation)).toContainText('−$44.42');

    expect((await api.accountByType('SAVINGS')).balance).toBe(cents(savings.balance - 44.42));
  });

  test('submit button and hint reflect the transaction type', async ({ transferPayPage }) => {
    await expect(transferPayPage.cashSubmit).toHaveText('Deposit Funds');
    await expect(transferPayPage.tabPanel('deposit')).toContainText(`Maximum ${currency(MAX_DEPOSIT)} per deposit.`);

    await transferPayPage.cashWithdraw.click();
    await expect(transferPayPage.cashSubmit).toHaveText('Withdraw Funds');
    await transferPayPage.cashAccount.selectOption({ index: 1 });
    await expect(transferPayPage.tabPanel('deposit')).toContainText('Available balance:');
  });

  test('brokerage accounts are not offered', async ({ transferPayPage }) => {
    await expect(transferPayPage.cashAccount.locator('option', { hasText: brokerage.nickname })).toHaveCount(0);
  });

  test('rejects deposits over the per-transaction limit', async ({ transferPayPage }) => {
    await transferPayPage.cashTransaction('DEPOSIT', checking.nickname, '10000.01');
    await expect(transferPayPage.cashError).toHaveText('Deposits are limited to $10,000.00 per transaction.');
  });

  test('allows a deposit exactly at the limit', async ({ transferPayPage }) => {
    await transferPayPage.cashTransaction('DEPOSIT', checking.nickname, '10000');
    await expect(transferPayPage.cashSuccess).toContainText('Deposit of $10,000.00');
  });

  test('rejects withdrawals over the balance', async ({ transferPayPage }) => {
    await transferPayPage.cashTransaction('WITHDRAWAL', checking.nickname, String(checking.balance + 0.01));
    await expect(transferPayPage.cashError).toHaveText('Amount exceeds the available balance.');
  });

  test('requires an account', async ({ transferPayPage }) => {
    await transferPayPage.cashAmount.fill('10');
    await transferPayPage.cashSubmit.click();
    await expect(transferPayPage.cashError).toHaveText('Please select an account.');
  });
});
