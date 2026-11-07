import v1AuthRouter from '@/routers/api/v1/auth.route';

describe('v1 auth route wiring', () => {
  it('serves /login only as POST — credentials never ride on a GET', () => {
    const loginLayers = (v1AuthRouter as any).stack.filter((layer: any) => layer.route?.path === '/login');

    expect(loginLayers).toHaveLength(1);
    expect(loginLayers[0].route.methods).toEqual({ post: true });
  });
});
