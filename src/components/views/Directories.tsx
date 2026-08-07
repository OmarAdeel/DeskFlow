import React, { useState } from 'react';
import { Book, Search, Hash, Lock, Users as UsersIcon, Mail } from 'lucide-react';
import { canAccessChannel, useWorkspace } from '../../context';
import { UserAvatar } from '../UserAvatar';

export function DirectoriesView() {
  const { users, channels, currentUser, activeOrganizationId } = useWorkspace();
  const [activeTab, setActiveTab] = useState<'users' | 'channels'>('users');
  const [search, setSearch] = useState('');

  const filteredUsers = users.filter(u =>
    (!activeOrganizationId || u.organizationIds?.includes(activeOrganizationId)) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredChannels = channels.filter(c =>
    canAccessChannel(c, currentUser, activeOrganizationId) && c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#1A1D21] text-gray-300">
      {/* Header */}
      <div className="flex items-center px-6 py-4 border-b border-gray-800 bg-[#121317]">
        <Book className="h-5 w-5 mr-3 text-gray-400" />
        <h2 className="text-xl font-bold text-gray-100">Directory</h2>
      </div>

      {/* Tabs & Search */}
      <div className="px-6 py-4 border-b border-gray-800 bg-[#121317]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-1 p-1 bg-[#1A1D21] rounded-lg">
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-[#2A2B32] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Members
            </button>
            <button 
              onClick={() => setActiveTab('channels')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'channels' ? 'bg-[#2A2B32] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Channels
            </button>
          </div>
          
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#1A1D21] border border-gray-700 rounded-md pl-9 pr-4 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500 w-64"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'users' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredUsers.map(user => (
                <div key={user.id} className="bg-[#121317] border border-gray-800 rounded-xl p-4 flex items-start space-x-4">
                  <div className="h-12 w-12 rounded bg-gray-700 shrink-0 overflow-hidden">
                    <UserAvatar user={user} className="h-full w-full object-cover" alt={user.name} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-100 font-bold truncate">{user.name}</h3>
                    <p className="text-sm text-blue-400 truncate mt-0.5">{user.title || 'Team Member'}</p>
                    <div className="mt-2 space-y-1 text-xs text-gray-500">
                      <p className="flex items-center"><Mail className="h-3 w-3 mr-1.5" /> {user.email}</p>
                      <p className="flex items-center"><UsersIcon className="h-3 w-3 mr-1.5" /> {user.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'channels' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredChannels.map(channel => (
                <div key={channel.id} className="bg-[#121317] border border-gray-800 rounded-xl p-4 flex items-center">
                  <div className="h-10 w-10 rounded-lg bg-[#1A1D21] flex items-center justify-center mr-4">
                    {channel.isPrivate ? <Lock className="h-5 w-5 text-gray-400" /> : <Hash className="h-5 w-5 text-gray-400" />}
                  </div>
                  <div>
                    <h3 className="text-gray-100 font-bold truncate">{channel.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{channel.isPrivate ? 'Private Channel' : 'Public Channel'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
