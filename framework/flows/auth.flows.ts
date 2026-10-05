import type { Page } from '@playwright/test';
import { header } from '../pages/header';
import { loginPage } from '../pages/login.page';

export interface Credentials {
  username?: string;
  password?: string;
}

export const authFlows = (page: Page) => {
  const login = loginPage(page);
  const nav = header(page);

  return {
    async openLogin() {
      await page.goto(login.path);
    },

    /** Fills whatever credentials are given (missing fields are left blank) and submits. */
    async login({ username = '', password = '' }: Credentials) {
      await login.username.fill(username);
      await login.password.fill(password);
      await login.submit.click();
    },

    async openProfileMenu() {
      await nav.profileButton.click();
    },

    async logout() {
      await nav.profileButton.click();
      await nav.logoutButton.click();
    },
  };
};
