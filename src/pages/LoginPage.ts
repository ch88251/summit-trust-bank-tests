import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly form: Locator;
  readonly username: Locator;
  readonly password: Locator;
  readonly togglePassword: Locator;
  readonly submit: Locator;
  readonly error: Locator;
  readonly logoutMessage: Locator;
  readonly demoCredentials: Locator;

  constructor(page: Page) {
    super(page);
    this.form = page.getByTestId('login-form');
    this.username = page.getByTestId('login-username');
    this.password = page.getByTestId('login-password');
    this.togglePassword = page.getByTestId('toggle-password');
    this.submit = page.getByTestId('login-submit');
    this.error = page.getByTestId('login-error');
    this.logoutMessage = page.getByTestId('logout-message');
    this.demoCredentials = page.getByTestId('demo-credentials');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(username: string, password: string) {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.submit.click();
  }
}
