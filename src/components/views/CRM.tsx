import React, { useState, useEffect } from 'react';
import { 
  Kanban, Plus, Search, Filter, DollarSign, User, Building, 
  Tag, Calendar, ArrowRight, CheckCircle2, XCircle, Clock, 
  MessageSquare, Mail, CheckSquare, MoreHorizontal, TrendingUp, X, Sparkles,
  Users, Briefcase, Award, ArrowUpRight, ChevronRight, Phone, ShieldCheck, FileText, Check
} from 'lucide-react';
import { DealItem, LeadItem, ClientItem } from '../../types';

// Default Demo Deals
const INITIAL_DEALS: DealItem[] = [
  {
    id: 'deal_1',
    title: 'Enterprise ERP License Expansion',
    contactId: 'c1',
    contactName: 'Esraa Al Barsiky',
    companyName: 'HR Tech Global',
    value: 45000,
    currency: 'USD',
    stage: 'Proposal',
    assignedTo: 'Abdallah Sayed',
    createdAt: '2026-07-20',
    expectedCloseDate: '2026-08-15',
    notes: 'In active negotiation stage. Client requested 10% volume discount for 3-year agreement.'
  },
  {
    id: 'deal_2',
    title: 'Omnichannel WhatsApp Commerce Suite',
    contactId: 'c2',
    contactName: 'Khaled El Sayed',
    companyName: 'FinCorp Middle East',
    value: 28000,
    currency: 'USD',
    stage: 'Contacted',
    assignedTo: 'Mohammed demo one',
    createdAt: '2026-07-22',
    expectedCloseDate: '2026-08-30',
    notes: 'Initial discovery call finished. Proposal deck sent yesterday.'
  },
  {
    id: 'deal_3',
    title: 'Cloud Infrastructure Migration & Managed SLA',
    contactId: 'c3',
    contactName: 'Abdulrahman Muhammad',
    companyName: 'Demo Company Cloud Services',
    value: 62000,
    currency: 'USD',
    stage: 'Lead',
    assignedTo: 'Ibrahim demo one',
    createdAt: '2026-07-25',
    expectedCloseDate: '2026-09-10',
    notes: 'New incoming inquiry from web intake form.'
  },
  {
    id: 'deal_4',
    title: 'AI Customer Service Bot Integration',
    contactId: 'c4',
    contactName: 'Moataz Radwan',
    companyName: 'Demo Company Logistics',
    value: 18500,
    currency: 'USD',
    stage: 'Won',
    assignedTo: 'Abdallah Sayed',
    createdAt: '2026-07-15',
    expectedCloseDate: '2026-07-28',
    notes: 'Closed Won! Contract signed and payment received.',
    closedReason: 'Superior AI bot customization capabilities'
  },
  {
    id: 'deal_5',
    title: 'Custom POS Module Customization',
    contactId: 'c5',
    contactName: 'Shaza Ibrahim',
    companyName: 'Retail Chains Co.',
    value: 12000,
    currency: 'USD',
    stage: 'Proposal',
    assignedTo: 'Alaa demo one',
    createdAt: '2026-07-18',
    expectedCloseDate: '2026-08-05',
    notes: 'Negotiating custom SLA terms for retail outlets.'
  },
  {
    id: 'deal_6',
    title: 'Legacy Database Refactoring Service',
    contactId: 'c6',
    contactName: 'Tarek Mahmoud',
    companyName: 'DataSphere Tech',
    value: 34000,
    currency: 'USD',
    stage: 'Lost',
    assignedTo: 'Mohammed demo one',
    createdAt: '2026-07-05',
    expectedCloseDate: '2026-07-20',
    notes: 'Closed Lost due to internal budget freeze at client company.',
    closedReason: 'Client budget cancellation'
  }
];

// Default Demo Leads
const INITIAL_LEADS: LeadItem[] = [
  {
    id: 'lead_1',
    name: 'Sami Mansour',
    company: 'Apex Financial Systems',
    email: 'sami.mansour@apexfin.com',
    phone: '+966 50 123 4567',
    source: 'Website Inbound',
    status: 'In Negotiation',
    estimatedValue: 35000,
    assignedTo: 'Abdallah Sayed',
    createdAt: '2026-07-26',
    notes: 'Interested in enterprise seat licenses and custom API integrations.'
  },
  {
    id: 'lead_2',
    name: 'Nour El Hoda',
    company: 'MediCare Pharmacies',
    email: 'nour.hoda@medicare.eg',
    phone: '+20 100 987 6543',
    source: 'LinkedIn Campaign',
    status: 'New',
    estimatedValue: 22000,
    assignedTo: 'Mohammed demo one',
    createdAt: '2026-07-28',
    notes: 'Requested product brochure for multi-location inventory tracking.'
  },
  {
    id: 'lead_3',
    name: 'Omar Farooq',
    company: 'LogiXpress Logistics',
    email: 'omar.farooq@logix.com',
    phone: '+971 52 444 8899',
    source: 'Partner Referral',
    status: 'Qualified',
    estimatedValue: 50000,
    assignedTo: 'Alaa demo one',
    createdAt: '2026-07-24',
    notes: 'Qualified prospect with budget approved for Q3 implementation.'
  }
];

// Default Demo Clients
const INITIAL_CLIENTS: ClientItem[] = [
  {
    id: 'client_1',
    companyName: 'HR Tech Global',
    contactName: 'Esraa Al Barsiky',
    email: 'esraa.barsiky@democompany.com',
    phone: '+20 109 111 2222',
    industry: 'Human Resources Software',
    status: 'VIP',
    totalRevenue: 125000,
    activeDealsCount: 2,
    accountManager: 'Abdallah Sayed',
    joinedDate: '2025-11-12'
  },
  {
    id: 'client_2',
    companyName: 'FinCorp Middle East',
    contactName: 'Khaled El Sayed',
    email: 'khaled.elsayed@fintech.me',
    phone: '+966 55 999 0000',
    industry: 'Banking & Financial Services',
    status: 'Active',
    totalRevenue: 85000,
    activeDealsCount: 1,
    accountManager: 'Mohammed demo one',
    joinedDate: '2026-02-01'
  },
  {
    id: 'client_3',
    companyName: 'Demo Company Logistics',
    contactName: 'Moataz Radwan',
    email: 'moataz.radwan@democompany.com',
    phone: '+20 122 333 4444',
    industry: 'Supply Chain & Logistics',
    status: 'Active',
    totalRevenue: 48500,
    activeDealsCount: 1,
    accountManager: 'Alaa demo one',
    joinedDate: '2026-04-18'
  }
];

const PIPELINE_STAGES: { key: DealItem['stage']; label: string; badgeBg: string; border: string; desc: string }[] = [
  { key: 'Lead', label: '1. Lead Intake', badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30', border: 'border-blue-500/40', desc: 'New qualified inquiries' },
  { key: 'Contacted', label: '2. Contacted & Discovery', badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30', border: 'border-purple-500/40', desc: 'Needs assessment & demo' },
  { key: 'Proposal', label: '3. Proposal & Negotiation', badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30', border: 'border-amber-500/40', desc: 'Contract terms & negotiation' },
  { key: 'Won', label: '4. Closed Won', badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', border: 'border-emerald-500/40', desc: 'Signed contract & won revenue' },
  { key: 'Lost', label: '5. Closed Lost', badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30', border: 'border-rose-500/40', desc: 'Unsuccessful or cancelled deals' }
];

export function CRMView() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'leads' | 'clients'>('pipeline');

  // Persistence State
  const [deals, setDeals] = useState<DealItem[]>(() => {
    const saved = localStorage.getItem('demo_crm_deals');
    return saved ? JSON.parse(saved) : INITIAL_DEALS;
  });

  const [leads, setLeads] = useState<LeadItem[]>(() => {
    const saved = localStorage.getItem('demo_crm_leads');
    return saved ? JSON.parse(saved) : INITIAL_LEADS;
  });

  const [clients, setClients] = useState<ClientItem[]>(() => {
    const saved = localStorage.getItem('demo_crm_clients');
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  useEffect(() => {
    localStorage.setItem('demo_crm_deals', JSON.stringify(deals));
  }, [deals]);

  useEffect(() => {
    localStorage.setItem('demo_crm_leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem('demo_crm_clients', JSON.stringify(clients));
  }, [clients]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<DealItem | null>(null);

  // Modals
  const [isCreateDealOpen, setIsCreateDealOpen] = useState(false);
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);

  // Deal Form State
  const [dealTitle, setDealTitle] = useState('');
  const [dealContact, setDealContact] = useState('');
  const [dealCompany, setDealCompany] = useState('');
  const [dealValue, setDealValue] = useState(25000);
  const [dealStage, setDealStage] = useState<DealItem['stage']>('Proposal');
  const [dealAssignee, setDealAssignee] = useState('Abdallah Sayed');
  const [dealCloseDate, setDealCloseDate] = useState('2026-08-30');
  const [dealNotes, setDealNotes] = useState('');

  // Lead Form State
  const [leadName, setLeadName] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadSource, setLeadSource] = useState('Website Inbound');
  const [leadValue, setLeadValue] = useState(20000);

  // Client Form State
  const [clientCompany, setClientCompany] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientIndustry, setClientIndustry] = useState('Software Tech');

  // Calculation Metrics
  const totalPipelineValue = deals.reduce((sum, d) => sum + d.value, 0);
  const wonValue = deals.filter(d => d.stage === 'Won').reduce((sum, d) => sum + d.value, 0);
  const negotiationDeals = deals.filter(d => d.stage === 'Proposal');
  const negotiationValue = negotiationDeals.reduce((sum, d) => sum + d.value, 0);
  const lostDeals = deals.filter(d => d.stage === 'Lost');

  const winRate = deals.length > 0 
    ? Math.round((deals.filter(d => d.stage === 'Won').length / (deals.filter(d => d.stage === 'Won' || d.stage === 'Lost').length || 1)) * 100) 
    : 0;

  // Handlers
  const handleCreateDealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealTitle.trim()) return;

    const newDeal: DealItem = {
      id: `deal_${Date.now()}`,
      title: dealTitle.trim(),
      contactId: `c_${Date.now()}`,
      contactName: dealContact.trim() || 'Direct Prospect',
      companyName: dealCompany.trim() || 'Independent Client',
      value: Number(dealValue) || 0,
      currency: 'USD',
      stage: dealStage,
      assignedTo: dealAssignee,
      createdAt: new Date().toISOString().split('T')[0],
      expectedCloseDate: dealCloseDate,
      notes: dealNotes.trim()
    };

    setDeals([newDeal, ...deals]);
    setIsCreateDealOpen(false);
    setDealTitle('');
    setDealContact('');
    setDealCompany('');
    setDealNotes('');
  };

  const handleCreateLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !leadCompany.trim()) return;

    const newLead: LeadItem = {
      id: `lead_${Date.now()}`,
      name: leadName.trim(),
      company: leadCompany.trim(),
      email: leadEmail.trim() || 'lead@company.com',
      phone: leadPhone.trim() || '+1 555-0199',
      source: leadSource,
      status: 'New',
      estimatedValue: Number(leadValue) || 15000,
      assignedTo: 'Abdallah Sayed',
      createdAt: new Date().toISOString().split('T')[0]
    };

    setLeads([newLead, ...leads]);
    setIsCreateLeadOpen(false);
    setLeadName('');
    setLeadCompany('');
    setLeadEmail('');
    setLeadPhone('');
  };

  const handleCreateClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientCompany.trim() || !clientContact.trim()) return;

    const newClient: ClientItem = {
      id: `client_${Date.now()}`,
      companyName: clientCompany.trim(),
      contactName: clientContact.trim(),
      email: clientEmail.trim() || 'contact@client.com',
      phone: clientPhone.trim() || '+1 555-0188',
      industry: clientIndustry,
      status: 'Active',
      totalRevenue: 0,
      activeDealsCount: 0,
      accountManager: 'Abdallah Sayed',
      joinedDate: new Date().toISOString().split('T')[0]
    };

    setClients([newClient, ...clients]);
    setIsCreateClientOpen(false);
    setClientCompany('');
    setClientContact('');
    setClientEmail('');
    setClientPhone('');
  };

  const handleConvertLeadToDeal = (lead: LeadItem) => {
    // 1. Create Deal in Proposal / Negotiation stage
    const convertedDeal: DealItem = {
      id: `deal_conv_${Date.now()}`,
      title: `${lead.company} — Enterprise Software Agreement`,
      contactId: `c_${lead.id}`,
      contactName: lead.name,
      companyName: lead.company,
      value: lead.estimatedValue,
      currency: 'USD',
      stage: 'Proposal', // Negotiation Stage!
      assignedTo: lead.assignedTo,
      createdAt: new Date().toISOString().split('T')[0],
      expectedCloseDate: '2026-08-30',
      notes: `Converted from Lead (${lead.source}). Lead Notes: ${lead.notes || 'None'}`
    };

    // 2. Create Client record
    const convertedClient: ClientItem = {
      id: `client_conv_${Date.now()}`,
      companyName: lead.company,
      contactName: lead.name,
      email: lead.email,
      phone: lead.phone,
      industry: 'Enterprise Client',
      status: 'Active',
      totalRevenue: lead.estimatedValue,
      activeDealsCount: 1,
      accountManager: lead.assignedTo,
      joinedDate: new Date().toISOString().split('T')[0]
    };

    // 3. Update state
    setDeals([convertedDeal, ...deals]);
    setClients([convertedClient, ...clients]);
    setLeads(leads.map(l => l.id === lead.id ? { ...l, status: 'Converted' } : l));
  };

  const handleMoveStage = (dealId: string, nextStage: DealItem['stage']) => {
    const updated = deals.map(d => d.id === dealId ? { ...d, stage: nextStage } : d);
    setDeals(updated);
    if (selectedDeal && selectedDeal.id === dealId) {
      setSelectedDeal({ ...selectedDeal, stage: nextStage });
    }
  };

  const filteredDeals = deals.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.companyName && d.companyName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1A1D21] text-gray-200 overflow-hidden">
      
      {/* HEADER BAR & METRICS PANEL */}
      <div className="border-b border-gray-800 bg-[#121317] p-5 shrink-0 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-tr from-amber-500 to-indigo-600 text-white rounded-2xl shadow-lg">
              <Kanban className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-extrabold text-white text-lg">Enterprise CRM & Sales Pipeline</h2>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2.5 py-0.5 rounded-full border border-amber-500/30 uppercase font-bold">
                  Leads • Deals • Clients
                </span>
              </div>
              <p className="text-xs text-gray-400">Complete CRM management suite for prospect conversion, negotiation stages, and client retention.</p>
            </div>
          </div>

          {/* Module Nav Tabs */}
          <div className="flex items-center space-x-2 bg-[#1A1D21] p-1.5 rounded-2xl border border-gray-800">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
                activeTab === 'pipeline'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Kanban className="h-4 w-4" />
              <span>Deals Pipeline ({deals.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('leads')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
                activeTab === 'leads'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Leads Management ({leads.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
                activeTab === 'clients'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Briefcase className="h-4 w-4" />
              <span>Clients Directory ({clients.length})</span>
            </button>
          </div>
        </div>

        {/* METRICS & NEGOTIATION STAGE SUMMARY CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
          <div className="bg-[#181B22] border border-gray-800 p-3.5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">Total Pipeline Value</span>
              <span className="text-lg font-extrabold text-amber-400 font-mono">${totalPipelineValue.toLocaleString()}</span>
            </div>
            <DollarSign className="h-6 w-6 text-amber-500/40" />
          </div>

          <div className="bg-[#181B22] border border-amber-500/40 p-3.5 rounded-2xl flex items-center justify-between shadow-lg shadow-amber-950/30">
            <div>
              <span className="text-amber-300 text-[10px] uppercase font-bold block flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-400" /> Active Negotiation Stage
              </span>
              <span className="text-lg font-extrabold text-white font-mono">${negotiationValue.toLocaleString()}</span>
              <span className="text-[10px] text-gray-400 block font-mono">{negotiationDeals.length} Deals in Proposal/Negotiation</span>
            </div>
            <Briefcase className="h-6 w-6 text-amber-400" />
          </div>

          <div className="bg-[#181B22] border border-gray-800 p-3.5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">Closed Won Revenue</span>
              <span className="text-lg font-extrabold text-emerald-400 font-mono">${wonValue.toLocaleString()}</span>
            </div>
            <Award className="h-6 w-6 text-emerald-500/40" />
          </div>

          <div className="bg-[#181B22] border border-gray-800 p-3.5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">Pipeline Win Rate</span>
              <span className="text-lg font-extrabold text-indigo-400 font-mono">{winRate}% Won</span>
              <span className="text-[10px] text-gray-500 block">{deals.filter(d => d.stage === 'Won').length} Won vs {lostDeals.length} Lost</span>
            </div>
            <TrendingUp className="h-6 w-6 text-indigo-500/40" />
          </div>
        </div>
      </div>

      {/* TABS CONTENT */}
      {activeTab === 'pipeline' && (
        /* ================================================================= */
        /* TAB 1: DEALS KANBAN PIPELINE BOARD */
        /* ================================================================= */
        <div className="flex-1 flex flex-col min-h-0">
          {/* Sub-bar */}
          <div className="px-6 py-3 bg-[#14161B] border-b border-gray-800 flex items-center justify-between shrink-0">
            <div className="relative w-80">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
              <input 
                type="text"
                placeholder="Search deals, contacts or companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1A1D21] border border-gray-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              onClick={() => setIsCreateDealOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-lg shadow-amber-900/30"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Deal</span>
            </button>
          </div>

          {/* Kanban Columns */}
          <div className="flex-1 overflow-x-auto p-6 flex gap-5 custom-scrollbar bg-gradient-to-b from-[#1A1D21] to-[#14161B]">
            {PIPELINE_STAGES.map(stage => {
              const stageDeals = filteredDeals.filter(d => d.stage === stage.key);
              const stageTotal = stageDeals.reduce((sum, d) => sum + d.value, 0);
              const isNegotiationStage = stage.key === 'Proposal';

              return (
                <div
                  key={stage.key}
                  className={`w-80 shrink-0 flex flex-col rounded-3xl border bg-[#121317] max-h-full shadow-xl transition ${
                    isNegotiationStage ? 'border-amber-500/80 ring-1 ring-amber-500/30' : 'border-gray-800'
                  }`}
                >
                  {/* Column Header */}
                  <div className="p-4 border-b border-gray-800 space-y-1 rounded-t-3xl bg-[#171920]">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${stage.badgeBg}`}>
                        {stage.label}
                      </span>
                      <span className="text-xs font-mono font-bold text-white">${stageTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                      <span>{stage.desc}</span>
                      <span className="font-mono font-bold">({stageDeals.length} deals)</span>
                    </div>
                  </div>

                  {/* Deals Cards Container */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar min-h-[250px]">
                    {stageDeals.length === 0 ? (
                      <div className="text-center py-10 text-gray-500 text-xs italic">
                        No deals in {stage.label}
                      </div>
                    ) : (
                      stageDeals.map(deal => (
                        <div
                          key={deal.id}
                          onClick={() => setSelectedDeal(deal)}
                          className="bg-[#181B22] hover:bg-[#1E222B] border border-gray-800 hover:border-amber-500/60 p-4 rounded-2xl space-y-3 cursor-pointer transition shadow-md group relative"
                        >
                          {/* Title & Value */}
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-bold text-xs text-white group-hover:text-amber-300 transition line-clamp-2 leading-snug">
                                {deal.title}
                              </h4>
                            </div>
                            <div className="text-sm font-extrabold text-amber-400 font-mono mt-1">
                              ${deal.value.toLocaleString()} <span className="text-[10px] text-gray-500 font-normal">USD</span>
                            </div>
                          </div>

                          {/* Contact & Company */}
                          <div className="text-[11px] text-gray-300 space-y-1 bg-[#121317] p-2.5 rounded-xl border border-gray-800/80">
                            <div className="flex items-center space-x-1.5 font-semibold text-white">
                              <User className="h-3 w-3 text-indigo-400 shrink-0" />
                              <span className="truncate">{deal.contactName}</span>
                            </div>
                            {deal.companyName && (
                              <div className="flex items-center space-x-1.5 text-gray-400 text-[10px]">
                                <Building className="h-3 w-3 text-gray-500 shrink-0" />
                                <span className="truncate">{deal.companyName}</span>
                              </div>
                            )}
                          </div>

                          {/* Footer Info */}
                          <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-800">
                            <span className="font-mono text-gray-500">{deal.assignedTo}</span>
                            {deal.expectedCloseDate && (
                              <span className="text-amber-300 font-mono">Close: {deal.expectedCloseDate}</span>
                            )}
                          </div>

                          {/* Fast Move Stage Control Buttons */}
                          <div className="flex items-center space-x-1 pt-1 opacity-80 group-hover:opacity-100 transition">
                            {stage.key !== 'Proposal' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveStage(deal.id, 'Proposal');
                                }}
                                className="flex-1 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-lg border border-amber-500/30 text-center"
                                title="Move to Negotiation Stage"
                              >
                                Move to Negotiation
                              </button>
                            )}

                            {stage.key !== 'Won' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveStage(deal.id, 'Won');
                                }}
                                className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-lg border border-emerald-500/30"
                                title="Mark Won"
                              >
                                Won
                              </button>
                            )}

                            {stage.key !== 'Lost' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveStage(deal.id, 'Lost');
                                }}
                                className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[10px] font-bold rounded-lg border border-rose-500/30"
                                title="Mark Lost"
                              >
                                Lost
                              </button>
                            )}
                          </div>

                        </div>
                      ))
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'leads' && (
        /* ================================================================= */
        /* TAB 2: LEADS MANAGEMENT MODULE */
        /* ================================================================= */
        <div className="flex-1 flex flex-col min-h-0 bg-[#14161B] p-6 space-y-4 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                <Users className="h-5 w-5 text-amber-400" />
                <span>Sales Leads Database</span>
              </h3>
              <p className="text-xs text-gray-400">Incoming potential leads ready for discovery and conversion to deals.</p>
            </div>

            <button
              onClick={() => setIsCreateLeadOpen(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center space-x-1.5 shadow"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Lead</span>
            </button>
          </div>

          <div className="bg-[#121317] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#181B22] text-gray-400 uppercase text-[10px] font-bold tracking-wider border-b border-gray-800">
                  <tr>
                    <th className="p-4">Lead Name & Company</th>
                    <th className="p-4">Contact Details</th>
                    <th className="p-4">Lead Source</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Est. Value</th>
                    <th className="p-4">Sales Rep</th>
                    <th className="p-4 text-right">Convert Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-[#181B22]/60 transition">
                      <td className="p-4">
                        <div className="font-bold text-white text-xs">{lead.name}</div>
                        <div className="text-[11px] text-gray-400">{lead.company}</div>
                      </td>
                      <td className="p-4 font-mono text-[11px] text-gray-300 space-y-0.5">
                        <div>{lead.email}</div>
                        <div className="text-gray-500">{lead.phone}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-gray-800 text-gray-300 rounded-lg border border-gray-700 font-semibold text-[11px]">
                          {lead.source}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] uppercase border ${
                          lead.status === 'In Negotiation'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : lead.status === 'Converted'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        }`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-amber-400 text-xs">
                        ${lead.estimatedValue.toLocaleString()} USD
                      </td>
                      <td className="p-4 text-gray-400 font-mono text-xs">
                        {lead.assignedTo}
                      </td>
                      <td className="p-4 text-right">
                        {lead.status !== 'Converted' ? (
                          <button
                            onClick={() => handleConvertLeadToDeal(lead)}
                            className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center space-x-1 ml-auto"
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                            <span>Convert to Deal & Client</span>
                          </button>
                        ) : (
                          <span className="text-emerald-400 font-bold text-xs flex items-center justify-end gap-1">
                            <Check className="h-4 w-4" /> Converted
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'clients' && (
        /* ================================================================= */
        /* TAB 3: CLIENTS DIRECTORY MODULE */
        /* ================================================================= */
        <div className="flex-1 flex flex-col min-h-0 bg-[#14161B] p-6 space-y-4 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                <Briefcase className="h-5 w-5 text-emerald-400" />
                <span>Active Clients & Key Accounts</span>
              </h3>
              <p className="text-xs text-gray-400">Directory of converted customer accounts, lifetime revenues, and assigned managers.</p>
            </div>

            <button
              onClick={() => setIsCreateClientOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center space-x-1.5 shadow"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Client</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {clients.map(client => (
              <div key={client.id} className="bg-[#121317] border border-gray-800 hover:border-emerald-500/60 p-5 rounded-3xl space-y-4 shadow-xl transition">
                <div className="flex items-start justify-between border-b border-gray-800 pb-3">
                  <div>
                    <h4 className="font-bold text-base text-white">{client.companyName}</h4>
                    <p className="text-xs text-gray-400">{client.industry}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                    client.status === 'VIP' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {client.status} Account
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center space-x-2 text-gray-300">
                    <User className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Contact: <strong className="text-white">{client.contactName}</strong></span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-400 font-mono text-[11px]">
                    <Mail className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                    <span>{client.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-400 font-mono text-[11px]">
                    <Phone className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-gray-500 text-[10px] block">Lifetime Revenue</span>
                    <span className="font-extrabold text-emerald-400 text-sm">${client.totalRevenue.toLocaleString()} USD</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500 text-[10px] block">Manager</span>
                    <span className="text-gray-300 font-bold">{client.accountManager}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SELECTED DEAL DETAIL & MANAGEMENT POPUP MODAL */}
      {selectedDeal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#1A1D21] border border-gray-800 rounded-3xl w-full max-w-3xl p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  CRM Deal Details & Negotiation Record
                </span>
                <h2 className="text-xl font-extrabold text-white mt-1">{selectedDeal.title}</h2>
              </div>
              <button onClick={() => setSelectedDeal(null)} className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-[#121317] p-4 rounded-2xl border border-gray-800 space-y-2">
                <span className="text-gray-400 font-bold block">Prospect / Contact</span>
                <div className="text-sm font-bold text-white">{selectedDeal.contactName}</div>
                {selectedDeal.companyName && <div className="text-gray-400">{selectedDeal.companyName}</div>}
              </div>

              <div className="bg-[#121317] p-4 rounded-2xl border border-gray-800 space-y-2">
                <span className="text-gray-400 font-bold block">Deal Value ($)</span>
                <div className="text-xl font-extrabold text-amber-400 font-mono">${selectedDeal.value.toLocaleString()} USD</div>
              </div>
            </div>

            {/* Change Pipeline Stage Buttons */}
            <div className="bg-[#121317] p-4 rounded-2xl border border-gray-800 space-y-3 text-xs">
              <span className="font-bold text-white block">Current Stage Control:</span>
              <div className="flex flex-wrap gap-2">
                {PIPELINE_STAGES.map(s => (
                  <button
                    key={s.key}
                    onClick={() => handleMoveStage(selectedDeal.id, s.key)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer text-xs ${
                      selectedDeal.stage === s.key
                        ? 'bg-amber-500 text-black shadow-lg font-extrabold'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes & Negotiation Details */}
            <div className="bg-[#121317] p-4 rounded-2xl border border-gray-800 space-y-2 text-xs">
              <span className="font-bold text-amber-300 flex items-center space-x-1">
                <FileText className="h-4 w-4" />
                <span>Negotiation Notes & Log:</span>
              </span>
              <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{selectedDeal.notes || 'No detailed notes logged yet.'}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-800">
              <div className="text-xs text-gray-400">Assigned Sales Rep: <strong className="text-white">{selectedDeal.assignedTo}</strong></div>
              <button
                onClick={() => setSelectedDeal(null)}
                className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs rounded-xl"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW DEAL MODAL */}
      {isCreateDealOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121317] border border-gray-800 rounded-3xl w-full max-w-xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="font-bold text-white text-base">Create New CRM Deal</h3>
              <button onClick={() => setIsCreateDealOpen(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDealSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1">Deal Title *</label>
                <input 
                  type="text"
                  placeholder="e.g. Enterprise Cloud Integration Contract"
                  value={dealTitle}
                  onChange={(e) => setDealTitle(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-gray-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Contact Person</label>
                  <input 
                    type="text"
                    placeholder="Contact name..."
                    value={dealContact}
                    onChange={(e) => setDealContact(e.target.value)}
                    className="w-full bg-[#1A1D21] border border-gray-700 rounded-xl px-3.5 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Company Name</label>
                  <input 
                    type="text"
                    placeholder="Company name..."
                    value={dealCompany}
                    onChange={(e) => setDealCompany(e.target.value)}
                    className="w-full bg-[#1A1D21] border border-gray-700 rounded-xl px-3.5 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Deal Value ($ USD)</label>
                  <input 
                    type="number"
                    value={dealValue}
                    onChange={(e) => setDealValue(Number(e.target.value))}
                    className="w-full bg-[#1A1D21] border border-gray-700 rounded-xl px-3.5 py-2 text-white focus:outline-none font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Initial Pipeline Stage</label>
                  <select 
                    value={dealStage}
                    onChange={(e) => setDealStage(e.target.value as any)}
                    className="w-full bg-[#1A1D21] border border-gray-700 rounded-xl px-3.5 py-2 text-white focus:outline-none cursor-pointer"
                  >
                    <option value="Lead">1. Lead Intake</option>
                    <option value="Contacted">2. Contacted & Discovery</option>
                    <option value="Proposal">3. Proposal & Negotiation</option>
                    <option value="Won">4. Closed Won</option>
                    <option value="Lost">5. Closed Lost</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Negotiation / Strategic Notes</label>
                <textarea 
                  rows={3}
                  placeholder="Record key client requirements or negotiation terms..."
                  value={dealNotes}
                  onChange={(e) => setDealNotes(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-gray-700 rounded-xl p-3 text-white focus:outline-none custom-scrollbar"
                />
              </div>

              <div className="pt-3 border-t border-gray-800 flex justify-end space-x-2">
                <button type="button" onClick={() => setIsCreateDealOpen(false)} className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow cursor-pointer">
                  Save Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW LEAD MODAL */}
      {isCreateLeadOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121317] border border-gray-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="font-bold text-white text-base">Add New Sales Lead</h3>
              <button onClick={() => setIsCreateLeadOpen(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLeadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1">Lead Contact Name *</label>
                <input 
                  type="text"
                  placeholder="e.g. Sami Mansour"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-gray-700 rounded-xl px-3.5 py-2 text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Company / Organization *</label>
                <input 
                  type="text"
                  placeholder="e.g. Apex Financial Systems"
                  value={leadCompany}
                  onChange={(e) => setLeadCompany(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-gray-700 rounded-xl px-3.5 py-2 text-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Email</label>
                  <input 
                    type="email"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    className="w-full bg-[#1A1D21] border border-gray-700 rounded-xl px-3.5 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Phone</label>
                  <input 
                    type="text"
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    className="w-full bg-[#1A1D21] border border-gray-700 rounded-xl px-3.5 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-800 flex justify-end space-x-2">
                <button type="button" onClick={() => setIsCreateLeadOpen(false)} className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow cursor-pointer">
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW CLIENT MODAL */}
      {isCreateClientOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121317] border border-gray-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="font-bold text-white text-base">Add New Client Account</h3>
              <button onClick={() => setIsCreateClientOpen(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClientSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1">Company Name *</label>
                <input 
                  type="text"
                  placeholder="e.g. FinCorp Middle East"
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-gray-700 rounded-xl px-3.5 py-2 text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Key Contact Name *</label>
                <input 
                  type="text"
                  placeholder="e.g. Khaled El Sayed"
                  value={clientContact}
                  onChange={(e) => setClientContact(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-gray-700 rounded-xl px-3.5 py-2 text-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Email</label>
                  <input 
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full bg-[#1A1D21] border border-gray-700 rounded-xl px-3.5 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Industry</label>
                  <input 
                    type="text"
                    value={clientIndustry}
                    onChange={(e) => setClientIndustry(e.target.value)}
                    className="w-full bg-[#1A1D21] border border-gray-700 rounded-xl px-3.5 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-800 flex justify-end space-x-2">
                <button type="button" onClick={() => setIsCreateClientOpen(false)} className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow cursor-pointer">
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
