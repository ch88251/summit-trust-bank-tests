import { isPresent } from '@serenity-js/assertions';
import { notes, Task, Wait, type Answerable } from '@serenity-js/core';
import {
  Attribute,
  Clear,
  Click,
  Enter,
  ExecuteScript,
  isVisible,
  Navigate,
  type PageElement,
  Select,
} from '@serenity-js/web';
import type { BankNotes } from '../actors/Actors';
import type { Customer } from '../actors/customers';
import { AccountsOverview, LoginForm, optionContaining, TransferForm } from '../ui/targets';
import { SignInToTheApi } from './api';

export const LogIn = {
  withCredentials: (username: string, password: string) =>
    Task.where(
      `#actor logs in as ${username}`,
      Navigate.to('/login'),
      Enter.theValue(username).into(LoginForm.username()),
      Enter.theValue(password).into(LoginForm.password()),
      Click.on(LoginForm.submitButton()),
    ),

  as: (customer: Customer) => LogIn.withCredentials(customer.username, customer.password),
};

/**
 * Skips the login form: signs in through the API and hands the token to the
 * browser (the app keeps it in localStorage["stb_token"]). Much faster than
 * `LogIn.as()` for scenarios that aren't about logging in.
 */
export const StartAnAuthenticatedSession = {
  as: (customer: Customer) =>
    Task.where(
      `#actor starts an authenticated session as ${customer.username}`,
      SignInToTheApi.as(customer),
      Navigate.to('/login'),
      ExecuteScript.sync(`localStorage.setItem('stb_token', arguments[0])`).withArguments(
        notes<BankNotes>().get('authToken'),
      ),
      Navigate.to('/accounts'),
      Wait.until(AccountsOverview.welcomeMessage(), isVisible()),
    ),
};

export const ViewTheAccountsOverview = () =>
  Task.where(
    `#actor views the accounts overview`,
    Navigate.to('/accounts'),
    Wait.until(AccountsOverview.welcomeMessage(), isVisible()),
  );

const ChooseTheAccount = (nickname: Answerable<string>, dropdown: Answerable<PageElement>) =>
  Task.where(
    `#actor chooses ${nickname} from ${dropdown}`,
    Wait.until(optionContaining(dropdown, nickname), isPresent()),
    Select.value(Attribute.called('value').of(optionContaining(dropdown, nickname))).from(dropdown),
  );

export const TransferFunds = {
  of: (amount: string) => ({
    from: (fromAccount: string) => ({
      to: (toAccount: string) =>
        Task.where(
          `#actor transfers "${amount}" from ${fromAccount} to ${toAccount}`,
          Navigate.to('/transfer-pay?tab=transfer'),
          Wait.until(TransferForm.panel(), isVisible()),
          ChooseTheAccount(fromAccount, TransferForm.from()),
          ChooseTheAccount(toAccount, TransferForm.to()),
          amount === '' ? Clear.theValueOf(TransferForm.amount()) : Enter.theValue(amount).into(TransferForm.amount()),
          Click.on(TransferForm.submitButton()),
        ),
    }),
  }),
};
