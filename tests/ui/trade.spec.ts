import { expect, test } from '../../src/fixtures';
import { quotes, users } from '../../src/data/testData';
import { cents, currency } from '../../src/utils/format';

const { brokerage } = users.demo.accounts;

test.describe('Trade', () => {
  test.beforeEach(async ({ tradePage }) => {
    await tradePage.goto();
  });

  test('shows portfolio summary for the brokerage account', async ({ api, tradePage }) => {
    const portfolio = await api.portfolio((await api.accountByType('BROKERAGE')).id);

    await expect(tradePage.accountSelect).toContainText(brokerage.nickname);
    await expect(tradePage.cash).toHaveText(currency(brokerage.balance));
    await expect(tradePage.holdingsValue).toHaveText(currency(portfolio.holdings_value));
    await expect(tradePage.totalValue).toHaveText(currency(portfolio.total_value));
    for (const [symbol, qty] of Object.entries(users.demo.holdings)) {
      await expect(tradePage.holdingQuantity(symbol)).toHaveText(String(qty));
    }
    await expect(tradePage.noOrders).toBeVisible();
  });

  test('lists market quotes', async ({ tradePage }) => {
    for (const [symbol, quote] of Object.entries(quotes)) {
      await expect(tradePage.quoteRow(symbol).getByTestId('quote-price')).toHaveText(currency(quote.price));
    }
  });

  test('updates the estimate as the order changes', async ({ tradePage }) => {
    await expect(tradePage.estimate).toHaveText('$0.00');
    await tradePage.fillOrder('BUY', 'NVDA', 3);
    await expect(tradePage.estimate).toHaveText(currency(cents(quotes.NVDA.price * 3)));
  });

  test('buys a new position', async ({ api, tradePage }) => {
    await tradePage.fillOrder('BUY', 'NVDA', 10);
    await tradePage.reviewButton.click();

    await expect(tradePage.reviewSide).toHaveText('Buy');
    await expect(tradePage.reviewSymbol).toHaveText('NVDA');
    await expect(tradePage.reviewQuantity).toHaveText('10');
    await expect(tradePage.reviewTotal).toHaveText('$1,214.00');

    await tradePage.placeButton.click();
    await expect(tradePage.orderSuccess).toContainText('Order filled: Bought 10 NVDA @ $121.40 for $1,214.00.');
    const confirmation = (await tradePage.orderConfirmation.textContent())!;
    expect(confirmation).toMatch(/^ORD-[0-9A-F]{8}$/);

    await expect(tradePage.holdingQuantity('NVDA')).toHaveText('10');
    await expect(tradePage.cash).toHaveText(currency(brokerage.balance - 1214));
    await expect(tradePage.orderRow(confirmation)).toContainText('BUY');
    await expect(tradePage.orderRow(confirmation)).toContainText('FILLED');

    const account = await api.accountByType('BROKERAGE');
    const [latest] = await api.transactions(account.id, 'TRADE');
    expect(latest).toMatchObject({ description: 'Buy 10 NVDA @ 121.40', amount: -1214 });
  });

  test('adds to an existing position', async ({ tradePage }) => {
    await tradePage.placeOrder('BUY', 'AAPL', 5);
    await expect(tradePage.holdingQuantity('AAPL')).toHaveText(String(users.demo.holdings.AAPL + 5));
  });

  test('partially sells a position', async ({ tradePage }) => {
    await tradePage.fillOrder('SELL', 'MSFT', 4);
    await expect(tradePage.ticket).toContainText(`You own ${users.demo.holdings.MSFT} shares`);
    await tradePage.reviewButton.click();
    await tradePage.placeButton.click();

    await expect(tradePage.orderSuccess).toContainText('Sold 4 MSFT @ $415.50 for $1,662.00.');
    await expect(tradePage.holdingQuantity('MSFT')).toHaveText('6');
    await expect(tradePage.cash).toHaveText(currency(brokerage.balance + 1662));
  });

  test('selling all shares removes the holding', async ({ tradePage }) => {
    await tradePage.placeOrder('SELL', 'VTI', users.demo.holdings.VTI);
    await expect(tradePage.holdingRow('VTI')).toHaveCount(0);
  });

  test('Edit returns to the order form with values kept', async ({ tradePage }) => {
    await tradePage.fillOrder('BUY', 'TSLA', 2);
    await tradePage.reviewButton.click();
    await tradePage.editButton.click();

    await expect(tradePage.orderForm).toBeVisible();
    await expect(tradePage.symbol).toHaveValue('TSLA');
    await expect(tradePage.quantity).toHaveValue('2');
    await expect(tradePage.noOrders).toBeVisible();
  });

  test.describe('validation', () => {
    test('requires a symbol', async ({ tradePage }) => {
      await tradePage.reviewButton.click();
      await expect(tradePage.orderError).toHaveText('Please select a symbol.');
    });

    for (const qty of ['0', '-1', '1.5']) {
      test(`rejects quantity ${qty}`, async ({ tradePage }) => {
        await tradePage.fillOrder('BUY', 'AAPL', qty);
        await tradePage.reviewButton.click();
        await expect(tradePage.orderError).toHaveText('Quantity must be a whole number greater than 0.');
      });
    }

    test('rejects buys over available cash', async ({ tradePage }) => {
      await tradePage.fillOrder('BUY', 'MSFT', 100);
      await tradePage.reviewButton.click();
      await expect(tradePage.orderError).toHaveText('Insufficient cash for this order.');
      await expect(tradePage.reviewPanel).toBeHidden();
    });

    test('rejects selling more shares than owned', async ({ tradePage }) => {
      await tradePage.fillOrder('SELL', 'AAPL', users.demo.holdings.AAPL + 1);
      await tradePage.reviewButton.click();
      await expect(tradePage.orderError).toHaveText(`You only own ${users.demo.holdings.AAPL} shares of AAPL.`);
    });

    test('rejects selling a symbol not owned', async ({ tradePage }) => {
      await tradePage.fillOrder('SELL', 'TSLA', 1);
      await tradePage.reviewButton.click();
      await expect(tradePage.orderError).toHaveText('You only own 0 shares of TSLA.');
    });
  });
});

test.describe('Trade without a brokerage account', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('shows the no-brokerage message', async ({ page, loginPage, tradePage }) => {
    await loginPage.goto();
    await loginPage.login(users.jane.username, users.jane.password);
    await page.waitForURL(/\/accounts$/);
    await tradePage.goto();
    await expect(tradePage.noBrokerage).toContainText('No brokerage account');
  });
});
