import type { Request, Response } from 'express';

const sendJson = (response: Response, status: number, body: Record<string, unknown>) => {
  response.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
};

const getBearerToken = (request: Request): string | null => {
  const authorization = request.headers.authorization;
  return authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length).trim() : null;
};

const isOrganizationId = (value: string): boolean => /^[a-zA-Z0-9_-]{1,100}$/.test(value);
const isUuid = (value: string): boolean => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export default async function handler(request: Request, response: Response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Method not allowed.' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/\/+$/, '');
  const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const adminKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !publishableKey || !adminKey) {
    return sendJson(response, 503, { error: 'Organization administration is not configured on the server.' });
  }

  const accessToken = getBearerToken(request);
  if (!accessToken) return sendJson(response, 401, { error: 'A valid DeskFlow session is required.' });

  const body = (request.body || {}) as Record<string, unknown>;
  const id = typeof body.id === 'string' ? body.id.trim() : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const logoUrl = typeof body.logoUrl === 'string' ? body.logoUrl.trim() : '';
  const requestedMemberIds = Array.isArray(body.memberIds)
    ? [...new Set(body.memberIds.filter((value): value is string => typeof value === 'string' && isUuid(value)))]
    : [];

  if (!isOrganizationId(id)) return sendJson(response, 400, { error: 'A valid organization ID is required.' });
  if (!name || name.length > 120) return sendJson(response, 400, { error: 'Organization name is required and must be 120 characters or fewer.' });
  if (description.length > 500) return sendJson(response, 400, { error: 'Organization description must be 500 characters or fewer.' });
  if (logoUrl.length > 3_000_000) return sendJson(response, 400, { error: 'Organization logo is too large.' });

  const adminHeaders = {
    Authorization: `Bearer ${adminKey}`,
    apikey: adminKey,
    'Content-Type': 'application/json'
  };

  try {
    const authHeaders = { Authorization: `Bearer ${accessToken}`, apikey: publishableKey };
    const callerResponse = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: authHeaders });
    if (!callerResponse.ok) return sendJson(response, 401, { error: 'Your DeskFlow session is invalid or expired.' });
    const caller = await callerResponse.json() as { id?: string };
    if (!caller.id) return sendJson(response, 401, { error: 'Your DeskFlow account could not be verified.' });

    const callerProfileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(caller.id)}&select=role`, {
      headers: { ...adminHeaders, Accept: 'application/vnd.pgrst.object+json' }
    });
    if (!callerProfileResponse.ok) return sendJson(response, 403, { error: 'Your DeskFlow role could not be verified.' });
    const callerProfile = await callerProfileResponse.json() as { role?: string };
    if (callerProfile.role !== 'Super Admin') return sendJson(response, 403, { error: 'Only a Super Admin can save organizations.' });

    const existingResponse = await fetch(`${supabaseUrl}/rest/v1/organizations?id=eq.${encodeURIComponent(id)}&select=id,created_at`, { headers: adminHeaders });
    if (!existingResponse.ok) throw new Error('Unable to check the existing organization.');
    const existingRows = await existingResponse.json() as Array<{ id: string; created_at: string }>;
    const isNew = existingRows.length === 0;

    const duplicateResponse = await fetch(`${supabaseUrl}/rest/v1/organizations?name=ilike.${encodeURIComponent(name)}&id=neq.${encodeURIComponent(id)}&select=id&limit=1`, { headers: adminHeaders });
    if (!duplicateResponse.ok) throw new Error('Unable to validate the organization name.');
    if ((await duplicateResponse.json() as unknown[]).length > 0) return sendJson(response, 409, { error: 'An organization with this name already exists.' });

    const organizationWrite = await fetch(`${supabaseUrl}/rest/v1/organizations?on_conflict=id`, {
      method: 'POST',
      headers: { ...adminHeaders, Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({
        id,
        name,
        description: description || null,
        logo_url: logoUrl || null,
        created_by: caller.id,
        updated_at: new Date().toISOString()
      })
    });
    if (!organizationWrite.ok) throw new Error((await organizationWrite.text()) || 'Unable to save the organization.');
    const savedRows = await organizationWrite.json() as Array<{ created_at?: string }>;

    const memberIds = [...new Set([caller.id, ...requestedMemberIds])];
    if (memberIds.length > 0) {
      const profilesResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=in.(${memberIds.map(encodeURIComponent).join(',')})&select=id,role`, { headers: adminHeaders });
      if (!profilesResponse.ok) throw new Error('Unable to validate organization members.');
      const profiles = await profilesResponse.json() as Array<{ id: string; role: string }>;
      if (profiles.length !== memberIds.length) throw new Error('One or more selected organization members no longer exist.');
      const memberships = profiles.map(profile => ({
        organization_id: id,
        user_id: profile.id,
        role: profile.id === caller.id ? 'Super Admin' : profile.role
      }));
      const membershipWrite = await fetch(`${supabaseUrl}/rest/v1/organization_members?on_conflict=organization_id,user_id`, {
        method: 'POST',
        headers: { ...adminHeaders, Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(memberships)
      });
      if (!membershipWrite.ok) throw new Error((await membershipWrite.text()) || 'Unable to save organization members.');
    }

    const removeResponse = await fetch(`${supabaseUrl}/rest/v1/organization_members?organization_id=eq.${encodeURIComponent(id)}&user_id=not.in.(${memberIds.map(encodeURIComponent).join(',')})`, {
      method: 'DELETE',
      headers: { ...adminHeaders, Prefer: 'return=minimal' }
    });
    if (!removeResponse.ok) throw new Error((await removeResponse.text()) || 'Unable to remove old organization members.');

    return sendJson(response, 200, {
      success: true,
      organization: {
        id,
        name,
        description: description || null,
        logoUrl: logoUrl || null,
        memberIds,
        createdAt: new Date(savedRows[0]?.created_at || existingRows[0]?.created_at || Date.now()).getTime()
      }
    });
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : 'The server could not save this organization.';
    return sendJson(response, 502, { error: message.slice(0, 500) });
  }
}
