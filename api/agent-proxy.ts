import type { Request, Response } from 'express';
import { isIP } from 'node:net';
import { lookup } from 'node:dns/promises';

const BLOCKED_HOSTNAMES = new Set(['localhost', 'localhost.localdomain']);

const MAX_BODY_BYTES = 1_000_000;
const PROVIDER_TIMEOUT_MS = 60_000;

const sendJson = (response: Response, status: number, body: Record<string, unknown>) => {
  response.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
};

const isPrivateAddress = (address: string): boolean => {
  if (address.includes(':')) {
    const normalized = address.toLowerCase();
    return normalized === '::1'
      || normalized === '::'
      || normalized.startsWith('fc')
      || normalized.startsWith('fd')
      || normalized.startsWith('fe8')
      || normalized.startsWith('fe9')
      || normalized.startsWith('fea')
      || normalized.startsWith('feb')
      || normalized.startsWith('::ffff:127.')
      || normalized.startsWith('::ffff:10.')
      || normalized.startsWith('::ffff:192.168.')
      || normalized.startsWith('::ffff:169.254.');
  }

  const [first, second] = address.split('.').map(Number);
  return first === 0
    || first === 10
    || first === 127
    || (first === 169 && second === 254)
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 168)
    || first >= 224;
};

const isPublicProviderHost = async (hostname: string): Promise<boolean> => {
  const normalized = hostname.toLowerCase().replace(/\.$/, '');
  if (!normalized.includes('.') || BLOCKED_HOSTNAMES.has(normalized) || normalized.endsWith('.local') || normalized.endsWith('.internal') || isIP(normalized)) return false;
  try {
    const addresses = await lookup(normalized, { all: true, verbatim: true });
    return addresses.length > 0 && addresses.every(result => !isPrivateAddress(result.address));
  } catch {
    return false;
  }
};

const hasValidSupabaseSession = async (request: Request): Promise<boolean> => {
  const authorization = request.headers.authorization;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!authorization?.startsWith('Bearer ') || !supabaseUrl || !publishableKey) return false;
  try {
    const authResponse = await fetch(`${supabaseUrl.replace(/\/+$/, '')}/auth/v1/user`, {
      headers: { Authorization: authorization, apikey: publishableKey }
    });
    return authResponse.ok;
  } catch {
    return false;
  }
};

export default async function handler(request: Request, response: Response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: { message: 'Method not allowed.' } });
  }

  if (!await hasValidSupabaseSession(request)) {
    return sendJson(response, 401, { error: { message: 'A valid DeskFlow session is required.' } });
  }

  const { endpoint, apiKey, payload } = (request.body || {}) as {
    endpoint?: unknown;
    apiKey?: unknown;
    payload?: unknown;
  };

  if (typeof endpoint !== 'string' || typeof apiKey !== 'string' || !apiKey.trim() || !payload || typeof payload !== 'object') {
    return sendJson(response, 400, { error: { message: 'A valid endpoint, API key, and request payload are required.' } });
  }

  let providerUrl: URL;
  try {
    providerUrl = new URL(endpoint);
  } catch {
    return sendJson(response, 400, { error: { message: 'The provider endpoint is invalid.' } });
  }

  const allowedPath = providerUrl.pathname.endsWith('/chat/completions') || providerUrl.pathname.endsWith('/responses');
  const validUrlShape = providerUrl.protocol === 'https:'
    && (!providerUrl.port || providerUrl.port === '443')
    && !providerUrl.username
    && !providerUrl.password
    && !providerUrl.search
    && !providerUrl.hash;
  if (!validUrlShape || !allowedPath || !await isPublicProviderHost(providerUrl.hostname)) {
    return sendJson(response, 403, { error: { message: 'Use a public HTTPS OpenAI-compatible endpoint ending in /chat/completions or /responses.' } });
  }

  const serializedPayload = JSON.stringify(payload);
  if (Buffer.byteLength(serializedPayload, 'utf8') > MAX_BODY_BYTES) {
    return sendJson(response, 413, { error: { message: 'The provider request is too large.' } });
  }

  const providerController = new AbortController();
  const timeout = setTimeout(() => providerController.abort(), PROVIDER_TIMEOUT_MS);
  try {
    const providerResponse = await fetch(providerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`
      },
      body: serializedPayload,
      signal: providerController.signal,
      redirect: 'manual'
    });
    if (providerResponse.status >= 300 && providerResponse.status < 400) {
      return sendJson(response, 502, { error: { message: 'The configured provider endpoint redirected. Use its final HTTPS API base URL instead.' } });
    }
    const body = await providerResponse.text();
    const retryAfter = providerResponse.headers.get('retry-after');
    if (retryAfter) response.setHeader('Retry-After', retryAfter);
    response.status(providerResponse.status).setHeader('Content-Type', providerResponse.headers.get('content-type') || 'application/json').send(body);
  } catch (error) {
    if (providerController.signal.aborted) {
      return sendJson(response, 504, { error: { message: 'The AI provider did not respond within 60 seconds.' } });
    }
    return sendJson(response, 502, { error: { message: 'The server could not reach the configured AI provider.' } });
  } finally {
    clearTimeout(timeout);
  }
}
