import type { Locator } from '@playwright/test';

/**
 * Selects the <option> whose text contains `text`. Account dropdowns render
 * "Nickname (••••1234) — $1,234.56", so callers can pass just the nickname.
 */
export async function selectOptionContaining(select: Locator, text: string) {
  const option = select.locator('option', { hasText: text }).first();
  await option.waitFor({ state: 'attached' });
  const value = await option.getAttribute('value');
  if (value === null) throw new Error(`No option containing "${text}"`);
  await select.selectOption(value);
}
