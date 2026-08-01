import React from 'react';
import { AlertOctagon, CheckCircle2, Clock, MessageSquare, Plus, Activity, Bell } from 'lucide-react';
import { ViewType } from '../../types';

interface HomeProps {
  onNavigate: (view: ViewType, id?: string) => void;
}

export function HomeView({ onNavigate }: HomeProps) {
  return (
    <div className="flex-1 bg-[#222529] p-6 text-gray-200 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Workspace Dashboard</h1>
          <p className="text-gray-400 text-sm">Welcome back! Here is a summary of your workspace activity.</p>
        </div>

        {/* Critical Alerts - REDS ON RED */}
        <section>
          <div className="flex items-center space-x-2 mb-4">
            <AlertOctagon className="h-5 w-5 text-red-500" />
            <h2 className="text-xl font-bold text-red-500">Attention Required</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              onClick={() => onNavigate('dms')}
              className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-5 hover:bg-red-500/20 cursor-pointer transition-colors flex items-start"
            >
              <div className="bg-red-500 p-3 rounded-lg mr-4 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-red-100 text-lg">3 Unread DMs</h3>
                <p className="text-red-300 text-sm mt-1">You have urgent messages waiting from team members.</p>
              </div>
            </div>
            
            <div 
              onClick={() => onNavigate('conversations')}
              className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-5 hover:bg-red-500/20 cursor-pointer transition-colors flex items-start"
            >
              <div className="bg-red-500 p-3 rounded-lg mr-4 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-red-100 text-lg">5 External Messages</h3>
                <p className="text-red-300 text-sm mt-1">Pending client replies from WhatsApp and Instagram.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Navigation */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Quick Navigation</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button onClick={() => onNavigate('follow-ups')} className="bg-[#1A1D21] border border-gray-800 p-4 rounded-xl hover:border-gray-600 transition-colors text-left group cursor-pointer">
              <CheckCircle2 className="h-6 w-6 text-green-500 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold text-gray-200">Follow-Ups</h4>
              <p className="text-xs text-gray-500 mt-1">Manage pending tasks</p>
            </button>
            <button onClick={() => onNavigate('canvas')} className="bg-[#1A1D21] border border-gray-800 p-4 rounded-xl hover:border-gray-600 transition-colors text-left group cursor-pointer">
              <Activity className="h-6 w-6 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold text-gray-200">Canvas</h4>
              <p className="text-xs text-gray-500 mt-1">Interactive whiteboards</p>
            </button>
            <button onClick={() => onNavigate('files')} className="bg-[#1A1D21] border border-gray-800 p-4 rounded-xl hover:border-gray-600 transition-colors text-left group cursor-pointer">
              <Plus className="h-6 w-6 text-purple-500 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold text-gray-200">Files</h4>
              <p className="text-xs text-gray-500 mt-1">Browse documents</p>
            </button>
            <button onClick={() => onNavigate('kpis')} className="bg-[#1A1D21] border border-gray-800 p-4 rounded-xl hover:border-gray-600 transition-colors text-left group cursor-pointer">
              <Clock className="h-6 w-6 text-orange-500 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold text-gray-200">KPIs & Analytics</h4>
              <p className="text-xs text-gray-500 mt-1">System & employee metrics</p>
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
