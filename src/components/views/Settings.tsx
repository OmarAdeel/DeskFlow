import { Facebook, Instagram, MessageCircle, Link as LinkIcon, CheckCircle2, ChevronRight, Activity, Plus } from 'lucide-react';
import { useState } from 'react';

const availableIntegrations = [
  { 
    id: 'whatsapp', 
    name: 'WhatsApp Business', 
    desc: 'Connect your WhatsApp Business account', 
    icon: MessageCircle, 
    color: 'text-green-500', 
    bg: 'bg-green-500/10'
  },
  { 
    id: 'facebook', 
    name: 'Facebook Messenger', 
    desc: 'Receive messages from your Facebook page', 
    icon: Facebook, 
    color: 'text-blue-500', 
    bg: 'bg-blue-500/10'
  },
  { 
    id: 'instagram', 
    name: 'Instagram Direct', 
    desc: 'Manage your Instagram DMs directly', 
    icon: Instagram, 
    color: 'text-pink-500', 
    bg: 'bg-pink-500/10'
  }
];

export function SettingsView() {
  const [integrations, setIntegrations] = useState<Record<string, boolean>>({
    whatsapp: true,
    facebook: false,
    instagram: false
  });

  const toggleIntegration = (id: string) => {
    setIntegrations(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="flex-1 bg-[#222529] flex flex-col h-full text-gray-200 overflow-y-auto">
      <div className="px-6 py-8 border-b border-gray-800 bg-gradient-to-b from-[#1A1D21] to-transparent">
        <h2 className="text-3xl font-bold text-white mb-2">Integration Settings</h2>
        <p className="text-gray-400 max-w-2xl text-lg">
          Connect external platforms and unify all your conversations. Messages from active integrations will automatically route to the unified Inbox.
        </p>
      </div>

      <div className="p-6 md:p-10 max-w-5xl mx-auto w-full space-y-8">
        
        <div>
          <div className="flex items-center justify-between mb-4 mt-2">
            <div>
              <h3 className="text-xl font-semibold text-white">Connected Platforms</h3>
              <p className="text-sm text-gray-400">Manage your active messaging channels.</p>
            </div>
            <button className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-md font-medium text-sm transition-colors border border-gray-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Integration
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableIntegrations.map((platform) => {
              const isConnected = integrations[platform.id];
              const Icon = platform.icon;
              
              return (
                <div key={platform.id} className={`bg-[#1A1D21] rounded-xl border ${isConnected ? 'border-gray-600' : 'border-gray-800'} overflow-hidden transition-all duration-300 relative group`}>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-12 h-12 rounded-lg ${platform.bg} flex items-center justify-center`}>
                        <Icon className={`h-6 w-6 ${platform.color}`} />
                      </div>
                      
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={isConnected}
                          onChange={() => toggleIntegration(platform.id)}
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4CAF50]"></div>
                      </label>
                    </div>
                    
                    <h4 className="text-lg font-semibold text-gray-100 mb-1">{platform.name}</h4>
                    <p className="text-sm text-gray-500 mb-6 min-h-[40px]">{platform.desc}</p>
                    
                    <div className="pt-4 border-t border-gray-800 flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        {isConnected ? (
                          <>
                            <div className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </div>
                            <span className="text-xs font-medium text-green-500">Receiving Messages</span>
                          </>
                        ) : (
                          <>
                            <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                            <span className="text-xs text-gray-500">Disconnected</span>
                          </>
                        )}
                      </div>
                      
                      {isConnected && (
                        <button className="text-gray-400 hover:text-white transition-colors">
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-12 bg-[#1A1D21] border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
             <div className="flex items-center space-x-3">
               <div className="p-2 bg-gray-800 rounded-lg">
                 <LinkIcon className="h-5 w-5 text-gray-400" />
               </div>
               <div>
                  <h3 className="text-lg font-semibold text-white">Custom Webhooks & API</h3>
                  <p className="text-sm text-gray-400">Build custom integrations for propriety platforms.</p>
               </div>
             </div>
             <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-md font-medium text-sm transition-colors border border-gray-700">
              Manage Keys
             </button>
          </div>
          <div className="p-6 bg-[#1f2226] flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm text-gray-500">
               <div className="flex items-center">
                 <Activity className="h-4 w-4 mr-2" />
                 <span>20,412 requests this month</span>
               </div>
               <div className="hidden sm:flex items-center">
                 <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                 <span>99.9% Uptime</span>
               </div>
            </div>
            <a href="#" className="text-sm font-medium text-blue-400 hover:text-blue-300">View API Documentation</a>
          </div>
        </div>

      </div>
    </div>
  );
}
