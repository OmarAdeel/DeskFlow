import React, { useState, useEffect } from 'react';
import { AlignLeft, Hash, Lock, Bell, Rocket, Sparkles, CheckCircle2, Circle, ArrowUp, Zap, Check, RotateCcw, AlertCircle, MessageSquare, User, CheckSquare } from 'lucide-react';
import { canAccessChannel, useWorkspace } from '../../context';
import { FormattedMessage } from '../FormattedMessage';
import { UserAvatar } from '../UserAvatar';

export function UnreadsView({ onNavigate }: { onNavigate?: any }) {
  const { messages, setMessages, channels, users, currentUser, activeOrganizationId } = useWorkspace();

  // 1. Channel unreads from workspace context
  const unreadMessages = messages.filter(m => !m.isRead);

  // 2. Direct message unreads (interactive, stored locally so users can read/clear them)
  const [unreadDMs, setUnreadDMs] = useState([
    { id: 'dm_1', name: 'Abdallah Mohamed', role: 'Super Admin', count: 2, snippet: 'Hey! Are we still on track for the system integration deployment today?' },
    { id: 'dm_2', name: 'John Doe', role: 'Support Agent', count: 1, snippet: 'Let me know if you need any help with the balance sheet.' }
  ]);

  const totalChannelUnreads = unreadMessages.length;
  const totalDMUnreads = unreadDMs.reduce((acc, dm) => acc + dm.count, 0);
  const totalPendingCount = totalChannelUnreads + unreadDMs.length; // Number of pending modules

  // Group unreads by channel
  const groupedByChannel = unreadMessages.reduce((acc, msg) => {
    if (!acc[msg.channelId]) acc[msg.channelId] = [];
    acc[msg.channelId].push(msg);
    return acc;
  }, {} as Record<string, typeof messages>);

  // Interactive Empty State Local Trajectory Configs
  const [rocketState, setRocketState] = useState<'idle' | 'charging' | 'orbit'>('idle');
  const [launchProgress, setLaunchProgress] = useState(0);
  
  const [ledgerStates, setLedgerStates] = useState({
    done: true,
    undone: true, 
    allSetup: true,
    allRead: true,
  });

  // Calculate orbital statistics
  const activeTasksCount = Object.values(ledgerStates).filter(v => v).length;
  const launchPower = Math.round((activeTasksCount / 4) * 100);

  // Auto progression of launch sequence when charging
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (rocketState === 'charging') {
      interval = setInterval(() => {
        setLaunchProgress(prev => {
          if (prev >= 100) {
            setRocketState('orbit');
            return 100;
          }
          return prev + 10;
        });
      }, 150);
    } else if (rocketState === 'idle') {
      setLaunchProgress(0);
    }
    return () => clearInterval(interval);
  }, [rocketState]);

  const handleIgnition = () => {
    if (rocketState === 'idle' || rocketState === 'orbit') {
      setLaunchProgress(0);
      setRocketState('charging');
    }
  };

  const resetRocket = () => {
    setRocketState('idle');
    setLaunchProgress(0);
    setLedgerStates(prev => ({ ...prev, undone: true }));
  };

  // Mark all channel messages as read
  const markChannelMessageRead = (messageId: string) => {
    setMessages(previous => previous.map(m => (m.id === messageId ? { ...m, isRead: true } : m)));
  };

  // Clear specific DM unread count
  const clearDMUnread = (dmId: string) => {
    setUnreadDMs(unreadDMs.filter(dm => dm.id !== dmId));
  };

  // Clear all unreads at once for instant satisfaction
  const markAllAsRead = () => {
    setMessages(previous => previous.map(m => ({ ...m, isRead: true })));
    setUnreadDMs([]);
  };

  return (
    <div className="flex flex-col h-full bg-[#1A1D21] text-gray-300 select-none">
      
      {/* View Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-805 bg-[#121317] shrink-0">
        <div className="flex items-center">
          <AlignLeft className="h-5 w-5 mr-3 text-blue-400" />
          <h2 className="text-xl font-bold text-gray-100 font-sans tracking-tight">Unreads & Pending Actions</h2>
          {totalPendingCount > 0 ? (
            <span className="ml-3 bg-red-500/95 text-white text-xs font-bold px-2.5 py-0.5 rounded-full select-none animate-pulse">
              {totalPendingCount} pending items
            </span>
          ) : (
            <span className="ml-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              ● Reconciled
            </span>
          )}
        </div>
        
        {totalPendingCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="text-xs font-mono text-blue-400 bg-blue-500/10 border border-blue-500/25 hover:bg-blue-500/20 px-3 py-1.5 rounded transition cursor-pointer"
          >
            ✓ Mark All Read
          </button>
        )}
      </div>

      {/* Main Board Container */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
        {totalPendingCount === 0 ? (
          
          /* INBOX ZERO / ALL RECONCILED STATE */
          <div className="w-full max-w-4xl flex flex-col lg:flex-row items-stretch justify-center gap-6 lg:gap-10 my-auto py-8">
            
            {/* Left Box: Active Flight HUD & Jet Simulation */}
            <div className="flex-1 bg-gradient-to-b from-[#1E2229] to-[#121317]/90 border border-gray-800 rounded-2xl p-6 relative flex flex-col justify-between overflow-hidden shadow-2xl">
              
              {/* Star Fields background */}
              <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute top-10 left-12 w-1 h-1 bg-white rounded-full animate-ping"></div>
                <div className="absolute top-28 right-24 w-1.5 h-1.5 bg-yellow-200 rounded-full animate-pulse"></div>
                <div className="absolute bottom-16 left-1/3 w-1 h-1 bg-white rounded-full"></div>
                <div className="absolute top-1/2 right-12 w-1 h-1 bg-blue-300 rounded-full animate-pulse"></div>
              </div>

              {/* HUD Header */}
              <div className="relative z-10 flex justify-between items-start border-b border-gray-800 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/30">
                      <Rocket className="h-4 w-4" />
                    </span>
                    <h3 className="text-sm font-bold text-gray-200 font-mono">TRAJECTORY_DRIVE</h3>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 font-mono">STATUS: {rocketState.toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    SYS_OK
                  </span>
                  <p className="text-[10px] text-gray-500 mt-1 font-mono">P_POWER: {launchPower}%</p>
                </div>
              </div>

              {/* Rocket Stage Center Visualizer */}
              <div className="relative z-10 flex-1 flex flex-col items-center justify-center py-6 min-h-[220px]">
                {/* Orbital Track scale lines */}
                <div className="absolute left-1/2 -translate-x-1/2 h-full w-[2px] bg-dashed bg-gray-800"></div>

                {/* Simulated Floating Space Rocket Container with animations */}
                <div 
                  className={`relative transition-all duration-700 ease-in-out transform ${
                    rocketState === 'charging' ? 'scale-95 duration-100 rotate-1' :
                    rocketState === 'orbit' ? '-translate-y-16 scale-110 drop-shadow-[0_10px_15px_rgba(59,130,246,0.3)]' :
                    'translate-y-0 text-gray-400'
                  }`}
                >
                  {/* Glowing Orbit Ring behind Rocket when in Orbit */}
                  {rocketState === 'orbit' && (
                    <div className="absolute -inset-6 rounded-full border border-blue-500/30 animate-spin opacity-60"></div>
                  )}

                  <div className="p-6 rounded-2xl bg-gray-900 border border-gray-700/80 shadow-inner block relative">
                    <Rocket className={`h-16 w-16 transition-all duration-300 ${
                      rocketState === 'orbit' ? 'text-blue-400 animate-pulse' : 
                      rocketState === 'charging' ? 'text-amber-500 animate-bounce' : 'text-gray-400'
                    }`} />

                    {/* Interactive Fire Particles below when boosting */}
                    {rocketState === 'charging' && (
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5">
                        <div className="h-4 w-3 bg-red-600 rounded-full animate-ping"></div>
                        <div className="h-3 w-2.5 bg-amber-500 rounded-full animate-bounce"></div>
                      </div>
                    )}
                    
                    {/* Pulsing engine light when in orbit */}
                    {rocketState === 'orbit' && (
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <div className="h-3 w-3 bg-blue-500 rounded-full animate-ping"></div>
                        <div className="text-[9px] text-blue-300 font-mono mt-1">ORBITING</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar info for charging launch */}
                {rocketState === 'charging' && (
                  <div className="w-48 bg-gray-800 h-1.5 rounded-full mt-8 overflow-hidden border border-gray-700">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-150"
                      style={{ width: `${launchProgress}%` }}
                    ></div>
                    <span className="text-[10px] text-gray-400 mt-2 block text-center font-mono">Igniting Boosters... {launchProgress}%</span>
                  </div>
                )}
                
                {rocketState === 'idle' && (
                  <p className="text-xs text-center text-gray-500 max-w-xs mt-6">
                    A clean dashboard launches growth. Ready to verify system telemetry and ignite?
                  </p>
                )}
              </div>

              {/* Action Buttons to Launch / Reset */}
              <div className="relative z-10 border-t border-gray-800 pt-4 flex gap-2 shrink-0">
                {rocketState === 'orbit' ? (
                  <button 
                    onClick={resetRocket}
                    className="flex-1 py-2 text-xs font-semibold bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Return to Station</span>
                  </button>
                ) : (
                  <button 
                    onClick={handleIgnition}
                    disabled={rocketState === 'charging'}
                    className="flex-1 py-2.5 text-xs font-bold bg-[#2B4BCA] hover:bg-[#1E3BB3] text-white rounded-xl shadow-lg border border-blue-500/20 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                    <span>Ignite Rocket Trajectory</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right Box: Ledger & Control Checklist Status Board */}
            <div className="flex-1 bg-gradient-to-b from-[#181B20] to-[#111317] border border-gray-800 rounded-2xl p-6 flex flex-col justify-between shadow-2xl">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold tracking-wider text-gray-400 font-sans uppercase">Workspace Balance Ledger</h3>
                  <span className="text-[10px] text-gray-500 font-mono">4 Parameters Defined</span>
                </div>

                {/* Operational Pills & Ledger Items */}
                <div className="space-y-3">
                  
                  {/* Ledger Item: "done" */}
                  <div className="p-3 rounded-xl border bg-emerald-500/5 border-emerald-500/20 flex items-start gap-3">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-gray-200 line-through opacity-70">
                          done
                        </span>
                        <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded shrink-0">
                          Verified
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">All processed items correctly marked complete.</p>
                    </div>
                  </div>

                  {/* Ledger Item: "undone" */}
                  <div className="p-3 rounded-xl border bg-emerald-500/5 border-emerald-500/20 flex items-start gap-3">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-gray-200 line-through opacity-70">
                          undone
                        </span>
                        <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded shrink-0">
                          Balanced
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">Zero items left in the outstanding ledger.</p>
                    </div>
                  </div>

                  {/* Ledger Item: "all setup" */}
                  <div className="p-3 rounded-xl border bg-emerald-500/5 border-emerald-500/20 flex items-start gap-3">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-gray-200 line-through opacity-70">
                          all setup
                        </span>
                        <span className="text-[9px] font-mono bg-blue-500/10 text-blue-400 px-1.5 py-0.2 rounded shrink-0">
                          Verified
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">Workspace index & modules are synchronized.</p>
                    </div>
                  </div>

                  {/* Ledger Item: "all have been read" */}
                  <div className="p-3 rounded-xl border bg-emerald-500/5 border-emerald-500/20 flex items-start gap-3">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-gray-200 line-through opacity-70">
                          all have been read
                        </span>
                        <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded shrink-0">
                          Inbox 0
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">All channels and direct threads reconciled.</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Bottom: Financial "Flash Summary" / C-Suite Balance widget */}
              <div className="mt-6 p-4 rounded-xl border border-gray-800 bg-[#121317] font-mono text-xs">
                <div className="flex justify-between items-center text-[10px] uppercase text-gray-500 border-b border-gray-800 pb-2 mb-2">
                  <span>Ledger Reconciliation</span>
                  <span>"One-Second" Rule ✅</span>
                </div>
                <div className="grid grid-cols-2 gap-y-2 text-[11px]">
                  <div className="text-gray-400">Total Unreads:</div>
                  <div className="text-right text-emerald-400 font-bold">🟢 0 items remaining</div>
                  
                  <div className="text-gray-400">Ledger Balance:</div>
                  <div className="text-right font-semibold text-gray-200">Balanced (IFRS compliant)</div>

                  <div className="text-gray-400">Business Health:</div>
                  <div className="text-right text-emerald-400 font-semibold">100% Operational (🚀 Trajectory)</div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          
          /* ACTIVE PENDING ITEMS GRID */
          <div className="w-full max-w-4xl space-y-6 py-4">
            
            <div className="bg-gradient-to-r from-amber-500/10 to-transparent border-l-4 border-amber-500 text-amber-200 p-4 rounded-r-xl text-xs flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold">Pending Reconciliations Audited: </span>
                There are currently <span className="font-bold text-white underline">{totalPendingCount} modules</span> with unreviewed content. 
                Below is the exact list of open threads and direct messages. Reconcile them to launch the workspace trajectory.
              </div>
            </div>

            {/* Grid Layout separating Channels & DMs clearly */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* Box 1: Unread Public & Private Channels */}
              <div className="bg-[#121317] border border-gray-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-gray-850 pb-3 mb-1">
                  <div className="flex items-center gap-1.5">
                    <Hash className="h-4.5 w-4.5 text-blue-400" />
                    <h3 className="font-bold text-gray-200 text-sm font-sans">Channels & Threads</h3>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
                    {totalChannelUnreads} pending thread
                  </span>
                </div>

                {totalChannelUnreads === 0 ? (
                  <div className="py-6 text-center text-xs text-gray-500">
                    All channels are fully caught up and reconciled!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(Object.entries(groupedByChannel) as [string, any[]][]).map(([channelId, channelMsgs]) => {
                      const channel = channels.find(c => c.id === channelId);
                      if (!channel || !canAccessChannel(channel, currentUser, activeOrganizationId)) return null;

                      return (
                        <div key={channelId} className="space-y-2">
                          {/* Channel Header Info */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-xs font-bold text-gray-300">
                              {channel.isPrivate ? <Lock className="h-3.5 w-3.5 mr-1 text-gray-500" /> : <Hash className="h-3.5 w-3.5 mr-1 text-gray-500" />}
                              <span>{channel.name}</span>
                            </div>
                            <span className="text-[9px] font-mono bg-blue-500/10 text-blue-400 px-1.5 py-0.2 rounded">
                              Channel Module
                            </span>
                          </div>

                          {/* Threads/Messages inside this Channel */}
                          <div className="space-y-2">
                            {channelMsgs.map(msg => {
                              const sender = users.find(u => u.id === msg.senderId);
                              return (
                                <div 
                                  key={msg.id} 
                                  className="p-3.5 bg-[#1A1D21] border border-gray-800 rounded-xl hover:border-gray-750 transition flex flex-col justify-between"
                                >
                                  <div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-800 border border-gray-700">
                                        <UserAvatar user={sender} className="w-full h-full object-cover" alt={sender?.name || 'User'} />
                                      </div>
                                      <span className="font-bold text-gray-200 text-xs">{sender?.name}</span>
                                      <span className="text-[9px] text-gray-550">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>

                                    {/* The text of the unread thread */}
                                    <div className="text-xs text-gray-300 bg-gray-900/60 p-2.5 rounded-lg border border-gray-800 leading-relaxed break-words font-sans">
                                      <FormattedMessage text={msg.text} />
                                    </div>
                                  </div>

                                  {/* Interaction Action */}
                                  <div className="mt-3 flex gap-2 justify-end">
                                    <button 
                                      onClick={() => onNavigate && onNavigate('channel', channelId)}
                                      className="text-[10px] font-bold text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-750 px-2.5 py-1.5 rounded transition cursor-pointer"
                                    >
                                      Go to Thread
                                    </button>
                                    <button 
                                      onClick={() => markChannelMessageRead(msg.id)}
                                      className="text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg shadow-md transition cursor-pointer flex items-center gap-1"
                                    >
                                      <Check className="h-3 w-3" />
                                      <span>Mark Read</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Box 2: Direct Messages (DMs) */}
              <div className="bg-[#121317] border border-gray-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-gray-850 pb-3 mb-1">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-4.5 w-4.5 text-emerald-400" />
                    <h3 className="font-bold text-gray-200 text-sm font-sans">Direct Messages</h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    Direct Message Module
                  </span>
                </div>

                {unreadDMs.length === 0 ? (
                  <div className="py-6 text-center text-xs text-gray-500">
                    All direct messages are caught up!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {unreadDMs.map(dm => (
                      <div 
                        key={dm.id} 
                        className="p-3.5 bg-[#1A1D21] border border-gray-800 rounded-xl hover:border-gray-750 transition flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-gray-800 border border-gray-700 font-bold text-emerald-400 flex items-center justify-center text-[10px]">
                                {dm.name.charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-bold text-xs text-gray-200">{dm.name}</h4>
                                <span className="text-[9px] text-gray-500">{dm.role}</span>
                              </div>
                            </div>
                            <span className="bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                              {dm.count} messages unread
                            </span>
                          </div>

                          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded inline-block mb-2 font-semibold">
                            Direct Message
                          </span>

                          <p className="text-xs text-gray-400 italic bg-gray-900/40 p-2.5 border border-gray-800 rounded-lg">
                            "{dm.snippet}"
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="mt-3 flex gap-2 justify-end">
                          <button 
                            onClick={() => onNavigate && onNavigate('dms')}
                            className="text-[10px] font-bold text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-750 px-2.5 py-1.5 rounded transition cursor-pointer"
                          >
                            Open Chat
                          </button>
                          <button 
                            onClick={() => clearDMUnread(dm.id)}
                            className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1"
                          >
                            <Check className="h-3 w-3" />
                            <span>Mark Read</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Flash Balance Summary */}
            <div className="p-4 rounded-xl border border-gray-800 bg-[#121317] font-mono text-xs w-full max-w-xl mx-auto">
              <div className="flex justify-between items-center text-[10px] uppercase text-gray-500 border-b border-gray-800 pb-2 mb-2">
                <span>"ONE-SECOND RULE" FLASH SUMMARY</span>
                <span className="text-amber-500 font-semibold animate-pulse">🔴 ACTIONS OUTSTANDING</span>
              </div>
              <div className="grid grid-cols-2 gap-y-2 text-[11px]">
                <div className="text-gray-400">Total Pending Count:</div>
                <div className="text-right text-red-400 font-bold">{totalPendingCount} modules unresolved</div>
                
                <div className="text-gray-400">Ledger Balance:</div>
                <div className="text-right text-amber-500 font-semibold">Unbalanced (Pending review)</div>

                <div className="text-gray-400">System Path:</div>
                <div className="text-right text-gray-300">Unreads → Review Channels & DMs</div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
