/**
 * Regression coverage for issue #156 — POST /api/v2/auth/register used to
 * always fail with a Promise->string cast error, from a missing `await`
 * on `bcryptGenerateSalt(password)` in a v2-only file
 * (`src/api/v1/auth/services/register.ts`). That file no longer exists —
 * it was removed when `consolidate-v1-v2-auth` (issue #77, SEALED
 * 2026-08-29) merged v1/v2 into a single shared implementation. Today,
 * `src/routers/api/v2/auth.route.ts` wires `/register` directly to the
 * SAME `authRegister` controller (`@/auth/auth.controller`) that v1 uses,
 * which calls `handlerRegister` (`@/auth/auth.service.ts`) — already
 * correctly `await`s `bcryptGenerateSalt` (line 48) and is already
 * covered by `auth.service.test.ts`'s "should register successfully"
 * test (asserts `CandidateModel.create` receives the resolved hash
 * string, not a pending Promise — would fail without the `await`).
 *
 * This test closes the one remaining gap: proving v2's `/register` route
 * really delegates to that same, already-tested, already-correct
 * handler, and isn't a separate, still-broken code path.
 */
import v2AuthRouter from '@/routers/api/v2/auth.route';
import { authRegister } from '@/auth/auth.controller';

jest.mock('@/auth/auth.controller', () => ({ authRegister: jest.fn().mockResolvedValue(undefined), authLogin: jest.fn().mockResolvedValue(undefined) }));

describe('v2 auth route wiring (issue #156)', () => {
  it('POST /register delegates to the same authRegister controller as v1 — no separate, unfixed v2-only code path', () => {
    const registerLayer = (v2AuthRouter as any).stack.find((layer: any) => layer.route?.path === '/register');

    expect(registerLayer).toBeDefined();
    expect(registerLayer.route.methods.post).toBe(true);
    // The asyncHandler wrapper must call v1's authRegister itself — not a re-implementation that could independently regress.
    const req = {}, res = {}, next = jest.fn();
    registerLayer.route.stack[0].handle(req, res, next);
    expect(authRegister).toHaveBeenCalledWith(req, res, next);
  });
});
