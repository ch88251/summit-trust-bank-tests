import type { Locator, Page } from '@playwright/test';

export class Header {
  readonly brandLogo: Locator;
  readonly mainMenu: Locator;
  readonly navAccounts: Locator;
  readonly navTrade: Locator;
  readonly navTransferPay: Locator;
  readonly navLogin: Locator;
  readonly profileButton: Locator;
  readonly profileName: Locator;
  readonly profileDropdown: Locator;
  readonly profileEmail: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.brandLogo = page.getByTestId('brand-logo');
    this.mainMenu = page.getByTestId('main-menu');
    this.navAccounts = page.getByTestId('nav-accounts');
    this.navTrade = page.getByTestId('nav-trade');
    this.navTransferPay = page.getByTestId('nav-transfer-pay');
    this.navLogin = page.getByTestId('nav-login');
    this.profileButton = page.getByTestId('profile-menu-button');
    this.profileName = page.getByTestId('profile-name');
    this.profileDropdown = page.getByTestId('profile-dropdown');
    this.profileEmail = page.getByTestId('profile-email');
    this.logoutButton = page.getByTestId('nav-logout');
  }

  async openProfileMenu() {
    await this.profileButton.click();
  }

  async logout() {
    await this.openProfileMenu();
    await this.logoutButton.click();
  }
}
