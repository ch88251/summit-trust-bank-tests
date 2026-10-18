import { Given, Then, When } from '@cucumber/cucumber';
import { Ensure, endsWith, equals } from '@serenity-js/assertions';
import type { Actor } from '@serenity-js/core';
import { Page, Text } from '@serenity-js/web';
import { customerCalled, LogIn, LoginForm, SignInToTheApi, StartAnAuthenticatedSession } from '../../src/screenplay';

Given('{actor} is logged in', async (actor: Actor) =>
  actor.attemptsTo(StartAnAuthenticatedSession.as(customerCalled(actor.name))),
);

Given('{actor} has signed in to the API', async (actor: Actor) =>
  actor.attemptsTo(SignInToTheApi.as(customerCalled(actor.name))),
);

When('{actor} logs in with valid credentials', async (actor: Actor) =>
  actor.attemptsTo(LogIn.as(customerCalled(actor.name))),
);

When('{actor} logs in with the password {string}', async (actor: Actor, password: string) =>
  actor.attemptsTo(LogIn.withCredentials(customerCalled(actor.name).username, password)),
);

Then('{actor} should be on the accounts page', async (actor: Actor) =>
  actor.attemptsTo(Ensure.eventually(Page.current().url().pathname, endsWith('/accounts'))),
);

Then('{pronoun} should still be on the login page', async (actor: Actor) =>
  actor.attemptsTo(Ensure.eventually(Page.current().url().pathname, endsWith('/login'))),
);

Then('{pronoun} should see the login error {string}', async (actor: Actor, message: string) =>
  actor.attemptsTo(Ensure.eventually(Text.of(LoginForm.error()), equals(message))),
);
