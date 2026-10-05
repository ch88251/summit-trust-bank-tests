import { expect, test } from '@framework';

test.describe('Navigation', () => {
  test('root redirects to accounts', async ({ page, accountsPage }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/accounts$/);
    await expect(accountsPage.root).toBeVisible();
  });

  test('main menu links navigate and highlight the active page', async ({ page, flows, header, tradePage, transferPayPage, accountsPage }) => {
    await flows.accounts.openAccounts();
    await expect(header.navAccounts).toHaveClass(/active/);

    await header.navTrade.click();
    await expect(page).toHaveURL(/\/trade$/);
    await expect(tradePage.root).toBeVisible();
    await expect(header.navTrade).toHaveClass(/active/);
    await expect(header.navAccounts).not.toHaveClass(/active/);

    await header.navTransferPay.click();
    await expect(page).toHaveURL(/\/transfer-pay$/);
    await expect(transferPayPage.root).toBeVisible();

    await header.brandLogo.click();
    await expect(accountsPage.root).toBeVisible();
  });

  test('unknown routes show a not found page', async ({ page, notFoundPage }) => {
    await page.goto('/does-not-exist');
    await expect(notFoundPage.root).toContainText('Page not found');
  });

  test('page title', async ({ page, flows }) => {
    await flows.accounts.openAccounts();
    await expect(page).toHaveTitle('Summit Trust Bank');
  });
});
