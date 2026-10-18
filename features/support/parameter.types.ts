import { defineParameterType } from '@cucumber/cucumber';
import { actorCalled, actorInTheSpotlight } from '@serenity-js/core';

/** "Alex", "Jane", ... — see src/screenplay/actors/customers.ts for who they are. */
defineParameterType({
  name: 'actor',
  regexp: /[A-Z][a-z]+/,
  transformer: (name: string) => actorCalled(name),
});

/** Refers back to the actor who performed the previous step. */
defineParameterType({
  name: 'pronoun',
  regexp: /they|their|he|his|she|her/,
  transformer: () => actorInTheSpotlight(),
});
