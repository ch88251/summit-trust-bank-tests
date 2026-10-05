import { expect, test } from '../../src/fixtures';
import { quotes, users } from '../../src/data/testData';
import { cents } from '../../src/utils/format';

test.describe('Trade API', () => {
  test('lists all quotes with fixed prices', async ({ api }) => {
    const res = await api.get('/trade/quotes');
    expect(res.status()).toBe(200);
    const body: Array<{ symbol: string; name: string; price: number }> = await res.json();
    expect(Object.fromEntries(body.map((q) => [q.symbol, { name: q.name, price: q.price }]))).toEqual(quotes);
  });

  test('single quote is case-insensitive; unknown is 404', async ({ api }) => {
    expect((await (await api.get('/trade/quotes/aapl')).json()).symbol).toBe('AAPL');
    expect((await api.get('/trade/quotes/ZZZZ')).status()).toBe(404);
  });

  test('portfolio values are consistent', async ({ api }) => {
    const brokerage = await api.accountByType('BROKERAGE');
    const p = await api.portfolio(brokerage.id);
    expect(p.cash).toBe(users.demo.accounts.brokerage.balance);
    for (const h of p.holdings) {
      expect(h.quantity).toBe(users.demo.holdings[h.symbol]);
      expect(h.market_value).toBe(cents(h.price * h.quantity));
    }
    expect(p.total_value).toBe(cents(p.cash + p.holdings_value));
  });

  test('portfolio for a non-brokerage account is 400', async ({ api }) => {
    const checking = await api.accountByType('CHECKING');
    expect((await api.get(`/trade/portfolio/${checking.id}`)).status()).toBe(400);
  });

  test('buy then sell round trip', async ({ api }) => {
    const brokerage = await api.accountByType('BROKERAGE');

    const buy = await api.post('/trade/orders', { account_id: brokerage.id, symbol: 'jpm', side: 'BUY', quantity: 5 });
    expect(buy.status()).toBe(201);
    expect(await buy.json()).toMatchObject({ symbol: 'JPM', side: 'BUY', quantity: 5, price: 205.6, total: 1028, status: 'FILLED' });
    let p = await api.portfolio(brokerage.id);
    expect(p.holdings.find((h) => h.symbol === 'JPM')?.quantity).toBe(5);
    expect(p.cash).toBe(cents(users.demo.accounts.brokerage.balance - 1028));

    const sell = await api.post('/trade/orders', { account_id: brokerage.id, symbol: 'JPM', side: 'SELL', quantity: 5 });
    expect(sell.status()).toBe(201);
    p = await api.portfolio(brokerage.id);
    expect(p.holdings.find((h) => h.symbol === 'JPM')).toBeUndefined();
    expect(p.cash).toBe(users.demo.accounts.brokerage.balance);

    const orders = await (await api.get('/trade/orders', { account_id: brokerage.id })).json();
    expect(orders.map((o: { side: string }) => o.side)).toEqual(['SELL', 'BUY']);
  });

  test('buy updates the average cost', async ({ api }) => {
    const brokerage = await api.accountByType('BROKERAGE');
    await api.post('/trade/orders', { account_id: brokerage.id, symbol: 'AAPL', side: 'BUY', quantity: 25 });
    const aapl = (await api.portfolio(brokerage.id)).holdings.find((h) => h.symbol === 'AAPL')!;
    expect(aapl.quantity).toBe(50);
    expect(aapl.avg_cost).toBeCloseTo((170.25 + 189.84) / 2, 4);
  });

  test('insufficient funds is 400', async ({ api }) => {
    const brokerage = await api.accountByType('BROKERAGE');
    const res = await api.post('/trade/orders', { account_id: brokerage.id, symbol: 'MSFT', side: 'BUY', quantity: 100 });
    expect(res.status()).toBe(400);
    expect((await res.json()).detail).toBe('Insufficient funds');
  });

  test('selling more than owned is 400', async ({ api }) => {
    const brokerage = await api.accountByType('BROKERAGE');
    const res = await api.post('/trade/orders', { account_id: brokerage.id, symbol: 'AAPL', side: 'SELL', quantity: 26 });
    expect(res.status()).toBe(400);
    expect((await res.json()).detail).toBe('Insufficient shares: you own 25 AAPL');
  });

  test('trading from a checking account is 400', async ({ api }) => {
    const checking = await api.accountByType('CHECKING');
    const res = await api.post('/trade/orders', { account_id: checking.id, symbol: 'AAPL', side: 'BUY', quantity: 1 });
    expect(res.status()).toBe(400);
    expect((await res.json()).detail).toBe('Trading is only available in brokerage accounts');
  });

  test('unknown symbol is 404', async ({ api }) => {
    const brokerage = await api.accountByType('BROKERAGE');
    const res = await api.post('/trade/orders', { account_id: brokerage.id, symbol: 'ZZZZ', side: 'BUY', quantity: 1 });
    expect(res.status()).toBe(404);
  });

  for (const quantity of [0, -1, 100_001]) {
    test(`quantity ${quantity} is 422`, async ({ api }) => {
      const brokerage = await api.accountByType('BROKERAGE');
      const res = await api.post('/trade/orders', { account_id: brokerage.id, symbol: 'AAPL', side: 'BUY', quantity });
      expect(res.status()).toBe(422);
    });
  }
});
