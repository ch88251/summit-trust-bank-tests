import { accountOf, cents, currency, expect, getUser, loadData, maskAccount, test, type Transaction } from '@framework';

const data = loadData<{
  otherUser: string;
  transactionFilter: { account: string; category: Transaction['category']; rowLabel: string };
  emptyFilter: { account: string; category: Transaction['category']; message: string };
  depositWithdrawAccount: string;
  noDepositWithdrawAccount: string;
}>('accounts');

test.describe('Accounts overview', () => {
  test.beforeEach(async ({ flows }) => {
    await flows.accounts.openAccounts();
  });

  test('greets the user and shows the total balance', async ({ accountsPage, user }) => {
    const total = Object.values(user.accounts).reduce((sum, a) => sum + a.balance, 0);
    await expect(accountsPage.welcomeMessage).toHaveText(`Welcome back, ${user.fullName.split(' ')[0]}`);
    await expect(accountsPage.totalBalance).toHaveText(currency(cents(total)));
  });

  test('groups accounts by type', async ({ accountsPage, user }) => {
    for (const account of Object.values(user.accounts)) {
      await expect(accountsPage.group(account.type)).toContainText(account.nickname);
    }
    await expect(accountsPage.group('BROKERAGE')).toContainText('Cash balance');
  });

  for (const account of Object.values(getUser().accounts)) {
    test(`shows masked number and balance for ${account.nickname}`, async ({ accountsPage }) => {
      await expect(accountsPage.numberOf(account.nickname)).toHaveText(maskAccount(account.number));
      await expect(accountsPage.balanceOf(account.nickname)).toHaveText(currency(account.balance));
    });
  }

  test('opens account details from the list', async ({ page, flows, accountDetailPage, user }) => {
    await flows.accounts.openAccountFromOverview('checking');
    await expect(page).toHaveURL(/\/accounts\/\d+$/);
    await expect(accountDetailPage.name).toHaveText(user.accounts.checking.nickname);
  });
});

test.describe('Account details', () => {
  test('shows account header and full transaction history', async ({ api, flows, accountDetailPage, user }) => {
    const seed = user.accounts.checking;
    const account = await api.accountByNumber(seed.number);
    const transactions = await api.transactions(account.id);

    await flows.accounts.openAccountDetail(account.id);
    await expect(accountDetailPage.name).toHaveText(seed.nickname);
    await expect(accountDetailPage.number).toHaveText(maskAccount(seed.number));
    await expect(accountDetailPage.balance).toHaveText(currency(seed.balance));
    await expect(accountDetailPage.transactionRows).toHaveCount(transactions.length);
    // Newest first
    await expect(accountDetailPage.transactionDescriptions.first()).toHaveText(transactions[0].description);
  });

  test('filters transactions by category', async ({ api, flows, accountDetailPage, user }) => {
    const { account: alias, category, rowLabel } = data.transactionFilter;
    const account = await api.accountByNumber(accountOf(user, alias).number);
    const matching = await api.transactions(account.id, category);

    await flows.accounts.openAccountDetail(account.id);
    await flows.accounts.filterTransactions(category);
    await expect(accountDetailPage.transactionRows).toHaveCount(matching.length);
    for (const row of await accountDetailPage.transactionRows.all()) {
      await expect(row).toContainText(rowLabel);
    }

    await flows.accounts.filterTransactions('ALL');
    await expect(accountDetailPage.transactionRows).toHaveCount((await api.transactions(account.id)).length);
  });

  test('shows an empty state when no transactions match', async ({ api, flows, accountDetailPage, user }) => {
    const { account: alias, category, message } = data.emptyFilter;
    const account = await api.accountByNumber(accountOf(user, alias).number);
    await flows.accounts.openAccountDetail(account.id);
    await flows.accounts.filterTransactions(category);
    await expect(accountDetailPage.noTransactions).toHaveText(message);
  });

  test('Deposit / Withdraw link pre-selects the account', async ({ page, api, flows, accountDetailPage, transferPayPage, user }) => {
    const account = await api.accountByNumber(accountOf(user, data.depositWithdrawAccount).number);
    await flows.accounts.openAccountDetail(account.id);
    await accountDetailPage.depositWithdrawLink.click();

    await expect(page).toHaveURL(new RegExp(`/transfer-pay\\?tab=deposit&account=${account.id}$`));
    await expect(transferPayPage.cash.account).toHaveValue(String(account.id));
  });

  test('brokerage accounts have no Deposit / Withdraw link', async ({ api, flows, accountDetailPage, user }) => {
    const seed = accountOf(user, data.noDepositWithdrawAccount);
    const account = await api.accountByNumber(seed.number);
    await flows.accounts.openAccountDetail(account.id);
    await expect(accountDetailPage.balance).toHaveText(currency(seed.balance));
    await expect(accountDetailPage.depositWithdrawLink).toBeHidden();
  });

  test("cannot view another user's account", async ({ apiAs, flows, accountDetailPage }) => {
    const other = await apiAs(data.otherUser);
    const otherAccount = await other.accountByType('CHECKING');

    await flows.accounts.openAccountDetail(otherAccount.id);
    await expect(accountDetailPage.error).toHaveText(`Account ${otherAccount.id} not found`);
  });

  test('back link returns to the overview', async ({ page, api, flows, accountDetailPage, accountsPage, user }) => {
    await flows.accounts.openAccountDetail((await api.accountByNumber(user.accounts.checking.number)).id);
    await accountDetailPage.backLink.click();
    await expect(page).toHaveURL(/\/accounts$/);
    await expect(accountsPage.root).toBeVisible();
  });
});
