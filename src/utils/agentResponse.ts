import { WorkspaceAgent, Message, Channel, Organization, WorkspaceUser } from '../context';
import { supabase } from '../lib/supabase';

export interface AgentConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
}

interface ResponsesApiResponse {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
}

const readLocalStorageJson = (key: string): unknown => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const formatWorkspaceData = (value: unknown): string => {
  if (!value) return 'No organization records are available.';
  return JSON.stringify(value).slice(0, 12000);
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const shouldUseWebSearch = (prompt: string): boolean => {
  const normalizedPrompt = prompt.trim().toLowerCase();
  if (!normalizedPrompt) return false;
  return /\b(latest|current|today|tonight|yesterday|recent|news|trending|this week|this month|this year|right now|price|pricing|cost|version|release|更新|أحدث|حالي|اليوم|الأخبار|سعر|أسعار)\b/.test(normalizedPrompt)
    || /\b(search|research|look up|find online|browse|web|internet|source|sources|cite|citation|according to)\b/.test(normalizedPrompt)
    || /https?:\/\//.test(normalizedPrompt);
};

export const buildWorkspaceLink = (channelId: string, messageId: string, replyId?: string): string => {
  const params = new URLSearchParams({
    view: 'channel',
    channelId,
    messageId
  });
  if (replyId) params.set('replyId', replyId);
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}${pathname}?${params.toString()}`;
};

const matchesUserName = (prompt: string, name: string): boolean => {
  const nameParts = name.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (nameParts.length === 0) return false;
  const fullNamePattern = nameParts.map(escapeRegExp).join('\\s+');
  if (new RegExp(`(^|[^a-z0-9])${fullNamePattern}(?=$|[^a-z0-9])`, 'i').test(prompt)) return true;

  // Also resolve a direct first- or last-name reference such as "ask John".
  return nameParts.some(part => part.length >= 3
    && new RegExp(`(^|[^a-z0-9])${escapeRegExp(part)}(?=$|[^a-z0-9])`, 'i').test(prompt));
};

export const findMentionedWorkspaceUsers = (
  prompt: string,
  users: WorkspaceUser[],
  activeOrganizationId: string | null = null
): WorkspaceUser[] => {
  const scopedUsers = activeOrganizationId
    ? users.filter(user => user.organizationIds?.includes(activeOrganizationId) || user.role === 'Super Admin')
    : users;
  return scopedUsers
    .filter(user => {
      const username = String(user.username || '').replace(/^@/, '').trim();
      const usernameMentioned = username
        ? new RegExp(`(^|[^a-z0-9_])@${escapeRegExp(username)}(?=$|[^a-z0-9_])`, 'i').test(prompt)
        : false;
      return usernameMentioned || matchesUserName(prompt, user.name);
    })
    .sort((a, b) => b.name.length - a.name.length);
};

export const buildAgentWorkspaceContext = (
  agent: WorkspaceAgent,
  messages: Message[] = [],
  channels: Channel[] = [],
  organizations: Organization[] = [],
  users: WorkspaceUser[] = [],
  userStatus = '',
  currentUserId = '',
  activeOrganizationId: string | null = null,
  prompt = ''
): string => {
  const contextParts: string[] = [];
  const databaseAccess = agent.databaseAccess || { organizations: false, publicThreads: false };
  const organizationUsers = activeOrganizationId
    ? users.filter(user => user.organizationIds?.includes(activeOrganizationId) || user.role === 'Super Admin')
    : users;
  const scopedOrganizations = activeOrganizationId
    ? organizations.filter(organization => organization.id === activeOrganizationId)
    : organizations;
  const scopedChannels = activeOrganizationId
    ? channels.filter(channel => !channel.organizationId || channel.organizationId === activeOrganizationId)
    : channels;
  const scopedChannelIds = new Set(scopedChannels.map(channel => channel.id));
  const userDirectory = organizationUsers.map(user => ({
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    title: user.title,
    role: user.role,
    status: user.status || (user.id === currentUserId ? userStatus : undefined),
    isAgent: Boolean(user.isAgent)
  }));

  contextParts.push(`Workspace user directory (general profile data):\n${formatWorkspaceData({ users: userDirectory })}`);

  const mentionedUsers = findMentionedWorkspaceUsers(prompt, organizationUsers, activeOrganizationId).map(user => ({
    id: user.id,
    name: user.name,
    username: user.username,
    mention: user.username ? `@${user.username.replace(/^@/, '')}` : null,
    email: user.email,
    phone: user.phone,
    title: user.title,
    role: user.role,
    status: user.status,
    isAgent: Boolean(user.isAgent)
  }));
  if (mentionedUsers.length > 0) {
    contextParts.push(`People directly mentioned or named in the request (resolved from the workspace directory):\n${formatWorkspaceData({ users: mentionedUsers })}`);
  }

  if (databaseAccess.organizations) {
    const scopeRecords = (value: unknown): unknown => {
      if (!activeOrganizationId || !Array.isArray(value)) return value;
      const recordsWithOrganization = value.filter(record => {
        if (!record || typeof record !== 'object') return false;
        const item = record as Record<string, unknown>;
        return 'organizationId' in item || 'organization_id' in item || 'orgId' in item;
      });
      if (recordsWithOrganization.length === 0) return [];
      return value.filter(record => {
        if (!record || typeof record !== 'object') return true;
        const item = record as Record<string, unknown>;
        const recordOrganizationId = item.organizationId || item.organization_id || item.orgId;
        return !recordOrganizationId || recordOrganizationId === activeOrganizationId;
      });
    };
    const organizationData = {
      workspace: localStorage.getItem('workspace_name') || 'Workspace',
      activeOrganizationId,
      organizations: scopedOrganizations,
      deals: scopeRecords(readLocalStorageJson('demo_crm_deals')),
      leads: scopeRecords(readLocalStorageJson('demo_crm_leads')),
      clients: scopeRecords(readLocalStorageJson('demo_crm_clients'))
    };
    contextParts.push(`Allowed organization and CRM data:\n${formatWorkspaceData(organizationData)}`);
  }

  if (databaseAccess.publicThreads) {
    const publicChannelIds = new Set(scopedChannels.filter(channel => !channel.isPrivate).map(channel => channel.id));
    const publicMessages = (messages || [])
      .filter(message => scopedChannelIds.has(message.channelId) && publicChannelIds.has(message.channelId))
      .slice(-20)
      .map(message => {
        const channel = scopedChannels.find(candidate => candidate.id === message.channelId);
        const threadLink = buildWorkspaceLink(message.channelId, message.id);
        const replies = (message.replies || []).slice(-5).map(reply => {
          const replyLink = buildWorkspaceLink(message.channelId, message.id, reply.id);
          return `  Reply by ${users.find(user => user.id === reply.senderId)?.name || 'Workspace member'}: ${reply.text}\n  Comment link: ${replyLink}`;
        }).join('\n');
        return `Thread in #${channel?.name || message.channelId}\nThread link: ${threadLink}\nParent message: ${message.text}${replies ? `\n${replies}` : ''}`;
      })
      .join('\n');
    contextParts.push(`Allowed public channel threads:\n${publicMessages || 'No public thread records are available.'}`);
  }

  return contextParts.join('\n\n') || 'No workspace data is available to this agent.';
};

const extractContent = (response: ChatCompletionResponse): string => {
  const content = response.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) return content.map(part => part.text || '').join('').trim();
  return '';
};

const extractResponsesContent = (response: ResponsesApiResponse): string => {
  if (typeof response.output_text === 'string') return response.output_text.trim();
  return (response.output || [])
    .flatMap(item => item.content || [])
    .map(part => part.text || '')
    .join('')
    .trim();
};

const isOpenAIProvider = (baseUrl: string): boolean => {
  try {
    return new URL(baseUrl).hostname === 'api.openai.com';
  } catch {
    return false;
  }
};

const isDeepSeekProvider = (baseUrl: string): boolean => {
  try {
    return new URL(baseUrl).hostname === 'api.deepseek.com';
  } catch {
    return false;
  }
};

const normalizeModel = (model: string): string => model.trim().toLowerCase().replace(/_/g, '-');

const getApiRoot = (baseUrl: string): string => baseUrl.replace(/\/(?:chat\/completions|responses)\/?$/, '');

const PROXY_TIMEOUT_MS = 30_000;

const readProviderError = async (response: Response): Promise<string> => {
  try {
    const errorData = await response.clone().json() as { error?: { message?: string }; message?: string };
    return String(errorData.error?.message || errorData.message || '').trim();
  } catch {
    return '';
  }
};

const isUnsupportedWebSearchError = (status: number, detail: string): boolean => {
  if (![400, 404, 422].includes(status)) return false;
  return /web[_ -]?search|unknown (?:field|parameter)|unsupported (?:field|parameter|option)|unrecognized (?:field|parameter)/i.test(detail);
};

const formatProviderFailure = (agent: WorkspaceAgent, model: string, response: Response, detail: string): string => {
  if (response.status === 429) {
    const retryAfter = response.headers.get('retry-after');
    const retryText = retryAfter ? ` Retry after ${retryAfter}.` : ' Please wait briefly before trying again.';
    const quotaText = /quota|billing|credits?|balance|insufficient/i.test(detail)
      ? ' The configured provider account has no available quota or billing credit.'
      : ' The configured AI provider rate-limited this request.';
    return `⚠️ ${agent.name} could not respond.${quotaText}${retryText}${detail ? ` Provider message: ${detail}` : ''}`;
  }
  return `⚠️ ${agent.name} could not complete the request through ${model} (${response.status}).${detail ? ` ${detail}` : ''}`;
};

const requestProvider = async (
  endpoint: string,
  apiKey: string,
  payload: Record<string, unknown>,
  signal?: AbortSignal
): Promise<Response> => {
  const controller = new AbortController();
  let timedOut = false;
  const abortFromCaller = () => controller.abort();
  signal?.addEventListener('abort', abortFromCaller, { once: true });
  const timeout = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, PROXY_TIMEOUT_MS);

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Your DeskFlow session has expired. Sign in again.');
    return await fetch('/api/agent-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ endpoint, apiKey, payload }),
      signal: controller.signal
    });
  } catch (error) {
    if (timedOut && !signal?.aborted) throw new Error('The agent provider request timed out.');
    throw error;
  } finally {
    window.clearTimeout(timeout);
    signal?.removeEventListener('abort', abortFromCaller);
  }
};

const removeAgentNamePrefix = (content: string, agent: WorkspaceAgent): string => {
  const possibleNames = [agent.name, agent.username]
    .map(value => String(value || '').trim().replace(/^@/, ''))
    .filter(Boolean);
  if (possibleNames.length === 0) return content.trim();

  const namesPattern = possibleNames.map(escapeRegExp).join('|');
  // Models sometimes imitate the transcript format and return "Agent Name: ...".
  return content.trim().replace(new RegExp(`^(?:@?(?:${namesPattern}))\\s*(?::|-|—)\\s*`, 'i'), '').trim();
};

export const containsAgentMention = (text: string, username: string): boolean => {
  const normalizedUsername = username.trim().replace(/^@/, '');
  if (!normalizedUsername) return false;

  // Allow punctuation after a mention while preventing partial username matches.
  const mentionPattern = new RegExp(`(^|[^a-zA-Z0-9_])@${escapeRegExp(normalizedUsername)}(?=$|[^a-zA-Z0-9_])`, 'i');
  return mentionPattern.test(text);
};

export const requestAgentReply = async (
  agent: WorkspaceAgent,
  prompt: string,
  workspaceContext: string,
  fallback: string,
  conversationHistory: AgentConversationMessage[] = [],
  signal?: AbortSignal
): Promise<string> => {
  try {
    const apiKey = String(agent.apiKey || '').trim();
    if (!apiKey) return `⚠️ ${agent.name} is not configured with an API key. Ask a Super Admin to add one in Workspace Settings.`;

    const configuredBaseUrl = String(agent.apiBaseUrl || '').trim().replace(/\/+$/, '');
    if (!configuredBaseUrl) return `⚠️ ${agent.name} is missing an API base URL. Ask a Super Admin to check this agent's settings.`;
    const apiRoot = getApiRoot(configuredBaseUrl);
    const endpoint = `${apiRoot}/chat/completions`;
    const model = String(agent.model || 'gpt-4o-mini');
    const normalizedModel = normalizeModel(model);
    const requestedWebSearch = Boolean(agent.databaseAccess?.webSearch) && shouldUseWebSearch(prompt);
    const canUseHostedWebSearch = isOpenAIProvider(apiRoot)
      || (isDeepSeekProvider(apiRoot) && normalizedModel === 'deepseek-v4-flash');
    const webSearchUnavailable = requestedWebSearch && isDeepSeekProvider(apiRoot) && normalizedModel !== 'deepseek-v4-flash';
    const searchInstruction = requestedWebSearch && canUseHostedWebSearch
      ? ' Live web search is enabled and must be used for this request. Cite the sources you actually consulted.'
      : webSearchUnavailable
        ? ' Live web search is not supported by this provider/model. Do not claim that you searched the web or invent citations; clearly say that live search is unavailable if the request depends on current information.'
        : '';
    const systemContent = `You are ${String(agent.name || 'Workspace Agent')}, an AI teammate in a DeskFlow-style workspace.\nJob details: ${String(agent.jobDetails || '')}\nPersonality and response style: ${String(agent.personality || '')}\nAnswer the latest user request directly. Do not repeat an earlier answer verbatim; use the conversation history only for relevant context. If the latest request changes topic, follow the latest request. Use only the workspace context supplied below. Do not claim access to data that is not present. Continue the conversation using the supplied history; do not answer as if this is an unrelated question. Return only the message body; do not prefix it with your name, username, role, or labels such as "${String(agent.name || 'Workspace Agent')}:". If the request is about a supplied thread, include its exact Thread link or Comment link in your answer. When the request names or asks another teammate to investigate something, resolve that person from the supplied workspace directory and mention them with their exact mention handle (for example @username); never invent a handle.${searchInstruction}\n\n${workspaceContext}`;
    const messages = [
      { role: 'system' as const, content: systemContent },
      ...conversationHistory,
      { role: 'user' as const, content: prompt }
    ];
    // OpenAI's current browsing interface is the Responses API tool. Require
    // the tool for a request that explicitly needs current/external data so a
    // model cannot silently answer from memory without searching.
    if (requestedWebSearch && canUseHostedWebSearch) {
      const responsesResponse = await requestProvider(`${apiRoot}/responses`, apiKey, {
        model,
        input: messages,
        tools: [{ type: 'web_search' }],
        tool_choice: isDeepSeekProvider(apiRoot) ? { type: 'web_search' } : 'required'
      }, signal);
      if (responsesResponse.ok) {
        const data = await responsesResponse.json() as ResponsesApiResponse;
        const content = extractResponsesContent(data);
        if (content) return removeAgentNamePrefix(content, agent);
        return `${fallback}\n\n⚠️ The web-search provider returned no answer for this request.`;
      }
      const providerDetail = await readProviderError(responsesResponse);
      if (responsesResponse.status === 429) return formatProviderFailure(agent, model, responsesResponse, providerDetail);
      return `⚠️ I could not access live web search for this request. The ${model} Responses API request failed (${responsesResponse.status})${providerDetail ? `: ${providerDetail}` : ''}, so I will not present an unsourced answer as live research. Check the provider response, API key, and model capability.`;
    }

    const requestBody: Record<string, unknown> = {
      model,
      temperature: 0.4,
      messages
    };
    // DeepSeek V4 Pro supports Chat Completions, but not hosted web search.
    // Never send OpenAI's web_search_options to it; that causes a failed
    // request followed by a misleading generic fallback response.
    if (requestedWebSearch && !webSearchUnavailable && !isDeepSeekProvider(apiRoot)) {
      requestBody.web_search_options = {};
    }

    const request = () => requestProvider(endpoint, apiKey, requestBody, signal);
    let response = await request();

    // Some OpenAI-compatible providers do not recognize web_search_options.
    // Retry only when the provider explicitly reports an unsupported parameter;
    // retrying 429/5xx responses immediately amplifies rate-limit failures.
    let providerDetail = response.ok ? '' : await readProviderError(response);
    if (!response.ok && requestedWebSearch && !webSearchUnavailable && isUnsupportedWebSearchError(response.status, providerDetail)) {
      delete requestBody.web_search_options;
      response = await request();
      providerDetail = response.ok ? '' : await readProviderError(response);
    }
    if (!response.ok) return formatProviderFailure(agent, model, response, providerDetail);
    const data = await response.json() as ChatCompletionResponse;
    const content = removeAgentNamePrefix(extractContent(data), agent);
    if (!content) return `⚠️ ${agent.name} returned an empty response. Please try again or check the agent's provider settings.`;
    return webSearchUnavailable
      ? `${content}\n\n⚠️ Live web search is unavailable for ${model}. DeepSeek V4 Pro currently supports Chat Completions but not the hosted web-search tool; use DeepSeek V4 Flash or a web-search-capable provider for current web research.`
      : content;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    return `⚠️ ${agent.name} could not reach its provider. Check the API base URL, API key, model name, and network connection, then try again.`;
  }
};
