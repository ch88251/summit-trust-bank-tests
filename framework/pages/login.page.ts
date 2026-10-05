import type { Page } from '@playwright/test';

export const loginPage = (page: Page) => ({
  path: '/login',
  form: page.getByTestId('login-form'),
  username: page.getByTestId('login-username'),
  password: page.getByTestId('login-password'),
  togglePassword: page.getByTestId('toggle-password'),
  submit: page.getByTestId('login-submit'),
  error: page.getByTestId('login-error'),
  logoutMessage: page.getByTestId('logout-message'),
  demoCredentials: page.getByTestId('demo-credentials'),
});

export type LoginPage = ReturnType<typeof loginPage>;
