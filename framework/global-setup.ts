import { request, type FullConfig } from '@playwright/test';

/** Fails fast with a useful message when the app is not running. */
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL!;
  const ctx = await request.newContext({ baseURL });
  const deadline = Date.now() + 30_000;
  try {
    while (true) {
      try {
        const res = await ctx.get('/api/health');
        if (res.ok()) return;
      } catch {
        // not up yet
      }
      if (Date.now() > deadline) {
        throw new Error(
          `Summit Trust Bank is not reachable at ${baseURL}/api/health.\n` +
            'Start it with "npm run env:up" (docker compose) or set BASE_URL.',
        );
      }
      await new Promise((r) => setTimeout(r, 1_000));
    }
  } finally {
    await ctx.dispose();
  }
}
