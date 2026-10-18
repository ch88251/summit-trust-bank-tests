// Serenity/JS + Cucumber + Playwright (Screenplay Pattern). Run with `npm run test:bdd`.
export default {
  requireModule: ['tsx/cjs'],
  require: ['features/support/**/*.ts', 'features/step_definitions/**/*.ts'],
  format: ['@serenity-js/cucumber'],
  formatOptions: { specDirectory: 'features' },
  strict: true,
};
