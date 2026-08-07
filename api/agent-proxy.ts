import type { Request, Response } from 'express';

const ALLOWED_PROVIDER_HOSTS = new Set([
  'api.openai.com',
  'api.deepseek.com',
  'integrate.api.nvidia.com'
]);

const MAX_BODY_BYTES = 1_000_000;
const PROVIDER_TIMEOUT_MS = 25_000;

const sendJson = (response: Response, status: number, body: Record<string, unknown>) => {
  response.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
};

export default async function handler(request: Request, response: Response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: { message: 'Method not allowed.' } });
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
  if (providerUrl.protocol !== 'https:' || !ALLOWED_PROVIDER_HOSTS.has(providerUrl.hostname) || !allowedPath) {
    return sendJson(response, 403, { error: { message: 'This provider endpoint is not allowed.' } });
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
      signal: providerController.signal
    });
    const body = await providerResponse.text();
    response.status(providerResponse.status).setHeader('Content-Type', providerResponse.headers.get('content-type') || 'application/json').send(body);
  } catch (error) {
    if (providerController.signal.aborted) {
      return sendJson(response, 504, { error: { message: 'The AI provider did not respond within 25 seconds.' } });
    }
    return sendJson(response, 502, { error: { message: 'The server could not reach the configured AI provider.' } });
  } finally {
    clearTimeout(timeout);
  }
}
