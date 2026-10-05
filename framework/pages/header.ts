import type { Page } from '@playwright/test';

export const header = (page: Page) => ({
  brandLogo: page.getByTestId('brand-logo'),
  mainMenu: page.getByTestId('main-menu'),
  navAccounts: page.getByTestId('nav-accounts'),
  navTrade: page.getByTestId('nav-trade'),
  navTransferPay: page.getByTestId('nav-transfer-pay'),
  navLogin: page.getByTestId('nav-login'),
  profileButton: page.getByTestId('profile-menu-button'),
  profileName: page.getByTestId('profile-name'),
  profileDropdown: page.getByTestId('profile-dropdown'),
  profileEmail: page.getByTestId('profile-email'),
  logoutButton: page.getByTestId('nav-logout'),
});

export type Header = ReturnType<typeof header>;
