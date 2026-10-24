/**
 * Redirects plain-HTTP requests to HTTPS in production. Reads the proxy's
 * `x-forwarded-proto` directly instead of enabling `trust proxy`: a spoofed
 * header only affects the spoofer's own request, whereas `trust proxy`
 * would also change `req.ip` (rate limiting, visit geo).
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */
import { Request, Response, NextFunction } from 'express';
import { NODE_ENV } from '@/config/process.config';

export const httpsRedirect = (req: Request, res: Response, next: NextFunction) => {
  const proto = req.headers['x-forwarded-proto'];
  const firstProto = (Array.isArray(proto) ? proto[0] : proto)?.split(',')[0]?.trim();

  // /health stays on plain HTTP: container and platform health checks call it without TLS.
  if (NODE_ENV !== 'production' || firstProto !== 'http' || req.path === '/health') return next();

  // 308, not 301: keeps the method and body of a POST/PUT.
  res.redirect(308, `https://${req.headers.host ?? ''}${req.originalUrl}`);
};
