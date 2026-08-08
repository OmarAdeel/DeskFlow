export type ViewType = 
  | 'home' 
  | 'unreads' 
  | 'dms' 
  | 'activity' 
  | 'files' 
  | 'later'
  | 'starred'
  | 'more' 
  | 'threads' 
  | 'huddles' 
  | 'drafts' 
  | 'directories' 
  | 'conversations' 
  | 'follow-ups' 
  | 'canvas' 
  | 'kpis' 
  | 'meetings' 
  | 'channel' 
  | 'settings' 
  | 'workspace-settings'
  | 'crm'
  | 'mail'
  | 'workflows'
  | 'ai-digest'
  | 'clips'
  | 'apps';

export type UserRole = 'Super Admin' | 'Admin' | 'Manager' | 'Standard User' | 'Guest';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title?: string;
  phone?: string;
  avatar?: string;
  online?: boolean;
  channelIds?: string[];
  username?: string;
  status?: 'active' | 'suspended' | 'invited';
}

export interface Channel {
  id: string;
  name: string;
  isPrivate: boolean;
  description?: string;
  unreadCount?: number;
  memberIds?: string[];
  agentIds?: string[];
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  creatorId: string;
  creatorName: string;
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: string;
  sourceMessageId?: string;
  createdAt: string;
}

export interface ContactItem {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  organization?: string;
  socialHandles?: {
    whatsapp?: string;
    instagram?: string;
    facebook?: string;
    messenger?: string;
  };
  notes?: string;
  createdAt: string;
}

export interface DealItem {
  id: string;
  title: string;
  contactId: string;
  contactName: string;
  companyName?: string;
  value: number;
  currency: string;
  stage: 'Lead' | 'Contacted' | 'Proposal' | 'Won' | 'Lost';
  assignedTo?: string;
  createdAt: string;
  expectedCloseDate?: string;
  notes?: string;
  closedReason?: string;
}

export interface LeadItem {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  status: 'New' | 'Contacted' | 'In Negotiation' | 'Qualified' | 'Converted' | 'Lost';
  estimatedValue: number;
  assignedTo: string;
  createdAt: string;
  notes?: string;
}

export interface ClientItem {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  industry: string;
  status: 'Active' | 'VIP' | 'Churned';
  totalRevenue: number;
  activeDealsCount: number;
  accountManager: string;
  joinedDate: string;
}

export interface SocialAccountItem {
  id: string;
  platform: 'whatsapp' | 'instagram' | 'facebook' | 'messenger';
  accountName: string;
  webhookUrl?: string;
  accessToken?: string;
  status: 'connected' | 'disconnected' | 'pending';
  connectedAt: string;
}

export interface MailAccountItem {
  id: string;
  emailAddress: string;
  provider: 'google' | 'microsoft' | 'imap';
  connectedAt: string;
}

export interface CanvasItem {
  id: string;
  title: string;
  content: string;
  channelId?: string;
  creatorId: string;
  creatorName: string;
  updatedAt: string;
  color?: string;
}

export interface SystemAuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface DriveFolder {
  id: string;
  name: string;
  parentId?: string | null;
  organization?: string;
  ownerName: string;
  ownerEmail: string;
  color?: string;
  createdAt: string;
  linkedTask?: { id: string; title: string };
  linkedFollowUp?: { id: string; title: string };
  linkedOrg?: string;
  linkedThread?: { id: string; title: string };
  isStarred?: boolean;
}

export interface DriveFileShareRule {
  isPublic: boolean;
  publicRole: 'viewer' | 'commenter' | 'editor';
  publicLink: string;
  passwordProtected?: boolean;
  expiresAt?: string;
  internalShares: {
    userId: string;
    userName: string;
    userEmail: string;
    role: 'viewer' | 'commenter' | 'editor';
  }[];
}

export interface DriveFile {
  id: string;
  name: string;
  folderId?: string | null;
  type: 'doc' | 'sheet' | 'pdf' | 'image' | 'code' | 'archive' | 'text';
  size: string;
  content?: string;
  organization: string;
  ownerName: string;
  ownerEmail: string;
  updatedAt: string;
  createdAt: string;
  isStarred?: boolean;
  linkedTask?: { id: string; title: string };
  linkedFollowUp?: { id: string; title: string };
  linkedOrg?: string;
  linkedThread?: { id: string; title: string };
  sharing: DriveFileShareRule;
}
