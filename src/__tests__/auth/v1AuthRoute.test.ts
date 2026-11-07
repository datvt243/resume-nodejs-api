import v1AuthRouter from '@/routers/api/v1/auth.route';
import v2AuthRouter from '@/routers/api/v2/auth.route';
import { authLimiter } from '@/middlewares/rateLimit.middleware';

describe('v1 auth route wiring', () => {
  it('serves /login only as POST — credentials never ride on a GET', () => {
    const loginLayers = (v1AuthRouter as any).stack.filter((layer: any) => layer.route?.path === '/login');

    expect(loginLayers).toHaveLength(1);
    expect(loginLayers[0].route.methods).toEqual({ post: true });
  });
});

describe('auth limiter wiring (issue #387)', () => {
  const handlersOf = (router: any, path: string) => router.stack.find((layer: any) => layer.route?.path === path).route.stack.map((s: any) => s.handle);

  it.each(['/login', '/register', '/forgot-password', '/reset-password'])('v1 %s runs the shared authLimiter first', (path) => {
    expect(handlersOf(v1AuthRouter, path)[0]).toBe(authLimiter);
  });

  it.each(['/login', '/register'])('v2 %s runs the same authLimiter instance (one bucket across v1 and v2)', (path) => {
    expect(handlersOf(v2AuthRouter, path)[0]).toBe(authLimiter);
  });

  it.each(['/logout', '/logout-all', '/refresh', '/verify-email'])('v1 %s stays on the global limit only', (path) => {
    expect(handlersOf(v1AuthRouter, path)).not.toContain(authLimiter);
  });

  it('is not mounted router-wide', () => {
    expect((v1AuthRouter as any).stack.some((layer: any) => !layer.route && layer.handle === authLimiter)).toBe(false);
  });
});
