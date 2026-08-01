import React, { useState, useEffect } from 'react';
import { 
  Folder, FileText, Image as ImageIcon, FileCode, Archive, Download, 
  ExternalLink, Search, Filter, Plus, Share2, Star, Trash2, Eye, Edit3, 
  Lock, Globe, Copy, Check, ChevronRight, User, Building, MessageSquare, 
  CheckSquare, Clock, ArrowLeft, Grid, List, Sparkles, FolderPlus, FilePlus, 
  Shield, Link as LinkIcon, AlertCircle, X, Tag
} from 'lucide-react';
import { DriveFolder, DriveFile, DriveFileShareRule } from '../../types';
import { useWorkspace } from '../../context';

// Initial Mock Folders with linked metadata
const INITIAL_FOLDERS: DriveFolder[] = [
  {
    id: 'folder_client_a',
    name: 'Client A — HR Tech Global',
    parentId: null,
    organization: 'HR Tech Global',
    ownerName: 'Abdullah demo one',
    ownerEmail: 'abdullah.demo1@gmail.com',
    color: 'from-amber-500 to-red-500',
    createdAt: '2026-07-20',
    linkedOrg: 'HR Tech Global',
    linkedTask: { id: 't_101', title: 'Q3 Enterprise ERP License Approval' },
    linkedThread: { id: 'th_1', title: '#general — Executive Roadmap' },
    isStarred: true
  },
  {
    id: 'folder_client_b',
    name: 'Client B — FinCorp Middle East',
    parentId: null,
    organization: 'FinCorp Middle East',
    ownerName: 'Mohammed demo one',
    ownerEmail: 'mohammed.demo1@gmail.com',
    color: 'from-blue-500 to-indigo-500',
    createdAt: '2026-07-22',
    linkedOrg: 'FinCorp Middle East',
    linkedFollowUp: { id: 'f_201', title: 'Follow-up on WhatsApp Commerce Proposal' },
    linkedThread: { id: 'th_2', title: '#tech-ba-support — Omnichannel API' },
    isStarred: false
  },
  {
    id: 'folder_internal',
    name: 'Internal Operations & SLAs',
    parentId: null,
    organization: 'Demo Company Internal',
    ownerName: 'Alaa demo one',
    ownerEmail: 'alaa.demo1@gmail.com',
    color: 'from-purple-500 to-pink-500',
    createdAt: '2026-07-15',
    linkedTask: { id: 't_102', title: 'Opener Stages SLA Verification' },
    linkedFollowUp: { id: 'f_202', title: 'Follow-up on Department Overtime' },
    isStarred: true
  },
  {
    id: 'folder_dev',
    name: 'Development & API Specs',
    parentId: null,
    organization: 'Demo Company Tech',
    ownerName: 'Ibrahim demo one',
    ownerEmail: 'ibrahim.demo1@gmail.com',
    color: 'from-emerald-500 to-teal-500',
    createdAt: '2026-07-18',
    linkedThread: { id: 'th_3', title: '#vchat-app — Socket Event Architecture' },
    isStarred: false
  }
];

// Initial Mock Files with Drive sharing rules and linked entities
const INITIAL_FILES: DriveFile[] = [
  {
    id: 'file_1',
    name: 'Q3_Enterprise_Strategy_Report.docx',
    folderId: 'folder_client_a',
    type: 'doc',
    size: '2.4 MB',
    content: 'EXECUTIVE SUMMARY:\nThis document outlines the Q3 financial allocations across development, QA, and operational streams for HR Tech Global.',
    organization: 'HR Tech Global',
    ownerName: 'Abdullah demo one',
    ownerEmail: 'abdullah.demo1@gmail.com',
    updatedAt: '2026-07-28',
    createdAt: '2026-07-20',
    isStarred: true,
    linkedTask: { id: 't_101', title: 'Q3 Enterprise ERP License Approval' },
    sharing: {
      isPublic: true,
      publicRole: 'viewer',
      publicLink: 'https://drive.Demo Company.workspace/share/f_991823?access=viewer',
      passwordProtected: false,
      internalShares: [
        { userId: 'u_esraa', userName: 'Esraa Al Barsiky', userEmail: 'esraa.barsiky@democompany.com', role: 'editor' },
        { userId: 'u_mohammed', userName: 'Mohammed demo one', userEmail: 'mohammed.demo1@gmail.com', role: 'commenter' }
      ]
    }
  },
  {
    id: 'file_2',
    name: 'Omnichannel_Proposal_Deck.sheet',
    folderId: 'folder_client_b',
    type: 'sheet',
    size: '1.8 MB',
    content: 'FINANCIAL PROJECTIONS:\nWhatsApp Integration: $14,000\nInstagram Commerce Bot: $14,000\nTotal Package: $28,000 USD.',
    organization: 'FinCorp Middle East',
    ownerName: 'Mohammed demo one',
    ownerEmail: 'mohammed.demo1@gmail.com',
    updatedAt: '2026-07-29',
    createdAt: '2026-07-22',
    isStarred: false,
    linkedFollowUp: { id: 'f_201', title: 'Follow-up on WhatsApp Commerce Proposal' },
    sharing: {
      isPublic: true,
      publicRole: 'commenter',
      publicLink: 'https://drive.Demo Company.workspace/share/f_110293?access=commenter',
      passwordProtected: true,
      internalShares: [
        { userId: 'u_khaled', userName: 'Khaled El Sayed', userEmail: 'khaled.elsayed@democompany.com', role: 'editor' }
      ]
    }
  },
  {
    id: 'file_3',
    name: 'Cloud_Architecture_Diagram.png',
    folderId: 'folder_dev',
    type: 'image',
    size: '4.2 MB',
    content: '[IMAGE ASSET: High resolution architecture diagram showing Cloud Run container ingress routing to port 3000]',
    organization: 'Demo Company Tech',
    ownerName: 'Ibrahim demo one',
    ownerEmail: 'ibrahim.demo1@gmail.com',
    updatedAt: '2026-07-27',
    createdAt: '2026-07-18',
    isStarred: true,
    linkedThread: { id: 'th_3', title: '#vchat-app — Socket Event Architecture' },
    sharing: {
      isPublic: false,
      publicRole: 'viewer',
      publicLink: 'https://drive.Demo Company.workspace/share/f_448201?access=restricted',
      internalShares: []
    }
  },
  {
    id: 'file_4',
    name: 'api_endpoints_specification.json',
    folderId: 'folder_dev',
    type: 'code',
    size: '45 KB',
    content: '{\n  "version": "2.4.0",\n  "endpoints": [\n    { "path": "/api/mail/accounts", "method": "GET" },\n    { "path": "/api/crm/deals", "method": "POST" }\n  ]\n}',
    organization: 'Demo Company Tech',
    ownerName: 'Ibrahim demo one',
    ownerEmail: 'ibrahim.demo1@gmail.com',
    updatedAt: '2026-07-26',
    createdAt: '2026-07-19',
    isStarred: false,
    sharing: {
      isPublic: true,
      publicRole: 'editor',
      publicLink: 'https://drive.Demo Company.workspace/share/f_773910?access=editor',
      internalShares: []
    }
  },
  {
    id: 'file_5',
    name: 'Department_SLA_Guidelines.pdf',
    folderId: 'folder_internal',
    type: 'pdf',
    size: '3.1 MB',
    content: 'INTERNAL AUDIT GUIDELINES:\nAll incoming customer support requests must receive a first response within 15 minutes during business hours.',
    organization: 'Demo Company Internal',
    ownerName: 'Alaa demo one',
    ownerEmail: 'alaa.demo1@gmail.com',
    updatedAt: '2026-07-25',
    createdAt: '2026-07-15',
    isStarred: false,
    linkedTask: { id: 't_102', title: 'Opener Stages SLA Verification' },
    sharing: {
      isPublic: false,
      publicRole: 'viewer',
      publicLink: 'https://drive.Demo Company.workspace/share/f_883012?access=restricted',
      internalShares: [
        { userId: 'u_abdullah', userName: 'Abdullah demo one', userEmail: 'abdullah.demo1@gmail.com', role: 'editor' }
      ]
    }
  }
];

// Available Organizations for linking
const ORGANIZATIONS_LIST = [
  'HR Tech Global',
  'FinCorp Middle East',
  'Demo Company Internal',
  'Demo Company Tech',
  'Demo Company Logistics',
  'Retail Chains Co.',
  'DataSphere Tech',
  'Apex Financial Systems'
];

// Available Tasks for linking
const SYSTEM_TASKS = [
  { id: 't_101', title: 'Task #101: Q3 Enterprise ERP License Approval' },
  { id: 't_102', title: 'Task #102: Opener Stages SLA Verification' },
  { id: 't_103', title: 'Task #103: Setup Omnichannel WhatsApp Webhook' },
  { id: 't_104', title: 'Task #104: Client Onboarding for FinCorp' }
];

// Available Follow-Ups for linking
const SYSTEM_FOLLOW_UPS = [
  { id: 'f_201', title: 'Follow-up #201: WhatsApp Commerce Proposal Review' },
  { id: 'f_202', title: 'Follow-up #202: Department Overtime & Task SLA' },
  { id: 'f_203', title: 'Follow-up #203: Key Master Opener Stage Sign-off' }
];

// Available Threads/Channels for linking
const SYSTEM_THREADS = [
  { id: 'th_1', title: '#general — Executive Strategy Roadmap' },
  { id: 'th_2', title: '#tech-ba-support — Omnichannel API Specs' },
  { id: 'th_3', title: '#vchat-app — Socket Event Architecture' },
  { id: 'th_4', title: '#accounting-ba-service — Invoices Submission' }
];

export function FilesView() {
  const { users } = useWorkspace();

  // State Persistence
  const [folders, setFolders] = useState<DriveFolder[]>(() => {
    const saved = localStorage.getItem('demo_gdrive_folders');
    return saved ? JSON.parse(saved) : INITIAL_FOLDERS;
  });

  const [files, setFiles] = useState<DriveFile[]>(() => {
    const saved = localStorage.getItem('demo_gdrive_files');
    return saved ? JSON.parse(saved) : INITIAL_FILES;
  });

  useEffect(() => {
    localStorage.setItem('demo_gdrive_folders', JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem('demo_gdrive_files', JSON.stringify(files));
  }, [files]);

  // Current Folder & Navigation state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'my_drive' | 'shared' | 'starred' | 'linked'>('my_drive');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>('all');
  const [selectedOwnerFilter, setSelectedOwnerFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedLinkedFilter, setSelectedLinkedFilter] = useState<string>('all');

  // Modals state
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isCreateFileOpen, setIsCreateFileOpen] = useState(false);
  const [sharingFile, setSharingFile] = useState<DriveFile | null>(null);
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);
  const [linkTargetFolder, setLinkTargetFolder] = useState<DriveFolder | null>(null);

  // New Folder Form State
  const [folderName, setFolderName] = useState('');
  const [folderOrg, setFolderOrg] = useState(ORGANIZATIONS_LIST[0]);
  const [folderColor, setFolderColor] = useState('from-blue-500 to-indigo-500');
  const [folderLinkedTask, setFolderLinkedTask] = useState('');
  const [folderLinkedFollowUp, setFolderLinkedFollowUp] = useState('');
  const [folderLinkedOrg, setFolderLinkedOrg] = useState('');
  const [folderLinkedThread, setFolderLinkedThread] = useState('');

  // New File Form State
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState<DriveFile['type']>('doc');
  const [fileOrg, setFileOrg] = useState(ORGANIZATIONS_LIST[0]);
  const [fileContent, setFileContent] = useState('');
  const [fileOwner, setFileOwner] = useState('Abdullah demo one');

  // Copy Feedback Toast
  const [copiedLink, setCopiedLink] = useState(false);

  // Selected Internal Share user form state inside Share Modal
  const [shareUserEmail, setShareUserEmail] = useState('');
  const [shareUserRole, setShareUserRole] = useState<'viewer' | 'commenter' | 'editor'>('viewer');

  const currentFolder = folders.find(f => f.id === currentFolderId);

  // Breadcrumb path calculation
  const getBreadcrumbs = () => {
    const path: DriveFolder[] = [];
    let curr = currentFolder;
    while (curr) {
      path.unshift(curr);
      curr = folders.find(f => f.id === curr?.parentId);
    }
    return path;
  };

  // Filter calculations
  const filteredFolders = folders.filter(folder => {
    const matchesTab = 
      activeTab === 'my_drive' ? folder.parentId === currentFolderId :
      activeTab === 'starred' ? folder.isStarred :
      activeTab === 'linked' ? (folder.linkedTask || folder.linkedFollowUp || folder.linkedOrg || folder.linkedThread) : true;

    const matchesSearch = folder.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesOrg = selectedOrgFilter === 'all' || folder.organization === selectedOrgFilter;
    const matchesOwner = selectedOwnerFilter === 'all' || folder.ownerName.includes(selectedOwnerFilter);
    const matchesType = selectedTypeFilter === 'all' || selectedTypeFilter === 'folder';

    return matchesTab && matchesSearch && matchesOrg && matchesOwner && matchesType;
  });

  const filteredFiles = files.filter(file => {
    const matchesTab = 
      activeTab === 'my_drive' ? file.folderId === currentFolderId :
      activeTab === 'starred' ? file.isStarred :
      activeTab === 'shared' ? (file.sharing.isPublic || file.sharing.internalShares.length > 0) :
      activeTab === 'linked' ? (file.linkedTask || file.linkedFollowUp || file.linkedOrg || file.linkedThread) : true;

    const matchesSearch = 
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (file.content && file.content.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesOrg = selectedOrgFilter === 'all' || file.organization === selectedOrgFilter;
    const matchesOwner = selectedOwnerFilter === 'all' || file.ownerName.includes(selectedOwnerFilter);
    const matchesType = selectedTypeFilter === 'all' || file.type === selectedTypeFilter;

    const matchesLinked = selectedLinkedFilter === 'all' || 
      (selectedLinkedFilter === 'task' && file.linkedTask) ||
      (selectedLinkedFilter === 'follow_up' && file.linkedFollowUp) ||
      (selectedLinkedFilter === 'thread' && file.linkedThread);

    return matchesTab && matchesSearch && matchesOrg && matchesOwner && matchesType && matchesLinked;
  });

  // Handlers
  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    const taskObj = SYSTEM_TASKS.find(t => t.id === folderLinkedTask);
    const followObj = SYSTEM_FOLLOW_UPS.find(f => f.id === folderLinkedFollowUp);
    const threadObj = SYSTEM_THREADS.find(t => t.id === folderLinkedThread);

    const newFolder: DriveFolder = {
      id: `folder_${Date.now()}`,
      name: folderName.trim(),
      parentId: currentFolderId,
      organization: folderOrg,
      ownerName: 'Abdullah demo one',
      ownerEmail: 'abdullah.demo1@gmail.com',
      color: folderColor,
      createdAt: new Date().toISOString().split('T')[0],
      linkedOrg: folderLinkedOrg || undefined,
      linkedTask: taskObj ? { id: taskObj.id, title: taskObj.title } : undefined,
      linkedFollowUp: followObj ? { id: followObj.id, title: followObj.title } : undefined,
      linkedThread: threadObj ? { id: threadObj.id, title: threadObj.title } : undefined,
      isStarred: false
    };

    setFolders([...folders, newFolder]);
    setIsCreateFolderOpen(false);
    setFolderName('');
    setFolderLinkedTask('');
    setFolderLinkedFollowUp('');
    setFolderLinkedOrg('');
    setFolderLinkedThread('');
  };

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) return;

    const newFile: DriveFile = {
      id: `file_${Date.now()}`,
      name: fileName.trim(),
      folderId: currentFolderId,
      type: fileType,
      size: `${(Math.random() * 3 + 0.5).toFixed(1)} MB`,
      content: fileContent.trim() || `New ${fileType.toUpperCase()} created in Drive.`,
      organization: fileOrg,
      ownerName: fileOwner,
      ownerEmail: `${fileOwner.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      updatedAt: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      isStarred: false,
      sharing: {
        isPublic: false,
        publicRole: 'viewer',
        publicLink: `https://drive.Demo Company.workspace/share/f_${Date.now()}?access=viewer`,
        internalShares: []
      }
    };

    setFiles([newFile, ...files]);
    setIsCreateFileOpen(false);
    setFileName('');
    setFileContent('');
  };

  const handleToggleStarFile = (fileId: string) => {
    setFiles(files.map(f => f.id === fileId ? { ...f, isStarred: !f.isStarred } : f));
  };

  const handleToggleStarFolder = (folderId: string) => {
    setFolders(folders.map(f => f.id === folderId ? { ...f, isStarred: !f.isStarred } : f));
  };

  const handleAddInternalShare = () => {
    if (!sharingFile || !shareUserEmail.trim()) return;
    const targetUser = users.find(u => u.email === shareUserEmail.trim());

    const updatedShares = [
      ...sharingFile.sharing.internalShares.filter(s => s.userEmail !== shareUserEmail.trim()),
      {
        userId: targetUser?.id || `user_${Date.now()}`,
        userName: targetUser?.name || shareUserEmail.split('@')[0],
        userEmail: shareUserEmail.trim(),
        role: shareUserRole
      }
    ];

    const updatedFile: DriveFile = {
      ...sharingFile,
      sharing: {
        ...sharingFile.sharing,
        internalShares: updatedShares
      }
    };

    setFiles(files.map(f => f.id === sharingFile.id ? updatedFile : f));
    setSharingFile(updatedFile);
    setShareUserEmail('');
  };

  const handleUpdatePublicSharing = (isPublic: boolean, publicRole: DriveFileShareRule['publicRole']) => {
    if (!sharingFile) return;

    const updatedFile: DriveFile = {
      ...sharingFile,
      sharing: {
        ...sharingFile.sharing,
        isPublic,
        publicRole,
        publicLink: `https://drive.Demo Company.workspace/share/${sharingFile.id}?access=${publicRole}`
      }
    };

    setFiles(files.map(f => f.id === sharingFile.id ? updatedFile : f));
    setSharingFile(updatedFile);
  };

  const handleCopyShareLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const getFileIcon = (type: DriveFile['type']) => {
    switch (type) {
      case 'doc': return <FileText className="h-5 w-5 text-blue-400" />;
      case 'sheet': return <FileText className="h-5 w-5 text-emerald-400" />;
      case 'image': return <ImageIcon className="h-5 w-5 text-purple-400" />;
      case 'code': return <FileCode className="h-5 w-5 text-amber-400" />;
      case 'pdf': return <FileText className="h-5 w-5 text-red-400" />;
      case 'archive': return <Archive className="h-5 w-5 text-yellow-400" />;
      default: return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="flex-1 bg-[#1A1D21] text-gray-200 flex flex-col h-full overflow-hidden">
      
      {/* TOP HEADER */}
      <div className="h-16 border-b border-gray-800 px-6 flex items-center justify-between shrink-0 bg-[#121317]">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg">
            <Folder className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-white text-base">Google Drive File Manager</h2>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">
                Linked Workspace Drive
              </span>
            </div>
            <p className="text-xs text-gray-400">Manage folders, files, internal/external sharing rules, and entity linkages.</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsCreateFolderOpen(true)}
            className="px-3.5 py-2 bg-[#1A1D21] hover:bg-gray-800 text-gray-200 border border-gray-700 font-semibold rounded-xl text-xs transition cursor-pointer flex items-center space-x-1.5"
          >
            <FolderPlus className="h-4 w-4 text-blue-400" />
            <span>New Folder</span>
          </button>

          <button
            onClick={() => setIsCreateFileOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-lg shadow-blue-900/30"
          >
            <FilePlus className="h-4 w-4" />
            <span>Create File</span>
          </button>
        </div>
      </div>

      {/* SEARCH AND FILTERS TOOLBAR */}
      <div className="px-6 py-3 bg-[#14161B] border-b border-gray-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        
        {/* Drive Category Navigation Tabs */}
        <div className="flex items-center space-x-1.5 bg-[#121317] p-1 rounded-xl border border-gray-800 text-xs">
          <button
            onClick={() => { setActiveTab('my_drive'); setCurrentFolderId(null); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'my_drive' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Folder className="h-3.5 w-3.5" />
            <span>My Drive</span>
          </button>
          <button
            onClick={() => setActiveTab('shared')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'shared' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Shared with Me</span>
          </button>
          <button
            onClick={() => setActiveTab('linked')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'linked' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <LinkIcon className="h-3.5 w-3.5 text-amber-400" />
            <span>Linked Items</span>
          </button>
          <button
            onClick={() => setActiveTab('starred')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'starred' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Star className="h-3.5 w-3.5 text-amber-400" />
            <span>Starred</span>
          </button>
        </div>

        {/* Filter Selectors & Search */}
        <div className="flex flex-wrap items-center space-x-2 text-xs">
          {/* Organization Filter */}
          <select 
            value={selectedOrgFilter}
            onChange={(e) => setSelectedOrgFilter(e.target.value)}
            className="bg-[#121317] border border-gray-800 rounded-xl px-3 py-1.5 text-gray-300 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">All Organizations</option>
            {ORGANIZATIONS_LIST.map(org => (
              <option key={org} value={org}>{org}</option>
            ))}
          </select>

          {/* People / Owner Filter */}
          <select 
            value={selectedOwnerFilter}
            onChange={(e) => setSelectedOwnerFilter(e.target.value)}
            className="bg-[#121317] border border-gray-800 rounded-xl px-3 py-1.5 text-gray-300 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">All People / Owners</option>
            <option value="Abdullah">Abdullah demo one</option>
            <option value="Mohammed">Mohammed demo one</option>
            <option value="Alaa">Alaa demo one</option>
            <option value="Ibrahim">Ibrahim demo one</option>
          </select>

          {/* Linked Filter */}
          <select 
            value={selectedLinkedFilter}
            onChange={(e) => setSelectedLinkedFilter(e.target.value)}
            className="bg-[#121317] border border-gray-800 rounded-xl px-3 py-1.5 text-gray-300 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">All Linked Entities</option>
            <option value="task">Linked to Task</option>
            <option value="follow_up">Linked to Follow-Up</option>
            <option value="thread">Linked to Thread</option>
          </select>

          {/* Search bar */}
          <div className="relative w-56">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
            <input 
              type="text"
              placeholder="Search files & content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121317] border border-gray-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* View Mode Grid/List toggle */}
          <div className="flex items-center space-x-1 bg-[#121317] p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}
            >
              <Grid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* BREADCRUMBS NAVIGATION BAR */}
      <div className="px-6 py-2.5 bg-[#121317] border-b border-gray-800/80 flex items-center space-x-2 text-xs text-gray-400">
        <button 
          onClick={() => setCurrentFolderId(null)} 
          className="hover:text-white font-semibold flex items-center space-x-1 cursor-pointer"
        >
          <Folder className="h-3.5 w-3.5 text-blue-400" />
          <span>My Drive</span>
        </button>

        {getBreadcrumbs().map(folder => (
          <React.Fragment key={folder.id}>
            <ChevronRight className="h-3.5 w-3.5 text-gray-600" />
            <button
              onClick={() => setCurrentFolderId(folder.id)}
              className={`hover:text-white font-semibold cursor-pointer ${
                folder.id === currentFolderId ? 'text-white font-bold' : ''
              }`}
            >
              {folder.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* MAIN CONTENT CANVAS AREA */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

        {/* FOLDERS SECTION */}
        {filteredFolders.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Folder className="h-4 w-4 text-blue-400" />
                <span>Folders ({filteredFolders.length})</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {filteredFolders.map(folder => (
                <div
                  key={folder.id}
                  onClick={() => setCurrentFolderId(folder.id)}
                  className="bg-[#121317] hover:bg-[#16181F] border border-gray-800 hover:border-blue-500/50 p-4 rounded-2xl transition cursor-pointer space-y-3 shadow-md group relative"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${folder.color || 'from-blue-500 to-indigo-500'} flex items-center justify-center text-white shadow`}>
                        <Folder className="h-5 w-5 fill-current opacity-90" />
                      </div>
                      <div className="max-w-[170px]">
                        <h4 className="font-bold text-xs text-white group-hover:text-blue-300 transition truncate">{folder.name}</h4>
                        <span className="text-[10px] text-gray-400 font-mono block">{folder.ownerName}</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStarFolder(folder.id);
                      }}
                      className={`p-1 text-gray-500 hover:text-amber-400 ${folder.isStarred ? 'text-amber-400' : ''}`}
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Folder Badges & Linked Entities */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center space-x-1 text-[10px] text-gray-400">
                      <Building className="h-3 w-3 text-gray-500 shrink-0" />
                      <span className="truncate">{folder.organization}</span>
                    </div>

                    {folder.linkedTask && (
                      <div className="flex items-center space-x-1 text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-md truncate">
                        <CheckSquare className="h-3 w-3 shrink-0" />
                        <span className="truncate">{folder.linkedTask.title}</span>
                      </div>
                    )}

                    {folder.linkedFollowUp && (
                      <div className="flex items-center space-x-1 text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md truncate">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span className="truncate">{folder.linkedFollowUp.title}</span>
                      </div>
                    )}

                    {folder.linkedThread && (
                      <div className="flex items-center space-x-1 text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md truncate">
                        <MessageSquare className="h-3 w-3 shrink-0" />
                        <span className="truncate">{folder.linkedThread.title}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FILES SECTION */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
              <FileText className="h-4 w-4 text-emerald-400" />
              <span>Drive Files ({filteredFiles.length})</span>
            </h3>
          </div>

          {filteredFiles.length === 0 ? (
            <div className="bg-[#121317] border border-gray-800 rounded-2xl p-10 text-center text-gray-500 space-y-2">
              <Folder className="h-10 w-10 mx-auto text-gray-600 opacity-40" />
              <p className="text-xs font-semibold">No files match the selected filter or current folder.</p>
            </div>
          ) : viewMode === 'grid' ? (
            /* GRID VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredFiles.map(file => (
                <div
                  key={file.id}
                  onClick={() => setPreviewFile(file)}
                  className="bg-[#121317] hover:bg-[#16181F] border border-gray-800 hover:border-emerald-500/50 p-4 rounded-2xl transition cursor-pointer space-y-3 shadow-md group relative flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 rounded-xl bg-gray-800 border border-gray-700">
                          {getFileIcon(file.type)}
                        </div>
                        <div className="max-w-[160px]">
                          <h4 className="font-bold text-xs text-white group-hover:text-emerald-300 transition line-clamp-1">{file.name}</h4>
                          <span className="text-[10px] text-gray-500 font-mono block">{file.size} • {file.updatedAt}</span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStarFile(file.id);
                        }}
                        className={`p-1 text-gray-500 hover:text-amber-400 ${file.isStarred ? 'text-amber-400' : ''}`}
                      >
                        <Star className="h-4 w-4" />
                      </button>
                    </div>

                    {file.content && (
                      <p className="text-[11px] text-gray-400 line-clamp-2 bg-[#171920] p-2 rounded-xl border border-gray-800/80 font-mono">
                        {file.content}
                      </p>
                    )}

                    {/* Organization Tag & Owner */}
                    <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                      <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700 font-semibold truncate max-w-[130px]">
                        {file.organization}
                      </span>
                      <span className="text-gray-500">{file.ownerName.split(' ')[0]}</span>
                    </div>

                    {/* Linked Entity Tags */}
                    {file.linkedTask && (
                      <div className="flex items-center space-x-1 text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-md truncate">
                        <CheckSquare className="h-3 w-3 shrink-0" />
                        <span className="truncate">{file.linkedTask.title}</span>
                      </div>
                    )}

                    {file.linkedFollowUp && (
                      <div className="flex items-center space-x-1 text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md truncate">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span className="truncate">{file.linkedFollowUp.title}</span>
                      </div>
                    )}
                  </div>

                  {/* Share Status Footer & Actions */}
                  <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-[11px]">
                    <span className="flex items-center space-x-1">
                      {file.sharing.isPublic ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
                          <Globe className="h-3 w-3" /> External Link ({file.sharing.publicRole})
                        </span>
                      ) : (
                        <span className="text-gray-500 flex items-center gap-1 text-[10px]">
                          <Lock className="h-3 w-3" /> Private Drive
                        </span>
                      )}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSharingFile(file);
                      }}
                      className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] font-bold rounded-lg border border-gray-700 flex items-center space-x-1 cursor-pointer"
                    >
                      <Share2 className="h-3 w-3 text-blue-400" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* LIST VIEW */
            <div className="bg-[#121317] rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#181B22] text-gray-400 uppercase text-[10px] font-bold tracking-wider border-b border-gray-800">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Organization</th>
                    <th className="p-4">Owner</th>
                    <th className="p-4">Size</th>
                    <th className="p-4">Sharing Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {filteredFiles.map(file => (
                    <tr key={file.id} className="hover:bg-[#181B22]/60 transition cursor-pointer" onClick={() => setPreviewFile(file)}>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          {getFileIcon(file.type)}
                          <div>
                            <div className="font-bold text-white text-xs">{file.name}</div>
                            {file.linkedTask && (
                              <span className="text-[10px] text-blue-300 block">{file.linkedTask.title}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-gray-800 text-gray-300 rounded-lg border border-gray-700 font-semibold text-[11px]">
                          {file.organization}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400 font-mono text-[11px]">
                        {file.ownerName}
                      </td>
                      <td className="p-4 font-mono text-gray-400">{file.size}</td>
                      <td className="p-4">
                        {file.sharing.isPublic ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                            <Globe className="h-3.5 w-3.5" /> Public Link ({file.sharing.publicRole})
                          </span>
                        ) : (
                          <span className="text-gray-500 flex items-center gap-1 text-[11px]">
                            <Lock className="h-3.5 w-3.5" /> Private
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSharingFile(file)}
                          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs rounded-xl border border-gray-700 cursor-pointer"
                        >
                          Share File
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* GOOGLE DRIVE SHARING & ACCESS CONTROL MODAL */}
      {sharingFile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#1A1D21] border border-gray-800 rounded-3xl w-full max-w-2xl p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow">
                  <Share2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Share "{sharingFile.name}"</h3>
                  <p className="text-xs text-gray-400">Manage internal teammates and client public link permissions.</p>
                </div>
              </div>
              <button onClick={() => setSharingFile(null)} className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* SECTION 1: INTERNAL PEOPLE SHARING */}
            <div className="space-y-3 bg-[#121317] p-4 rounded-2xl border border-gray-800">
              <label className="block text-xs font-bold text-white uppercase tracking-wider">
                Internal Teammates Sharing (Access Rules)
              </label>

              <div className="flex gap-2 text-xs">
                <select 
                  value={shareUserEmail}
                  onChange={(e) => setShareUserEmail(e.target.value)}
                  className="flex-1 bg-[#1A1D21] border border-gray-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="">Select teammate email...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.email}>{u.name} ({u.email})</option>
                  ))}
                </select>

                <select 
                  value={shareUserRole}
                  onChange={(e) => setShareUserRole(e.target.value as any)}
                  className="bg-[#1A1D21] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none cursor-pointer font-bold"
                >
                  <option value="viewer">Viewer</option>
                  <option value="commenter">Commenter</option>
                  <option value="editor">Editor</option>
                </select>

                <button 
                  onClick={handleAddInternalShare}
                  disabled={!shareUserEmail}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer shadow"
                >
                  Add User
                </button>
              </div>

              {/* Shared Teammates List */}
              {sharingFile.sharing.internalShares.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold text-gray-400 block">Shared with ({sharingFile.sharing.internalShares.length} users):</span>
                  <div className="divide-y divide-gray-800 border border-gray-800 rounded-xl overflow-hidden bg-[#1A1D21]">
                    {sharingFile.sharing.internalShares.map(share => (
                      <div key={share.userEmail} className="p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-white block">{share.userName}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{share.userEmail}</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold text-[10px] uppercase border border-blue-500/30">
                          {share.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2: EXTERNAL CLIENT LINK SHARING (GOOGLE DRIVE STYLE) */}
            <div className="space-y-4 bg-[#121317] p-4 rounded-2xl border border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center space-x-1.5">
                    <Globe className="h-4 w-4 text-emerald-400" />
                    <span>External Client Link Sharing</span>
                  </h4>
                  <p className="text-[11px] text-gray-400">Generate copyable link for clients with granular access rules.</p>
                </div>

                <button
                  onClick={() => handleUpdatePublicSharing(!sharingFile.sharing.isPublic, sharingFile.sharing.publicRole)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                    sharingFile.sharing.isPublic
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-gray-800 text-gray-400 border border-gray-700'
                  }`}
                >
                  {sharingFile.sharing.isPublic ? 'Link Active (Public)' : 'Restricted (Off)'}
                </button>
              </div>

              {sharingFile.sharing.isPublic && (
                <div className="space-y-3 pt-2 border-t border-gray-800 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 font-bold">Client Link Permission Level:</span>
                    <select 
                      value={sharingFile.sharing.publicRole}
                      onChange={(e) => handleUpdatePublicSharing(true, e.target.value as any)}
                      className="bg-[#1A1D21] border border-gray-700 rounded-xl px-3 py-1.5 text-white font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="viewer">Viewer (Read-Only)</option>
                      <option value="commenter">Commenter (View & Feedback)</option>
                      <option value="editor">Editor (Full Access)</option>
                    </select>
                  </div>

                  {/* Generated Link Input & Copy Button */}
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      readOnly
                      value={sharingFile.sharing.publicLink}
                      className="flex-1 bg-[#1A1D21] border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-emerald-400 font-mono focus:outline-none"
                    />
                    <button
                      onClick={() => handleCopyShareLink(sharingFile.sharing.publicLink)}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer shadow"
                    >
                      {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-gray-800 pt-3">
              <button
                onClick={() => setSharingFile(null)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW FOLDER MODAL */}
      {isCreateFolderOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121317] border border-gray-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="font-bold text-white text-base">Create Drive Folder</h3>
              <button onClick={() => setIsCreateFolderOpen(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1">Folder Name *</label>
                <input 
                  type="text"
                  placeholder="e.g. Q3 Financial Agreements"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-gray-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Organization *</label>
                <select 
                  value={folderOrg}
                  onChange={(e) => setFolderOrg(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-gray-700 rounded-xl px-3.5 py-2 text-white focus:outline-none cursor-pointer"
                >
                  {ORGANIZATIONS_LIST.map(org => (
                    <option key={org} value={org}>{org}</option>
                  ))}
                </select>
              </div>

              {/* LINKING SECTION */}
              <div className="bg-[#1A1D21] p-3.5 rounded-2xl border border-gray-800 space-y-3">
                <span className="font-bold text-amber-300 block flex items-center space-x-1">
                  <LinkIcon className="h-3.5 w-3.5" />
                  <span>Link Folder to Workspace Entities:</span>
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 text-[11px] mb-1">Link to Task</label>
                    <select 
                      value={folderLinkedTask}
                      onChange={(e) => setFolderLinkedTask(e.target.value)}
                      className="w-full bg-[#121317] border border-gray-800 rounded-xl p-2 text-white text-[11px] focus:outline-none cursor-pointer"
                    >
                      <option value="">None</option>
                      {SYSTEM_TASKS.map(t => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 text-[11px] mb-1">Link to Follow-Up</label>
                    <select 
                      value={folderLinkedFollowUp}
                      onChange={(e) => setFolderLinkedFollowUp(e.target.value)}
                      className="w-full bg-[#121317] border border-gray-800 rounded-xl p-2 text-white text-[11px] focus:outline-none cursor-pointer"
                    >
                      <option value="">None</option>
                      {SYSTEM_FOLLOW_UPS.map(f => (
                        <option key={f.id} value={f.id}>{f.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-[11px] mb-1">Link to Open Thread / Channel</label>
                  <select 
                    value={folderLinkedThread}
                    onChange={(e) => setFolderLinkedThread(e.target.value)}
                    className="w-full bg-[#121317] border border-gray-800 rounded-xl p-2 text-white text-[11px] focus:outline-none cursor-pointer"
                  >
                    <option value="">None</option>
                    {SYSTEM_THREADS.map(th => (
                      <option key={th.id} value={th.id}>{th.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-800 flex justify-end space-x-2">
                <button type="button" onClick={() => setIsCreateFolderOpen(false)} className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow cursor-pointer">
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW FILE MODAL */}
      {isCreateFileOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121317] border border-gray-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="font-bold text-white text-base">Create Drive File Document</h3>
              <button onClick={() => setIsCreateFileOpen(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFile} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1">File Name *</label>
                <input 
                  type="text"
                  placeholder="e.g. Operational_SLA_Rules.docx"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-gray-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Document Type</label>
                  <select 
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value as any)}
                    className="w-full bg-[#1A1D21] border border-gray-700 rounded-xl px-3.5 py-2 text-white focus:outline-none cursor-pointer font-semibold"
                  >
                    <option value="doc">Google Doc (.docx)</option>
                    <option value="sheet">Google Sheet (.xlsx)</option>
                    <option value="pdf">PDF Document (.pdf)</option>
                    <option value="code">Code File (.json/.ts)</option>
                    <option value="image">Image Asset (.png)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-bold mb-1">Organization</label>
                  <select 
                    value={fileOrg}
                    onChange={(e) => setFileOrg(e.target.value)}
                    className="w-full bg-[#1A1D21] border border-gray-700 rounded-xl px-3.5 py-2 text-white focus:outline-none cursor-pointer"
                  >
                    {ORGANIZATIONS_LIST.map(org => (
                      <option key={org} value={org}>{org}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">File Body / Content</label>
                <textarea 
                  rows={4}
                  placeholder="Enter file text content or notes..."
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-gray-700 rounded-xl p-3 text-white focus:outline-none font-mono custom-scrollbar"
                />
              </div>

              <div className="pt-3 border-t border-gray-800 flex justify-end space-x-2">
                <button type="button" onClick={() => setIsCreateFileOpen(false)} className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow cursor-pointer">
                  Save File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FILE PREVIEW DRAWER */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1D21] border border-gray-800 rounded-3xl w-full max-w-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-800 rounded-xl border border-gray-700">
                  {getFileIcon(previewFile.type)}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{previewFile.name}</h3>
                  <span className="text-[11px] text-gray-400 font-mono">{previewFile.size} • Created by {previewFile.ownerName}</span>
                </div>
              </div>

              <button onClick={() => setPreviewFile(null)} className="p-1 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-[#121317] p-5 rounded-2xl border border-gray-800 text-xs text-gray-200 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed custom-scrollbar">
              {previewFile.content || 'No content preview available for this binary file.'}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-800 text-xs">
              <div className="text-gray-400 font-mono">
                Organization: <strong className="text-white">{previewFile.organization}</strong>
              </div>

              <div className="flex space-x-2">
                <button 
                  onClick={() => {
                    setSharingFile(previewFile);
                    setPreviewFile(null);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow cursor-pointer flex items-center space-x-1.5"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share Settings</span>
                </button>
                <button 
                  onClick={() => setPreviewFile(null)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
