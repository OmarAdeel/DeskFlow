import type { Request, Response } from 'express';

const sendJson = (response: Response, status: number, body: Record<string, unknown>) => {
  response.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
};

const getBearerToken = (request: Request): string | null => {
  const authorization = request.headers.authorization;
  return authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length).trim() : null;
};

const isValidId = (value: string): boolean => /^[a-zA-Z0-9_-]{1,120}$/.test(value);

const uniqueIds = (value: unknown): string[] => Array.isArray(value)
  ? [...new Set(value.filter((item): item is string => typeof item === 'string').map(item => item.trim()).filter(isValidId))]
  : [];

export default async function handler(request: Request, response: Response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Method not allowed.' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/\/+$/, '');
  const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const adminKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !publishableKey || !adminKey) {
    return sendJson(response, 503, { error: 'Channel membership persistence is not configured on the server.' });
  }

  const accessToken = getBearerToken(request);
  if (!accessToken) return sendJson(response, 401, { error: 'A valid DeskFlow session is required.' });

  const body = (request.body || {}) as Record<string, unknown>;
  const organizationId = typeof body.organizationId === 'string' ? body.organizationId.trim() : '';
  const channelId = typeof body.channelId === 'string' ? body.channelId.trim() : '';
  const requestedMemberIds = uniqueIds(body.memberIds);
  const hasAgentIds = Array.isArray(body.agentIds);
  const requestedAgentIds = uniqueIds(body.agentIds);

  if (!isValidId(organizationId)) return sendJson(response, 400, { error: 'A valid organization id is required.' });
  if (!isValidId(channelId)) return sendJson(response, 400, { error: 'A valid channel id is required.' });
  if (!Array.isArray(body.memberIds)) return sendJson(response, 400, { error: 'A complete channel member list is required.' });

  const adminHeaders = {
    Authorization: `Bearer ${adminKey}`,
    apikey: adminKey,
    'Content-Type': 'application/json'
  };

  try {
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${accessToken}`, apikey: publishableKey }
    });
    if (!authResponse.ok) return sendJson(response, 401, { error: 'Your DeskFlow session is invalid or expired.' });
    const caller = await authResponse.json() as { id?: string };
    if (!caller.id) return sendJson(response, 401, { error: 'Your DeskFlow account could not be verified.' });

    const channelResponse = await fetch(`${supabaseUrl}/rest/v1/channels?id=eq.${encodeURIComponent(channelId)}&organization_id=eq.${encodeURIComponent(organizationId)}&select=id`, {
      headers: { ...adminHeaders, Accept: 'application/vnd.pgrst.object+json' }
    });
    if (!channelResponse.ok || !await channelResponse.json()) {
      return sendJson(response, 404, { error: 'The channel was not found in this organization.' });
    }

    const callerMembershipResponse = await fetch(`${supabaseUrl}/rest/v1/organization_members?organization_id=eq.${encodeURIComponent(organizationId)}&user_id=eq.${encodeURIComponent(caller.id)}&select=role`, {
      headers: adminHeaders
    });
    if (!callerMembershipResponse.ok) return sendJson(response, 403, { error: 'You are not a member of this organization.' });
    const callerMemberships = await callerMembershipResponse.json() as Array<{ role?: string }>;
    const callerMembership = callerMemberships[0] || null;
    if (!callerMembership?.role) return sendJson(response, 403, { error: 'You are not a member of this organization.' });

    const callerChannelResponse = await fetch(`${supabaseUrl}/rest/v1/channel_members?channel_id=eq.${encodeURIComponent(channelId)}&user_id=eq.${encodeURIComponent(caller.id)}&select=user_id`, {
      headers: adminHeaders
    });
    if (!callerChannelResponse.ok) return sendJson(response, 403, { error: 'Your channel membership could not be verified.' });
    const callerChannelMemberships = await callerChannelResponse.json() as Array<{ user_id?: string }>;
    const callerChannelMembership = callerChannelMemberships[0] || null;
    const canManage = callerMembership.role === 'Super Admin'
      || callerMembership.role === 'Admin'
      || Boolean(callerChannelMembership?.user_id);
    if (!canManage) return sendJson(response, 403, { error: 'Only a channel member or organization admin can manage this channel.' });

    const organizationMembersResponse = await fetch(`${supabaseUrl}/rest/v1/organization_members?organization_id=eq.${encodeURIComponent(organizationId)}&select=user_id`, {
      headers: adminHeaders
    });
    if (!organizationMembersResponse.ok) return sendJson(response, 400, { error: 'The organization members could not be validated.' });
    const organizationMembers = await organizationMembersResponse.json() as Array<{ user_id?: string }>;
    const organizationUserIds = new Set(organizationMembers.map(member => member.user_id).filter((id): id is string => Boolean(id)));
    if (requestedMemberIds.some(id => !organizationUserIds.has(id))) {
      return sendJson(response, 400, { error: 'One or more selected users do not belong to this organization.' });
    }

    if (hasAgentIds) {
      const agentsResponse = requestedAgentIds.length
        ? await fetch(`${supabaseUrl}/rest/v1/agents?organization_id=eq.${encodeURIComponent(organizationId)}&id=in.(${requestedAgentIds.map(encodeURIComponent).join(',')})&select=id`, {
          headers: adminHeaders
        })
        : null;
      if (agentsResponse && !agentsResponse.ok) return sendJson(response, 400, { error: 'The channel agents could not be validated.' });
      const organizationAgents = agentsResponse ? await agentsResponse.json() as Array<{ id?: string }> : [];
      const organizationAgentIds = new Set(organizationAgents.map(agent => agent.id).filter((id): id is string => Boolean(id)));
      if (requestedAgentIds.some(id => !organizationAgentIds.has(id))) {
        return sendJson(response, 400, { error: 'One or more selected agents do not belong to this organization.' });
      }
    }

    const existingMembersResponse = await fetch(`${supabaseUrl}/rest/v1/channel_members?channel_id=eq.${encodeURIComponent(channelId)}&select=user_id`, {
      headers: adminHeaders
    });
    if (!existingMembersResponse.ok) throw new Error('Unable to read the current channel members.');
    const existingMembers = await existingMembersResponse.json() as Array<{ user_id?: string }>;
    const existingMemberIds = new Set(existingMembers.map(member => member.user_id).filter((id): id is string => Boolean(id)));
    const requestedMemberSet = new Set(requestedMemberIds);
    const additions = requestedMemberIds.filter(id => !existingMemberIds.has(id));
    const deletions = [...existingMemberIds].filter(id => !requestedMemberSet.has(id));

    if (additions.length) {
      const insertResponse = await fetch(`${supabaseUrl}/rest/v1/channel_members?on_conflict=channel_id,user_id`, {
        method: 'POST',
        headers: { ...adminHeaders, Prefer: 'resolution=ignore-duplicates,return=minimal' },
        body: JSON.stringify(additions.map(userId => ({ channel_id: channelId, user_id: userId })))
      });
      if (!insertResponse.ok) throw new Error((await insertResponse.text()) || 'Unable to add channel members.');
    }

    if (deletions.length) {
      const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/channel_members?channel_id=eq.${encodeURIComponent(channelId)}&user_id=in.(${deletions.map(encodeURIComponent).join(',')})`, {
        method: 'DELETE',
        headers: { ...adminHeaders, Prefer: 'return=minimal' }
      });
      if (!deleteResponse.ok) throw new Error((await deleteResponse.text()) || 'Unable to remove channel members.');
    }

    const verifyResponse = await fetch(`${supabaseUrl}/rest/v1/channel_members?channel_id=eq.${encodeURIComponent(channelId)}&select=user_id`, {
      headers: adminHeaders
    });
    if (!verifyResponse.ok) throw new Error('Unable to verify the saved channel members.');
    const verifiedMembers = await verifyResponse.json() as Array<{ user_id?: string }>;
    const verifiedIds = new Set(verifiedMembers.map(member => member.user_id).filter((id): id is string => Boolean(id)));
    if (verifiedIds.size !== requestedMemberSet.size || [...requestedMemberSet].some(id => !verifiedIds.has(id))) {
      throw new Error('The saved channel membership did not match the requested members.');
    }

    let verifiedAgentIds: string[] = [];
    if (hasAgentIds) {
      const existingAgentsResponse = await fetch(`${supabaseUrl}/rest/v1/channel_agents?channel_id=eq.${encodeURIComponent(channelId)}&select=agent_id`, {
        headers: adminHeaders
      });
      if (!existingAgentsResponse.ok) throw new Error('Unable to read the current channel agents.');
      const existingAgents = await existingAgentsResponse.json() as Array<{ agent_id?: string }>;
      const existingAgentIds = new Set(existingAgents.map(agent => agent.agent_id).filter((id): id is string => Boolean(id)));
      const requestedAgentSet = new Set(requestedAgentIds);
      const agentAdditions = requestedAgentIds.filter(id => !existingAgentIds.has(id));
      const agentDeletions = [...existingAgentIds].filter(id => !requestedAgentSet.has(id));

      if (agentAdditions.length) {
        const insertAgentsResponse = await fetch(`${supabaseUrl}/rest/v1/channel_agents?on_conflict=channel_id,agent_id`, {
          method: 'POST',
          headers: { ...adminHeaders, Prefer: 'resolution=ignore-duplicates,return=minimal' },
          body: JSON.stringify(agentAdditions.map(agentId => ({ channel_id: channelId, agent_id: agentId })))
        });
        if (!insertAgentsResponse.ok) throw new Error((await insertAgentsResponse.text()) || 'Unable to add channel agents.');
      }

      if (agentDeletions.length) {
        const deleteAgentsResponse = await fetch(`${supabaseUrl}/rest/v1/channel_agents?channel_id=eq.${encodeURIComponent(channelId)}&agent_id=in.(${agentDeletions.map(encodeURIComponent).join(',')})`, {
          method: 'DELETE',
          headers: { ...adminHeaders, Prefer: 'return=minimal' }
        });
        if (!deleteAgentsResponse.ok) throw new Error((await deleteAgentsResponse.text()) || 'Unable to remove channel agents.');
      }

      const verifyAgentsResponse = await fetch(`${supabaseUrl}/rest/v1/channel_agents?channel_id=eq.${encodeURIComponent(channelId)}&select=agent_id`, {
        headers: adminHeaders
      });
      if (!verifyAgentsResponse.ok) throw new Error('Unable to verify the saved channel agents.');
      const verifiedAgents = await verifyAgentsResponse.json() as Array<{ agent_id?: string }>;
      verifiedAgentIds = verifiedAgents.map(agent => agent.agent_id).filter((id): id is string => Boolean(id));
      if (verifiedAgentIds.length !== requestedAgentSet.size || [...requestedAgentSet].some(id => !verifiedAgentIds.includes(id))) {
        throw new Error('The saved channel agent membership did not match the requested agents.');
      }
    }

    return sendJson(response, 200, { success: true, memberIds: [...verifiedIds], ...(hasAgentIds ? { agentIds: verifiedAgentIds } : {}) });
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : 'The server could not save channel membership.';
    return sendJson(response, 502, { error: message.slice(0, 500) });
  }
}
