import { type Actor, type Cast, TakeNotes } from '@serenity-js/core';
import { BrowseTheWebWithPlaywright, type ExtraBrowserContextOptions } from '@serenity-js/playwright';
import { CallAnApi } from '@serenity-js/rest';
import type * as playwright from 'playwright-core';

/**
 * Gives every actor a browser (opened lazily, one context per scenario),
 * a REST client and a notepad for sharing values such as auth tokens between steps.
 */
export class Actors implements Cast {
  constructor(
    private readonly browser: playwright.Browser,
    private readonly baseURL: string,
    private readonly options: ExtraBrowserContextOptions = {},
  ) {}

  prepare(actor: Actor): Actor {
    return actor.whoCan(
      BrowseTheWebWithPlaywright.using(this.browser, { baseURL: this.baseURL }, this.options),
      CallAnApi.at(this.baseURL),
      TakeNotes.usingAnEmptyNotepad<BankNotes>(),
    );
  }
}

export interface BankNotes {
  /** JWT returned by POST /api/auth/login. */
  authToken: string;
}
