import type { Request, Response } from 'express';

const sendJson = (response: Response, status: number, body: Record<string, unknown>) => {
  response.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
};

const getBearerToken = (request: Request): string | null => {
  const authorization = request.headers.authorization;
  return authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length).trim() : null;
};

const isValidId = (value: string): boolean => /^[a-zA-Z0-9_-]{1,100}$/.test(value);

const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

interface ProfileRow {
  id: string;
  name: string;
  email: string;
  role: string;
}

/**
 * Provisions a DeskFlow profile for a Supabase Auth user who just signed in
 * with an OAuth provider (Google). OAuth does not create a `profiles` row the
 * way `admin-create-user` does, and RLS requires a profile before the client
 * can hydrate the workspace.
 *
 * This route is idempotent: an existing profile (matched by Auth user id or by
 * email) is returned unchanged. First-time Google users are added to the first
 * organization in the workspace with the default "Member" role.
 */
export default async function handler(request: Request, response: Response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Method not allowed.' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/\/+$/, '');
  const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const adminKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !publishableKey || !adminKey) {
    return sendJson(response, 503, { error: 'User provisioning is not configured on the server.' });
  }

  const accessToken = getBearerToken(request);
  if (!accessToken) return sendJson(response, 401, { error: 'A valid DeskFlow session is required.' });

  const body = (request.body || {}) as Record<string, unknown>;
  const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const avatarUrl = typeof body.avatarUrl === 'string' ? body.avatarUrl.trim() : '';

  if (!isValidId(userId)) return sendJson(response, 400, { error: 'A valid user id is required.' });
  if (!isValidEmail(email)) return sendJson(response, 400, { error: 'A valid email address is required.' });
  if (!name || name.length > 120) return sendJson(response, 400, { error: 'A valid name is required.' });

  const adminHeaders = {
    Authorization: `Bearer ${adminKey}`,
    apikey: adminKey,
    'Content-Type': 'application/json'
  };

  try {
    // Verify the caller is the user they claim to be, so one account cannot
    // provision a profile for another.
    const authHeaders = { Authorization: `Bearer ${accessToken}`, apikey: publishableKey };
    const callerResponse = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: authHeaders });
    if (!callerResponse.ok) return sendJson(response, 401, { error: 'Your DeskFlow session is invalid or expired.' });
    const caller = await callerResponse.json() as { id?: string };
    if (!caller.id || caller.id !== userId) return sendJson(response, 403, { error: 'The session does not match the requested user.' });

    // Existing profile by id, or by email (the user may have signed in with a
    // password before enabling Google sign-in).
    const existingResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?or=(id.eq.${encodeURIComponent(userId)},email.eq.${encodeURIComponent(email)})&select=id,name,email,role&limit=2`, {
      headers: { ...adminHeaders, Accept: 'application/vnd.pgrst.object+json' }
    });
    if (existingResponse.ok) {
      const existing = await existingResponse.json() as ProfileRow | null;
      if (existing?.id) {
        return sendJson(response, 200, { success: true, user: existing });
      }
    }

    // First organization in the workspace is the default home for new members.
    const organizationResponse = await fetch(`${supabaseUrl}/rest/v1/organizations?select=id&order=created_at.asc&limit=1`, {
      headers: { ...adminHeaders, Accept: 'application/vnd.pgrst.object+json' }
    });
    const organization = organizationResponse.ok ? await organizationResponse.json() as { id?: string } | null : null;
    if (!organization?.id) {
      return sendJson(response, 409, { error: 'No DeskFlow organization is available to join. Ask a workspace administrator to create one.' });
    }

    const username = email.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_.-]/g, '').slice(0, 80) || `user_${userId.slice(0, 8)}`;

    const profileWrite = await fetch(`${supabaseUrl}/rest/v1/profiles?on_conflict=id`, {
      method: 'POST',
      headers: { ...adminHeaders, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        id: userId,
        name,
        email,
        username,
        role: 'Member',
        title: null,
        phone: null,
        avatar_url: avatarUrl || null,
        status: 'active'
      })
    });
    if (!profileWrite.ok) throw new Error((await profileWrite.text()) || 'Unable to create the user profile.');

    const membershipWrite = await fetch(`${supabaseUrl}/rest/v1/organization_members?on_conflict=organization_id,user_id`, {
      method: 'POST',
      headers: { ...adminHeaders, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ organization_id: organization.id, user_id: userId, role: 'Member' })
    });
    if (!membershipWrite.ok) throw new Error((await membershipWrite.text()) || 'Unable to add the user to the organization.');

    return sendJson(response, 201, {
      success: true,
      user: { id: userId, name, email, role: 'Member' }
    });
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : 'The server could not provision this account.';
    return sendJson(response, 502, { error: message.slice(0, 500) });
  }
}
