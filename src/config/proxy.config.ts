/**
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */

/**
 * Express `trust proxy` hop count from `TRUST_PROXY_HOPS` (1 on Render: the
 * browser calls it directly, Render's proxy is the only hop). With N hops,
 * `req.ip` is the Nth `X-Forwarded-For` entry from the right — appended by a
 * trusted proxy, so a client can't forge it. Unset/invalid → no proxy
 * trusted: `req.ip` stays the socket address, so a deploy without a proxy
 * can't be spoofed through the header.
 */
export const trustProxySetting = (raw: string | undefined = process.env['TRUST_PROXY_HOPS']): number | undefined => {
  const hops = Number(raw);
  return Number.isInteger(hops) && hops > 0 ? hops : undefined;
};
