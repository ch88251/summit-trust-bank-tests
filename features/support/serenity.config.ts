import { AfterAll, Before, BeforeAll, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium, type Browser } from '@playwright/test';
import { actorCalled, ArtifactArchiver, configure, Duration } from '@serenity-js/core';
import { ConsoleReporter } from '@serenity-js/console-reporter';
import { SerenityBDDReporter } from '@serenity-js/serenity-bdd';
import { Photographer, TakePhotosOfFailures } from '@serenity-js/web';
import { BASE_URL } from '../../src/config';
import { Actors, ResetTestData } from '../../src/screenplay';

const timeouts = {
  cucumber: Duration.ofSeconds(30),
  interaction: Duration.ofSeconds(5),
  navigation: Duration.ofSeconds(15),
};

setDefaultTimeout(timeouts.cucumber.inMilliseconds());

let browser: Browser;

BeforeAll(async () => {
  browser = await chromium.launch({ headless: !process.env.HEADED });

  configure({
    actors: new Actors(browser, BASE_URL, {
      defaultTimeout: timeouts.interaction.inMilliseconds(),
      defaultNavigationTimeout: timeouts.navigation.inMilliseconds(),
    }),
    interactionTimeout: timeouts.interaction,
    crew: [
      ArtifactArchiver.fromJSON({ outputDirectory: 'target/site/serenity' }),
      SerenityBDDReporter.fromJSON({ specDirectory: 'features' }),
      ConsoleReporter.fromJSON({ theme: 'auto' }),
      Photographer.whoWill(TakePhotosOfFailures),
    ],
  });
});

// Every scenario starts from the seed data. The reset wipes the whole database,
// so scenarios run one at a time (Cucumber's default; don't enable --parallel).
Before(async () => {
  await actorCalled('Test Data Manager').attemptsTo(ResetTestData());
});

AfterAll(async () => {
  await browser?.close();
});
