import type { Locator, Page } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /**
   * Selects the <option> whose text contains `text`. Account dropdowns render
   * "Nickname (••••1234) — $1,234.56", so callers can pass just the nickname.
   */
  protected async selectOptionContaining(select: Locator, text: string) {
    const value = await select.locator('option', { hasText: text }).first().getAttribute('value');
    if (value === null) throw new Error(`No option containing "${text}"`);
    await select.selectOption(value);
  }
}
