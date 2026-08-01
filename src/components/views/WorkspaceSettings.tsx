import { 
  Plus, Edit2, Trash2, Users, Hash, Shield, Briefcase, Mail, Check, X, Phone, UserCheck, 
  AlertCircle, MessageCircle, Instagram, Facebook, Link as LinkIcon, Activity, Key, 
  Copy, RefreshCw, Lock, Server, CheckCircle2, Bot, Globe
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../context';

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
  const { workspaceName, setWorkspaceName, channels, setChannels, users, setUsers } = useWorkspace();
  
  // Navigation tabs inside Super Admin Workspace Settings
  const [activeTab, setActiveTab] = useState<'general' | 'users' | 'omnichannel' | 'email' | 'security'>('general');

  // Local state for edits
  const [localName, setLocalName] = useState(workspaceName);
  const [localChannels, setLocalChannels] = useState(channels);
  const [localUsers, setLocalUsers] = useState(users);
  const [isSaved, setIsSaved] = useState(false);

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

  // States for adding user
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserTitle, setNewUserTitle] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState('Member');
  const [newUserChannels, setNewUserChannels] = useState<string[]>(['4']);
  const [userAddedSuccessToast, setUserAddedSuccessToast] = useState<string | null>(null);
  const [addUserValidationError, setAddUserValidationError] = useState<string | null>(null);

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
    setLocalChannels(localChannels.filter(c => c.id !== id));
  };

  const handleSaveNewChannel = () => {
    if (newChannelName.trim()) {
      const newChannel = {
        id: Date.now().toString(),
        name: newChannelName.trim().toLowerCase().replace(/\s+/g, '-'),
        isPrivate: newChannelIsPrivate
      };
      setLocalChannels([...localChannels, newChannel]);
      setIsAddingChannel(false);
      setNewChannelName('');
      setNewChannelIsPrivate(false);
    }
  };

  const handleDeleteUser = (id: string) => {
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    setLocalUsers(updated);
  };

  const handleSaveNewUser = (e?: React.FormEvent) => {
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

    const newUser = {
      id: 'user_' + Date.now().toString(),
      name: fullName,
      email: email,
      title: newUserTitle.trim() || undefined,
      phone: newUserPhone.trim() || undefined,
      role: newUserRole,
      channelIds: newUserRole === 'Member' ? newUserChannels : undefined,
      username: email.split('@')[0] || firstName.toLowerCase()
    };

    const updatedUsers = [...users.filter(u => u.id !== newUser.id), newUser];
    setUsers(updatedUsers);
    setLocalUsers(updatedUsers);

    setUserAddedSuccessToast(`User ${fullName} (${email}) was successfully added to your database!`);
    setTimeout(() => setUserAddedSuccessToast(null), 5000);

    setIsAddingUser(false);
    setNewUserFirstName('');
    setNewUserLastName('');
    setNewUserEmail('');
    setNewUserTitle('');
    setNewUserPhone('');
    setNewUserRole('Member');
    setNewUserChannels(['4']);
  };

  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editChannelName, setEditChannelName] = useState('');
  const [editChannelIsPrivate, setEditChannelIsPrivate] = useState(false);

  const startEditChannel = (channel: any) => {
    setEditingChannelId(channel.id);
    setEditChannelName(channel.name);
    setEditChannelIsPrivate(channel.isPrivate);
  };

  const saveEditChannel = () => {
    if (editChannelName.trim() && editingChannelId) {
      setLocalChannels(localChannels.map(c => 
        c.id === editingChannelId 
          ? { ...c, name: editChannelName.trim().toLowerCase().replace(/\s+/g, '-'), isPrivate: editChannelIsPrivate }
          : c
      ));
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
      setLocalUsers(localUsers.map(u =>
        u.id === editingUserId
          ? { ...u, name: editUserName.trim(), email: editUserEmail.trim(), title: editUserTitle.trim(), phone: editUserPhone.trim(), role: editUserRole, channelIds: editUserChannels }
          : u
      ));
      setEditingUserId(null);
    }
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
                          <div className="flex justify-end space-x-2">
                            <button onClick={handleSaveNewChannel} className="p-1.5 text-green-400 hover:text-green-300 bg-gray-800 rounded transition-colors" title="Save Channel"><Check className="h-4 w-4" /></button>
                            <button onClick={() => setIsAddingChannel(false)} className="p-1.5 text-gray-400 hover:text-white bg-gray-800 rounded transition-colors" title="Cancel"><X className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    )}
                    {localChannels.map(channel => (
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
                                    {localChannels.map(channel => (
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

        {/* TAB 3: OMNICHANNEL SOCIAL & WEBHOOKS (Central Integration Hub) */}
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
                    {localChannels.map(channel => (
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
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition shadow-lg shadow-blue-900/30 flex items-center space-x-2 cursor-pointer"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Invite Member</span>
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
