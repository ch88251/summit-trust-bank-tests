import { BankApi } from '../../src/api/BankApi';
import { expect, test } from '../../src/fixtures';
import { users } from '../../src/data/testData';
import { cents, currency, maskAccount } from '../../src/utils/format';

const { checking, savings, brokerage } = users.demo.accounts;

test.describe('Accounts overview', () => {
  test.beforeEach(async ({ accountsPage }) => {
    await accountsPage.goto();
  });

  test('greets the user and shows the total balance', async ({ accountsPage }) => {
    await expect(accountsPage.welcomeMessage).toHaveText('Welcome back, Alex');
    await expect(accountsPage.totalBalance).toHaveText(
      currency(cents(checking.balance + savings.balance + brokerage.balance)),
    );
  });

  test('groups accounts by type', async ({ accountsPage }) => {
    await expect(accountsPage.group('CHECKING')).toContainText(checking.nickname);
    await expect(accountsPage.group('SAVINGS')).toContainText(savings.nickname);
    await expect(accountsPage.group('BROKERAGE')).toContainText(brokerage.nickname);
    await expect(accountsPage.group('BROKERAGE')).toContainText('Cash balance');
  });

  for (const account of [checking, savings, brokerage]) {
    test(`shows masked number and balance for ${account.nickname}`, async ({ accountsPage }) => {
      await expect(accountsPage.numberOf(account.nickname)).toHaveText(maskAccount(account.number));
      await expect(accountsPage.balanceOf(account.nickname)).toHaveText(currency(account.balance));
    });
  }

  test('opens account details from the list', async ({ page, accountsPage, accountDetailPage }) => {
    await accountsPage.openAccount(checking.nickname);
    await expect(page).toHaveURL(/\/accounts\/\d+$/);
    await expect(accountDetailPage.name).toHaveText(checking.nickname);
  });
});

test.describe('Account details', () => {
  test('shows account header and full transaction history', async ({ api, accountDetailPage }) => {
    const account = await api.accountByType('CHECKING');
    const transactions = await api.transactions(account.id);

    await accountDetailPage.goto(account.id);
    await expect(accountDetailPage.name).toHaveText(checking.nickname);
    await expect(accountDetailPage.number).toHaveText(maskAccount(checking.number));
    await expect(accountDetailPage.balance).toHaveText(currency(checking.balance));
    await expect(accountDetailPage.transactionRows).toHaveCount(transactions.length);
    // Newest first
    await expect(accountDetailPage.transactionRows.first().getByTestId('transaction-description')).toHaveText(
      transactions[0].description,
    );
  });

  test('filters transactions by category', async ({ api, accountDetailPage }) => {
    const account = await api.accountByType('CHECKING');
    const payments = await api.transactions(account.id, 'PAYMENT');

    await accountDetailPage.goto(account.id);
    await accountDetailPage.filterBy('PAYMENT');
    await expect(accountDetailPage.transactionRows).toHaveCount(payments.length);
    for (const row of await accountDetailPage.transactionRows.all()) {
      await expect(row).toContainText('Payment');
    }

    await accountDetailPage.filterBy('ALL');
    await expect(accountDetailPage.transactionRows).toHaveCount((await api.transactions(account.id)).length);
  });

  test('shows an empty state when no transactions match', async ({ api, accountDetailPage }) => {
    const account = await api.accountByType('SAVINGS');
    await accountDetailPage.goto(account.id);
    await accountDetailPage.filterBy('TRADE');
    await expect(accountDetailPage.noTransactions).toHaveText('No transactions found.');
  });

  test('Deposit / Withdraw link pre-selects the account', async ({ page, api, accountDetailPage, transferPayPage }) => {
    const account = await api.accountByType('SAVINGS');
    await accountDetailPage.goto(account.id);
    await accountDetailPage.depositWithdrawLink.click();

    await expect(page).toHaveURL(new RegExp(`/transfer-pay\\?tab=deposit&account=${account.id}$`));
    await expect(transferPayPage.cashAccount).toHaveValue(String(account.id));
  });

  test('brokerage accounts have no Deposit / Withdraw link', async ({ api, accountDetailPage }) => {
    const account = await api.accountByType('BROKERAGE');
    await accountDetailPage.goto(account.id);
    await expect(accountDetailPage.balance).toHaveText(currency(brokerage.balance));
    await expect(accountDetailPage.depositWithdrawLink).toBeHidden();
  });

  test("cannot view another user's account", async ({ playwright, baseURL, accountDetailPage }) => {
    const ctx = await playwright.request.newContext({ baseURL });
    const jane = new BankApi(ctx);
    await jane.login(users.jane.username, users.jane.password);
    const janeAccount = await jane.accountByType('CHECKING');
    await ctx.dispose();

    await accountDetailPage.goto(janeAccount.id);
    await expect(accountDetailPage.error).toHaveText(`Account ${janeAccount.id} not found`);
  });

  test('back link returns to the overview', async ({ page, api, accountDetailPage, accountsPage }) => {
    await accountDetailPage.goto((await api.accountByType('CHECKING')).id);
    await accountDetailPage.backLink.click();
    await expect(page).toHaveURL(/\/accounts$/);
    await expect(accountsPage.root).toBeVisible();
  });
});
