import type { Request, Response } from 'express';

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;

const sendJson = (response: Response, status: number, body: Record<string, unknown>) => {
  response.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
};

const getBearerToken = (request: Request): string | null => {
  const authorization = request.headers.authorization;
  return authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length).trim() : null;
};

export default async function handler(request: Request, response: Response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Method not allowed.' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/\/+$/, '');
  const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const adminKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !publishableKey || !adminKey) {
    return sendJson(response, 503, { error: 'Password administration is not configured on the server.' });
  }

  const accessToken = getBearerToken(request);
  if (!accessToken) return sendJson(response, 401, { error: 'A valid DeskFlow session is required.' });

  const { userId, newPassword } = (request.body || {}) as { userId?: unknown; newPassword?: unknown };
  if (typeof userId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
    return sendJson(response, 400, { error: 'A valid target user is required.' });
  }
  if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > MAX_PASSWORD_LENGTH) {
    return sendJson(response, 400, { error: `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.` });
  }

  try {
    const authHeaders = { Authorization: `Bearer ${accessToken}`, apikey: publishableKey };
    const callerResponse = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: authHeaders });
    if (!callerResponse.ok) return sendJson(response, 401, { error: 'Your DeskFlow session is invalid or expired.' });
    const caller = await callerResponse.json() as { id?: string };
    if (!caller.id) return sendJson(response, 401, { error: 'Your DeskFlow account could not be verified.' });

    const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(caller.id)}&select=role`, {
      headers: {
        Authorization: `Bearer ${adminKey}`,
        apikey: adminKey,
        Accept: 'application/vnd.pgrst.object+json'
      }
    });
    if (!profileResponse.ok) return sendJson(response, 403, { error: 'Your DeskFlow role could not be verified.' });
    const profile = await profileResponse.json() as { role?: string };
    if (profile.role !== 'Super Admin') return sendJson(response, 403, { error: 'Only a Super Admin can set another user’s password.' });

    const adminResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminKey}`,
        apikey: adminKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password: newPassword })
    });
    if (!adminResponse.ok) {
      const detail = await adminResponse.json().catch(() => null) as { message?: string; error?: string } | null;
      return sendJson(response, adminResponse.status, { error: detail?.message || detail?.error || 'Supabase could not update this password.' });
    }

    return sendJson(response, 200, { success: true });
  } catch {
    return sendJson(response, 502, { error: 'The server could not complete the Supabase password update.' });
  }
}
