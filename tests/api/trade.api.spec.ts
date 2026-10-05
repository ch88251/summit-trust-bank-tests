import { accountOf, cents, expect, loadData, test, type Scenario } from '@framework';

interface OrderRequest {
  account: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
}

const { quotes } = loadData<{ quotes: Record<string, { name: string; price: number }> }>('market');
const data = loadData<{
  api: {
    roundTrip: { symbol: string; quantity: number; expected: { symbol: string; price: number; total: number } };
    averageCost: { symbol: string; quantity: number };
    rejectedOrders: Scenario<OrderRequest, { status: number; error?: string }>[];
    unknownSymbol: string;
  };
}>('trade').api;

test.describe('Trade API', () => {
  test('lists all quotes with fixed prices', async ({ api }) => {
    const res = await api.get('/trade/quotes');
    expect(res.status()).toBe(200);
    const body: Array<{ symbol: string; name: string; price: number }> = await res.json();
    expect(Object.fromEntries(body.map((q) => [q.symbol, { name: q.name, price: q.price }]))).toEqual(quotes);
  });

  test('single quote is case-insensitive; unknown is 404', async ({ api }) => {
    const symbol = Object.keys(quotes)[0];
    expect((await (await api.get(`/trade/quotes/${symbol.toLowerCase()}`)).json()).symbol).toBe(symbol);
    expect((await api.get(`/trade/quotes/${data.unknownSymbol}`)).status()).toBe(404);
  });

  test('portfolio values are consistent', async ({ api, user }) => {
    const brokerage = await api.accountByNumber(user.accounts.brokerage.number);
    const p = await api.portfolio(brokerage.id);
    expect(p.cash).toBe(user.accounts.brokerage.balance);
    expect(p.holdings.map((h) => h.symbol).sort()).toEqual(Object.keys(user.holdings).sort());
    for (const h of p.holdings) {
      expect(h.quantity).toBe(user.holdings[h.symbol].quantity);
      expect(h.avg_cost).toBe(user.holdings[h.symbol].avgCost);
      expect(h.market_value).toBe(cents(h.price * h.quantity));
    }
    expect(p.total_value).toBe(cents(p.cash + p.holdings_value));
  });

  test('portfolio for a non-brokerage account is 400', async ({ api, user }) => {
    const checking = await api.accountByNumber(user.accounts.checking.number);
    expect((await api.get(`/trade/portfolio/${checking.id}`)).status()).toBe(400);
  });

  test('buy then sell round trip', async ({ api, user }) => {
    const { symbol, quantity, expected } = data.roundTrip;
    const seedCash = user.accounts.brokerage.balance;
    const brokerage = await api.accountByNumber(user.accounts.brokerage.number);

    const buy = await api.post('/trade/orders', { account_id: brokerage.id, symbol, side: 'BUY', quantity });
    expect(buy.status()).toBe(201);
    expect(await buy.json()).toMatchObject({ ...expected, side: 'BUY', quantity, status: 'FILLED' });
    let p = await api.portfolio(brokerage.id);
    expect(p.holdings.find((h) => h.symbol === expected.symbol)?.quantity).toBe(quantity);
    expect(p.cash).toBe(cents(seedCash - expected.total));

    const sell = await api.post('/trade/orders', { account_id: brokerage.id, symbol: expected.symbol, side: 'SELL', quantity });
    expect(sell.status()).toBe(201);
    p = await api.portfolio(brokerage.id);
    expect(p.holdings.find((h) => h.symbol === expected.symbol)).toBeUndefined();
    expect(p.cash).toBe(seedCash);

    const orders = await (await api.get('/trade/orders', { account_id: brokerage.id })).json();
    expect(orders.map((o: { side: string }) => o.side)).toEqual(['SELL', 'BUY']);
  });

  test('buy updates the average cost', async ({ api, user }) => {
    const { symbol, quantity } = data.averageCost;
    const held = user.holdings[symbol];
    const brokerage = await api.accountByNumber(user.accounts.brokerage.number);
    await api.post('/trade/orders', { account_id: brokerage.id, symbol, side: 'BUY', quantity });

    const holding = (await api.portfolio(brokerage.id)).holdings.find((h) => h.symbol === symbol)!;
    expect(holding.quantity).toBe(held.quantity + quantity);
    const expectedAvg = (held.quantity * held.avgCost + quantity * quotes[symbol].price) / (held.quantity + quantity);
    expect(holding.avg_cost).toBeCloseTo(expectedAvg, 4);
  });

  for (const { scenario, input, expected } of data.rejectedOrders) {
    test(scenario, async ({ api, user }) => {
      const account = await api.accountByNumber(accountOf(user, input.account).number);
      const res = await api.post('/trade/orders', {
        account_id: account.id,
        symbol: input.symbol,
        side: input.side,
        quantity: input.quantity,
      });
      expect(res.status()).toBe(expected.status);
      if (expected.error) expect((await res.json()).detail).toBe(expected.error);
    });
  }
});
