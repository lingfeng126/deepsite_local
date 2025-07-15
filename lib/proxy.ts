import { setGlobalDispatcher, EnvHttpProxyAgent } from 'undici';

/**
 * Undici will read the usual proxy env‑vars (`http_proxy`, `https_proxy`,
 * upper‑ or lower‑case) **after you pass it through EnvHttpProxyAgent**.
 * We only register the dispatcher if any of those vars is present.
 */
const proxy =
  process.env.http_proxy   ||
  process.env.HTTP_PROXY   ||
  process.env.https_proxy  ||
  process.env.HTTPS_PROXY; 

if (process.env.enable_proxy) {
  setGlobalDispatcher(new EnvHttpProxyAgent());
  console.log(`[proxy] Outbound traffic will be tunneled through ${proxy}`);
} else {
  console.log('[proxy] No proxy env‑var detected – using direct connection');
}