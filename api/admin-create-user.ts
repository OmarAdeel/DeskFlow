import type { Request, Response } from 'express';
import { randomBytes } from 'node:crypto';

const ALLOWED_ROLES = new Set(['Super Admin', 'Admin', 'Manager', 'Member', 'Guest']);

const sendJson = (response: Response, status: number, body: Record<string, unknown>) => {
  response.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
};

const getBearerToken = (request: Request): string | null => {
  const authorization = request.headers.authorization;
  return authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length).trim() : null;
};

const isValidId = (value: string): boolean => /^[a-zA-Z0-9_-]{1,100}$/.test(value);

interface SupabaseErrorBody {
  code?: string;
  error?: string;
  error_code?: string;
  error_description?: string;
  message?: string;
  msg?: string;
}

const readSupabaseError = async (response: globalThis.Response, fallback: string): Promise<string> => {
  const detail = await response.json().catch(() => null) as SupabaseErrorBody | null;
  const message = detail?.message || detail?.msg || detail?.error_description || detail?.error || fallback;
  const code = detail?.code || detail?.error_code;
  return code && !message.includes(code) ? `${message} (${code})` : message;
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
    return sendJson(response, 503, { error: 'User administration is not configured on the server.' });
  }

  const accessToken = getBearerToken(request);
  if (!accessToken) return sendJson(response, 401, { error: 'A valid DeskFlow session is required.' });

  const body = (request.body || {}) as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const username = typeof body.username === 'string' ? body.username.trim().replace(/^@/, '') : '';
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const role = typeof body.role === 'string' ? body.role : '';
  const organizationId = typeof body.organizationId === 'string' ? body.organizationId : '';
  const channelIds = Array.isArray(body.channelIds)
    ? [...new Set(body.channelIds.filter((value): value is string => typeof value === 'string' && isValidId(value)))]
    : [];

  if (!name || name.length > 120) return sendJson(response, 400, { error: 'A valid name is required.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return sendJson(response, 400, { error: 'A valid email address is required.' });
  if (!username || username.length > 80) return sendJson(response, 400, { error: 'A valid username is required.' });
  if (!ALLOWED_ROLES.has(role)) return sendJson(response, 400, { error: 'The selected role is invalid.' });
  if (!isValidId(organizationId)) return sendJson(response, 400, { error: 'A valid organization is required.' });
  if (title.length > 160 || phone.length > 50) return sendJson(response, 400, { error: 'The title or phone number is too long.' });

  const adminHeaders = {
    Authorization: `Bearer ${adminKey}`,
    apikey: adminKey,
    'Content-Type': 'application/json'
  };
  let createdUserId: string | null = null;
  let authUserCreatedByThisRequest = false;

  try {
    const authHeaders = { Authorization: `Bearer ${accessToken}`, apikey: publishableKey };
    const callerResponse = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: authHeaders });
    if (!callerResponse.ok) return sendJson(response, 401, { error: 'Your DeskFlow session is invalid or expired.' });
    const caller = await callerResponse.json() as { id?: string };
    if (!caller.id) return sendJson(response, 401, { error: 'Your DeskFlow account could not be verified.' });

    const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(caller.id)}&select=role`, {
      headers: { ...adminHeaders, Accept: 'application/vnd.pgrst.object+json' }
    });
    if (!profileResponse.ok) return sendJson(response, 403, { error: 'Your DeskFlow role could not be verified.' });
    const callerProfile = await profileResponse.json() as { role?: string };
    if (callerProfile.role !== 'Super Admin') return sendJson(response, 403, { error: 'Only a Super Admin can add workspace users.' });

    const organizationResponse = await fetch(`${supabaseUrl}/rest/v1/organizations?id=eq.${encodeURIComponent(organizationId)}&select=id`, {
      headers: { ...adminHeaders, Accept: 'application/vnd.pgrst.object+json' }
    });
    if (!organizationResponse.ok) return sendJson(response, 404, { error: 'The selected organization was not found.' });

    if (channelIds.length > 0) {
      const channelsResponse = await fetch(`${supabaseUrl}/rest/v1/channels?id=in.(${channelIds.map(encodeURIComponent).join(',')})&organization_id=eq.${encodeURIComponent(organizationId)}&select=id`, {
        headers: adminHeaders
      });
      if (!channelsResponse.ok) return sendJson(response, 400, { error: 'The selected channels could not be validated.' });
      const validChannels = await channelsResponse.json() as Array<{ id: string }>;
      if (validChannels.length !== channelIds.length) return sendJson(response, 400, { error: 'One or more selected channels do not belong to this organization.' });
    }

    const usernameResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?username=eq.${encodeURIComponent(username)}&select=id&limit=1`, { headers: adminHeaders });
    if (!usernameResponse.ok) throw new Error('Unable to validate the username.');
    if ((await usernameResponse.json() as unknown[]).length > 0) {
      return sendJson(response, 409, { error: `The username @${username} is already in use. Choose another email or username.` });
    }

    const authUsersResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=1&per_page=1000`, { headers: adminHeaders });
    if (!authUsersResponse.ok) {
      return sendJson(response, authUsersResponse.status, { error: await readSupabaseError(authUsersResponse, 'Unable to check existing Supabase Auth users.') });
    }
    const authUsersPayload = await authUsersResponse.json() as { users?: Array<{ id: string; email?: string }> } | Array<{ id: string; email?: string }>;
    const authUsers = Array.isArray(authUsersPayload) ? authUsersPayload : authUsersPayload.users || [];
    const existingAuthUser = authUsers.find(user => user.email?.toLowerCase() === email);

    if (existingAuthUser) {
      const existingProfileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(existingAuthUser.id)}&select=id&limit=1`, { headers: adminHeaders });
      if (!existingProfileResponse.ok) throw new Error('Unable to check the existing DeskFlow profile.');
      if ((await existingProfileResponse.json() as unknown[]).length > 0) {
        return sendJson(response, 409, { error: 'A DeskFlow user with this email already exists. Edit the existing user instead.' });
      }
      createdUserId = existingAuthUser.id;
    } else {
      const createResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          email,
          password: `${randomBytes(32).toString('base64url')}Aa1!`,
          email_confirm: true,
          user_metadata: { name }
        })
      });
      if (!createResponse.ok) {
        return sendJson(response, createResponse.status, { error: await readSupabaseError(createResponse, 'Supabase could not create this Auth user.') });
      }
      const createdUser = await createResponse.json() as { id?: string; user?: { id?: string } };
      createdUserId = createdUser.id || createdUser.user?.id || null;
      if (!createdUserId) throw new Error('Supabase did not return the new user ID.');
      authUserCreatedByThisRequest = true;
    }

    const profileWrite = await fetch(`${supabaseUrl}/rest/v1/profiles?on_conflict=id`, {
      method: 'POST',
      headers: { ...adminHeaders, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ id: createdUserId, name, email, username, role, title: title || null, phone: phone || null, status: 'active' })
    });
    if (!profileWrite.ok) throw new Error((await profileWrite.text()) || 'Unable to create the user profile.');

    const membershipWrite = await fetch(`${supabaseUrl}/rest/v1/organization_members?on_conflict=organization_id,user_id`, {
      method: 'POST',
      headers: { ...adminHeaders, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ organization_id: organizationId, user_id: createdUserId, role })
    });
    if (!membershipWrite.ok) throw new Error((await membershipWrite.text()) || 'Unable to add the user to the organization.');

    if (channelIds.length > 0) {
      const channelMembershipWrite = await fetch(`${supabaseUrl}/rest/v1/channel_members?on_conflict=channel_id,user_id`, {
        method: 'POST',
        headers: { ...adminHeaders, Prefer: 'resolution=ignore-duplicates,return=minimal' },
        body: JSON.stringify(channelIds.map(channelId => ({ channel_id: channelId, user_id: createdUserId })))
      });
      if (!channelMembershipWrite.ok) throw new Error((await channelMembershipWrite.text()) || 'Unable to assign the selected channels.');
    }

    return sendJson(response, 201, {
      success: true,
      user: { id: createdUserId, name, email, username, role, title: title || null, phone: phone || null, organizationIds: [organizationId], channelIds }
    });
  } catch (error) {
    if (createdUserId && authUserCreatedByThisRequest) {
      await fetch(`${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(createdUserId)}`, { method: 'DELETE', headers: adminHeaders }).catch(() => undefined);
    }
    const message = error instanceof Error && error.message ? error.message : 'The server could not create this user.';
    return sendJson(response, 502, { error: message.slice(0, 500) });
  }
}
