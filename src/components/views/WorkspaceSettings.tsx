import { 
  Plus, Edit2, Trash2, Users, Hash, Shield, Briefcase, Mail, Check, X, Phone, UserCheck, 
  AlertCircle, MessageCircle, Instagram, Facebook, Link as LinkIcon, Activity, Key, 
  Copy, RefreshCw, Lock, Server, CheckCircle2, Bot, Globe, Building2
} from 'lucide-react';
import React, { useRef, useState, useEffect } from 'react';
import { useWorkspace, WorkspaceAgent, Channel, WorkspaceUser, Organization } from '../../context';

interface IntegrationPlatform {
  id: 'whatsapp' | 'facebook' | 'instagram' | 'messenger';
  name: string;
  desc: string;
  icon: any;
  color: string;
  bg: string;
  webhookUrl: string;
  status: 'connected' | 'disconnected' | 'pending';
  appId?: string;
  apiToken?: string;
  verifyToken?: string;
}

const isDeepSeekV4ProConfiguration = (baseUrl: string, model: string): boolean => {
  try {
    return new URL(baseUrl).hostname === 'api.deepseek.com'
      && model.trim().toLowerCase().replace(/_/g, '-') === 'deepseek-v4-pro';
  } catch {
    return false;
  }
};

const initialSocialIntegrations: IntegrationPlatform[] = [
  { 
    id: 'whatsapp', 
    name: 'WhatsApp Business API', 
    desc: 'Connect Meta Cloud API to send & receive WhatsApp DMs across your workspace', 
    icon: MessageCircle, 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-500/10',
    webhookUrl: 'https://ais-dev-6fx4ugxtxd2hcd5plwflpj-73163646668.europe-west2.run.app/api/webhooks/whatsapp',
    status: 'connected',
    appId: 'WA_BIZ_9948271',
    apiToken: 'EAAG...wx98',
    verifyToken: 'Demo Company_whatsapp_verify_secret'
  },
  { 
    id: 'instagram', 
    name: 'Instagram Graph API', 
    desc: 'Manage Instagram DMs, mentions, and story replies directly from Omnichannel inbox', 
    icon: Instagram, 
    color: 'text-pink-400', 
    bg: 'bg-pink-500/10',
    webhookUrl: 'https://ais-dev-6fx4ugxtxd2hcd5plwflpj-73163646668.europe-west2.run.app/api/webhooks/instagram',
    status: 'connected',
    appId: 'IG_GRAPH_44102',
    apiToken: 'EAAG...ig02',
    verifyToken: 'Demo Company_instagram_verify_secret'
  },
  { 
    id: 'facebook', 
    name: 'Facebook Page Graph API', 
    desc: 'Receive & reply to messages sent to your official Facebook Page', 
    icon: Facebook, 
    color: 'text-blue-400', 
    bg: 'bg-blue-500/10',
    webhookUrl: 'https://ais-dev-6fx4ugxtxd2hcd5plwflpj-73163646668.europe-west2.run.app/api/webhooks/facebook',
    status: 'disconnected',
    verifyToken: 'Demo Company_fb_verify_secret'
  },
  { 
    id: 'messenger', 
    name: 'Meta Messenger Platform', 
    desc: 'Automate Messenger customer support chats & live agent handover', 
    icon: Facebook, 
    color: 'text-indigo-400', 
    bg: 'bg-indigo-500/10',
    webhookUrl: 'https://ais-dev-6fx4ugxtxd2hcd5plwflpj-73163646668.europe-west2.run.app/api/webhooks/messenger',
    status: 'connected',
    appId: 'MSG_PLAT_10293',
    apiToken: 'EAAG...ms88',
    verifyToken: 'Demo Company_msg_verify_secret'
  }
];

interface AuditLogEntry {
  id: string;
  action: string;
  actor: string;
  target: string;
  timestamp: string;
  ip: string;
  status: 'Success' | 'Failed';
}

const mockAuditLogs: AuditLogEntry[] = [
  { id: 'log_1', action: 'Update Role: Member -> Admin', actor: 'Abdallah Mohamed (Super Admin)', target: 'Esraa Al Barsiky', timestamp: '2026-07-30 01:12:44', ip: '197.55.210.4', status: 'Success' },
  { id: 'log_2', action: 'WhatsApp Webhook Verified', actor: 'System Auto-Vault', target: 'WhatsApp Business API', timestamp: '2026-07-30 00:45:10', ip: '34.140.82.12', status: 'Success' },
  { id: 'log_3', action: 'Created Channel #announcements', actor: 'Abdallah Mohamed (Super Admin)', target: '#announcements', timestamp: '2026-07-29 18:22:00', ip: '197.55.210.4', status: 'Success' },
  { id: 'log_4', action: 'Failed API Token Auth', actor: 'External Webhook Hook', target: 'Facebook Page API', timestamp: '2026-07-29 14:05:12', ip: '52.18.90.11', status: 'Failed' },
];

export function WorkspaceSettingsView() {
  const { workspaceName, setWorkspaceName, channels, setChannels, users, setUsers, organizations, setOrganizations, agents, setAgents, currentUser, activeOrganizationId, adminSetUserPassword, adminCreateUser, adminSaveOrganization, requestPasswordReset } = useWorkspace();
  const isSuperAdmin = currentUser?.role === 'Super Admin';
  
  // Navigation tabs inside Super Admin Workspace Settings
  const [activeTab, setActiveTab] = useState<'general' | 'users' | 'organizations' | 'agents' | 'omnichannel' | 'email' | 'security'>('general');

  // Local state for edits
  const [localName, setLocalName] = useState(workspaceName);
  const [localChannels, setLocalChannels] = useState(channels);
  const [localUsers, setLocalUsers] = useState(users);
  const [isSaved, setIsSaved] = useState(false);

  // Organization management is persisted immediately because membership affects workspace access.
  const [isAddingOrganization, setIsAddingOrganization] = useState(false);
  const [editingOrganizationId, setEditingOrganizationId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState('');
  const [organizationDescription, setOrganizationDescription] = useState('');
  const [organizationLogoUrl, setOrganizationLogoUrl] = useState('');
  const [organizationMemberIds, setOrganizationMemberIds] = useState<string[]>([]);
  const organizationLogoInputRef = useRef<HTMLInputElement>(null);
  const [organizationFormError, setOrganizationFormError] = useState<string | null>(null);
  const [isSavingOrganization, setIsSavingOrganization] = useState(false);

  // Social Integrations State
  const [socialIntegrations, setSocialIntegrations] = useState<IntegrationPlatform[]>(initialSocialIntegrations);
  const [editingSocialIntegration, setEditingSocialIntegration] = useState<IntegrationPlatform | null>(null);

  // Sync to local if they haven't been edited
  useEffect(() => {
    if (localName === workspaceName) {
      setLocalName(workspaceName);
    }
  }, [workspaceName]);

  useEffect(() => {
    const isChannelsEqual = JSON.stringify(localChannels) === JSON.stringify(channels);
    if (isChannelsEqual) {
      setLocalChannels(channels);
    }
  }, [channels]);

  useEffect(() => {
    const isUsersEqual = JSON.stringify(localUsers) === JSON.stringify(users);
    if (isUsersEqual) {
      setLocalUsers(users);
    }
  }, [users]);
  
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelIsPrivate, setNewChannelIsPrivate] = useState(false);
  const [newChannelMemberIds, setNewChannelMemberIds] = useState<string[]>(currentUser ? [currentUser.id] : []);
  const organizationChannelUsers = localUsers.filter(user => {
    if (!activeOrganizationId) return true;
    return user.organizationIds?.includes(activeOrganizationId) || user.role === 'Super Admin';
  });
  const scopedChannels = localChannels.filter(channel => !activeOrganizationId || channel.organizationId === activeOrganizationId);

  // States for adding user
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserTitle, setNewUserTitle] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState('Member');
  const [newUserChannels, setNewUserChannels] = useState<string[]>([]);
  const [userAddedSuccessToast, setUserAddedSuccessToast] = useState<string | null>(null);
  const [addUserValidationError, setAddUserValidationError] = useState<string | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const [isAddingAgent, setIsAddingAgent] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [agentFormError, setAgentFormError] = useState<string | null>(null);
  const [agentName, setAgentName] = useState('');
  const [agentUsername, setAgentUsername] = useState('');
  const [agentEmail, setAgentEmail] = useState('');
  const [agentModel, setAgentModel] = useState('gpt-4o-mini');
  const [agentApiBaseUrl, setAgentApiBaseUrl] = useState('https://api.openai.com/v1');
  const [agentApiKey, setAgentApiKey] = useState('');
  const [agentJobDetails, setAgentJobDetails] = useState('');
  const [agentPersonality, setAgentPersonality] = useState('Helpful, concise, and transparent about uncertainty.');
  const [agentCanReadOrganizations, setAgentCanReadOrganizations] = useState(true);
  const [agentCanReadPublicThreads, setAgentCanReadPublicThreads] = useState(true);
  const [agentCanSearchWeb, setAgentCanSearchWeb] = useState(false);

  const isDirty = 
    localName !== workspaceName ||
    JSON.stringify(localChannels) !== JSON.stringify(channels) ||
    JSON.stringify(localUsers) !== JSON.stringify(users);

  const handleSaveChanges = () => {
    setWorkspaceName(localName.trim());
    setChannels(localChannels);
    setUsers(localUsers);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleDiscardChanges = () => {
    setLocalName(workspaceName);
    setLocalChannels(channels);
    setLocalUsers(users);
  };

  const handleSaveName = () => {
    if (localName.trim()) {
      handleSaveChanges();
    }
  };

  const handleDeleteChannel = (id: string) => {
    const updatedChannels = localChannels.filter(channel => channel.id !== id);
    const updatedUsers = localUsers.map(user => ({
      ...user,
      channelIds: (user.channelIds || []).filter(channelId => channelId !== id)
    }));
    setChannels(updatedChannels);
    setUsers(updatedUsers);
    setLocalChannels(updatedChannels);
    setLocalUsers(updatedUsers);
  };

  const getChannelMemberIds = (channel: Channel, sourceUsers: WorkspaceUser[] = localUsers) => (
    channel.memberIds ?? sourceUsers.filter(user => user.channelIds?.includes(channel.id)).map(user => user.id)
  );

  const synchronizeUserChannelIds = (nextChannels: Channel[], sourceUsers: WorkspaceUser[]) => {
    return sourceUsers.map(user => ({
      ...user,
      channelIds: nextChannels
        .filter(channel => channel.memberIds
          ? channel.memberIds.includes(user.id)
          : user.channelIds?.includes(channel.id))
        .map(channel => channel.id)
    }));
  };

  const toggleChannelMember = (userId: string, editing = false) => {
    if (editing) {
      setEditChannelMemberIds(previous => previous.includes(userId)
        ? previous.filter(id => id !== userId)
        : [...previous, userId]);
      return;
    }
    setNewChannelMemberIds(previous => previous.includes(userId)
      ? previous.filter(id => id !== userId)
      : [...previous, userId]);
  };

  const handleSaveNewChannel = () => {
    const trimmedName = newChannelName.trim();
    if (!trimmedName) return;

    const newChannel: Channel = {
      id: `channel_${Date.now()}`,
      name: trimmedName.toLowerCase().replace(/\s+/g, '-'),
      isPrivate: newChannelIsPrivate,
      organizationId: activeOrganizationId || undefined,
      memberIds: Array.from(new Set(newChannelMemberIds.filter(id => organizationChannelUsers.some(user => user.id === id))))
    };
    const updatedChannels = [...localChannels, newChannel];
    const updatedUsers = synchronizeUserChannelIds(updatedChannels, localUsers);

    // Channel creation is an immediate workspace action, not only a draft setting.
    setChannels(updatedChannels);
    setUsers(updatedUsers);
    setLocalChannels(updatedChannels);
    setLocalUsers(updatedUsers);
    setIsAddingChannel(false);
    setNewChannelName('');
    setNewChannelIsPrivate(false);
    setNewChannelMemberIds(currentUser ? [currentUser.id] : []);
  };

  const synchronizeUserOrganizationIds = (nextOrganizations: Organization[], sourceUsers: WorkspaceUser[]) => {
    return sourceUsers.map(user => ({
      ...user,
      organizationIds: nextOrganizations
        .filter(organization => organization.memberIds.includes(user.id))
        .map(organization => organization.id)
    }));
  };

  const resetOrganizationForm = () => {
    setEditingOrganizationId(null);
    setOrganizationName('');
    setOrganizationDescription('');
    setOrganizationLogoUrl('');
    setOrganizationMemberIds([]);
    setOrganizationFormError(null);
  };

  const startEditOrganization = (organization: Organization) => {
    if (!isSuperAdmin) return;
    setEditingOrganizationId(organization.id);
    setOrganizationName(organization.name);
    setOrganizationDescription(organization.description || '');
    setOrganizationLogoUrl(organization.logoUrl || '');
    setOrganizationMemberIds(organization.memberIds);
    setOrganizationFormError(null);
    setIsAddingOrganization(true);
  };

  const toggleOrganizationMember = (userId: string) => {
    setOrganizationMemberIds(previous => previous.includes(userId)
      ? previous.filter(id => id !== userId)
      : [...previous, userId]);
  };

  const handleOrganizationLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setOrganizationFormError('Please choose a valid image file for the organization logo.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setOrganizationFormError('The organization logo must be 2 MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setOrganizationLogoUrl(reader.result);
        setOrganizationFormError(null);
      }
    };
    reader.onerror = () => setOrganizationFormError('Unable to read this image. Please try another file.');
    reader.readAsDataURL(file);
  };

  const handleSaveOrganization = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isSuperAdmin) {
      setOrganizationFormError('Only Super Admins can create or edit organizations.');
      return;
    }

    const name = organizationName.trim();
    if (!name) {
      setOrganizationFormError('Organization name is required.');
      return;
    }
    if (organizations.some(organization => organization.id !== editingOrganizationId && organization.name.toLowerCase() === name.toLowerCase())) {
      setOrganizationFormError('An organization with this name already exists.');
      return;
    }

    const memberIds: string[] = Array.from(new Set<string>(organizationMemberIds.filter(id => users.some(user => user.id === id))));
    const organizationId = editingOrganizationId || `organization_${Date.now()}`;
    setIsSavingOrganization(true);
    const result = await adminSaveOrganization({
      id: organizationId,
      name,
      description: organizationDescription.trim() || undefined,
      logoUrl: organizationLogoUrl || undefined,
      memberIds
    });
    setIsSavingOrganization(false);
    if (!result.success || !result.organization) {
      setOrganizationFormError(result.error || 'Unable to save this organization.');
      return;
    }

    const savedOrganization = result.organization;
    const updatedOrganizations = organizations.some(organization => organization.id === savedOrganization.id)
      ? organizations.map(organization => organization.id === savedOrganization.id ? savedOrganization : organization)
      : [...organizations, savedOrganization];
    setLocalUsers(synchronizeUserOrganizationIds(updatedOrganizations, localUsers));
    setUserAddedSuccessToast(editingOrganizationId
      ? `${name} was updated successfully.`
      : `${name} was created successfully.`);
    setTimeout(() => setUserAddedSuccessToast(null), 4000);
    resetOrganizationForm();
    setIsAddingOrganization(false);
  };

  const handleDeleteOrganization = (organizationId: string) => {
    if (!isSuperAdmin) return;
    const updatedOrganizations = organizations.filter(organization => organization.id !== organizationId);
    const updatedUsers = synchronizeUserOrganizationIds(updatedOrganizations, localUsers);
    setOrganizations(updatedOrganizations);
    setUsers(updatedUsers);
    setLocalUsers(updatedUsers);
    if (editingOrganizationId === organizationId) {
      resetOrganizationForm();
      setIsAddingOrganization(false);
    }
  };

  const handleDeleteUser = (id: string) => {
    const updatedUsers = users.filter(user => user.id !== id);
    const updatedChannels = localChannels.map(channel => channel.memberIds
      ? { ...channel, memberIds: channel.memberIds.filter(memberId => memberId !== id) }
      : channel
    );
    const updatedOrganizations = organizations.map(organization => ({
      ...organization,
      memberIds: organization.memberIds.filter(memberId => memberId !== id)
    }));
    setOrganizations(updatedOrganizations);
    setChannels(updatedChannels);
    setUsers(updatedUsers);
    setLocalChannels(updatedChannels);
    setLocalUsers(updatedUsers);
  };

  const handleSaveNewUser = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAddUserValidationError(null);

    const firstName = newUserFirstName.trim();
    const lastName = newUserLastName.trim();
    const fullName = lastName ? `${firstName} ${lastName}` : firstName;
    const email = newUserEmail.trim();

    if (!firstName) {
      setAddUserValidationError('First Name is required.');
      return;
    }

    if (!email) {
      setAddUserValidationError('Email address is required.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setAddUserValidationError('Please enter a valid email address.');
      return;
    }

    if (!activeOrganizationId) {
      setAddUserValidationError('Select an organization before adding a user.');
      return;
    }

    setIsCreatingUser(true);
    const result = await adminCreateUser({
      name: fullName,
      email,
      title: newUserTitle.trim() || undefined,
      phone: newUserPhone.trim() || undefined,
      role: newUserRole,
      channelIds: newUserRole === 'Member' ? newUserChannels : scopedChannels.map(channel => channel.id),
      username: email.split('@')[0] || firstName.toLowerCase(),
      organizationId: activeOrganizationId
    });
    setIsCreatingUser(false);
    if (!result.success || !result.user) {
      setAddUserValidationError(result.error || 'Unable to add this user.');
      return;
    }

    const newUser = result.user;
    const updatedUsers = [...users.filter(user => user.id !== newUser.id), newUser];
    const assignedChannelIds = new Set(newUser.channelIds || []);
    const updatedChannels = localChannels.map(channel => assignedChannelIds.has(channel.id)
      ? { ...channel, memberIds: Array.from(new Set([...(channel.memberIds || []), newUser.id])) }
      : channel
    );
    const updatedOrganizations = organizations.map(organization => organization.id === activeOrganizationId
      ? { ...organization, memberIds: Array.from(new Set([...organization.memberIds, newUser.id])) }
      : organization
    );
    setOrganizations(updatedOrganizations);
    setChannels(updatedChannels);
    setUsers(updatedUsers);
    setLocalChannels(updatedChannels);
    setLocalUsers(updatedUsers);

    setUserAddedSuccessToast(`User ${fullName} (${email}) was created. Set their initial password from Manage password.`);
    setTimeout(() => setUserAddedSuccessToast(null), 5000);

    setIsAddingUser(false);
    setNewUserFirstName('');
    setNewUserLastName('');
    setNewUserEmail('');
    setNewUserTitle('');
    setNewUserPhone('');
    setNewUserRole('Member');
    setNewUserChannels([]);
  };

  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editChannelName, setEditChannelName] = useState('');
  const [editChannelIsPrivate, setEditChannelIsPrivate] = useState(false);
  const [editChannelMemberIds, setEditChannelMemberIds] = useState<string[]>([]);

  const startEditChannel = (channel: Channel) => {
    setEditingChannelId(channel.id);
    setEditChannelName(channel.name);
    setEditChannelIsPrivate(channel.isPrivate);
    setEditChannelMemberIds(getChannelMemberIds(channel));
  };

  const saveEditChannel = () => {
    if (editChannelName.trim() && editingChannelId) {
      const updatedChannels = localChannels.map(channel =>
        channel.id === editingChannelId
          ? {
              ...channel,
              name: editChannelName.trim().toLowerCase().replace(/\s+/g, '-'),
              isPrivate: editChannelIsPrivate,
              memberIds: Array.from(new Set(editChannelMemberIds.filter(id => organizationChannelUsers.some(user => user.id === id))))
            }
          : channel
      );
      const updatedUsers = synchronizeUserChannelIds(updatedChannels, localUsers);
      setChannels(updatedChannels);
      setUsers(updatedUsers);
      setLocalChannels(updatedChannels);
      setLocalUsers(updatedUsers);
      setEditingChannelId(null);
    }
  };

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserTitle, setEditUserTitle] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserRole, setEditUserRole] = useState('');
  const [editUserChannels, setEditUserChannels] = useState<string[]>([]);
  const [passwordTargetUser, setPasswordTargetUser] = useState<WorkspaceUser | null>(null);
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState<string | null>(null);
  const [adminResetLink, setAdminResetLink] = useState<string | null>(null);

  const startEditUser = (user: any) => {
    setEditingUserId(user.id);
    setEditUserName(user.name);
    setEditUserEmail(user.email);
    setEditUserTitle(user.title || '');
    setEditUserPhone(user.phone || '');
    setEditUserRole(user.role);
    setEditUserChannels(user.channelIds || []);
  };

  const saveEditUser = () => {
    if (editUserName.trim() && editUserEmail.trim() && editingUserId) {
      const updatedUsers = localUsers.map(user =>
        user.id === editingUserId
          ? { ...user, name: editUserName.trim(), email: editUserEmail.trim(), title: editUserTitle.trim(), phone: editUserPhone.trim(), role: editUserRole, channelIds: editUserChannels }
          : user
      );
      const updatedChannels = localChannels.map(channel => channel.memberIds
        ? {
            ...channel,
            memberIds: editUserChannels.includes(channel.id)
              ? Array.from(new Set([...channel.memberIds, editingUserId]))
              : channel.memberIds.filter(memberId => memberId !== editingUserId)
          }
        : channel
      );
      setChannels(updatedChannels);
      setUsers(updatedUsers);
      setLocalChannels(updatedChannels);
      setLocalUsers(updatedUsers);
      setEditingUserId(null);
    }
  };

  const openPasswordManager = (user: WorkspaceUser) => {
    if (!isSuperAdmin || user.isAgent) return;
    setPasswordTargetUser(user);
    setAdminNewPassword('');
    setAdminConfirmPassword('');
    setAdminPasswordError(null);
    setAdminResetLink(null);
  };

  const closePasswordManager = () => {
    setPasswordTargetUser(null);
    setAdminNewPassword('');
    setAdminConfirmPassword('');
    setAdminPasswordError(null);
    setAdminResetLink(null);
  };

  const handleAdminSetPassword = async () => {
    if (!passwordTargetUser) return;
    setAdminPasswordError(null);
    setAdminResetLink(null);
    if (adminNewPassword !== adminConfirmPassword) {
      setAdminPasswordError('Passwords do not match.');
      return;
    }
    const result = await adminSetUserPassword(passwordTargetUser.id, adminNewPassword);
    if (!result.success) {
      setAdminPasswordError(result.error || 'Unable to set this password.');
      return;
    }
    setUserAddedSuccessToast(`Password updated for ${passwordTargetUser.name}.`);
    setTimeout(() => setUserAddedSuccessToast(null), 4000);
    closePasswordManager();
  };

  const handleAdminCreateResetLink = async () => {
    if (!passwordTargetUser) return;
    setAdminPasswordError(null);
    const result = await requestPasswordReset(passwordTargetUser.email);
    if (!result.success) {
      setAdminPasswordError(result.error || 'Unable to create a reset link.');
      return;
    }
    setAdminResetLink(result.link || null);
  };

  const copyAdminResetLink = async () => {
    if (!adminResetLink) return;
    await navigator.clipboard?.writeText(adminResetLink);
    setUserAddedSuccessToast('Reset link copied to your clipboard.');
    setTimeout(() => setUserAddedSuccessToast(null), 4000);
  };

  const openAdminEmailDraft = () => {
    if (!passwordTargetUser || !adminResetLink) return;
    const subject = encodeURIComponent('Reset your workspace password');
    const body = encodeURIComponent(`Use this link to reset your workspace password:\n\n${adminResetLink}\n\nThis link expires in 30 minutes and can only be used once.`);
    window.location.href = `mailto:${encodeURIComponent(passwordTargetUser.email)}?subject=${subject}&body=${body}`;
  };

  const toggleUserChannel = (channelId: string) => {
    setEditUserChannels(prev => 
      prev.includes(channelId) 
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

  const toggleNewUserChannel = (channelId: string) => {
    setNewUserChannels(prev =>
      prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

  const resetAgentForm = () => {
    setEditingAgentId(null);
    setAgentName('');
    setAgentUsername('');
    setAgentEmail('');
    setAgentModel('gpt-4o-mini');
    setAgentApiBaseUrl('https://api.openai.com/v1');
    setAgentApiKey('');
    setAgentJobDetails('');
    setAgentPersonality('Helpful, concise, and transparent about uncertainty.');
    setAgentCanReadOrganizations(true);
    setAgentCanReadPublicThreads(true);
    setAgentCanSearchWeb(false);
    setAgentFormError(null);
  };

  const handleCreateAgent = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isSuperAdmin) {
      setAgentFormError('Only Super Admins can create or edit agents.');
      return;
    }

    const name = agentName.trim();
    const username = agentUsername.trim().replace(/^@/, '').toLowerCase();
    const email = agentEmail.trim();
    const model = agentModel.trim();
    const enteredApiKey = agentApiKey.trim();
    const existingAgent = editingAgentId ? agents.find(agent => agent.id === editingAgentId) : undefined;
    const apiKey = enteredApiKey || existingAgent?.apiKey || '';

    if (!name || !username || !email || !model || !agentJobDetails.trim() || !agentPersonality.trim()) {
      setAgentFormError('Name, username, email, model name, job details, and personality are required.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setAgentFormError('Enter a valid agent email address.');
      return;
    }
    if (!apiKey) {
      setAgentFormError('Add an OpenAI-compatible API key to connect this agent.');
      return;
    }
    if (agents.some(agent => agent.id !== editingAgentId && (agent.username === username || agent.email.toLowerCase() === email.toLowerCase()))) {
      setAgentFormError('Agent username and email must be unique.');
      return;
    }

    const updatedAgent: WorkspaceAgent = {
      id: editingAgentId || `agent_${Date.now()}`,
      name,
      username,
      email,
      model,
      apiBaseUrl: agentApiBaseUrl.trim() || 'https://api.openai.com/v1',
      apiKey,
      jobDetails: agentJobDetails.trim(),
      personality: agentPersonality.trim(),
      databaseAccess: {
        organizations: agentCanReadOrganizations,
        publicThreads: agentCanReadPublicThreads,
        webSearch: agentCanSearchWeb
      },
      enabled: existingAgent?.enabled ?? true,
      createdAt: existingAgent?.createdAt ?? Date.now()
    };

    setAgents(previous => editingAgentId
      ? previous.map(agent => agent.id === editingAgentId ? updatedAgent : agent)
      : [...previous, updatedAgent]
    );
    if (!editingAgentId && activeOrganizationId) {
      setOrganizations(previous => previous.map(organization => organization.id === activeOrganizationId
        ? { ...organization, memberIds: Array.from(new Set([...organization.memberIds, updatedAgent.id])) }
        : organization
      ));
    }
    setUserAddedSuccessToast(editingAgentId
      ? `${name} settings were updated successfully.`
      : `${name} is ready. It can now receive DMs and respond to @${username} mentions.`
    );
    setTimeout(() => setUserAddedSuccessToast(null), 5000);
    resetAgentForm();
    setIsAddingAgent(false);
  };

  const startEditAgent = (agent: WorkspaceAgent) => {
    if (!isSuperAdmin) return;
    setEditingAgentId(agent.id);
    setAgentName(agent.name);
    setAgentUsername(agent.username);
    setAgentEmail(agent.email);
    setAgentModel(agent.model || 'gpt-4o-mini');
    setAgentApiBaseUrl(agent.apiBaseUrl);
    setAgentApiKey('');
    setAgentJobDetails(agent.jobDetails);
    setAgentPersonality(agent.personality);
    setAgentCanReadOrganizations(agent.databaseAccess.organizations);
    setAgentCanReadPublicThreads(agent.databaseAccess.publicThreads);
    setAgentCanSearchWeb(Boolean(agent.databaseAccess.webSearch));
    setAgentFormError(null);
    setIsAddingAgent(true);
  };

  const toggleAgentEnabled = (agentId: string) => {
    setAgents(previous => previous.map(agent => agent.id === agentId ? { ...agent, enabled: !agent.enabled } : agent));
  };

  const deleteAgent = (agentId: string) => {
    if (!isSuperAdmin) return;
    const updatedOrganizations = organizations.map(organization => ({
      ...organization,
      memberIds: organization.memberIds.filter(memberId => memberId !== agentId)
    }));
    const updatedUsers = localUsers.filter(user => user.id !== agentId);
    setOrganizations(updatedOrganizations);
    setUsers(updatedUsers);
    setLocalUsers(updatedUsers);
    setAgents(previous => previous.filter(agent => agent.id !== agentId));
  };

  const toggleSocialStatus = (id: string) => {
    setSocialIntegrations(socialIntegrations.map(s => {
      if (s.id === id) {
        return { ...s, status: s.status === 'connected' ? 'disconnected' : 'connected' };
      }
      return s;
    }));
  };

  return (
    <div className="flex-1 bg-[#1A1D21] flex flex-col h-full text-gray-200 overflow-y-auto">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-800/80 bg-[#121317]">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center">
              <Shield className="h-6 w-6 mr-2.5 text-blue-500" />
              Central Super Admin & Integration Governance Control
            </h2>
            <p className="text-xs text-gray-400 mt-1">Manage all workspace settings, omnichannel API webhooks, RBAC users, and security logs in one unified portal.</p>
          </div>
        </div>

        {/* Unified Governance Navigation Bar */}
        <div className="flex space-x-2 border-b border-gray-800/60 pb-1 overflow-x-auto custom-scrollbar text-xs font-semibold">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded-lg transition cursor-pointer flex items-center space-x-2 shrink-0 ${
              activeTab === 'general' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            <span>Workspace & Channels</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg transition cursor-pointer flex items-center space-x-2 shrink-0 ${
              activeTab === 'users' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Team & Role Governance (RBAC)</span>
          </button>

          <button
            onClick={() => setActiveTab('organizations')}
            className={`px-4 py-2 rounded-lg transition cursor-pointer flex items-center space-x-2 shrink-0 ${
              activeTab === 'organizations' ? 'bg-cyan-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }}`}
          >
            <Building2 className="h-4 w-4 text-cyan-300" />
            <span>Organizations</span>
            <span className="text-[10px] bg-gray-800/80 px-1.5 py-0.5 rounded-full">{organizations.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('agents')}
            className={`px-4 py-2 rounded-lg transition cursor-pointer flex items-center space-x-2 shrink-0 ${
              activeTab === 'agents' ? 'bg-violet-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }}`}
          >
            <Bot className="h-4 w-4 text-violet-300" />
            <span>AI Agents</span>
            <span className="text-[10px] bg-gray-800/80 px-1.5 py-0.5 rounded-full">{agents.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('omnichannel')}
            className={`px-4 py-2 rounded-lg transition cursor-pointer flex items-center space-x-2 shrink-0 ${
              activeTab === 'omnichannel' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <MessageCircle className="h-4 w-4 text-emerald-300" />
            <span>Omnichannel Social & Webhooks</span>
          </button>

          <button
            onClick={() => setActiveTab('email')}
            className={`px-4 py-2 rounded-lg transition cursor-pointer flex items-center space-x-2 shrink-0 ${
              activeTab === 'email' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <Mail className="h-4 w-4" />
            <span>Multi-Account Mail Sync</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-lg transition cursor-pointer flex items-center space-x-2 shrink-0 ${
              activeTab === 'security' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Security & Audit Logs</span>
          </button>
        </div>
      </div>

      <div className="p-6 md:p-8 max-w-6xl mx-auto w-full space-y-8">
        
        {/* TAB 1: GENERAL WORKSPACE & CHANNELS */}
        {activeTab === 'general' && (
          <div className="space-y-8">
            {/* General Settings */}
            <section className="bg-[#121317] border border-gray-800 rounded-2xl p-6">
              <h3 className="text-base font-bold text-white mb-4 flex items-center">
                <Briefcase className="h-5 w-5 mr-2 text-blue-400" /> Workspace Profile
              </h3>
              <div className="max-w-md">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Workspace Name</label>
                <div className="flex space-x-3">
                  <input 
                    type="text" 
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                    className="flex-1 bg-[#1A1D21] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                  <button 
                    onClick={handleSaveName}
                    className={`${isSaved ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-lg font-medium text-xs transition-colors flex items-center shadow-md`}
                  >
                    {isSaved ? <><Check className="h-4 w-4 mr-1.5" /> Saved</> : 'Save Name'}
                  </button>
                </div>
              </div>
            </section>

            {/* Channel Management */}
            <section className="bg-[#121317] border border-gray-800 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center">
                    <Hash className="h-5 w-5 mr-2 text-blue-400" /> Channel Management
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Create, edit, or remove public and private collaboration channels.</p>
                </div>
                <button 
                  onClick={() => setIsAddingChannel(true)}
                  className="flex items-center bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-900/20 cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-1.5" /> New Channel
                </button>
              </div>
              
              <div className="overflow-hidden border border-gray-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1A1D21] text-gray-400 border-b border-gray-800 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3">Channel Name</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Members</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 bg-[#121317]">
                    {isAddingChannel && (
                      <tr className="bg-[#1A1D21]/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <span className="text-gray-500 mr-2">#</span>
                            <input 
                              type="text"
                              autoFocus
                              placeholder="e.g. general-updates"
                              value={newChannelName}
                              onChange={(e) => setNewChannelName(e.target.value)}
                              className="bg-[#121317] border border-gray-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-blue-500 w-full"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select 
                            value={newChannelIsPrivate ? "private" : "public"}
                            onChange={(e) => setNewChannelIsPrivate(e.target.value === "private")}
                            className="bg-[#121317] border border-gray-700 rounded px-2 py-1.5 text-white focus:outline-none focus:border-blue-500"
                          >
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="bg-[#121317] border border-gray-700 rounded-lg p-2 max-h-28 overflow-y-auto space-y-1 min-w-[180px]">
                            {organizationChannelUsers.map(user => (
                              <label key={user.id} className="flex items-center gap-2 text-[11px] text-gray-300 cursor-pointer">
                                <input type="checkbox" checked={newChannelMemberIds.includes(user.id)} onChange={() => toggleChannelMember(user.id)} className="accent-blue-500" />
                                <span className="truncate">{user.isAgent ? '🤖 ' : ''}{user.name}</span>
                              </label>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="flex justify-end space-x-2">
                            <button onClick={handleSaveNewChannel} className="p-1.5 text-green-400 hover:text-green-300 bg-gray-800 rounded transition-colors" title="Save Channel"><Check className="h-4 w-4" /></button>
                            <button onClick={() => setIsAddingChannel(false)} className="p-1.5 text-gray-400 hover:text-white bg-gray-800 rounded transition-colors" title="Cancel"><X className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    )}
                    {scopedChannels.map(channel => (
                      <tr key={channel.id} className="hover:bg-[#1A1D21] transition-colors">
                        {editingChannelId === channel.id ? (
                          <>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <span className="text-gray-500 mr-2">#</span>
                                <input 
                                  type="text"
                                  autoFocus
                                  value={editChannelName}
                                  onChange={(e) => setEditChannelName(e.target.value)}
                                  className="bg-[#121317] border border-gray-700 rounded px-3 py-1.5 text-white focus:outline-none focus:border-blue-500 w-full"
                                />
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <select 
                                value={editChannelIsPrivate ? "private" : "public"}
                                onChange={(e) => setEditChannelIsPrivate(e.target.value === "private")}
                                className="bg-[#121317] border border-gray-700 rounded px-2 py-1.5 text-white focus:outline-none focus:border-blue-500"
                              >
                                <option value="public">Public</option>
                                <option value="private">Private</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 align-top">
                              <div className="bg-[#121317] border border-gray-700 rounded-lg p-2 max-h-28 overflow-y-auto space-y-1 min-w-[180px]">
                                {organizationChannelUsers.map(user => (
                                  <label key={user.id} className="flex items-center gap-2 text-[11px] text-gray-300 cursor-pointer">
                                    <input type="checkbox" checked={editChannelMemberIds.includes(user.id)} onChange={() => toggleChannelMember(user.id, true)} className="accent-blue-500" />
                                    <span className="truncate">{user.isAgent ? '🤖 ' : ''}{user.name}</span>
                                  </label>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 align-top">
                              <div className="flex justify-end space-x-2">
                                <button onClick={saveEditChannel} className="p-1.5 text-green-400 hover:text-green-300 bg-gray-800 rounded transition-colors" title="Save"><Check className="h-4 w-4" /></button>
                                <button onClick={() => setEditingChannelId(null)} className="p-1.5 text-gray-400 hover:text-white bg-gray-800 rounded transition-colors" title="Cancel"><X className="h-4 w-4" /></button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 text-gray-200 font-medium"># {channel.name}</td>
                            <td className="px-6 py-4 text-gray-400">{channel.isPrivate ? 'Private' : 'Public'}</td>
                            <td className="px-6 py-4 text-gray-400">{getChannelMemberIds(channel).length} selected</td>
                            <td className="px-6 py-4 align-top">
                              <div className="flex justify-end space-x-2">
                                <button onClick={() => startEditChannel(channel)} className="p-1.5 text-gray-400 hover:text-white bg-gray-800 rounded transition-colors" title="Rename Channel"><Edit2 className="h-4 w-4" /></button>
                                <button onClick={() => handleDeleteChannel(channel.id)} className="p-1.5 text-gray-400 hover:text-red-500 bg-gray-800 rounded transition-colors" title="Delete Channel"><Trash2 className="h-4 w-4" /></button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: TEAM MEMBERS & RBAC */}
        {activeTab === 'users' && (
          <section className="bg-[#121317] border border-gray-800 rounded-2xl p-6 space-y-4">
            {userAddedSuccessToast && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-lg text-emerald-300 text-xs flex items-center justify-between shadow-lg">
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="font-medium">{userAddedSuccessToast}</span>
                </div>
                <button onClick={() => setUserAddedSuccessToast(null)} className="text-emerald-400 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-400" /> Team & Role-Based Access Control (RBAC)
                </h3>
                <p className="text-xs text-gray-400 mt-1">Assign Super Admin, Admin, and Member roles with channel-level permissions.</p>
              </div>
              <button 
                onClick={() => {
                  setAddUserValidationError(null);
                  setIsAddingUser(true);
                }} 
                className="flex items-center bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-900/20 cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-1.5" /> Invite Member
              </button>
            </div>

            <div className="overflow-hidden border border-gray-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1A1D21] text-gray-400 border-b border-gray-800 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-3 font-medium">Member</th>
                    <th className="px-6 py-3 font-medium">Contact Details</th>
                    <th className="px-6 py-3 font-medium">Role</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 bg-[#121317]">
                  {localUsers.map(user => (
                    <tr key={user.id} className="hover:bg-[#1A1D21] transition-colors">
                      {editingUserId === user.id ? (
                        <>
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              <input 
                                type="text"
                                placeholder="Full Name"
                                value={editUserName}
                                onChange={(e) => setEditUserName(e.target.value)}
                                className="bg-[#121317] border border-gray-700 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500 w-full text-xs font-medium"
                              />
                              <input 
                                type="text"
                                placeholder="Job Title"
                                value={editUserTitle}
                                onChange={(e) => setEditUserTitle(e.target.value)}
                                className="bg-[#121317] border border-gray-700 rounded px-2 py-1 text-gray-300 focus:outline-none focus:border-blue-500 w-full text-xs"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              <input 
                                type="email"
                                placeholder="Email"
                                value={editUserEmail}
                                onChange={(e) => setEditUserEmail(e.target.value)}
                                className="bg-[#121317] border border-gray-700 rounded px-2 py-1 text-gray-300 focus:outline-none focus:border-blue-500 w-full text-xs"
                              />
                              <input 
                                type="tel"
                                placeholder="Phone Number"
                                value={editUserPhone}
                                onChange={(e) => setEditUserPhone(e.target.value)}
                                className="bg-[#121317] border border-gray-700 rounded px-2 py-1 text-gray-300 focus:outline-none focus:border-blue-500 w-full text-xs"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 align-top pt-5">
                            <div className="space-y-3">
                              <select 
                                value={editUserRole}
                                onChange={(e) => setEditUserRole(e.target.value)}
                                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-gray-500 w-full"
                              >
                                <option value="Super Admin">Super Admin</option>
                                <option value="Admin">Admin</option>
                                <option value="Member">Member</option>
                              </select>

                              {editUserRole === 'Member' && (
                                <div className="bg-[#121317] border border-gray-700 rounded p-2 max-h-32 overflow-y-auto w-full">
                                  <p className="text-xs text-gray-400 mb-2 font-medium">Channel Access:</p>
                                  <div className="space-y-1">
                                    {scopedChannels.map(channel => (
                                      <label key={channel.id} className="flex items-center space-x-2 text-xs text-gray-300 cursor-pointer">
                                        <input 
                                          type="checkbox" 
                                          checked={editUserChannels.includes(channel.id)}
                                          onChange={() => toggleUserChannel(channel.id)}
                                          className="rounded bg-gray-800 border-gray-700 text-blue-500 focus:ring-blue-500"
                                        />
                                        <span className="truncate"># {channel.name}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 align-top pt-5">
                            <div className="flex justify-end space-x-2">
                              <button onClick={saveEditUser} className="p-1.5 text-green-400 hover:text-green-300 bg-gray-800 rounded transition-colors" title="Save User"><Check className="h-4 w-4" /></button>
                              <button onClick={() => setEditingUserId(null)} className="p-1.5 text-gray-400 hover:text-white bg-gray-800 rounded transition-colors" title="Cancel"><X className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded bg-gray-700 flex items-center justify-center font-bold text-xs mr-3 shrink-0">
                                {user.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-gray-200 font-medium">{user.name}</p>
                                {user.title && <p className="text-xs text-blue-400 mt-0.5">{user.title}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs text-gray-400 space-y-1">
                              <p className="flex items-center"><Mail className="h-3 w-3 mr-1.5 text-gray-500" />{user.email}</p>
                              {user.phone && <p className="flex items-center"><span className="text-xs mr-1.5">📞</span>{user.phone}</p>}
                            </div>
                          </td>
                          <td className="px-6 py-4 align-top pt-5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium 
                              ${user.role === 'Super Admin' ? 'bg-purple-900/50 text-purple-300' : 
                                user.role === 'Admin' ? 'bg-blue-900/50 text-blue-300' : 
                                'bg-gray-800 text-gray-300'}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 align-top pt-5">
                            <div className="flex justify-end space-x-2">
                              {isSuperAdmin && !user.isAgent && (
                                <button
                                  onClick={() => openPasswordManager(user)}
                                  className="p-1.5 text-gray-400 hover:text-blue-300 bg-gray-800 rounded transition-colors"
                                  title="Manage password"
                                >
                                  <Key className="h-4 w-4" />
                                </button>
                              )}
                              <button 
                                onClick={() => startEditUser(user)}
                                className="p-1.5 text-gray-400 hover:text-white bg-gray-800 rounded transition-colors" 
                                title="Edit User"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 bg-gray-800 rounded transition-colors cursor-pointer" 
                                title="Remove User"
                                disabled={user.role === 'Super Admin' && localUsers.filter(u => u.role === 'Super Admin').length === 1}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 3: ORGANIZATIONS */}
        {activeTab === 'organizations' && (
          <div className="space-y-6">
            <section className="p-6 bg-gradient-to-r from-cyan-950/40 via-[#121317] to-blue-950/30 border border-cyan-500/30 rounded-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2"><Building2 className="h-5 w-5 text-cyan-400" /> Organizations</h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-2xl">Create organizations and control which workspace users and AI agents belong to each one.</p>
                </div>
                {isSuperAdmin && (
                  <button onClick={() => { resetOrganizationForm(); setIsAddingOrganization(true); }} className="shrink-0 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-2"><Plus className="h-4 w-4" /> Add organization</button>
                )}
              </div>
              {!isSuperAdmin && <div className="mt-4 flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3"><Lock className="h-4 w-4" /> Only Super Admins can create or manage organizations.</div>}
            </section>

            {userAddedSuccessToast && activeTab === 'organizations' && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-lg text-emerald-300 text-xs flex items-center gap-2 shadow-lg">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="font-medium">{userAddedSuccessToast}</span>
              </div>
            )}

            {isAddingOrganization && isSuperAdmin && (
              <form onSubmit={handleSaveOrganization} className="bg-[#121317] border border-cyan-500/30 rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div><h3 className="text-sm font-bold text-white">{editingOrganizationId ? 'Edit organization' : 'Create an organization'}</h3><p className="text-[11px] text-gray-500 mt-1">Membership changes are applied immediately across the workspace.</p></div>
                  <button type="button" onClick={() => { resetOrganizationForm(); setIsAddingOrganization(false); }} className="p-1 text-gray-500 hover:text-white"><X className="h-4 w-4" /></button>
                </div>
                {organizationFormError && <div className="flex items-center gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg p-3"><AlertCircle className="h-4 w-4" />{organizationFormError}</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="text-xs text-gray-400">Organization name<input value={organizationName} onChange={e => setOrganizationName(e.target.value)} placeholder="e.g. Acme Corporation" className="mt-1 w-full bg-[#1A1D21] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" /></label>
                  <label className="text-xs text-gray-400">Description <span className="text-gray-600">(optional)</span><input value={organizationDescription} onChange={e => setOrganizationDescription(e.target.value)} placeholder="What this organization is for" className="mt-1 w-full bg-[#1A1D21] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" /></label>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-xl overflow-hidden bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    {organizationLogoUrl ? <img src={organizationLogoUrl} alt="Organization logo preview" className="h-full w-full object-cover" /> : <Building2 className="h-7 w-7 text-cyan-300" />}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-white">Organization logo <span className="text-gray-600 font-normal">(optional)</span></p>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => organizationLogoInputRef.current?.click()} className="px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-300 hover:text-white hover:border-gray-500">{organizationLogoUrl ? 'Change logo' : 'Upload logo'}</button>
                      {organizationLogoUrl && <button type="button" onClick={() => setOrganizationLogoUrl('')} className="px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-rose-300">Remove</button>}
                    </div>
                    <p className="text-[10px] text-gray-500">Use a square image, up to 2 MB.</p>
                    <input ref={organizationLogoInputRef} type="file" accept="image/*" onChange={handleOrganizationLogoChange} className="hidden" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-white mb-2 flex items-center gap-2"><Users className="h-4 w-4 text-cyan-400" /> Organization members</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto border border-gray-800 rounded-xl p-3 bg-[#1A1D21]">
                    {users.length === 0 ? <p className="text-xs text-gray-500">No workspace users available.</p> : users.map(user => (
                      <label key={user.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-800/70 cursor-pointer">
                        <input type="checkbox" checked={organizationMemberIds.includes(user.id)} onChange={() => toggleOrganizationMember(user.id)} className="accent-cyan-500" />
                        <span className="min-w-0"><span className="block text-xs text-gray-200 truncate">{user.isAgent ? '🤖 ' : ''}{user.name}</span><span className="block text-[10px] text-gray-500 truncate">{user.role} • {user.email}</span></span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2"><button type="button" onClick={() => { resetOrganizationForm(); setIsAddingOrganization(false); }} className="px-3 py-2 text-xs text-gray-400 hover:text-white">Cancel</button><button type="submit" disabled={isSavingOrganization} className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold">{isSavingOrganization ? 'Saving…' : editingOrganizationId ? 'Save changes' : 'Create organization'}</button></div>
              </form>
            )}

            <section className="bg-[#121317] border border-gray-800 rounded-2xl p-6 space-y-3">
              {organizations.length === 0 ? <div className="py-10 text-center text-gray-500"><Building2 className="h-8 w-8 mx-auto mb-2 text-gray-700" /><p className="text-sm">No organizations created yet.</p><p className="text-xs mt-1">Add one to group users and agents around a shared organization.</p></div> : organizations.map(organization => {
                const members = users.filter(user => organization.memberIds.includes(user.id));
                return (
                  <div key={organization.id} className="flex flex-col md:flex-row md:items-start gap-4 p-4 rounded-xl border border-gray-800 bg-[#1A1D21]">
                    <div className="h-10 w-10 rounded-xl overflow-hidden bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">{organization.logoUrl ? <img src={organization.logoUrl} alt={`${organization.name} logo`} className="h-full w-full object-cover" /> : <Building2 className="h-5 w-5 text-cyan-300" />}</div>
                    <div className="flex-1 min-w-0"><h4 className="text-sm font-bold text-white truncate">{organization.name}</h4>{organization.description && <p className="text-[11px] text-gray-400 mt-1">{organization.description}</p>}<p className="text-[11px] text-gray-500 mt-2">{members.length} member{members.length === 1 ? '' : 's'} • Created {new Date(organization.createdAt).toLocaleDateString()}</p><div className="flex flex-wrap gap-1.5 mt-2">{members.length === 0 ? <span className="text-[10px] text-gray-600">No members assigned</span> : members.map(member => <span key={member.id} className="text-[10px] text-cyan-200 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-2 py-1">{member.isAgent ? '🤖 ' : ''}{member.name}</span>)}</div></div>
                    {isSuperAdmin && <div className="flex items-center gap-2"><button onClick={() => startEditOrganization(organization)} className="px-2.5 py-1.5 text-[11px] rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 flex items-center gap-1.5" title="Edit organization settings"><Edit2 className="h-3.5 w-3.5" /> Edit</button><button onClick={() => handleDeleteOrganization(organization.id)} className="p-1.5 text-gray-500 hover:text-rose-400" title="Delete organization"><Trash2 className="h-4 w-4" /></button></div>}
                  </div>
                );
              })}
            </section>
          </div>
        )}

        {/* TAB 4: AI AGENTS */}
        {activeTab === 'agents' && (
          <div className="space-y-6">
            <section className="p-6 bg-gradient-to-r from-violet-950/40 via-[#121317] to-blue-950/30 border border-violet-500/30 rounded-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2"><Bot className="h-5 w-5 text-violet-400" /> Workspace AI agents</h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-2xl">Create assistants that can answer direct messages and public-channel mentions. Credentials are stored in this demo's local workspace state; production deployments should encrypt them server-side and call the provider from an API route.</p>
                </div>
                {isSuperAdmin && (
                  <button onClick={() => { resetAgentForm(); setIsAddingAgent(true); }} className="shrink-0 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-2"><Plus className="h-4 w-4" /> Add agent</button>
                )}
              </div>
              {!isSuperAdmin && <div className="mt-4 flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3"><Lock className="h-4 w-4" /> Only Super Admins can create or manage agents.</div>}
            </section>

            {isAddingAgent && isSuperAdmin && (
              <form onSubmit={handleCreateAgent} className="bg-[#121317] border border-violet-500/30 rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between"><div><h3 className="text-sm font-bold text-white">{editingAgentId ? 'Edit agent settings' : 'Create an agent'}</h3><p className="text-[11px] text-gray-500 mt-1">OpenAI-compatible providers use the standard chat completions contract.</p></div><button type="button" onClick={() => { resetAgentForm(); setIsAddingAgent(false); }} className="p-1 text-gray-500 hover:text-white"><X className="h-4 w-4" /></button></div>
                {agentFormError && <div className="flex items-center gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg p-3"><AlertCircle className="h-4 w-4" />{agentFormError}</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="text-xs text-gray-400">Display name<input value={agentName} onChange={e => setAgentName(e.target.value)} placeholder="e.g. Support Copilot" className="mt-1 w-full bg-[#1A1D21] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" /></label>
                  <label className="text-xs text-gray-400">Username<input value={agentUsername} onChange={e => setAgentUsername(e.target.value)} placeholder="support-copilot" className="mt-1 w-full bg-[#1A1D21] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" /></label>
                  <label className="text-xs text-gray-400">Agent email<input type="email" value={agentEmail} onChange={e => setAgentEmail(e.target.value)} placeholder="support-copilot@workspace.ai" className="mt-1 w-full bg-[#1A1D21] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" /></label>
                  <label className="text-xs text-gray-400">Model name<input value={agentModel} onChange={e => setAgentModel(e.target.value)} placeholder="e.g. gpt-4o-mini" autoComplete="off" className="mt-1 w-full bg-[#1A1D21] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" /><span className="block text-[10px] text-gray-500 mt-1">Used only for the provider request; it is not shown in the agent profile.</span></label>
                  <label className="text-xs text-gray-400 md:col-span-2">API base URL<input value={agentApiBaseUrl} onChange={e => setAgentApiBaseUrl(e.target.value)} placeholder="https://api.openai.com/v1" className="mt-1 w-full bg-[#1A1D21] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" /></label>
                  <label className="text-xs text-gray-400 md:col-span-2">OpenAI-compatible API key<input type="password" value={agentApiKey} onChange={e => setAgentApiKey(e.target.value)} placeholder={editingAgentId ? 'Leave blank to keep the current key' : 'sk-…'} autoComplete="new-password" className="mt-1 w-full bg-[#1A1D21] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />{editingAgentId && <span className="block text-[10px] text-gray-500 mt-1">Leave this blank to preserve the existing API key, or enter a new key to replace it.</span>}</label>
                  {agentCanSearchWeb && isDeepSeekV4ProConfiguration(agentApiBaseUrl, agentModel) && <div className="md:col-span-2 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200"><Globe className="h-4 w-4 shrink-0 mt-0.5 text-amber-300" /><span><strong>Live web search is unavailable for DeepSeek V4 Pro.</strong> DeepSeek currently exposes hosted web search through its Responses API for V4 Flash, not V4 Pro. Use <code className="text-amber-100">deepseek-v4-flash</code>, OpenAI with a web-search-capable model, or configure an external search provider.</span></div>}
                  <label className="text-xs text-gray-400 md:col-span-2">Job details<textarea value={agentJobDetails} onChange={e => setAgentJobDetails(e.target.value)} rows={3} placeholder="What should this agent help the team accomplish?" className="mt-1 w-full bg-[#1A1D21] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white resize-y" /></label>
                  <label className="text-xs text-gray-400 md:col-span-2">Personality and response style<textarea value={agentPersonality} onChange={e => setAgentPersonality(e.target.value)} rows={3} placeholder="Tone, boundaries, and how it should communicate…" className="mt-1 w-full bg-[#1A1D21] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white resize-y" /></label>
                </div>
                <div className="border-t border-gray-800 pt-4"><p className="text-xs font-bold text-white mb-3 flex items-center gap-2"><Server className="h-4 w-4 text-blue-400" /> Database read access</p><div className="flex flex-col sm:flex-row gap-3"><label className="flex items-center gap-2 text-xs text-gray-300"><input type="checkbox" checked={agentCanReadOrganizations} onChange={e => setAgentCanReadOrganizations(e.target.checked)} className="accent-blue-500" /> Organizations / CRM data</label><label className="flex items-center gap-2 text-xs text-gray-300"><input type="checkbox" checked={agentCanReadPublicThreads} onChange={e => setAgentCanReadPublicThreads(e.target.checked)} className="accent-blue-500" /> Public channel threads</label><label className="flex items-center gap-2 text-xs text-gray-300"><input type="checkbox" checked={agentCanSearchWeb} onChange={e => setAgentCanSearchWeb(e.target.checked)} className="accent-violet-500" /> Allow web search</label></div><p className="text-[10px] text-gray-500 mt-2">Web search is used only for requests that need current or external information and requires a provider/model that supports web search. Private channels and private DMs are never included in the agent context.</p></div>
                <div className="flex justify-end gap-2"><button type="button" onClick={() => { resetAgentForm(); setIsAddingAgent(false); }} className="px-3 py-2 text-xs text-gray-400 hover:text-white">Cancel</button><button type="submit" className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold">{editingAgentId ? 'Save changes' : 'Create agent'}</button></div>
              </form>
            )}

            <section className="bg-[#121317] border border-gray-800 rounded-2xl p-6 space-y-3">
              {agents.length === 0 ? <div className="py-10 text-center text-gray-500"><Bot className="h-8 w-8 mx-auto mb-2 text-gray-700" /><p className="text-sm">No agents created yet.</p><p className="text-xs mt-1">Add one to make it available in DMs and @mentions.</p></div> : agents.map(agent => (
                <div key={agent.id} className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl border border-gray-800 bg-[#1A1D21]">
                  <div className="h-10 w-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center shrink-0"><Bot className="h-5 w-5 text-violet-300" /></div><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><h4 className="text-sm font-bold text-white truncate">{agent.name}</h4><span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${agent.enabled ? 'bg-emerald-500/15 text-emerald-300' : 'bg-gray-700 text-gray-400'}`}>{agent.enabled ? 'enabled' : 'disabled'}</span></div><p className="text-[11px] text-gray-500 mt-1">@{agent.username} • API configured</p><p className="text-[11px] text-gray-400 mt-2 line-clamp-2">{agent.jobDetails}</p><div className="flex gap-2 mt-2 text-[10px] text-gray-500"><span>{agent.databaseAccess.organizations ? 'Organizations' : 'No organizations'}</span><span>•</span><span>{agent.databaseAccess.publicThreads ? 'Public threads' : 'No public threads'}</span><span>•</span><span>{agent.databaseAccess.webSearch ? 'Web search' : 'No web search'}</span></div></div>
                  {isSuperAdmin && <div className="flex items-center gap-2"><button onClick={() => startEditAgent(agent)} className="px-2.5 py-1.5 text-[11px] rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 flex items-center gap-1.5" title="Edit agent settings"><Edit2 className="h-3.5 w-3.5" /> Edit</button><button onClick={() => toggleAgentEnabled(agent.id)} className="px-2.5 py-1.5 text-[11px] rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500">{agent.enabled ? 'Disable' : 'Enable'}</button><button onClick={() => deleteAgent(agent.id)} className="p-1.5 text-gray-500 hover:text-rose-400" title="Delete agent"><Trash2 className="h-4 w-4" /></button></div>}
                </div>
              ))}
            </section>
          </div>
        )}

        {/* TAB 4: OMNICHANNEL SOCIAL & WEBHOOKS (Central Integration Hub) */}
        {activeTab === 'omnichannel' && (
          <div className="space-y-6">
            <div className="p-6 bg-gradient-to-r from-emerald-950/40 via-[#121317] to-blue-950/30 border border-emerald-500/30 rounded-2xl flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-emerald-400" /> Omnichannel Social & Webhook Integration Vault
                </h3>
                <p className="text-xs text-gray-400 max-w-2xl">
                  Centralized settings for Meta Cloud API (WhatsApp Business), Instagram Graph API, Facebook Page Messenger, and Custom Inbound/Outbound Webhooks.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {socialIntegrations.map((platform) => {
                const Icon = platform.icon;
                const isConnected = platform.status === 'connected';

                return (
                  <div 
                    key={platform.id}
                    className="p-5 bg-[#121317] border border-gray-800 hover:border-emerald-500/40 rounded-2xl space-y-4 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl ${platform.bg} border border-gray-700/50 flex items-center justify-center`}>
                          <Icon className={`h-5 w-5 ${platform.color}`} />
                        </div>
                        <div>
                          <h5 className="font-bold text-white text-sm">{platform.name}</h5>
                          <span className="text-[10px] text-gray-500 font-mono">APP ID: {platform.appId || 'UNCONFIGURED'}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleSocialStatus(platform.id)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                          isConnected 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                            : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'
                        }`}
                      >
                        {isConnected ? 'Active & Live' : 'Disconnected'}
                      </button>
                    </div>

                    <p className="text-xs text-gray-400 leading-relaxed">{platform.desc}</p>

                    {/* Webhook Endpoint Box */}
                    <div className="p-3 bg-[#1A1D21] border border-gray-800/80 rounded-xl space-y-1 font-mono text-[10px]">
                      <span className="text-gray-500 block uppercase font-bold">Incoming Webhook Callback URL</span>
                      <div className="flex items-center justify-between text-emerald-400 truncate">
                        <span className="truncate">{platform.webhookUrl}</span>
                        <Copy className="h-3.5 w-3.5 text-gray-500 hover:text-white cursor-pointer ml-2 shrink-0" />
                      </div>
                    </div>

                    <div className="pt-2 flex justify-between items-center text-xs">
                      <span className="text-gray-500 text-[10px] flex items-center gap-1">
                        <Lock className="h-3 w-3 text-emerald-400" /> AES-256 Vault Encrypted
                      </span>
                      <button 
                        onClick={() => setEditingSocialIntegration(platform)}
                        className="text-emerald-400 hover:underline font-bold flex items-center space-x-1"
                      >
                        <span>Configure Keys</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: MULTI-ACCOUNT EMAIL SYNC */}
        {activeTab === 'email' && (
          <div className="space-y-6">
            <div className="p-6 bg-[#121317] border border-gray-800 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center">
                    <Mail className="h-5 w-5 mr-2 text-blue-400" /> Multi-Account Email & OAuth Settings
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">Configure OAuth2 for Google Workspace & Microsoft 365 or IMAP/SMTP credentials.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-[#1A1D21] border border-gray-800 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-5 w-5 text-blue-400" />
                      <span className="font-bold text-white text-xs">Google Workspace OAuth2</span>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">Connected</span>
                  </div>
                  <p className="text-xs text-gray-400">Sync Gmail, Calendar, and contacts automatically for workspace members.</p>
                  <div className="text-[10px] font-mono text-gray-500 bg-[#121317] p-2 rounded border border-gray-800">
                    CLIENT_ID: 998240-google-cloud-applet.apps.googleusercontent.com
                  </div>
                </div>

                <div className="p-4 bg-[#1A1D21] border border-gray-800 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Server className="h-5 w-5 text-indigo-400" />
                      <span className="font-bold text-white text-xs">Microsoft 365 / Exchange</span>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">Connected</span>
                  </div>
                  <p className="text-xs text-gray-400">Sync Microsoft Outlook email and calendar events across workspace.</p>
                  <div className="text-[10px] font-mono text-gray-500 bg-[#121317] p-2 rounded border border-gray-800">
                    TENANT_ID: msFT-365-Demo Company-enterprise
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SECURITY & AUDIT LOGS */}
        {activeTab === 'security' && (
          <section className="bg-[#121317] border border-gray-800 rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center">
                <Activity className="h-5 w-5 mr-2 text-purple-400" /> Security Audit Logs & Webhook Telemetry
              </h3>
              <p className="text-xs text-gray-400 mt-1">Real-time tracking of administrator actions, access tokens, and webhook events.</p>
            </div>

            <div className="overflow-hidden border border-gray-800 rounded-xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#1A1D21] text-gray-400 border-b border-gray-800 uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3">Event Action</th>
                    <th className="px-5 py-3">Administrator / Actor</th>
                    <th className="px-5 py-3">Target</th>
                    <th className="px-5 py-3">Timestamp</th>
                    <th className="px-5 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 bg-[#121317] text-gray-300">
                  {mockAuditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-[#1A1D21]/60 transition">
                      <td className="px-5 py-3 text-white font-semibold">{log.action}</td>
                      <td className="px-5 py-3 text-gray-400">{log.actor}</td>
                      <td className="px-5 py-3 text-blue-400">{log.target}</td>
                      <td className="px-5 py-3 text-gray-500 text-[11px]">{log.timestamp}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'Success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {/* Super Admin Password Management Modal */}
      {passwordTargetUser && isSuperAdmin && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121317] border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-[#1A1D21]">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2"><Key className="h-4 w-4 text-blue-400" /> Manage password</h3>
                <p className="text-xs text-gray-400 mt-1">{passwordTargetUser.name} · {passwordTargetUser.email}</p>
              </div>
              <button type="button" onClick={closePasswordManager} className="text-gray-400 hover:text-white p-1"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {adminPasswordError && <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-lg text-red-300 text-xs flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" /><span>{adminPasswordError}</span></div>}
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-[11px] text-amber-200">Setting a password takes effect immediately. A reset link expires after 30 minutes and can only be used once.</div>
              <label className="block text-xs font-semibold text-gray-300">New password
                <input type="password" value={adminNewPassword} onChange={event => setAdminNewPassword(event.target.value)} autoComplete="new-password" minLength={8} placeholder="At least 8 characters" className="mt-1.5 w-full bg-[#1A1D21] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
              </label>
              <label className="block text-xs font-semibold text-gray-300">Confirm password
                <input type="password" value={adminConfirmPassword} onChange={event => setAdminConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} className="mt-1.5 w-full bg-[#1A1D21] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
              </label>
              <div className="flex flex-wrap justify-end gap-2">
                <button type="button" onClick={handleAdminSetPassword} className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold">Set password</button>
                <button type="button" onClick={handleAdminCreateResetLink} className="px-3 py-2 rounded-lg border border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold">Create reset link</button>
              </div>
              {adminResetLink && <div className="space-y-2 rounded-lg border border-gray-700 bg-[#1A1D21] p-3"><p className="text-[10px] text-gray-500">Reset link for {passwordTargetUser.email}</p><p className="break-all text-[11px] text-blue-300">{adminResetLink}</p><div className="flex gap-2"><button type="button" onClick={copyAdminResetLink} className="flex-1 px-2 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-[11px] text-gray-200 flex items-center justify-center gap-1"><Copy className="h-3.5 w-3.5" /> Copy</button><button type="button" onClick={openAdminEmailDraft} className="flex-1 px-2 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[11px] text-white flex items-center justify-center gap-1"><Mail className="h-3.5 w-3.5" /> Email draft</button></div></div>}
              <div className="flex justify-end"><button type="button" onClick={closePasswordManager} className="px-3 py-2 text-xs text-gray-400 hover:text-white">Close</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Invite User Modal Overlay */}
      {isAddingUser && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121317] border border-gray-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1A1D21]">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Invite New Team Member</h3>
                  <p className="text-xs text-gray-400">Add user details directly to the workspace database.</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsAddingUser(false);
                  setAddUserValidationError(null);
                }}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewUser} className="p-6 overflow-y-auto space-y-4">
              {addUserValidationError && (
                <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-lg text-red-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{addUserValidationError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    First Name <span className="text-red-400">*</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. John"
                    value={newUserFirstName}
                    onChange={(e) => setNewUserFirstName(e.target.value)}
                    className="w-full bg-[#1A1D21] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Last Name
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. Doe"
                    value={newUserLastName}
                    onChange={(e) => setNewUserLastName(e.target.value)}
                    className="w-full bg-[#1A1D21] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <input 
                      type="email"
                      placeholder="john.doe@company.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full bg-[#1A1D21] border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <input 
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={newUserPhone}
                      onChange={(e) => setNewUserPhone(e.target.value)}
                      className="w-full bg-[#1A1D21] border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Job Title
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. Senior Software Engineer"
                    value={newUserTitle}
                    onChange={(e) => setNewUserTitle(e.target.value)}
                    className="w-full bg-[#1A1D21] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Role Permission
                  </label>
                  <select 
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full bg-[#1A1D21] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Admin">Admin</option>
                    <option value="Member">Member</option>
                  </select>
                </div>
              </div>

              {newUserRole === 'Member' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Channel Access Permissions
                  </label>
                  <div className="bg-[#1A1D21] border border-gray-700 rounded-lg p-3 max-h-36 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {scopedChannels.map(channel => (
                      <label key={channel.id} className="flex items-center space-x-2 text-xs text-gray-300 cursor-pointer hover:text-white transition select-none">
                        <input 
                          type="checkbox" 
                          checked={newUserChannels.includes(channel.id)}
                          onChange={() => toggleNewUserChannel(channel.id)}
                          className="rounded bg-gray-800 border-gray-700 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="truncate"># {channel.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-800 flex items-center justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => {
                    setIsAddingUser(false);
                    setAddUserValidationError(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isCreatingUser}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition shadow-lg shadow-blue-900/30 flex items-center space-x-2 cursor-pointer"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>{isCreatingUser ? 'Creating…' : 'Invite Member'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Social Credential Configuration Modal */}
      {editingSocialIntegration && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121317] border border-gray-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="font-bold text-white text-base">Configure {editingSocialIntegration.name}</h3>
              <button onClick={() => setEditingSocialIntegration(null)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1">App / Account ID</label>
                <input 
                  type="text" 
                  defaultValue={editingSocialIntegration.appId || ''} 
                  placeholder="e.g. WA_BIZ_9948271"
                  className="w-full bg-[#1A1D21] border border-gray-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Meta Access Token (AES-256 Vault)</label>
                <input 
                  type="password" 
                  defaultValue={editingSocialIntegration.apiToken || ''} 
                  placeholder="EAAG..."
                  className="w-full bg-[#1A1D21] border border-gray-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Webhook Secret Verification Token</label>
                <input 
                  type="text" 
                  defaultValue={editingSocialIntegration.verifyToken || 'Demo Company_verify_secret'} 
                  className="w-full bg-[#1A1D21] border border-gray-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-gray-800 flex justify-end space-x-2 text-xs">
              <button 
                onClick={() => setEditingSocialIntegration(null)}
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setSocialIntegrations(socialIntegrations.map(s => s.id === editingSocialIntegration.id ? { ...s, status: 'connected' } : s));
                  setEditingSocialIntegration(null);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg shadow-emerald-900/30"
              >
                Save Integration Keys
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Save Bar for DIRTY State */}
      {isDirty && (
        <div className="sticky bottom-0 left-0 right-0 bg-[#121317] border-t border-gray-800 p-4 shadow-2xl flex items-center justify-between z-40 backdrop-blur-md">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse"></div>
            <div>
              <p className="text-xs font-bold text-white">Unsaved Administrator Changes</p>
              <p className="text-[10px] text-gray-400 font-mono">You modified workspace profile, channels, or team roles.</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 px-2">
            <button 
              onClick={handleDiscardChanges}
              className="px-4 py-1.5 text-xs text-gray-400 hover:text-white transition-colors font-medium border border-gray-800 hover:bg-gray-800 rounded-lg cursor-pointer"
            >
              Discard
            </button>
            <button 
              onClick={handleSaveChanges}
              className="px-5 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-emerald-950/20 cursor-pointer flex items-center space-x-2"
            >
              {isSaved ? <><Check className="h-3.5 w-3.5" /> Saved</> : <span>Save Changes</span>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
