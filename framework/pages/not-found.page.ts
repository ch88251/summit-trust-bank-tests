import type { Page } from '@playwright/test';

export const notFoundPage = (page: Page) => ({
  root: page.getByTestId('not-found'),
});

export type NotFoundPage = ReturnType<typeof notFoundPage>;
