import type { Request, Response } from 'express';

const MAX_BODY_BYTES = 100_000;

const sendJson = (response: Response, status: number, body: Record<string, unknown>) => {
  response.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
};

const getBearerToken = (request: Request): string | null => {
  const authorization = request.headers.authorization;
  return authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length).trim() : null;
};

const isValidId = (value: string): boolean => /^[a-zA-Z0-9_-]{1,120}$/.test(value);

const isValidText = (value: string): boolean => value.length > 0 && value.length <= 20_000;

/**
 * Persists AI agent messages (channel replies and thread replies) on behalf of
 * an agent. The normal client path (`messages_insert` RLS policy) requires
 * `sender_id = auth.uid()`, and `messages.sender_id` is a foreign key to
 * `profiles(id)`, so a client session can never insert a message authored by
 * an agent from the separate `agents` table.
 *
 * This route runs with the service-role key and performs the checks the client
 * would otherwise rely on RLS for: the caller must hold a valid DeskFlow
 * session and belong to the target organization, and the agent id must be a
 * real agent in that organization.
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
    return sendJson(response, 503, { error: 'Agent message persistence is not configured on the server.' });
  }

  const accessToken = getBearerToken(request);
  if (!accessToken) return sendJson(response, 401, { error: 'A valid DeskFlow session is required.' });

  const body = (request.body || {}) as Record<string, unknown>;
  const messageId = typeof body.messageId === 'string' ? body.messageId.trim() : '';
  const organizationId = typeof body.organizationId === 'string' ? body.organizationId.trim() : '';
  const channelId = typeof body.channelId === 'string' ? body.channelId.trim() : '';
  const senderId = typeof body.senderId === 'string' ? body.senderId.trim() : '';
  const parentMessageId = typeof body.parentMessageId === 'string' && body.parentMessageId.trim() ? body.parentMessageId.trim() : null;
  const content = typeof body.content === 'string' ? body.content : '';
  const createdAt = typeof body.createdAt === 'string' ? body.createdAt.trim() : '';

  if (!isValidId(messageId) || messageId.startsWith('agent_placeholder_')) {
    return sendJson(response, 400, { error: 'A valid message id is required.' });
  }
  if (!isValidId(organizationId)) return sendJson(response, 400, { error: 'A valid organization id is required.' });
  if (!isValidId(channelId)) return sendJson(response, 400, { error: 'A valid channel id is required.' });
  if (!isValidId(senderId)) return sendJson(response, 400, { error: 'A valid sender id is required.' });
  if (parentMessageId && !isValidId(parentMessageId)) return sendJson(response, 400, { error: 'A valid parent message id is required.' });
  if (!isValidText(content)) return sendJson(response, 400, { error: 'The message content is empty or too long.' });

  const adminHeaders = {
    Authorization: `Bearer ${adminKey}`,
    apikey: adminKey,
    'Content-Type': 'application/json'
  };

  try {
    // Verify the caller's session and organization membership.
    const authHeaders = { Authorization: `Bearer ${accessToken}`, apikey: publishableKey };
    const callerResponse = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: authHeaders });
    if (!callerResponse.ok) return sendJson(response, 401, { error: 'Your DeskFlow session is invalid or expired.' });
    const caller = await callerResponse.json() as { id?: string };
    if (!caller.id) return sendJson(response, 401, { error: 'Your DeskFlow account could not be verified.' });

    const membershipResponse = await fetch(`${supabaseUrl}/rest/v1/organization_members?organization_id=eq.${encodeURIComponent(organizationId)}&user_id=eq.${encodeURIComponent(caller.id)}&select=user_id`, {
      headers: { ...adminHeaders, Accept: 'application/vnd.pgrst.object+json' }
    });
    if (!membershipResponse.ok || !await membershipResponse.json()) {
      return sendJson(response, 403, { error: 'You are not a member of this organization.' });
    }

    // Verify the sender is a real agent in the target organization.
    const agentResponse = await fetch(`${supabaseUrl}/rest/v1/agents?id=eq.${encodeURIComponent(senderId)}&organization_id=eq.${encodeURIComponent(organizationId)}&select=id`, {
      headers: { ...adminHeaders, Accept: 'application/vnd.pgrst.object+json' }
    });
    if (!agentResponse.ok || !await agentResponse.json()) {
      return sendJson(response, 403, { error: 'The sender is not a workspace agent in this organization.' });
    }

    // Verify the target channel belongs to the organization and is accessible to the caller.
    const channelResponse = await fetch(`${supabaseUrl}/rest/v1/channels?id=eq.${encodeURIComponent(channelId)}&organization_id=eq.${encodeURIComponent(organizationId)}&select=id,is_private`, {
      headers: { ...adminHeaders, Accept: 'application/vnd.pgrst.object+json' }
    });
    if (!channelResponse.ok || !await channelResponse.json()) {
      return sendJson(response, 403, { error: 'The target channel is not in this organization.' });
    }

    if (parentMessageId) {
      const parentResponse = await fetch(`${supabaseUrl}/rest/v1/messages?id=eq.${encodeURIComponent(parentMessageId)}&channel_id=eq.${encodeURIComponent(channelId)}&select=id`, {
        headers: { ...adminHeaders, Accept: 'application/vnd.pgrst.object+json' }
      });
      if (!parentResponse.ok || !await parentResponse.json()) {
        return sendJson(response, 403, { error: 'The parent message was not found in this channel.' });
      }
    }

    const insert = await fetch(`${supabaseUrl}/rest/v1/messages?on_conflict=id`, {
      method: 'POST',
      headers: { ...adminHeaders, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        id: messageId,
        organization_id: organizationId,
        channel_id: channelId,
        sender_id: senderId,
        parent_message_id: parentMessageId,
        content,
        created_at: createdAt || undefined
      })
    });
    if (!insert.ok) throw new Error((await insert.text()) || 'Unable to save the agent message.');

    return sendJson(response, 201, { success: true });
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : 'The server could not save this agent message.';
    return sendJson(response, 502, { error: message.slice(0, 500) });
  }
}
