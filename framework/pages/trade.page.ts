import type { Page } from '@playwright/test';

export const tradePage = (page: Page) => {
  const holdingRow = (symbol: string) => page.getByTestId(`holding-row-${symbol}`);
  const quoteRow = (symbol: string) => page.getByTestId(`quote-row-${symbol}`);

  return {
    path: '/trade',
    root: page.getByTestId('trade-page'),
    noBrokerage: page.getByTestId('no-brokerage'),
    accountSelect: page.getByTestId('trade-account'),

    // portfolio
    cash: page.getByTestId('portfolio-cash'),
    holdingsValue: page.getByTestId('portfolio-holdings-value'),
    totalValue: page.getByTestId('portfolio-total-value'),
    quoteRow,
    quotePrice: (symbol: string) => quoteRow(symbol).getByTestId('quote-price'),
    holdingRow,
    holdingQuantity: (symbol: string) => holdingRow(symbol).getByTestId('holding-quantity'),
    orderRow: (confirmationNumber: string) => page.getByTestId(`order-row-${confirmationNumber}`),
    noOrders: page.getByTestId('no-orders'),

    // order ticket
    ticket: page.getByTestId('order-ticket'),
    orderForm: page.getByTestId('order-form'),
    // The radio inputs are visually hidden inside styled labels; interact with the label.
    buy: page.locator('label', { has: page.getByTestId('order-side-buy') }),
    sell: page.locator('label', { has: page.getByTestId('order-side-sell') }),
    symbol: page.getByTestId('order-symbol'),
    quantity: page.getByTestId('order-quantity'),
    estimate: page.getByTestId('order-estimate'),
    reviewButton: page.getByTestId('order-review'),
    orderError: page.getByTestId('order-error'),
    orderSuccess: page.getByTestId('order-success'),
    orderConfirmation: page.getByTestId('order-confirmation'),

    // order review
    reviewPanel: page.getByTestId('order-review-panel'),
    reviewSide: page.getByTestId('review-side'),
    reviewSymbol: page.getByTestId('review-symbol'),
    reviewQuantity: page.getByTestId('review-quantity'),
    reviewTotal: page.getByTestId('review-total'),
    editButton: page.getByTestId('order-edit'),
    placeButton: page.getByTestId('order-place'),
  };
};

export type TradePage = ReturnType<typeof tradePage>;
