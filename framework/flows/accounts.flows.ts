import type { Page } from '@playwright/test';
import type { Transaction } from '../api/BankApi';
import { accountOf } from '../data/loader';
import type { UserData } from '../data/types';
import { accountDetailPage } from '../pages/account-detail.page';
import { accountsPage } from '../pages/accounts.page';

export const accountsFlows = (page: Page, user: UserData) => {
  const overview = accountsPage(page);
  const detail = accountDetailPage(page);

  return {
    async openAccounts() {
      await page.goto(overview.path);
    },

    async openAccountDetail(accountId: number) {
      await page.goto(detail.path(accountId));
    },

    /** Clicks through from the overview to the account with this alias (e.g. "checking"). */
    async openAccountFromOverview(alias: string) {
      await overview.link(accountOf(user, alias).nickname).click();
    },

    async filterTransactions(category: Transaction['category'] | 'ALL') {
      await detail.filter.selectOption(category === 'ALL' ? '' : category);
    },
  };
};
