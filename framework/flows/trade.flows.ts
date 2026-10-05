import type { Page } from '@playwright/test';
import { tradePage } from '../pages/trade.page';

/** Omitted fields are left untouched. `quantity` may be a string to exercise validation. */
export interface OrderInput {
  side?: 'BUY' | 'SELL';
  symbol?: string;
  quantity?: number | string;
}

export const tradeFlows = (page: Page) => {
  const trade = tradePage(page);

  const fillOrder = async ({ side, symbol, quantity }: OrderInput) => {
    if (side) await (side === 'BUY' ? trade.buy : trade.sell).click();
    if (symbol) await trade.symbol.selectOption(symbol);
    if (quantity !== undefined) await trade.quantity.fill(String(quantity));
  };

  const reviewOrder = async (order: OrderInput) => {
    await fillOrder(order);
    await trade.reviewButton.click();
  };

  return {
    async openTrade() {
      await page.goto(trade.path);
    },

    fillOrder,
    reviewOrder,

    /** Fills the ticket, reviews and places the order; returns the confirmation number. */
    async placeOrder(order: OrderInput) {
      await reviewOrder(order);
      await trade.placeButton.click();
      await trade.orderConfirmation.waitFor();
      return (await trade.orderConfirmation.textContent())!.trim();
    },
  };
};
