import { cents, currency, expect, loadData, test, type OrderInput, type Scenario } from '@framework';

type Order = Required<Pick<OrderInput, 'side' | 'symbol'>> & { quantity: number };

const { quotes } = loadData<{ quotes: Record<string, { name: string; price: number }> }>('market');
const data = loadData<{
  estimate: Order;
  buyNewPosition: Scenario<Order, { reviewSide: string; total: string; cost: number; message: string; ledgerDescription: string }>;
  addToPosition: Order;
  partialSell: Scenario<Order, { message: string; proceeds: number }>;
  sellAll: string;
  editOrder: Order;
  invalidOrders: Scenario<OrderInput, { error: string }>[];
  noBrokerageUser: string;
}>('trade');

test.describe('Trade', () => {
  test.beforeEach(async ({ flows }) => {
    await flows.trade.openTrade();
  });

  test('shows portfolio summary for the brokerage account', async ({ api, tradePage, user }) => {
    const { brokerage } = user.accounts;
    const portfolio = await api.portfolio((await api.accountByNumber(brokerage.number)).id);

    await expect(tradePage.accountSelect).toContainText(brokerage.nickname);
    await expect(tradePage.cash).toHaveText(currency(brokerage.balance));
    await expect(tradePage.holdingsValue).toHaveText(currency(portfolio.holdings_value));
    await expect(tradePage.totalValue).toHaveText(currency(portfolio.total_value));
    for (const [symbol, { quantity }] of Object.entries(user.holdings)) {
      await expect(tradePage.holdingQuantity(symbol)).toHaveText(String(quantity));
    }
    await expect(tradePage.noOrders).toBeVisible();
  });

  test('lists market quotes', async ({ tradePage }) => {
    for (const [symbol, quote] of Object.entries(quotes)) {
      await expect(tradePage.quotePrice(symbol)).toHaveText(currency(quote.price));
    }
  });

  test('updates the estimate as the order changes', async ({ flows, tradePage }) => {
    const order = data.estimate;
    await expect(tradePage.estimate).toHaveText(currency(0));
    await flows.trade.fillOrder(order);
    await expect(tradePage.estimate).toHaveText(currency(cents(quotes[order.symbol].price * order.quantity)));
  });

  test(data.buyNewPosition.scenario, async ({ api, flows, tradePage, user }) => {
    const { input, expected } = data.buyNewPosition;
    await flows.trade.reviewOrder(input);

    await expect(tradePage.reviewSide).toHaveText(expected.reviewSide);
    await expect(tradePage.reviewSymbol).toHaveText(input.symbol);
    await expect(tradePage.reviewQuantity).toHaveText(String(input.quantity));
    await expect(tradePage.reviewTotal).toHaveText(expected.total);

    await tradePage.placeButton.click();
    await expect(tradePage.orderSuccess).toContainText(expected.message);
    const confirmation = (await tradePage.orderConfirmation.textContent())!;
    expect(confirmation).toMatch(/^ORD-[0-9A-F]{8}$/);

    await expect(tradePage.holdingQuantity(input.symbol)).toHaveText(String(input.quantity));
    await expect(tradePage.cash).toHaveText(currency(user.accounts.brokerage.balance - expected.cost));
    await expect(tradePage.orderRow(confirmation)).toContainText(input.side);
    await expect(tradePage.orderRow(confirmation)).toContainText('FILLED');

    const account = await api.accountByNumber(user.accounts.brokerage.number);
    const [latest] = await api.transactions(account.id, 'TRADE');
    expect(latest).toMatchObject({ description: expected.ledgerDescription, amount: -expected.cost });
  });

  test('adds to an existing position', async ({ flows, tradePage, user }) => {
    const order = data.addToPosition;
    await flows.trade.placeOrder(order);
    await expect(tradePage.holdingQuantity(order.symbol)).toHaveText(String(user.holdings[order.symbol].quantity + order.quantity));
  });

  test(data.partialSell.scenario, async ({ flows, tradePage, user }) => {
    const { input, expected } = data.partialSell;
    const owned = user.holdings[input.symbol].quantity;
    await flows.trade.fillOrder(input);
    await expect(tradePage.ticket).toContainText(`You own ${owned} shares`);
    await tradePage.reviewButton.click();
    await tradePage.placeButton.click();

    await expect(tradePage.orderSuccess).toContainText(expected.message);
    await expect(tradePage.holdingQuantity(input.symbol)).toHaveText(String(owned - input.quantity));
    await expect(tradePage.cash).toHaveText(currency(user.accounts.brokerage.balance + expected.proceeds));
  });

  test('selling all shares removes the holding', async ({ flows, tradePage, user }) => {
    const symbol = data.sellAll;
    await flows.trade.placeOrder({ side: 'SELL', symbol, quantity: user.holdings[symbol].quantity });
    await expect(tradePage.holdingRow(symbol)).toHaveCount(0);
  });

  test('Edit returns to the order form with values kept', async ({ flows, tradePage }) => {
    const order = data.editOrder;
    await flows.trade.reviewOrder(order);
    await tradePage.editButton.click();

    await expect(tradePage.orderForm).toBeVisible();
    await expect(tradePage.symbol).toHaveValue(order.symbol);
    await expect(tradePage.quantity).toHaveValue(String(order.quantity));
    await expect(tradePage.noOrders).toBeVisible();
  });

  test.describe('validation', () => {
    for (const { scenario, input, expected } of data.invalidOrders) {
      test(scenario, async ({ flows, tradePage }) => {
        await flows.trade.reviewOrder(input);
        await expect(tradePage.orderError).toHaveText(expected.error);
        await expect(tradePage.reviewPanel).toBeHidden();
      });
    }
  });
});

test.describe('Trade without a brokerage account', () => {
  test.use({ loggedInAs: data.noBrokerageUser });

  test('shows the no-brokerage message', async ({ flows, tradePage }) => {
    await flows.trade.openTrade();
    await expect(tradePage.noBrokerage).toContainText('No brokerage account');
  });
});
