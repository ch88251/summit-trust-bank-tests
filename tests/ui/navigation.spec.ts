import { expect, test } from '../../src/fixtures';

test.describe('Navigation', () => {
  test('root redirects to accounts', async ({ page, accountsPage }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/accounts$/);
    await expect(accountsPage.root).toBeVisible();
  });

  test('main menu links navigate and highlight the active page', async ({ page, header, tradePage, transferPayPage, accountsPage }) => {
    await page.goto('/accounts');
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

  test('unknown routes show a not found page', async ({ page }) => {
    await page.goto('/does-not-exist');
    await expect(page.getByTestId('not-found')).toContainText('Page not found');
  });

  test('page title', async ({ page }) => {
    await page.goto('/accounts');
    await expect(page).toHaveTitle('Summit Trust Bank');
  });
});
