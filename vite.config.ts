import { defineConfig, type Plugin } from 'vite';

/**
 * `npm run dev` is plain Vite, which doesn't run Vercel functions — it would
 * try to serve api/highscore.ts as a browser module and show an error overlay.
 * Answer /api/* with a 503 instead, so the game exercises its offline path.
 * Use `npm run dev:api` (vercel dev) to run the real leaderboard locally.
 */
function localApiStub(): Plugin {
  return {
    name: 'local-api-stub',
    configureServer(server) {
      server.middlewares.use('/api', (_req, res) => {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Leaderboard not available under `vite`; run `npm run dev:api`' }));
      });
    },
  };
}

export default defineConfig({
  plugins: [localApiStub()],
  test: {
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
  },
});
