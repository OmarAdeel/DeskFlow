import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Users, MessageCircle, UserCheck, Shield, Zap, Award, Target, 
  CheckCircle2, Clock, AlertTriangle, Search, Filter, Download, ArrowUpRight, MessageSquare, 
  Edit3, Save, Star, ChevronRight, Activity, Calendar, PieChart, Sparkles, Heart, Crown, 
  Code, RefreshCw, Check, ArrowRight, User, Copy, Send, FileText, Bot, Share2
} from 'lucide-react';
import { useWorkspace, WorkspaceUser } from '../../context';
import { mockEmployeeAnalytics, getEmployeeAnalytics, EmployeeAnalyticsData } from '../../data/employeeAnalytics';
import { ViewType } from '../../types';

interface KPIsViewProps {
  onNavigate?: (view: ViewType, id?: string) => void;
  initialSelectedUserId?: string;
}

export function KPIsView({ onNavigate, initialSelectedUserId }: KPIsViewProps) {
  const { users } = useWorkspace();
  const [activeTab, setActiveTab] = useState<'system' | 'employees' | 'leaderboard'>('employees');
  
  // Selected employee state
  const [selectedUserId, setSelectedUserId] = useState<string>(() => {
    if (initialSelectedUserId) return initialSelectedUserId;
    return users.length > 0 ? users[0].id : '1';
  });

  // Employee search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // AI Report Generator State
  const [reportTimeframe, setReportTimeframe] = useState<'Monthly KPI' | 'Weekly Sprint' | 'Quarterly Review'>('Monthly KPI');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportCopied, setReportCopied] = useState(false);
  const [reportSentToast, setReportSentToast] = useState(false);
  
  // Custom manager notes state (persisted to localStorage)
  const [employeeNotes, setEmployeeNotes] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('demo_employee_notes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [editingNotes, setEditingNotes] = useState(false);
  const [currentNoteText, setCurrentNoteText] = useState('');
  const [notesSavedAlert, setNotesSavedAlert] = useState(false);

  useEffect(() => {
    if (initialSelectedUserId) {
      setSelectedUserId(initialSelectedUserId);
      setActiveTab('employees');
    }
  }, [initialSelectedUserId]);

  const selectedUserObj = users.find(u => u.id === selectedUserId) || users[0];
  const analyticsData = getEmployeeAnalytics(selectedUserId, selectedUserObj);

  useEffect(() => {
    const customNote = employeeNotes[selectedUserId];
    setCurrentNoteText(customNote !== undefined ? customNote : (analyticsData.notes || ''));
    setEditingNotes(false);
    setReportCopied(false);
    setReportSentToast(false);
  }, [selectedUserId, employeeNotes]);

  const handleSaveNotes = () => {
    const updated = { ...employeeNotes, [selectedUserId]: currentNoteText };
    setEmployeeNotes(updated);
    try {
      localStorage.setItem('demo_employee_notes', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setEditingNotes(false);
    setNotesSavedAlert(true);
    setTimeout(() => setNotesSavedAlert(false), 2500);
  };

  // Helper to construct full AI summary message answering user's requirements
  const buildAIMessageReport = (
    user: WorkspaceUser,
    data: EmployeeAnalyticsData,
    timeframe: string,
    managerNote?: string
  ) => {
    const firstName = user.name.split(' ')[0];
    const deptsDealtWith = data.workDistribution
      ? data.workDistribution.map(w => `${w.category} (${w.percentage}%)`).join(', ')
      : data.department;

    return `📊 OFFICIAL WORKSPACE KPI & TIME PERFORMANCE REPORT
--------------------------------------------------
👤 Employee: ${user.name} (${user.title || user.role})
🏢 Primary Department: ${data.department}
📅 Evaluation Period: ${timeframe}
--------------------------------------------------

Hi ${firstName}, here is your full performance & time analysis summary prepared by the AI Analytics Engine:

1️⃣ 💬 Messages Created & Activity:
• Total Messages Created: ${data.stats.totalMessagesSent.toLocaleString()} messages logged across channels
• Technical & Ops Threads Resolved: ${data.stats.threadsResolved} active discussions closed

2️⃣ ⚡ Response Speed & Time SLA:
• Average Time to Respond: ${data.stats.avgResponseMinutes} minutes (Top SLA performance bracket)
• Peak Productivity Window: ${data.stats.peakProductivityWindow}
• Daily Active Working Time: ${data.stats.activeHoursPerDay} hrs / day average

3️⃣ 📋 Tasks & Execution SLA:
• Total Tasks Dealt With: ${data.stats.tasksCompleted} tasks completed
• Punctuality SLA Delivery Rate: ${data.stats.tasksOnTimePct}% on-time completion

4️⃣ 🏢 Departments & Functions Dealt With:
• Departments Dealt With: ${deptsDealtWith}

5️⃣ 🏆 Overall KPI Rating & Recognition:
• Performance Score: ${data.performanceScore}% (Grade ${data.ratingGrade})
• CSAT Team Rating: ${data.stats.csatScore} / 5.0 ★
• Karma Recognition Points: ${data.stats.karmaPoints} pts

6️⃣ 📝 Manager Evaluation & AI Feedback:
"${managerNote || data.notes || 'Consistently demonstrates strong teamwork, proactive communication, and top-tier execution.'}"

---
Generated by VOK Tech Workspace AI Analytics Engine on ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.`;
  };

  const currentReportText = buildAIMessageReport(
    selectedUserObj,
    analyticsData,
    reportTimeframe,
    employeeNotes[selectedUserId] || analyticsData.notes
  );

  const handleCopyReport = () => {
    navigator.clipboard.writeText(currentReportText);
    setReportCopied(true);
    setTimeout(() => setReportCopied(false), 2500);
  };

  const handleSendDMReport = () => {
    try {
      const savedConvStr = localStorage.getItem('demo_conversations');
      const savedConv = savedConvStr ? JSON.parse(savedConvStr) : {};
      const userMsgs = savedConv[selectedUserObj.id] || [];
      const newReportMsg = {
        id: `report_msg_${Date.now()}`,
        senderId: '8',
        senderName: 'You',
        text: currentReportText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: true,
        reactions: ['📊'],
        replies: []
      };
      savedConv[selectedUserObj.id] = [...userMsgs, newReportMsg];
      localStorage.setItem('demo_conversations', JSON.stringify(savedConv));
    } catch (e) {
      console.error('Failed to append report to DM conversations:', e);
    }

    setReportSentToast(true);
    setTimeout(() => {
      setReportSentToast(false);
      if (onNavigate) {
        onNavigate('dms', selectedUserObj.id);
      }
    }, 800);
  };

  const handleRegenerateReport = () => {
    setIsGeneratingReport(true);
    setTimeout(() => {
      setIsGeneratingReport(false);
    }, 500);
  };

  // Filtered employees list
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                          user.email.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                          (user.title && user.title.toLowerCase().includes(searchQuery.toLowerCase().trim()));
    if (!matchesSearch) return false;

    if (departmentFilter === 'all') return true;
    const data = getEmployeeAnalytics(user.id, user);
    return data.department.toLowerCase() === departmentFilter.toLowerCase();
  });

  const departments = ['all', 'Engineering', 'Management', 'HR', 'Design', 'QA', 'Accounting'];

  const handleExportPDF = (user: WorkspaceUser, data: EmployeeAnalyticsData) => {
    const reportText = `Demo Company EMPLOYEE PERFORMANCE ANALYSIS REPORT
==================================================
Date: ${new Date().toLocaleDateString()}
Employee: ${user.name} (${user.email})
Title / Role: ${user.title || user.role} | Department: ${data.department}

OVERALL PERFORMANCE RATING
- Performance Score: ${data.performanceScore} / 100 (${data.ratingGrade} Grade)
- Tasks Completed: ${data.stats.tasksCompleted} (${data.stats.tasksOnTimePct}% on time)
- Avg Response Speed: ${data.stats.avgResponseMinutes} minutes
- Total Messages Sent: ${data.stats.totalMessagesSent}
- CSAT Satisfaction Rating: ${data.stats.csatScore} / 5.0
- Karma Recognition Points: ${data.stats.karmaPoints} pts

ACTIVE GOALS
${data.goals.map(g => `- ${g.title}: ${g.current}/${g.target} ${g.unit} [${g.status.toUpperCase()}]`).join('\n')}

MANAGER NOTES:
${employeeNotes[user.id] || data.notes || 'No notes provided.'}
==================================================`;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Performance_Report_${user.name.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 bg-[#222529] flex flex-col h-full text-gray-200 overflow-y-auto custom-scrollbar">
      
      {/* Top Header & Navigation Tabs */}
      <div className="px-6 py-6 border-b border-gray-800 bg-[#1A1D21] sticky top-0 z-20 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto w-full">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
                <BarChart3 className="h-5 w-5" />
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight">Analytics & KPI Dashboard</h1>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Track workspace efficiency, system health, and individual employee performance deep-dives.
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleExportPDF(selectedUserObj, analyticsData)}
              className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-xl text-xs font-semibold flex items-center space-x-2 transition cursor-pointer shadow-sm"
            >
              <Download className="h-3.5 w-3.5 text-blue-400" />
              <span>Export Selected Report</span>
            </button>
            {onNavigate && (
              <button
                onClick={() => onNavigate('dms', selectedUserId)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition cursor-pointer shadow-md shadow-blue-900/30"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Message {selectedUserObj.name.split(' ')[0]}</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 mt-6 max-w-7xl mx-auto w-full border-b border-gray-800/80 text-xs font-medium">
          <button
            onClick={() => setActiveTab('employees')}
            className={`pb-3 px-4 flex items-center space-x-2 border-b-2 transition cursor-pointer ${
              activeTab === 'employees' 
                ? 'border-blue-500 text-blue-400 font-bold' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>Individual Employee Analysis</span>
            <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full text-[10px] font-mono">
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`pb-3 px-4 flex items-center space-x-2 border-b-2 transition cursor-pointer ${
              activeTab === 'system' 
                ? 'border-blue-500 text-blue-400 font-bold' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>System Analysis & Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`pb-3 px-4 flex items-center space-x-2 border-b-2 transition cursor-pointer ${
              activeTab === 'leaderboard' 
                ? 'border-blue-500 text-blue-400 font-bold' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Award className="h-4 w-4" />
            <span>Team Matrix & Leaderboard</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 max-w-7xl w-full mx-auto space-y-6">

        {/* TAB 1: INDIVIDUAL EMPLOYEE FULL ANALYSIS */}
        {activeTab === 'employees' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Employee Selector & Filter List */}
            <div className="lg:col-span-4 bg-[#1A1D21] border border-gray-800 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm flex items-center">
                  <Users className="h-4 w-4 mr-2 text-blue-400" />
                  Select Teammate
                </h3>
                <span className="text-[11px] text-gray-400 font-mono">{filteredUsers.length} employees</span>
              </div>

              {/* Search & Dept Filter */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or title..."
                    className="w-full bg-[#121317] border border-gray-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-1 overflow-x-auto pb-1 custom-scrollbar">
                  {departments.map(dept => (
                    <button
                      key={dept}
                      onClick={() => setDepartmentFilter(dept)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] capitalize whitespace-nowrap transition cursor-pointer ${
                        departmentFilter === dept 
                          ? 'bg-blue-600 text-white font-bold' 
                          : 'bg-gray-800/80 text-gray-400 hover:text-white'
                      }`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </div>

              {/* Employee Cards List */}
              <div className="space-y-2 max-h-[620px] overflow-y-auto custom-scrollbar pr-1">
                {filteredUsers.map((user) => {
                  const isSelected = user.id === selectedUserId;
                  const data = getEmployeeAnalytics(user.id, user);

                  return (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUserId(user.id)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between group ${
                        isSelected 
                          ? 'bg-blue-900/30 border-blue-500 text-white shadow-md' 
                          : 'bg-[#121317] border-gray-800/80 hover:border-gray-700 hover:bg-[#1f2227] text-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow">
                            {user.name.charAt(0)}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#121317]" />
                        </div>
                        <div className="truncate">
                          <div className="flex items-center space-x-1.5">
                            <h4 className="font-semibold text-xs text-white truncate group-hover:text-blue-400 transition">
                              {user.name}
                            </h4>
                            {user.role === 'Super Admin' && (
                              <Crown className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400 truncate">
                            {user.title || user.role} • {data.department}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                          data.performanceScore >= 95 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : data.performanceScore >= 90
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {data.performanceScore}%
                        </span>
                        <div className="text-[10px] text-gray-500 mt-0.5 font-mono">
                          {data.ratingGrade} Grade
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <div className="py-8 text-center text-xs text-gray-500">
                    No employees matching "{searchQuery}"
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Deep-Dive Employee Analysis Detail */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Employee Overview Card */}
              <div className="bg-[#1A1D21] border border-gray-800 rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-800/80 pb-6">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-2xl shadow-lg border border-white/10">
                        {selectedUserObj.name.charAt(0)}
                      </div>
                      <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full border-2 border-[#1A1D21]" title="Online Active" />
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-xl font-bold text-white">{selectedUserObj.name}</h2>
                        <span className="px-2.5 py-0.5 bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[11px] font-semibold rounded-full">
                          {selectedUserObj.role}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {selectedUserObj.title || 'Team Specialist'} • Department: <strong className="text-gray-200">{analyticsData.department}</strong>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 font-mono">{selectedUserObj.email}</p>
                    </div>
                  </div>

                  {/* Rating Badge */}
                  <div className="flex items-center space-x-3 bg-[#121317] border border-gray-800 p-3 rounded-2xl">
                    <div className="text-center">
                      <div className="text-2xl font-black text-white">{analyticsData.performanceScore}</div>
                      <div className="text-[10px] text-gray-400 uppercase font-semibold">Overall KPI</div>
                    </div>
                    <div className="h-8 w-px bg-gray-800" />
                    <div className="text-center">
                      <div className="text-xl font-extrabold text-emerald-400">{analyticsData.ratingGrade}</div>
                      <div className="text-[10px] text-emerald-500/80 uppercase font-semibold">Rating</div>
                    </div>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-[#121317] border border-gray-800 p-4 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-gray-400 text-xs">
                      <span>Tasks Delivered</span>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="text-xl font-bold text-white">{analyticsData.stats.tasksCompleted}</div>
                    <div className="text-[10px] text-emerald-400 font-semibold">{analyticsData.stats.tasksOnTimePct}% on-time SLA</div>
                  </div>

                  <div className="bg-[#121317] border border-gray-800 p-4 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-gray-400 text-xs">
                      <span>Avg Response</span>
                      <Zap className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="text-xl font-bold text-white">{analyticsData.stats.avgResponseMinutes} min</div>
                    <div className="text-[10px] text-blue-400 font-semibold">Top 10% workspace</div>
                  </div>

                  <div className="bg-[#121317] border border-gray-800 p-4 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-gray-400 text-xs">
                      <span>Messages & Threads</span>
                      <MessageSquare className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="text-xl font-bold text-white">{analyticsData.stats.totalMessagesSent.toLocaleString()}</div>
                    <div className="text-[10px] text-purple-400 font-semibold">{analyticsData.stats.threadsResolved} threads closed</div>
                  </div>

                  <div className="bg-[#121317] border border-gray-800 p-4 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-gray-400 text-xs">
                      <span>Karma & CSAT</span>
                      <Award className="h-4 w-4 text-amber-400" />
                    </div>
                    <div className="text-xl font-bold text-white">{analyticsData.stats.csatScore} / 5</div>
                    <div className="text-[10px] text-amber-400 font-semibold">{analyticsData.stats.karmaPoints} karma pts</div>
                  </div>
                </div>

                {/* Peak Hours & Active Time */}
                <div className="p-3.5 bg-blue-950/20 border border-blue-500/30 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-blue-300">
                    <Clock className="h-4 w-4 text-blue-400 shrink-0" />
                    <span>Peak Productivity Hours: <strong className="text-white font-mono">{analyticsData.stats.peakProductivityWindow}</strong></span>
                  </div>
                  <span className="text-gray-400 text-[11px]">Daily Avg: <strong>{analyticsData.stats.activeHoursPerDay} hrs</strong></span>
                </div>
              </div>

              {/* AI GENERATED KPI & TIME PERFORMANCE MESSAGE CARD */}
              <div className="bg-[#1A1D21] border-2 border-blue-500/40 rounded-2xl p-6 space-y-5 shadow-2xl relative overflow-hidden bg-gradient-to-br from-[#1A1D21] via-[#1E222A] to-[#171B22]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-800 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-white text-base">AI Prepared Performance Report Message</h3>
                        <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold rounded-full flex items-center space-x-1">
                          <Sparkles className="h-3 w-3 text-amber-400" />
                          <span>Ready for {selectedUserObj.name}</span>
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Comprehensive AI breakdown of messages, response SLA times, tasks, and department interactions.
                      </p>
                    </div>
                  </div>

                  {/* Timeframe selector & Regenerate */}
                  <div className="flex items-center space-x-2">
                    <div className="bg-[#121317] p-1 rounded-xl border border-gray-800 flex space-x-1">
                      {(['Monthly KPI', 'Weekly Sprint', 'Quarterly Review'] as const).map((tf) => (
                        <button
                          key={tf}
                          onClick={() => setReportTimeframe(tf)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            reportTimeframe === tf 
                              ? 'bg-blue-600 text-white shadow' 
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handleRegenerateReport}
                      disabled={isGeneratingReport}
                      title="Regenerate AI Analysis"
                      className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`h-4 w-4 ${isGeneratingReport ? 'animate-spin text-blue-400' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Quick Answer Highlights Chips */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-[#121317] border border-gray-800/80 p-3 rounded-xl">
                    <span className="text-gray-400 text-[11px] block">1. Messages Created</span>
                    <strong className="text-white text-sm block mt-0.5 font-bold">
                      {analyticsData.stats.totalMessagesSent.toLocaleString()} msgs
                    </strong>
                    <span className="text-[10px] text-purple-400">Across channels & DMs</span>
                  </div>

                  <div className="bg-[#121317] border border-gray-800/80 p-3 rounded-xl">
                    <span className="text-gray-400 text-[11px] block">2. Avg Response Time</span>
                    <strong className="text-emerald-400 text-sm block mt-0.5 font-bold">
                      {analyticsData.stats.avgResponseMinutes} min SLA
                    </strong>
                    <span className="text-[10px] text-emerald-500">Peak: {analyticsData.stats.peakProductivityWindow}</span>
                  </div>

                  <div className="bg-[#121317] border border-gray-800/80 p-3 rounded-xl">
                    <span className="text-gray-400 text-[11px] block">3. Tasks Dealt With</span>
                    <strong className="text-white text-sm block mt-0.5 font-bold">
                      {analyticsData.stats.tasksCompleted} tasks
                    </strong>
                    <span className="text-[10px] text-blue-400">{analyticsData.stats.tasksOnTimePct}% on-time rate</span>
                  </div>

                  <div className="bg-[#121317] border border-gray-800/80 p-3 rounded-xl">
                    <span className="text-gray-400 text-[11px] block">4. Departments Dealt With</span>
                    <strong className="text-amber-300 text-xs block mt-0.5 font-semibold truncate">
                      {analyticsData.workDistribution ? analyticsData.workDistribution.map(w => w.category).join(', ') : analyticsData.department}
                    </strong>
                    <span className="text-[10px] text-gray-400">Multi-dept collaboration</span>
                  </div>
                </div>

                {/* Formatted Prepared Message Output */}
                <div className="relative group">
                  <div className="bg-[#0E0F12] border border-gray-800/90 rounded-xl p-4 font-mono text-xs text-gray-200 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto custom-scrollbar">
                    {isGeneratingReport ? (
                      <div className="py-12 flex flex-col items-center justify-center space-y-3 text-gray-400">
                        <Sparkles className="h-6 w-6 text-blue-400 animate-spin" />
                        <span>AI is analyzing activity logs and generating report message...</span>
                      </div>
                    ) : (
                      currentReportText
                    )}
                  </div>

                  {reportSentToast && (
                    <div className="absolute top-4 right-4 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl flex items-center space-x-1.5 animate-bounce">
                      <Check className="h-4 w-4" />
                      <span>Navigating to DMs to send report to {selectedUserObj.name.split(' ')[0]}!</span>
                    </div>
                  )}
                </div>

                {/* Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSendDMReport}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center space-x-2 transition cursor-pointer shadow-lg shadow-blue-900/40"
                    >
                      <Send className="h-4 w-4" />
                      <span>Send DM Report to {selectedUserObj.name.split(' ')[0]}</span>
                    </button>

                    <button
                      onClick={handleCopyReport}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold rounded-xl text-xs flex items-center space-x-2 transition cursor-pointer border border-gray-700"
                    >
                      {reportCopied ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-400" />
                          <span className="text-emerald-400">Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 text-gray-400" />
                          <span>Copy Message Text</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-[11px] text-gray-400 flex items-center space-x-1">
                    <FileText className="h-3.5 w-3.5 text-blue-400" />
                    <span>Formatted for Slack / VChat markdown reporting</span>
                  </div>
                </div>
              </div>

              {/* Weekly Activity Distribution Chart & Work Allocation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Weekly Activity Bar Chart */}
                <div className="bg-[#1A1D21] border border-gray-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm flex items-center">
                      <BarChart3 className="h-4 w-4 mr-2 text-emerald-400" />
                      Weekly Task & Output Volume
                    </h3>
                    <span className="text-[10px] text-gray-400">Mon - Fri</span>
                  </div>

                  <div className="h-44 flex items-end justify-between px-2 pt-6 pb-2 border-b border-gray-800">
                    {analyticsData.weeklyActivity.map((dayData, idx) => {
                      const maxTask = Math.max(...analyticsData.weeklyActivity.map(d => d.tasks));
                      const heightPct = Math.round((dayData.tasks / maxTask) * 100);

                      return (
                        <div key={idx} className="flex flex-col items-center flex-1 space-y-2 group">
                          <div className="text-[10px] font-bold text-gray-400 opacity-0 group-hover:opacity-100 transition">
                            {dayData.tasks}
                          </div>
                          <div className="w-8 bg-gray-800 rounded-t-lg relative flex items-end overflow-hidden h-32">
                            <div 
                              style={{ height: `${heightPct}%` }}
                              className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-lg group-hover:from-blue-500 group-hover:to-cyan-400 transition-all duration-300"
                            />
                          </div>
                          <span className="text-[11px] font-semibold text-gray-400 group-hover:text-white transition">
                            {dayData.day}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-gray-400 text-center">
                    Highest output registered on Thursdays with average {Math.max(...analyticsData.weeklyActivity.map(d => d.tasks))} tasks.
                  </p>
                </div>

                {/* Work Category Breakdown */}
                <div className="bg-[#1A1D21] border border-gray-800 rounded-2xl p-5 space-y-4">
                  <h3 className="font-bold text-white text-sm flex items-center">
                    <PieChart className="h-4 w-4 mr-2 text-purple-400" />
                    Work & Responsibility Allocation
                  </h3>

                  <div className="space-y-3 pt-1">
                    {analyticsData.workDistribution.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-300 font-medium">{item.category}</span>
                          <span className="font-bold text-white">{item.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${item.percentage}%` }}
                            className={`h-full ${item.color} rounded-full transition-all duration-500`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active Goals & Milestones */}
              <div className="bg-[#1A1D21] border border-gray-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm flex items-center">
                    <Target className="h-4 w-4 mr-2 text-amber-400" />
                    Current Quarter Goals & SLAs
                  </h3>
                  <span className="text-xs text-amber-400 font-medium">{analyticsData.goals.length} active goals</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {analyticsData.goals.map((goal, idx) => (
                    <div key={idx} className="bg-[#121317] border border-gray-800 p-3.5 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">{goal.title}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          goal.status === 'completed' 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {goal.status}
                        </span>
                      </div>
                      <div className="flex items-baseline space-x-1">
                        <span className="text-lg font-bold text-white">{goal.current}</span>
                        <span className="text-xs text-gray-500">/ {goal.target} {goal.unit}</span>
                      </div>
                      <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${Math.min(100, Math.round((goal.current / goal.target) * 100))}%` }}
                          className={`h-full ${goal.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badges & Achievements */}
              <div className="bg-[#1A1D21] border border-gray-800 rounded-2xl p-5 space-y-4">
                <h3 className="font-bold text-white text-sm flex items-center">
                  <Sparkles className="h-4 w-4 mr-2 text-amber-400" />
                  Earned Badges & Recognition
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {analyticsData.badges.map((badge) => (
                    <div key={badge.id} className="p-3.5 bg-[#121317] border border-gray-800 rounded-xl space-y-2 flex flex-col justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className={`p-2 rounded-lg font-bold ${badge.bg}`}>
                          <Award className="h-4 w-4" />
                        </div>
                        <div>
                          <h5 className="font-bold text-xs text-white">{badge.title}</h5>
                          <span className="text-[10px] text-gray-500 font-mono">Verified</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-400">{badge.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Log & Manager Review Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Activity Log */}
                <div className="bg-[#1A1D21] border border-gray-800 rounded-2xl p-5 space-y-4">
                  <h3 className="font-bold text-white text-sm flex items-center">
                    <Activity className="h-4 w-4 mr-2 text-blue-400" />
                    Recent Activity Log
                  </h3>

                  <div className="space-y-3">
                    {analyticsData.recentActivities.map((act) => (
                      <div key={act.id} className="p-3 bg-[#121317] border border-gray-800 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-200">{act.action}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                          <span className="bg-gray-800 px-2 py-0.5 rounded text-[10px] text-gray-400">{act.category}</span>
                          <span>{act.timestamp}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Manager Notes & Assessment */}
                <div className="bg-[#1A1D21] border border-gray-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-white text-sm flex items-center">
                        <Edit3 className="h-4 w-4 mr-2 text-amber-400" />
                        Manager Review & Notes
                      </h3>
                      {notesSavedAlert && (
                        <span className="text-xs text-emerald-400 font-bold flex items-center">
                          <Check className="h-3.5 w-3.5 mr-1" /> Saved!
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      Private performance notes for employee reviews. Visible to workspace managers.
                    </p>

                    <div className="mt-3">
                      {editingNotes ? (
                        <textarea
                          value={currentNoteText}
                          onChange={(e) => setCurrentNoteText(e.target.value)}
                          rows={4}
                          placeholder="Add performance evaluation, notes or feedback..."
                          className="w-full bg-[#121317] border border-blue-500 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none resize-none custom-scrollbar"
                        />
                      ) : (
                        <div className="bg-[#121317] border border-gray-800 rounded-xl p-3 text-xs text-gray-300 italic min-h-[90px] whitespace-pre-wrap">
                          {currentNoteText || 'No custom manager notes recorded for this employee yet. Click edit to add notes.'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-800 flex justify-end space-x-2">
                    {editingNotes ? (
                      <>
                        <button
                          onClick={() => setEditingNotes(false)}
                          className="px-3 py-1.5 text-xs text-gray-400 hover:text-white rounded-lg transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveNotes}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center space-x-1.5 transition cursor-pointer"
                        >
                          <Save className="h-3.5 w-3.5" />
                          <span>Save Evaluation</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setEditingNotes(true)}
                        className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold rounded-lg text-xs flex items-center space-x-1.5 transition cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-amber-400" />
                        <span>Edit Notes</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* TAB 2: SYSTEM ANALYSIS & OVERVIEW */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            
            {/* System Top Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#1A1D21] p-5 rounded-2xl border border-gray-800 relative overflow-hidden space-y-2">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-blue-500/10 rounded-xl">
                    <MessageCircle className="h-5 w-5 text-blue-500" />
                  </div>
                  <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">+14% MoM</span>
                </div>
                <h3 className="text-gray-400 text-xs font-semibold">Total Messages Logged</h3>
                <p className="text-3xl font-extrabold text-white">24,592</p>
                <p className="text-[11px] text-gray-500">Across 11 active workspace channels</p>
              </div>
              
              <div className="bg-[#1A1D21] p-5 rounded-2xl border border-gray-800 relative overflow-hidden space-y-2">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-purple-500/10 rounded-xl">
                    <Users className="h-5 w-5 text-purple-500" />
                  </div>
                  <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">100% Active</span>
                </div>
                <h3 className="text-gray-400 text-xs font-semibold">Active Teammates</h3>
                <p className="text-3xl font-extrabold text-white">{users.length}</p>
                <p className="text-[11px] text-gray-500">All member profiles verified</p>
              </div>
              
              <div className="bg-[#1A1D21] p-5 rounded-2xl border border-gray-800 relative overflow-hidden space-y-2">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                  </div>
                  <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">-18% Faster</span>
                </div>
                <h3 className="text-gray-400 text-xs font-semibold">Avg SLA Response Time</h3>
                <p className="text-3xl font-extrabold text-white">12.4 min</p>
                <p className="text-[11px] text-gray-500">Industry benchmark: 45 min</p>
              </div>
              
              <div className="bg-[#1A1D21] p-5 rounded-2xl border border-gray-800 relative overflow-hidden space-y-2">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-amber-500/10 rounded-xl">
                    <Shield className="h-5 w-5 text-amber-500" />
                  </div>
                  <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">99.98% Uptime</span>
                </div>
                <h3 className="text-gray-400 text-xs font-semibold">System Health & APIs</h3>
                <p className="text-3xl font-extrabold text-white">Optimal</p>
                <p className="text-[11px] text-gray-500">8 active integration endpoints</p>
              </div>
            </div>

            {/* Platform Distribution & Activity Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#1A1D21] p-6 rounded-2xl border border-gray-800 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">Omnichannel Traffic Distribution</h3>
                  <p className="text-xs text-gray-400 mb-6">Traffic volume handled per integration channel.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-emerald-400">WhatsApp Business</span>
                        <span className="text-gray-300 font-bold">42% (10,320 msg)</span>
                      </div>
                      <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[42%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-blue-400">Instagram Direct</span>
                        <span className="text-gray-300 font-bold">28% (6,880 msg)</span>
                      </div>
                      <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full w-[28%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-purple-400">Facebook Messenger</span>
                        <span className="text-gray-300 font-bold">18% (4,420 msg)</span>
                      </div>
                      <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full w-[18%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-amber-400">Web Portal & Chat</span>
                        <span className="text-gray-300 font-bold">12% (2,972 msg)</span>
                      </div>
                      <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full w-[12%]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-gray-800 flex justify-between text-xs text-gray-400">
                  <span>Total Inbound Sessions: <strong>8,420</strong></span>
                  <span>Avg Handling Time: <strong>3.2m</strong></span>
                </div>
              </div>

              {/* System Uptime & Milestones */}
              <div className="bg-[#1A1D21] p-6 rounded-2xl border border-gray-800 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">System Health & Milestones</h3>
                  <p className="text-xs text-gray-400 mb-6">Recent automated operational logs and SLAs.</p>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-[#121317] border border-gray-800 rounded-xl flex items-start space-x-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                      <div>
                        <h5 className="font-bold text-xs text-white">System Uptime 99.98% Achieved</h5>
                        <p className="text-[11px] text-gray-400 mt-0.5">Zero unhandled exceptions over the past 30 days.</p>
                        <span className="text-[10px] text-gray-500">Updated 1 hour ago</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#121317] border border-gray-800 rounded-xl flex items-start space-x-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                      <div>
                        <h5 className="font-bold text-xs text-white">100 Daily Tasks Milestone Reached</h5>
                        <p className="text-[11px] text-gray-400 mt-0.5">Crossed 100 resolved tickets in a single 24-hour cycle.</p>
                        <span className="text-[10px] text-gray-500">Updated 3 hours ago</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#121317] border border-gray-800 rounded-xl flex items-start space-x-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-purple-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                      <div>
                        <h5 className="font-bold text-xs text-white">Integration Webhooks Verified</h5>
                        <p className="text-[11px] text-gray-400 mt-0.5">All 8 endpoints operating with under 120ms latency.</p>
                        <span className="text-[10px] text-gray-500">Updated 5 hours ago</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-800 flex justify-end">
                  <span className="text-xs text-blue-400 font-semibold flex items-center cursor-pointer hover:underline">
                    View Full System Diagnostics Logs <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: TEAM MATRIX & LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="bg-[#1A1D21] border border-gray-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">Workspace Employee Leaderboard</h3>
                <p className="text-xs text-gray-400">Comparative matrix of efficiency, task delivery, and customer ratings.</p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400 font-medium">Sorted by:</span>
                <span className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold">Performance Score</span>
              </div>
            </div>

            {/* Leaderboard Table */}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="pb-3 px-3">Rank & Employee</th>
                    <th className="pb-3 px-3">Department</th>
                    <th className="pb-3 px-3">Score</th>
                    <th className="pb-3 px-3">Tasks Done</th>
                    <th className="pb-3 px-3">Avg Response</th>
                    <th className="pb-3 px-3">Karma</th>
                    <th className="pb-3 px-3">CSAT</th>
                    <th className="pb-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 text-xs">
                  {users
                    .map(u => ({ user: u, data: getEmployeeAnalytics(u.id, u) }))
                    .sort((a, b) => b.data.performanceScore - a.data.performanceScore)
                    .map(({ user, data }, index) => (
                      <tr key={user.id} className="hover:bg-[#22252B] transition group">
                        <td className="py-3.5 px-3">
                          <div className="flex items-center space-x-3">
                            <span className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                              index === 0 ? 'bg-amber-500 text-black font-extrabold' :
                              index === 1 ? 'bg-gray-300 text-black font-bold' :
                              index === 2 ? 'bg-amber-700 text-white font-bold' :
                              'bg-gray-800 text-gray-400'
                            }`}>
                              {index + 1}
                            </span>
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shrink-0">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-white group-hover:text-blue-400 transition flex items-center">
                                {user.name}
                                {user.role === 'Super Admin' && <Crown className="h-3 w-3 ml-1 text-amber-400 fill-amber-400 inline" />}
                              </div>
                              <div className="text-[11px] text-gray-500">{user.title || user.role}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="px-2 py-0.5 bg-gray-800 rounded text-[11px] text-gray-300 font-medium">
                            {data.department}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 font-bold text-white">
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded">
                            {data.performanceScore}% ({data.ratingGrade})
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-gray-200">
                          {data.stats.tasksCompleted} <span className="text-[10px] text-emerald-400">({data.stats.tasksOnTimePct}%)</span>
                        </td>

                        <td className="py-3.5 px-3 text-gray-200">
                          {data.stats.avgResponseMinutes} min
                        </td>

                        <td className="py-3.5 px-3 font-semibold text-amber-400">
                          {data.stats.karmaPoints} pts
                        </td>

                        <td className="py-3.5 px-3 font-semibold text-emerald-400">
                          {data.stats.csatScore} / 5
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setActiveTab('employees');
                            }}
                            className="px-3 py-1 bg-gray-800 hover:bg-blue-600 text-gray-300 hover:text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                          >
                            Full Analysis
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
