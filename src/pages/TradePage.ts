import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class TradePage extends BasePage {
  readonly root: Locator;
  readonly noBrokerage: Locator;
  readonly accountSelect: Locator;
  readonly cash: Locator;
  readonly holdingsValue: Locator;
  readonly totalValue: Locator;
  readonly quotesTable: Locator;
  readonly holdingsTable: Locator;
  readonly ordersTable: Locator;
  readonly noOrders: Locator;

  // order ticket
  readonly ticket: Locator;
  readonly orderForm: Locator;
  readonly buy: Locator;
  readonly sell: Locator;
  readonly symbol: Locator;
  readonly quantity: Locator;
  readonly estimate: Locator;
  readonly reviewButton: Locator;
  readonly reviewPanel: Locator;
  readonly reviewSide: Locator;
  readonly reviewSymbol: Locator;
  readonly reviewQuantity: Locator;
  readonly reviewTotal: Locator;
  readonly editButton: Locator;
  readonly placeButton: Locator;
  readonly orderError: Locator;
  readonly orderSuccess: Locator;
  readonly orderConfirmation: Locator;

  constructor(page: Page) {
    super(page);
    this.root = page.getByTestId('trade-page');
    this.noBrokerage = page.getByTestId('no-brokerage');
    this.accountSelect = page.getByTestId('trade-account');
    this.cash = page.getByTestId('portfolio-cash');
    this.holdingsValue = page.getByTestId('portfolio-holdings-value');
    this.totalValue = page.getByTestId('portfolio-total-value');
    this.quotesTable = page.getByTestId('quotes-table');
    this.holdingsTable = page.getByTestId('holdings-table');
    this.ordersTable = page.getByTestId('orders-table');
    this.noOrders = page.getByTestId('no-orders');

    this.ticket = page.getByTestId('order-ticket');
    this.orderForm = page.getByTestId('order-form');
    // The radio inputs are visually hidden inside styled labels; interact with the label.
    this.buy = page.locator('label', { has: page.getByTestId('order-side-buy') });
    this.sell = page.locator('label', { has: page.getByTestId('order-side-sell') });
    this.symbol = page.getByTestId('order-symbol');
    this.quantity = page.getByTestId('order-quantity');
    this.estimate = page.getByTestId('order-estimate');
    this.reviewButton = page.getByTestId('order-review');
    this.reviewPanel = page.getByTestId('order-review-panel');
    this.reviewSide = page.getByTestId('review-side');
    this.reviewSymbol = page.getByTestId('review-symbol');
    this.reviewQuantity = page.getByTestId('review-quantity');
    this.reviewTotal = page.getByTestId('review-total');
    this.editButton = page.getByTestId('order-edit');
    this.placeButton = page.getByTestId('order-place');
    this.orderError = page.getByTestId('order-error');
    this.orderSuccess = page.getByTestId('order-success');
    this.orderConfirmation = page.getByTestId('order-confirmation');
  }

  async goto() {
    await this.page.goto('/trade');
  }

  quoteRow(symbol: string) {
    return this.page.getByTestId(`quote-row-${symbol}`);
  }

  holdingRow(symbol: string) {
    return this.page.getByTestId(`holding-row-${symbol}`);
  }

  holdingQuantity(symbol: string) {
    return this.holdingRow(symbol).getByTestId('holding-quantity');
  }

  orderRow(confirmationNumber: string) {
    return this.page.getByTestId(`order-row-${confirmationNumber}`);
  }

  async fillOrder(side: 'BUY' | 'SELL', symbol: string, quantity: number | string) {
    await (side === 'BUY' ? this.buy : this.sell).click();
    await this.symbol.selectOption(symbol);
    await this.quantity.fill(String(quantity));
  }

  /** Fills the ticket, reviews and places the order; returns the confirmation number. */
  async placeOrder(side: 'BUY' | 'SELL', symbol: string, quantity: number) {
    await this.fillOrder(side, symbol, quantity);
    await this.reviewButton.click();
    await this.placeButton.click();
    await this.orderConfirmation.waitFor();
    return (await this.orderConfirmation.textContent())!.trim();
  }
}
