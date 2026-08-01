import React, { useState, useEffect } from 'react';
import { 
  Mail, Inbox, Send, Archive, Trash2, Star, Plus, Search, 
  Filter, Paperclip, ChevronRight, Check, X, Shield, RefreshCw, Eye,
  User, CheckCircle2, ArrowRight, CornerUpLeft, Clock
} from 'lucide-react';

export interface GmailAccount {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  badgeCount?: number;
}

export interface EmailThread {
  id: string;
  senderName: string;
  senderEmail: string;
  accountEmail: string;
  subject: string;
  snippet: string;
  body: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachment: boolean;
  folder?: 'inbox' | 'sent' | 'drafts';
}

const GMAIL_ACCOUNTS: GmailAccount[] = [
  { id: 'acc_abdullah', name: 'Abdullah demo one', email: 'abdullah.demo1@gmail.com', avatarColor: 'from-amber-500 to-red-500' },
  { id: 'acc_mohammed', name: 'Mohammed demo one', email: 'mohammed.demo1@gmail.com', avatarColor: 'from-blue-500 to-indigo-500' },
  { id: 'acc_alaa', name: 'Alaa demo one', email: 'alaa.demo1@gmail.com', avatarColor: 'from-purple-500 to-pink-500' },
  { id: 'acc_ibrahim', name: 'Ibrahim demo one', email: 'ibrahim.demo1@gmail.com', avatarColor: 'from-emerald-500 to-teal-500' },
];

const INITIAL_EMAILS: EmailThread[] = [
  // --- Abdullah demo one ---
  {
    id: 'email_abdullah_1',
    senderName: 'Esraa Al Barsiky',
    senderEmail: 'esraa.barsiky@democompany.com',
    accountEmail: 'abdullah.demo1@gmail.com',
    subject: 'Q3 Enterprise Strategy & Opener Stages Approval',
    snippet: 'Hi Abdullah, I finalized the Q3 executive roadmap and team allocations...',
    body: `Hi Abdullah,\n\nI have finalized the Q3 financial allocations across development, QA, and operational streams. Please review the attached breakdown.\n\nKey highlights:\n- Infrastructure budget optimized by 15%\n- New developer onboarding schedule finalized for Abdullah demo one workspace\n- Opener stages SLA metrics approved by Key Master\n\nBest regards,\nEsraa Al Barsiky`,
    date: '10:45 AM',
    isRead: false,
    isStarred: true,
    hasAttachment: true,
    folder: 'inbox'
  },
  {
    id: 'email_abdullah_2',
    senderName: 'Google Cloud Platform',
    senderEmail: 'no-reply@cloud.google.com',
    accountEmail: 'abdullah.demo1@gmail.com',
    subject: '[Action Required] Monthly Production Build Security Audit',
    snippet: 'Your Cloud Run container services passed automated compliance checks...',
    body: `Hello Abdullah demo one,\n\nYour monthly security audit for project "Demo Company Workspace" has completed successfully with zero high-severity vulnerabilities.\n\nAll container endpoints are operating at peak efficiency.`,
    date: 'Jul 28',
    isRead: true,
    isStarred: false,
    hasAttachment: false,
    folder: 'inbox'
  },

  // --- Mohammed demo one ---
  {
    id: 'email_mohammed_1',
    senderName: 'Khaled El Sayed',
    senderEmail: 'khaled.elsayed@fintech.me',
    accountEmail: 'mohammed.demo1@gmail.com',
    subject: 'Client Proposal Confirmation: Omnichannel Suite Deal',
    snippet: 'Thank you for transmitting the proposal to Mohammed demo one. We would like to schedule a call...',
    body: `Dear Mohammed demo one,\n\nWe received your proposal for the Omnichannel WhatsApp and Instagram Integration Suite. Everything looks aligned with our specifications.\n\nCould we arrange a technical kickoff call tomorrow morning?\n\nSincerely,\nKhaled El Sayed`,
    date: '09:15 AM',
    isRead: false,
    isStarred: true,
    hasAttachment: false,
    folder: 'inbox'
  },
  {
    id: 'email_mohammed_2',
    senderName: 'Calendly Automated',
    senderEmail: 'notifications@calendly.com',
    accountEmail: 'mohammed.demo1@gmail.com',
    subject: 'New Demo Scheduled: Enterprise CRM Negotiation Review',
    snippet: 'A new 30-minute discovery call has been scheduled on your calendar...',
    body: `Hi Mohammed demo one,\n\nA new prospect has scheduled a 30-minute demo session:\n\nClient: FinCorp Tech Leads\nDate: Tomorrow at 2:00 PM UTC\nTopic: CRM Pipeline & Negotiation Stage Overview`,
    date: 'Yesterday',
    isRead: true,
    isStarred: false,
    hasAttachment: false,
    folder: 'inbox'
  },

  // --- Alaa demo one ---
  {
    id: 'email_alaa_1',
    senderName: 'Support Escalations',
    senderEmail: 'support@democompany.com',
    accountEmail: 'alaa.demo1@gmail.com',
    subject: 'SLA Extension Review for Department Tasks',
    snippet: 'Alaa demo one - Please review the pending task extension requests...',
    body: `Hello Alaa demo one,\n\nTwo task follower extension requests have been submitted by the engineering team for Stage 3 Openers.\n\nPlease review them in the Follow-Uppers module when possible.\n\nThank you,\nSupport Desk`,
    date: '11:30 AM',
    isRead: false,
    isStarred: false,
    hasAttachment: true,
    folder: 'inbox'
  },
  {
    id: 'email_alaa_2',
    senderName: 'Procurement Billing',
    senderEmail: 'billing@cloudprovider.com',
    accountEmail: 'alaa.demo1@gmail.com',
    subject: 'Monthly Invoice #INV-2026-8841 Received',
    snippet: 'Your monthly hosting statement is available for download...',
    body: `Dear Alaa demo one,\n\nYour invoice #INV-2026-8841 for the billing cycle ending July 30, 2026 is attached.\n\nTotal Paid: $420.00\nStatus: Settled via Credit Card`,
    date: 'Jul 27',
    isRead: true,
    isStarred: false,
    hasAttachment: false,
    folder: 'inbox'
  },

  // --- Ibrahim demo one ---
  {
    id: 'email_ibrahim_1',
    senderName: 'DevOps Architecture Team',
    senderEmail: 'devops@democompany.com',
    accountEmail: 'ibrahim.demo1@gmail.com',
    subject: 'Database Migration & Server Deployment Successful',
    snippet: 'Ibrahim demo one - Container build #402 deployed cleanly to Cloud Run...',
    body: `Hi Ibrahim demo one,\n\nThe backend server build #402 was deployed to Cloud Run successfully.\n\nSummary:\n- Node.js ESM bundling active\n- All API endpoints operating with 0 latency latency spikes\n- Database connections pooled cleanly`,
    date: '08:00 AM',
    isRead: false,
    isStarred: true,
    hasAttachment: false,
    folder: 'inbox'
  },
  {
    id: 'email_ibrahim_2',
    senderName: 'Security Token Guard',
    senderEmail: 'auth@security.org',
    accountEmail: 'ibrahim.demo1@gmail.com',
    subject: 'API OAuth Keys Verification Summary',
    snippet: 'All 4 Gmail accounts (Abdullah, Mohammed, Alaa, Ibrahim) linked properly...',
    body: `Hello Ibrahim demo one,\n\nYour linked account authentication tokens for all four Gmail accounts were verified:\n- abdullah.demo1@gmail.com (Connected)\n- mohammed.demo1@gmail.com (Connected)\n- alaa.demo1@gmail.com (Connected)\n- ibrahim.demo1@gmail.com (Connected)\n\nNo action required.`,
    date: 'Jul 26',
    isRead: true,
    isStarred: false,
    hasAttachment: false,
    folder: 'inbox'
  }
];

export function MailView() {
  const [emails, setEmails] = useState<EmailThread[]>(() => {
    const saved = localStorage.getItem('demo_gmail_emails');
    return saved ? JSON.parse(saved) : INITIAL_EMAILS;
  });

  // Selected account filter: 'all' or specific account email
  const [activeAccountEmail, setActiveAccountEmail] = useState<string>('all');
  const [selectedEmail, setSelectedEmail] = useState<EmailThread | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  // Compose state
  const [composeFrom, setComposeFrom] = useState<string>('abdullah.demo1@gmail.com');
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  // Reply state
  const [replyBody, setReplyBody] = useState('');

  useEffect(() => {
    localStorage.setItem('demo_gmail_emails', JSON.stringify(emails));
  }, [emails]);

  // Set default selected email when account changes or emails update
  useEffect(() => {
    const filtered = emails.filter(e => activeAccountEmail === 'all' || e.accountEmail === activeAccountEmail);
    if (filtered.length > 0 && (!selectedEmail || !filtered.some(e => e.id === selectedEmail.id))) {
      setSelectedEmail(filtered[0]);
    } else if (filtered.length === 0) {
      setSelectedEmail(null);
    }
  }, [activeAccountEmail, emails]);

  const filteredEmails = emails.filter(e => {
    const matchesAccount = activeAccountEmail === 'all' || e.accountEmail === activeAccountEmail;
    const matchesSearch = e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.snippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.body.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAccount && matchesSearch;
  });

  const getUnreadCount = (accountEmail: string) => {
    if (accountEmail === 'all') {
      return emails.filter(e => !e.isRead).length;
    }
    return emails.filter(e => e.accountEmail === accountEmail && !e.isRead).length;
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim() || !composeSubject.trim()) return;

    const senderAccount = GMAIL_ACCOUNTS.find(a => a.email === composeFrom) || GMAIL_ACCOUNTS[0];

    const newEmail: EmailThread = {
      id: `email_sent_${Date.now()}`,
      senderName: senderAccount.name,
      senderEmail: senderAccount.email,
      accountEmail: senderAccount.email,
      subject: composeSubject.trim(),
      snippet: composeBody.trim().substring(0, 80) + '...',
      body: composeBody.trim() || 'No text content',
      date: 'Just now',
      isRead: true,
      isStarred: false,
      hasAttachment: false,
      folder: 'sent'
    };

    const updated = [newEmail, ...emails];
    setEmails(updated);
    setSelectedEmail(newEmail);
    setIsComposing(false);
    setComposeTo('');
    setComposeSubject('');
    setComposeBody('');
  };

  const handleSendReply = () => {
    if (!selectedEmail || !replyBody.trim()) return;

    const replyEmail: EmailThread = {
      id: `reply_${Date.now()}`,
      senderName: 'You',
      senderEmail: selectedEmail.accountEmail,
      accountEmail: selectedEmail.accountEmail,
      subject: `Re: ${selectedEmail.subject.replace(/^Re:\s*/i, '')}`,
      snippet: replyBody.trim().substring(0, 80) + '...',
      body: `On ${selectedEmail.date}, ${selectedEmail.senderName} wrote:\n> ${selectedEmail.body.split('\n').join('\n> ')}\n\n${replyBody.trim()}`,
      date: 'Just now',
      isRead: true,
      isStarred: false,
      hasAttachment: false,
      folder: 'sent'
    };

    const updated = [replyEmail, ...emails];
    setEmails(updated);
    setSelectedEmail(replyEmail);
    setReplyBody('');
  };

  const activeAccount = GMAIL_ACCOUNTS.find(a => a.email === activeAccountEmail);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1A1D21] text-gray-200 overflow-hidden">
      {/* Top Header */}
      <div className="h-16 border-b border-gray-800 px-6 flex items-center justify-between shrink-0 bg-[#121317]">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-tr from-red-500 to-amber-500 text-white rounded-xl shadow-lg">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-white text-base">Unfiled Mail Box — Linked Gmail Accounts</h2>
              <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">
                4 Active Accounts Linked
              </span>
            </div>
            <p className="text-xs text-gray-400">Select any of your 4 Gmail demo accounts to access its inbox and send emails.</p>
          </div>
        </div>

        <button 
          onClick={() => {
            if (activeAccountEmail !== 'all') {
              setComposeFrom(activeAccountEmail);
            } else {
              setComposeFrom(GMAIL_ACCOUNTS[0].email);
            }
            setIsComposing(true);
          }}
          className="px-4 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center space-x-2 shadow-lg shadow-red-900/40"
        >
          <Plus className="h-4 w-4" />
          <span>Compose New Email</span>
        </button>
      </div>

      {/* THE 4 LINKED GMAIL ACCOUNTS NAVIGATION BAR */}
      <div className="p-4 bg-[#121317]/80 border-b border-gray-800">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
          <span>Linked Gmail Accounts ({GMAIL_ACCOUNTS.length} Accounts):</span>
          <span className="text-amber-400 font-mono text-[11px]">Click an account to isolate its inbox</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* ALL ACCOUNTS TAB */}
          <button
            onClick={() => setActiveAccountEmail('all')}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
              activeAccountEmail === 'all'
                ? 'bg-[#1A1D21] border-red-500/80 shadow-lg shadow-red-950/40 ring-1 ring-red-500/50'
                : 'bg-[#16181D] border-gray-800 hover:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-7 h-7 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-white font-bold text-xs">
                ALL
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                {getUnreadCount('all')} Unread
              </span>
            </div>
            <div>
              <div className="text-xs font-bold text-white">All Linked Inboxes</div>
              <div className="text-[10px] text-gray-400">Unified 4 Gmail Streams</div>
            </div>
          </button>

          {/* THE 4 INDIVIDUAL GMAIL ACCOUNTS */}
          {GMAIL_ACCOUNTS.map(account => {
            const isSelected = activeAccountEmail === account.email;
            const unread = getUnreadCount(account.email);

            return (
              <button
                key={account.id}
                onClick={() => setActiveAccountEmail(account.email)}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#1A1D21] border-red-500/90 shadow-lg shadow-red-950/50 ring-1 ring-red-500/50'
                    : 'bg-[#16181D] border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-7 h-7 rounded-xl bg-gradient-to-tr ${account.avatarColor} flex items-center justify-center text-white font-bold text-xs shadow`}>
                    {account.name.charAt(0)}
                  </div>
                  {unread > 0 ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                      {unread} New
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-gray-500">
                      Ready
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-white truncate">{account.name}</div>
                  <div className="text-[10px] text-gray-400 font-mono truncate">{account.email}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SEARCH AND INBOX INDICATOR BAR */}
      <div className="px-6 py-2.5 bg-[#14161B] border-b border-gray-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-gray-400">Viewing Inbox:</span>
          <span className="font-bold text-white bg-red-500/10 border border-red-500/30 px-2.5 py-1 rounded-lg text-red-300">
            {activeAccount ? `${activeAccount.name} (${activeAccount.email})` : 'All 4 Linked Gmail Accounts'}
          </span>
          <span className="text-gray-500">({filteredEmails.length} messages)</span>
        </div>

        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
          <input 
            type="text"
            placeholder="Search email threads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1A1D21] border border-gray-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      {/* MAIN SPLIT PANELS (EMAILS LIST + READING PANE) */}
      <div className="flex-1 flex min-h-0">
        {/* Email List Column */}
        <div className="w-96 border-r border-gray-800 bg-[#121317] flex flex-col overflow-y-auto shrink-0 custom-scrollbar">
          {filteredEmails.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500 space-y-2">
              <Mail className="h-8 w-8 mx-auto text-gray-600 opacity-50" />
              <p>No email messages found for this account.</p>
            </div>
          ) : (
            filteredEmails.map((email) => {
              const isSelected = selectedEmail?.id === email.id;
              const accountOfEmail = GMAIL_ACCOUNTS.find(a => a.email === email.accountEmail);

              return (
                <div
                  key={email.id}
                  onClick={() => {
                    setSelectedEmail(email);
                    setEmails(emails.map(e => e.id === email.id ? { ...e, isRead: true } : e));
                  }}
                  className={`p-4 border-b border-gray-800/80 cursor-pointer transition select-none relative ${
                    isSelected ? 'bg-[#1A1D21] border-l-4 border-l-red-500' : 'hover:bg-[#1A1D21]/60'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs font-bold truncate max-w-[190px] ${email.isRead ? 'text-gray-300' : 'text-white'}`}>
                      {email.senderName}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">{email.date}</span>
                  </div>

                  <h4 className={`text-xs font-semibold mb-1 line-clamp-1 ${email.isRead ? 'text-gray-400' : 'text-amber-300'}`}>
                    {email.subject}
                  </h4>

                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                    {email.snippet}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-[10px]">
                    <span className="px-2 py-0.5 rounded-md bg-[#16181D] border border-gray-800 text-gray-300 font-mono truncate max-w-[170px] flex items-center space-x-1">
                      <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${accountOfEmail?.avatarColor || 'from-gray-500 to-gray-700'}`}></span>
                      <span className="truncate">{email.accountEmail}</span>
                    </span>
                    {email.hasAttachment && (
                      <span className="flex items-center text-amber-400"><Paperclip className="h-3 w-3 mr-0.5" /> Attachment</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Email Reading Pane */}
        <div className="flex-1 flex flex-col bg-[#1A1D21] overflow-y-auto p-6 custom-scrollbar">
          {selectedEmail ? (
            <div className="max-w-4xl space-y-6 mx-auto w-full">
              {/* Email Subject & Account Header */}
              <div className="pb-5 border-b border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-extrabold text-white">{selectedEmail.subject}</h3>
                  <span className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-300 font-mono text-xs rounded-full font-bold">
                    Inbox Account: {selectedEmail.accountEmail}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-[#121317] p-3.5 rounded-2xl border border-gray-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-600 text-white flex items-center justify-center font-bold text-sm shadow">
                      {selectedEmail.senderName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs">{selectedEmail.senderName} &lt;{selectedEmail.senderEmail}&gt;</div>
                      <div className="text-[11px] text-gray-400 font-mono mt-0.5">To: {selectedEmail.accountEmail} • {selectedEmail.date}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setEmails(emails.map(e => e.id === selectedEmail.id ? { ...e, isStarred: !e.isStarred } : e))}
                      className={`p-2 rounded-xl border ${selectedEmail.isStarred ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-[#1A1D21] text-gray-400 border-gray-800'}`}
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Email Body Content */}
              <div className="prose prose-invert max-w-none text-xs text-gray-200 whitespace-pre-wrap leading-relaxed bg-[#121317] p-6 border border-gray-800 rounded-2xl shadow-xl">
                {selectedEmail.body}
              </div>

              {/* Quick Reply Toolbar */}
              <div className="p-5 bg-[#121317] border border-gray-800 rounded-2xl space-y-3 shadow-xl">
                <div className="flex items-center justify-between text-xs font-bold text-gray-300">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <CornerUpLeft className="h-4 w-4" /> Direct Reply from {selectedEmail.accountEmail}
                  </span>
                  <span className="text-gray-500 font-mono">Replying to {selectedEmail.senderName}</span>
                </div>

                <textarea 
                  rows={3}
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder={`Write your email response from ${selectedEmail.accountEmail}...`}
                  className="w-full bg-[#1A1D21] border border-gray-800 rounded-xl p-3.5 text-xs text-gray-200 focus:outline-none focus:border-red-500 custom-scrollbar"
                />

                <div className="flex justify-between items-center pt-1">
                  <span className="text-[11px] text-gray-500">Sent emails will automatically sync with this account's inbox history.</span>
                  <button 
                    onClick={handleSendReply}
                    disabled={!replyBody.trim()}
                    className="px-5 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer shadow-lg shadow-red-900/30 flex items-center space-x-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send Reply</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-3">
              <Mail className="h-12 w-12 opacity-30 text-red-400" />
              <p className="text-sm font-semibold">Select an email thread to read messages</p>
            </div>
          )}
        </div>
      </div>

      {/* COMPOSE EMAIL MODAL */}
      {isComposing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121317] border border-gray-800 rounded-3xl w-full max-w-2xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-gray-800 pb-4">
              <div className="flex items-center space-x-2">
                <Send className="h-5 w-5 text-red-400" />
                <h3 className="font-bold text-white text-base">Compose Email Message</h3>
              </div>
              <button onClick={() => setIsComposing(false)} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1.5">From Gmail Account *</label>
                <select 
                  value={composeFrom}
                  onChange={(e) => setComposeFrom(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-gray-700 rounded-xl px-3.5 py-2.5 text-white font-semibold focus:outline-none focus:border-red-500 cursor-pointer"
                >
                  {GMAIL_ACCOUNTS.map(a => (
                    <option key={a.id} value={a.email}>
                      {a.name} ({a.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1.5">Recipient Email (To) *</label>
                <input 
                  type="email"
                  placeholder="e.g. recipient@company.com"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-gray-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1.5">Subject Line *</label>
                <input 
                  type="text"
                  placeholder="Subject of the email..."
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-gray-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1.5">Email Body Content</label>
                <textarea 
                  rows={6}
                  placeholder="Write message content here..."
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-gray-700 rounded-xl p-3.5 text-white focus:outline-none focus:border-red-500 custom-scrollbar"
                />
              </div>

              <div className="pt-3 border-t border-gray-800 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setIsComposing(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 font-bold rounded-xl hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold rounded-xl shadow-lg shadow-red-900/30 cursor-pointer flex items-center space-x-1.5"
                >
                  <Send className="h-4 w-4" />
                  <span>Send Email</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
