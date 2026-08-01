import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Calendar, Filter, Grid, List as ListIcon, CheckCircle2, Circle, Clock, 
  Plus, AlertTriangle, User, Building, MessageSquare, Check, X, Hourglass, 
  FileText, ChevronDown, Sparkles, Trash2, Edit3, ArrowRight, ShieldAlert,
  HelpCircle, UserCheck, Flag, ArrowUpRight, GitCommit, Crown, Lock, Unlock,
  Workflow, ChevronRight, Layers, Users, UserPlus, MoveRight, ArrowDown
} from 'lucide-react';
import { useWorkspace, WorkspaceUser } from '../../context';
import { ViewType } from '../../types';

export interface WorkflowTask {
  id: string;
  title: string;
  description: string; // What is needed exactly from him
  assigneeId: string;
  assigneeName: string;
  teamMemberIds?: string[]; // Multiple team members assigned to task
  creatorName: string;
  dueDate: string; // YYYY-MM-DD
  originalDueDate?: string;
  status: 'todo' | 'in_progress' | 'extension_requested' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  department: string; // Organization / Department
  openerStage: 1 | 2 | 3 | 4; // Mind Map Opener stage (1 to 4)
  extensionRequest?: {
    requestedDate: string;
    reason: string;
    status: 'pending' | 'accepted' | 'rejected';
    requestedAt: string;
    managerComment?: string;
  };
  notes: Array<{
    id: string;
    author: string;
    text: string;
    createdAt: string;
  }>;
  createdAt: string;
}

export interface OrganizationConfig {
  id: string;
  name: string;
  keyMasterId: string;
  keyMasterName: string;
  keyMasterRole: string;
  currentActiveOpener: number; // 1, 2, 3, or 4
  openers: Array<{
    stage: 1 | 2 | 3 | 4;
    title: string;
    description: string;
    deliverable: string;
  }>;
}

const DEFAULT_ORGANIZATIONS: OrganizationConfig[] = [
  {
    id: 'Engineering',
    name: 'Engineering',
    keyMasterId: '8',
    keyMasterName: 'Abdallah Sayed',
    keyMasterRole: 'CEO & Lead System Architect',
    currentActiveOpener: 2,
    openers: [
      { stage: 1, title: 'Opener 1: Scope & Architecture', description: 'Define memory specs, data models, and API endpoints.', deliverable: 'Architecture Specs & Schema' },
      { stage: 2, title: 'Opener 2: Dev & Memory Fixes', description: 'Fix telemetry memory leaks and build core services.', deliverable: 'Core Microservices' },
      { stage: 3, title: 'Opener 3: QA & Security Audit', description: 'Run E2E Cypress regression suite and database audit.', deliverable: 'Pass 100% QA & Security' },
      { stage: 4, title: 'Opener 4: Deployment & Handover', description: 'Execute zero-downtime production release.', deliverable: 'Prod Release & Live Ops' }
    ]
  },
  {
    id: 'Finance',
    name: 'Finance',
    keyMasterId: '4',
    keyMasterName: 'Mohammed Dwidar',
    keyMasterRole: 'Head of Finance & Compliance',
    currentActiveOpener: 2,
    openers: [
      { stage: 1, title: 'Opener 1: Accounts Collection', description: 'Gather Q3 bank statements, receipts, and invoices.', deliverable: 'Raw Ledger Records' },
      { stage: 2, title: 'Opener 2: Balance Sheet Audit', description: 'Reconcile accounts receivable against treasury logs.', deliverable: 'Balance Sheet Draft' },
      { stage: 3, title: 'Opener 3: Executive Sign-off', description: 'Present financial forecast to executive board.', deliverable: 'Board Audit Approval' },
      { stage: 4, title: 'Opener 4: Regulatory Filing', description: 'Submit quarterly tax filings to authorities.', deliverable: 'Official Compliance Filing' }
    ]
  },
  {
    id: 'Marketing',
    name: 'Marketing',
    keyMasterId: '2',
    keyMasterName: 'Esraa Soliman',
    keyMasterRole: 'Marketing Director',
    currentActiveOpener: 3,
    openers: [
      { stage: 1, title: 'Opener 1: Campaign Strategy', description: 'Identify target persona, value proposition, and budget.', deliverable: 'Strategy Blueprint' },
      { stage: 2, title: 'Opener 2: Media Asset Creation', description: 'Design banners, mockups, video teasers, and ads.', deliverable: 'Creative Asset Package' },
      { stage: 3, title: 'Opener 3: Copywriting Review', description: 'Finalize email templates, website copy, and PR posts.', deliverable: 'Approved Marketing Copy' },
      { stage: 4, title: 'Opener 4: Omnichannel Launch', description: 'Broadcast launch campaigns on social & newsletter.', deliverable: 'Live Campaign Launch' }
    ]
  },
  {
    id: 'Operations',
    name: 'Operations',
    keyMasterId: '5',
    keyMasterName: 'Omar Adel',
    keyMasterRole: 'Operations Manager',
    currentActiveOpener: 4,
    openers: [
      { stage: 1, title: 'Opener 1: Process Mapping', description: 'Map out enterprise client onboarding workflow.', deliverable: 'Workflow Map Draft' },
      { stage: 2, title: 'Opener 2: Training Workshop', description: 'Train customer success team on SOP guidelines.', deliverable: 'Team SOP Certification' },
      { stage: 3, title: 'Opener 3: Operational Pilot', description: 'Run 14-day live onboarding pilot with beta users.', deliverable: 'Pilot Report & Feedback' },
      { stage: 4, title: 'Opener 4: Full SOP Rollout', description: 'Publish final onboarding playbook across workspace.', deliverable: 'Published Operational Playbook' }
    ]
  }
];

const INITIAL_TASKS: WorkflowTask[] = [
  {
    id: 'task_1',
    title: 'Audit API Performance & Telemetry Leaks',
    description: 'Perform memory heap profiling on backend service endpoints. Identify memory leaks in background telemetry daemons and submit fixes.',
    assigneeId: '3',
    assigneeName: 'Mohamed Alaa',
    teamMemberIds: ['8', '1'],
    creatorName: 'Abdallah Sayed',
    dueDate: '2026-07-29',
    originalDueDate: '2026-07-29',
    status: 'extension_requested',
    priority: 'urgent',
    department: 'Engineering',
    openerStage: 2,
    extensionRequest: {
      requestedDate: '2026-08-04',
      reason: 'Discovered additional heap retention in background worker pool. Need extra days for regression testing.',
      status: 'pending',
      requestedAt: '2026-07-29 16:30'
    },
    notes: [
      { id: 'n1', author: 'Mohamed Alaa', text: 'Heap dump analysis shows uncollected closures in telemetry listener.', createdAt: 'Jul 28, 2026 14:20' },
      { id: 'n2', author: 'Abdallah Sayed', text: 'Please ensure staging load tests pass before production merge.', createdAt: 'Jul 29, 2026 09:15' }
    ],
    createdAt: '2026-07-25'
  },
  {
    id: 'task_1_arch',
    title: 'Define Microservices Data Models & Specs',
    description: 'Draft initial OpenAPI schemas and Firestore index rules for high-throughput messaging.',
    assigneeId: '1',
    assigneeName: 'Esraa Al Barsiky',
    teamMemberIds: ['8'],
    creatorName: 'Abdallah Sayed',
    dueDate: '2026-07-26',
    status: 'completed',
    priority: 'high',
    department: 'Engineering',
    openerStage: 1,
    notes: [
      { id: 'n10', author: 'Esraa Al Barsiky', text: 'OpenAPI v3 spec published.', createdAt: 'Jul 26, 2026 10:00' }
    ],
    createdAt: '2026-07-22'
  },
  {
    id: 'task_2',
    title: 'Q3 Balance Sheet & Tax Reconciliation',
    description: 'Reconcile Q3 accounts receivable against bank statements and generate audit documentation for external advisors.',
    assigneeId: '4',
    assigneeName: 'Mohammed Dwidar',
    teamMemberIds: ['7'],
    creatorName: 'Abdallah Sayed',
    dueDate: '2026-08-02',
    status: 'in_progress',
    priority: 'high',
    department: 'Finance',
    openerStage: 2,
    notes: [
      { id: 'n3', author: 'Mohammed Dwidar', text: 'Bank statements imported. Draft reconciliation at 85%.', createdAt: 'Jul 29, 2026 11:00' }
    ],
    createdAt: '2026-07-26'
  },
  {
    id: 'task_3',
    title: 'QA Automated Test Suite Execution',
    description: 'Execute full end-to-end regression suite across web & mobile views before major minor release.',
    assigneeId: '6',
    assigneeName: 'Salma Sabeb',
    teamMemberIds: ['3'],
    creatorName: 'Mohamed Alaa',
    dueDate: '2026-07-30',
    originalDueDate: '2026-07-30',
    status: 'extension_requested',
    priority: 'high',
    department: 'Engineering',
    openerStage: 3,
    extensionRequest: {
      requestedDate: '2026-08-03',
      reason: 'Staging environment reboot delayed execution of nightly automated Cypress suites.',
      status: 'pending',
      requestedAt: '2026-07-30 08:45'
    },
    notes: [
      { id: 'n4', author: 'Salma Sabeb', text: 'Smoke tests 100% green. Full suite queued.', createdAt: 'Jul 30, 2026 08:30' }
    ],
    createdAt: '2026-07-27'
  },
  {
    id: 'task_4',
    title: 'Firestore Security Rules Audit & Indexing',
    description: 'Review database access controls, test tenant isolation rules, and build missing composite indices.',
    assigneeId: '1',
    assigneeName: 'Esraa Al Barsiky',
    teamMemberIds: ['8'],
    creatorName: 'Abdallah Sayed',
    dueDate: '2026-08-05',
    status: 'todo',
    priority: 'medium',
    department: 'Engineering',
    openerStage: 3,
    notes: [],
    createdAt: '2026-07-28'
  },
  {
    id: 'task_5',
    title: 'Product Campaign Visual Assets & Media',
    description: 'Create high-res banners, social media mockups, and email templates for the new product launch.',
    assigneeId: '2',
    assigneeName: 'Esraa Soliman',
    teamMemberIds: ['5'],
    creatorName: 'Omar Adel',
    dueDate: '2026-07-31',
    status: 'review',
    priority: 'medium',
    department: 'Marketing',
    openerStage: 3,
    notes: [
      { id: 'n5', author: 'Esraa Soliman', text: 'Design drafts uploaded to workspace Drive folder for review.', createdAt: 'Jul 29, 2026 16:00' }
    ],
    createdAt: '2026-07-24'
  },
  {
    id: 'task_6',
    title: 'Client Onboarding Playbook Documentation',
    description: 'Publish standard operational procedures (SOPs) for enterprise client onboarding and technical setup.',
    assigneeId: '5',
    assigneeName: 'Omar Adel',
    teamMemberIds: ['8', '2'],
    creatorName: 'Abdallah Sayed',
    dueDate: '2026-07-28',
    status: 'completed',
    priority: 'low',
    department: 'Operations',
    openerStage: 4,
    notes: [
      { id: 'n6', author: 'Omar Adel', text: 'Playbook finalized and linked in workspace Directories.', createdAt: 'Jul 28, 2026 17:30' }
    ],
    createdAt: '2026-07-20'
  }
];

interface FollowUppersProps {
  onNavigate?: (view: ViewType, id?: string) => void;
}

export function FollowUppersView({ onNavigate }: FollowUppersProps) {
  const { users } = useWorkspace();

  // Tasks state stored in localStorage
  const [tasks, setTasks] = useState<WorkflowTask[]>(() => {
    const saved = localStorage.getItem('demo_management_tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_TASKS;
  });

  // Organizations & Key Masters state stored in localStorage
  const [organizations, setOrganizations] = useState<OrganizationConfig[]>(() => {
    const saved = localStorage.getItem('demo_organizations_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_ORGANIZATIONS;
  });

  useEffect(() => {
    localStorage.setItem('demo_management_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('demo_organizations_config', JSON.stringify(organizations));
  }, [organizations]);

  // View mode: 'mindmap' (Visual Flow) vs 'kanban' (Trello) vs 'table' (Monday.com)
  const [viewMode, setViewMode] = useState<'mindmap' | 'kanban' | 'table'>('mindmap');

  // Selected Organization for Mind Map View
  const [activeOrgId, setActiveOrgId] = useState<string>('Engineering');

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState('all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [selectedDueDateFilter, setSelectedDueDateFilter] = useState('all');
  const [selectedOpenerFilter, setSelectedOpenerFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<WorkflowTask | null>(null);
  const [taskModalTab, setTaskModalTab] = useState<'sub_mindmap' | 'details'>('sub_mindmap');

  // Create Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState(users[0]?.id || '1');
  const [newTaskTeamMembers, setNewTaskTeamMembers] = useState<string[]>([]);
  const [newTaskDept, setNewTaskDept] = useState('Engineering');
  const [newTaskOpenerStage, setNewTaskOpenerStage] = useState<1 | 2 | 3 | 4>(1);
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('2026-08-05');

  // Time Extension Modal / Form State
  const [isRequestingExtension, setIsRequestingExtension] = useState(false);
  const [extensionNewDate, setExtensionNewDate] = useState('');
  const [extensionReason, setExtensionReason] = useState('');

  // Internal Note State
  const [newNoteText, setNewNoteText] = useState('');

  // Reassign Task State
  const [isReassigning, setIsReassigning] = useState(false);
  const [reassignUserId, setReassignUserId] = useState('');

  // Active Organization Config
  const activeOrg = useMemo(() => {
    return organizations.find(o => o.id === activeOrgId) || organizations[0];
  }, [organizations, activeOrgId]);

  // Key Master Object
  const keyMasterUser = useMemo(() => {
    return users.find(u => u.id === activeOrg.keyMasterId) || users[0];
  }, [users, activeOrg]);

  // Unique departments list
  const departments = useMemo(() => {
    return organizations.map(o => o.name);
  }, [organizations]);

  // Filter tasks logic
  const filteredTasks = useMemo(() => {
    const todayStr = '2026-07-30';
    return tasks.filter(task => {
      // Search
      const matchesSearch = 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.assigneeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.department.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // User / Assignee filter
      if (selectedUserFilter !== 'all') {
        const isAssignee = task.assigneeId === selectedUserFilter;
        const isTeam = task.teamMemberIds?.includes(selectedUserFilter);
        if (!isAssignee && !isTeam) return false;
      }

      // Department / Organization filter
      if (selectedDeptFilter !== 'all' && task.department !== selectedDeptFilter) {
        return false;
      }

      // Opener Stage Filter
      if (selectedOpenerFilter !== 'all' && task.openerStage !== parseInt(selectedOpenerFilter)) {
        return false;
      }

      // Status filter
      if (selectedStatusFilter !== 'all' && task.status !== selectedStatusFilter) {
        return false;
      }

      // Due Date filter
      if (selectedDueDateFilter === 'overdue') {
        if (task.dueDate >= todayStr || task.status === 'completed') return false;
      } else if (selectedDueDateFilter === 'today') {
        if (task.dueDate !== todayStr) return false;
      } else if (selectedDueDateFilter === 'this_week') {
        if (task.dueDate > '2026-08-05' || task.dueDate < todayStr) return false;
      } else if (selectedDueDateFilter === 'extension') {
        if (task.status !== 'extension_requested') return false;
      }

      return true;
    });
  }, [tasks, searchQuery, selectedUserFilter, selectedDeptFilter, selectedOpenerFilter, selectedStatusFilter, selectedDueDateFilter]);

  // Check if an opener stage is locked for a given organization
  const isOpenerStageLocked = (org: OrganizationConfig, stage: number) => {
    // Opener 1 is always unlocked
    if (stage <= 1) return false;

    // Check if stage is beyond current active opener controlled by Key Master
    if (stage > org.currentActiveOpener) return true;

    // Check dependency lock: Are all tasks in previous stage (stage - 1) completed?
    const prevStageTasks = tasks.filter(t => t.department === org.id && t.openerStage === (stage - 1));
    if (prevStageTasks.length === 0) return false;
    
    const uncompletedPrevTasks = prevStageTasks.filter(t => t.status !== 'completed');
    return uncompletedPrevTasks.length > 0;
  };

  // Key Master advances active opener stage
  const handleAdvanceKeyMasterOpener = (orgId: string, targetStage?: number) => {
    setOrganizations(prev => prev.map(o => {
      if (o.id === orgId) {
        const nextStage = targetStage !== undefined ? targetStage : Math.min(4, o.currentActiveOpener + 1);
        return {
          ...o,
          currentActiveOpener: nextStage
        };
      }
      return o;
    }));
  };

  // Handle Create Task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const assignedUser = users.find(u => u.id === newTaskAssigneeId);
    const newTask: WorkflowTask = {
      id: `task_${Date.now()}`,
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim(),
      assigneeId: newTaskAssigneeId,
      assigneeName: assignedUser ? assignedUser.name : 'Team Member',
      teamMemberIds: newTaskTeamMembers,
      creatorName: 'You (Admin / Key Master)',
      dueDate: newTaskDueDate || '2026-08-05',
      originalDueDate: newTaskDueDate || '2026-08-05',
      status: 'todo',
      priority: newTaskPriority,
      department: newTaskDept,
      openerStage: newTaskOpenerStage,
      notes: [],
      createdAt: new Date().toISOString().split('T')[0]
    };

    setTasks(prev => [newTask, ...prev]);
    setIsCreateModalOpen(false);
    
    // Reset form
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskTeamMembers([]);
    setNewTaskDueDate('2026-08-05');
  };

  // Handle Reassignment of Task from one person to another
  const handleReassignTask = (taskId: string, newUserId: string) => {
    const newUser = users.find(u => u.id === newUserId);
    if (!newUser) return;

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          assigneeId: newUser.id,
          assigneeName: newUser.name,
          notes: [
            ...t.notes,
            {
              id: `note_${Date.now()}`,
              author: 'Key Master (System)',
              text: `🔄 Task reassigned from ${t.assigneeName} to ${newUser.name}.`,
              createdAt: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            }
          ]
        };
      }
      return t;
    }));

    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask(prev => prev ? {
        ...prev,
        assigneeId: newUser.id,
        assigneeName: newUser.name,
        notes: [
          ...prev.notes,
          {
            id: `note_${Date.now()}`,
            author: 'Key Master (System)',
            text: `🔄 Task reassigned to ${newUser.name}.`,
            createdAt: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          }
        ]
      } : null);
    }
    setIsReassigning(false);
  };

  // Handle Extension Request submission
  const handleRequestExtensionSubmit = (taskId: string) => {
    if (!extensionNewDate || !extensionReason.trim()) return;

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: 'extension_requested',
          originalDueDate: t.originalDueDate || t.dueDate,
          extensionRequest: {
            requestedDate: extensionNewDate,
            reason: extensionReason.trim(),
            status: 'pending',
            requestedAt: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          }
        };
      }
      return t;
    }));

    setIsRequestingExtension(false);
    setExtensionReason('');
    setExtensionNewDate('');

    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask(prev => prev ? {
        ...prev,
        status: 'extension_requested',
        extensionRequest: {
          requestedDate: extensionNewDate,
          reason: extensionReason.trim(),
          status: 'pending',
          requestedAt: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        }
      } : null);
    }
  };

  // Handle Key Master Accept Extension Request
  const handleAcceptExtension = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId && t.extensionRequest) {
        const newDueDate = t.extensionRequest.requestedDate;
        return {
          ...t,
          dueDate: newDueDate,
          status: 'in_progress',
          extensionRequest: {
            ...t.extensionRequest,
            status: 'accepted',
            managerComment: 'Approved by Key Master'
          },
          notes: [
            ...t.notes,
            {
              id: `note_${Date.now()}`,
              author: 'Key Master (System)',
              text: `✅ Time extension approved! New Due Date: ${newDueDate}`,
              createdAt: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            }
          ]
        };
      }
      return t;
    }));

    if (selectedTask && selectedTask.id === taskId && selectedTask.extensionRequest) {
      const newDueDate = selectedTask.extensionRequest.requestedDate;
      setSelectedTask(prev => prev ? {
        ...prev,
        dueDate: newDueDate,
        status: 'in_progress',
        extensionRequest: {
          ...prev.extensionRequest!,
          status: 'accepted'
        }
      } : null);
    }
  };

  // Handle Key Master Reject Extension Request
  const handleRejectExtension = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId && t.extensionRequest) {
        return {
          ...t,
          status: 'in_progress',
          extensionRequest: {
            ...t.extensionRequest,
            status: 'rejected',
            managerComment: 'Rejected by Key Master'
          },
          notes: [
            ...t.notes,
            {
              id: `note_${Date.now()}`,
              author: 'Key Master (System)',
              text: `❌ Time extension request rejected. Original due date (${t.dueDate}) remains active.`,
              createdAt: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            }
          ]
        };
      }
      return t;
    }));

    if (selectedTask && selectedTask.id === taskId && selectedTask.extensionRequest) {
      setSelectedTask(prev => prev ? {
        ...prev,
        status: 'in_progress',
        extensionRequest: {
          ...prev.extensionRequest!,
          status: 'rejected'
        }
      } : null);
    }
  };

  // Handle Add Internal Note
  const handleAddNote = (taskId: string) => {
    if (!newNoteText.trim()) return;

    const noteObj = {
      id: `note_${Date.now()}`,
      author: 'You',
      text: newNoteText.trim(),
      createdAt: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    };

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          notes: [...t.notes, noteObj]
        };
      }
      return t;
    }));

    setNewNoteText('');
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask(prev => prev ? {
        ...prev,
        notes: [...prev.notes, noteObj]
      } : null);
    }
  };

  // Quick Status change
  const handleUpdateStatus = (taskId: string, newStatus: WorkflowTask['status']) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  // Priority badge helper
  const getPriorityBadge = (priority: WorkflowTask['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'low': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Status badge helper
  const getStatusBadge = (status: WorkflowTask['status']) => {
    switch (status) {
      case 'todo': return { bg: 'bg-gray-700 text-gray-200 border-gray-600', label: 'To Do' };
      case 'in_progress': return { bg: 'bg-blue-600 text-white border-blue-500', label: 'In Progress' };
      case 'extension_requested': return { bg: 'bg-amber-600 text-white border-amber-500 animate-pulse', label: 'Extension Requested' };
      case 'review': return { bg: 'bg-purple-600 text-white border-purple-500', label: 'Under Review' };
      case 'completed': return { bg: 'bg-emerald-600 text-white border-emerald-500', label: 'Completed' };
    }
  };

  // Kanban Columns Definition
  const KANBAN_COLUMNS: Array<{ id: WorkflowTask['status']; title: string; icon: any; color: string }> = [
    { id: 'todo', title: 'To Do', icon: Circle, color: 'text-gray-400' },
    { id: 'in_progress', title: 'In Progress', icon: Clock, color: 'text-blue-400' },
    { id: 'extension_requested', title: 'Extension Requested', icon: AlertTriangle, color: 'text-amber-400' },
    { id: 'review', title: 'Under Review', icon: Hourglass, color: 'text-purple-400' },
    { id: 'completed', title: 'Completed', icon: CheckCircle2, color: 'text-emerald-400' },
  ];

  return (
    <div className="flex-1 bg-[#222529] flex flex-col h-full text-gray-200 overflow-hidden">
      
      {/* Top Header */}
      <div className="px-6 py-4 bg-[#1A1D21] border-b border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-md">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-400 text-[11px] font-bold rounded-full border border-indigo-500/30 flex items-center space-x-1">
              <Crown className="h-3 w-3 text-amber-400" />
              <span>Key Master & Mind Map Workflow</span>
            </span>
            <span className="text-gray-500 text-xs">•</span>
            <span className="text-gray-400 text-xs font-semibold">{tasks.length} Total Tasks across {organizations.length} Organizations</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5 flex items-center space-x-2">
            <span>Tasks & Follow-Ups Management</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Organized by Organizations & Key Masters. Mind Map flow links Start ➡️ Key Master ➡️ 4 Opener Stages ➡️ End Point.
          </p>
        </div>

        {/* View Mode & Create Task Button */}
        <div className="flex items-center space-x-3">
          <div className="bg-[#121317] p-1 rounded-xl border border-gray-800 flex items-center space-x-1">
            <button
              onClick={() => setViewMode('mindmap')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                viewMode === 'mindmap' 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Workflow className="h-4 w-4 text-amber-300" />
              <span>Mind Map Flow</span>
            </button>

            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                viewMode === 'table' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <ListIcon className="h-4 w-4" />
              <span>Monday Table</span>
            </button>

            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                viewMode === 'kanban' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Grid className="h-4 w-4" />
              <span>Trello Kanban</span>
            </button>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center space-x-2 shadow-lg shadow-blue-900/30 cursor-pointer transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* RICH FILTERS BAR */}
      <div className="px-6 py-3 border-b border-gray-800 bg-[#171A1E] flex flex-wrap items-center gap-3 shrink-0 text-xs">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, instructions, assignees..."
            className="w-full bg-[#121317] text-gray-200 pl-9 pr-3 py-1.5 rounded-xl border border-gray-700/80 focus:outline-none focus:border-blue-500 text-xs"
          />
        </div>

        {/* User / Assignee Filter */}
        <div className="flex items-center space-x-1.5 bg-[#121317] border border-gray-700/80 px-3 py-1.5 rounded-xl">
          <User className="h-3.5 w-3.5 text-blue-400" />
          <select
            value={selectedUserFilter}
            onChange={(e) => setSelectedUserFilter(e.target.value)}
            className="bg-transparent text-gray-200 focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-gray-900">All Employees</option>
            {users.map(u => (
              <option key={u.id} value={u.id} className="bg-gray-900">{u.name}</option>
            ))}
          </select>
        </div>

        {/* Department / Organization Filter */}
        <div className="flex items-center space-x-1.5 bg-[#121317] border border-gray-700/80 px-3 py-1.5 rounded-xl">
          <Building className="h-3.5 w-3.5 text-purple-400" />
          <select
            value={selectedDeptFilter}
            onChange={(e) => {
              setSelectedDeptFilter(e.target.value);
              if (e.target.value !== 'all') {
                setActiveOrgId(e.target.value);
              }
            }}
            className="bg-transparent text-gray-200 focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-gray-900">All Organizations</option>
            {departments.map(d => (
              <option key={d} value={d} className="bg-gray-900">{d} Org</option>
            ))}
          </select>
        </div>

        {/* Opener Stage Filter */}
        <div className="flex items-center space-x-1.5 bg-[#121317] border border-gray-700/80 px-3 py-1.5 rounded-xl">
          <Layers className="h-3.5 w-3.5 text-amber-400" />
          <select
            value={selectedOpenerFilter}
            onChange={(e) => setSelectedOpenerFilter(e.target.value)}
            className="bg-transparent text-gray-200 focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-gray-900">All 4 Stage Openers</option>
            <option value="1" className="bg-gray-900">Opener 1: Scope & Arch</option>
            <option value="2" className="bg-gray-900">Opener 2: Dev & Execution</option>
            <option value="3" className="bg-gray-900">Opener 3: QA & Testing</option>
            <option value="4" className="bg-gray-900">Opener 4: Deploy & Handover</option>
          </select>
        </div>

        {/* Due Date Filter */}
        <div className="flex items-center space-x-1.5 bg-[#121317] border border-gray-700/80 px-3 py-1.5 rounded-xl">
          <Calendar className="h-3.5 w-3.5 text-emerald-400" />
          <select
            value={selectedDueDateFilter}
            onChange={(e) => setSelectedDueDateFilter(e.target.value)}
            className="bg-transparent text-gray-200 focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-gray-900">All Due Dates</option>
            <option value="overdue" className="bg-gray-900">🚨 Overdue Tasks</option>
            <option value="extension" className="bg-gray-900">⏳ Extension Requested</option>
            <option value="today" className="bg-gray-900">Due Today</option>
            <option value="this_week" className="bg-gray-900">Due This Week</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-1.5 bg-[#121317] border border-gray-700/80 px-3 py-1.5 rounded-xl">
          <Filter className="h-3.5 w-3.5 text-blue-400" />
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-transparent text-gray-200 focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-gray-900">All Task Statuses</option>
            <option value="todo" className="bg-gray-900">To Do</option>
            <option value="in_progress" className="bg-gray-900">In Progress</option>
            <option value="extension_requested" className="bg-gray-900">Extension Requested</option>
            <option value="review" className="bg-gray-900">Under Review</option>
            <option value="completed" className="bg-gray-900">Completed</option>
          </select>
        </div>

        {/* Reset filters */}
        {(searchQuery || selectedUserFilter !== 'all' || selectedDeptFilter !== 'all' || selectedOpenerFilter !== 'all' || selectedDueDateFilter !== 'all' || selectedStatusFilter !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedUserFilter('all');
              setSelectedDeptFilter('all');
              setSelectedOpenerFilter('all');
              setSelectedDueDateFilter('all');
              setSelectedStatusFilter('all');
            }}
            className="px-2.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold rounded-xl text-xs flex items-center space-x-1 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-auto p-6 custom-scrollbar">
        {viewMode === 'mindmap' ? (
          
          /* ========================================================= */
          /* MIND MAP WORKFLOW VIEW (Interactive Start -> Key Master -> 4 Openers -> End) */
          /* ========================================================= */
          <div className="space-y-6">
            
            {/* Organization Selector Tabs */}
            <div className="flex items-center space-x-2 bg-[#1A1D21] p-2 rounded-2xl border border-gray-800 overflow-x-auto custom-scrollbar">
              <span className="text-xs font-bold text-gray-400 px-3 uppercase tracking-wider flex items-center space-x-1 shrink-0">
                <Building className="h-4 w-4 text-purple-400" />
                <span>Select Mind Map Organization:</span>
              </span>
              {organizations.map(org => {
                const isSelected = org.id === activeOrgId;
                const orgTaskCount = tasks.filter(t => t.department === org.id).length;

                return (
                  <button
                    key={org.id}
                    onClick={() => setActiveOrgId(org.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/40 border border-purple-400/40'
                        : 'bg-[#121317] text-gray-300 hover:bg-gray-800 border border-gray-800'
                    }`}
                  >
                    <Building className="h-3.5 w-3.5" />
                    <span>{org.name} Org</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-800 text-gray-400'}`}>
                      {orgTaskCount} tasks
                    </span>
                  </button>
                );
              })}
            </div>

            {/* MIND MAP WORKFLOW CANVAS */}
            <div className="bg-[#1A1D21] border border-gray-800/90 rounded-2xl p-6 space-y-8 shadow-2xl relative overflow-hidden bg-gradient-to-br from-[#1A1D21] via-[#1D2026] to-[#16181D]">
              
              {/* Header Banner */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-5">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-300 font-bold text-xs rounded-full border border-purple-500/30 flex items-center space-x-1.5">
                      <Workflow className="h-3.5 w-3.5 text-amber-400" />
                      <span>{activeOrg.name} Organization Mind Map Flow</span>
                    </span>
                    <span className="text-gray-400 text-xs">Active Opener Stage: <strong>Stage {activeOrg.currentActiveOpener}</strong></span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">Project Execution Workflow</h2>
                </div>

                {/* Key Master Control Button */}
                <div className="flex items-center space-x-3 bg-[#121317] border border-amber-500/40 px-4 py-2 rounded-2xl shadow-lg">
                  <Crown className="h-5 w-5 text-amber-400" />
                  <div>
                    <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Key Master: {activeOrg.keyMasterName}</div>
                    <div className="text-xs font-bold text-white">{activeOrg.keyMasterRole}</div>
                  </div>
                  <button
                    onClick={() => handleAdvanceKeyMasterOpener(activeOrg.id)}
                    disabled={activeOrg.currentActiveOpener >= 4}
                    className="ml-2 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1 cursor-pointer disabled:opacity-50 transition shadow"
                  >
                    <span>Advance Stage</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* FLOW NODE 1: START POINT */}
              <div className="flex flex-col items-center justify-center">
                <div className="bg-emerald-950/80 border-2 border-emerald-500/80 px-6 py-3 rounded-full text-center shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center space-x-3">
                  <div className="w-4 h-4 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-extrabold text-white text-sm tracking-wide">🟢 START POINT: {activeOrg.name} Project Kickoff</span>
                </div>

                {/* Vertical Line Connector */}
                <div className="w-0.5 h-8 bg-gradient-to-b from-emerald-500 via-purple-500 to-amber-500 my-1" />
              </div>

              {/* FLOW NODE 2: KEY MASTER MASTER CONTROL NODE */}
              <div className="flex flex-col items-center justify-center">
                <div className="bg-gradient-to-r from-amber-950/90 via-purple-950/90 to-indigo-950/90 border-2 border-amber-400/80 p-5 rounded-2xl max-w-xl w-full shadow-2xl space-y-2 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="inline-flex items-center space-x-2 bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/40">
                    <Crown className="h-4 w-4 text-amber-400" />
                    <span>Key Master Gatekeeper Node</span>
                  </div>

                  <h3 className="text-base font-bold text-white">{keyMasterUser.name} ({keyMasterUser.title || keyMasterUser.role})</h3>
                  <p className="text-xs text-gray-300">
                    Translates organizational strategy into 4 sequential Opener Stages. Controls progression between stage openers, approves task reassignment, and manages time extension requests.
                  </p>

                  <div className="pt-2 flex justify-center space-x-2">
                    {[1, 2, 3, 4].map((stageNum) => (
                      <button
                        key={stageNum}
                        onClick={() => handleAdvanceKeyMasterOpener(activeOrg.id, stageNum)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          activeOrg.currentActiveOpener === stageNum 
                            ? 'bg-amber-400 text-black shadow-lg font-extrabold' 
                            : 'bg-gray-800/90 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        Set Active to Opener {stageNum}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vertical Line Connector */}
                <div className="w-0.5 h-6 bg-gradient-to-b from-amber-500 to-indigo-500 my-1" />
              </div>

              {/* FLOW NODE 2.5: ORGANIZATION FOLLOWERS & TASK METRICS MIND MAP NODE */}
              {(() => {
                const orgTasks = tasks.filter(t => t.department === activeOrg.id);
                const totalOrgTasks = orgTasks.length;
                const completedOrgTasks = orgTasks.filter(t => t.status === 'completed').length;
                const inProgressOrgTasks = orgTasks.filter(t => t.status === 'in_progress').length;
                const extensionOrgTasks = orgTasks.filter(t => t.status === 'extension_requested').length;
                
                // Get all followers / team members assigned to tasks in this organization
                const orgFollowerIds = Array.from(new Set(
                  orgTasks.flatMap(t => [t.assigneeId, ...(t.teamMemberIds || [])])
                ));
                const orgFollowers = users.filter(u => orgFollowerIds.includes(u.id));

                return (
                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-[#12141A] border-2 border-indigo-500/60 p-5 rounded-2xl max-w-4xl w-full shadow-xl space-y-4">
                      
                      {/* Title & Badge */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-gray-800 pb-3">
                        <div className="flex items-center space-x-2">
                          <Users className="h-5 w-5 text-indigo-400" />
                          <h4 className="font-bold text-sm text-white">{activeOrg.name} Organization Mind Map Overview</h4>
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 font-bold rounded-lg border border-indigo-500/30">
                            {totalOrgTasks} Total Mind Map Tasks
                          </span>
                          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-bold rounded-lg border border-emerald-500/30">
                            {completedOrgTasks} Completed ({totalOrgTasks > 0 ? Math.round((completedOrgTasks / totalOrgTasks) * 100) : 0}%)
                          </span>
                        </div>
                      </div>

                      {/* Mind Map Task Breakdown Chips */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="bg-[#181B22] p-2.5 rounded-xl border border-gray-800 flex items-center justify-between">
                          <span className="text-gray-400 font-medium">In Progress</span>
                          <span className="font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">{inProgressOrgTasks}</span>
                        </div>
                        <div className="bg-[#181B22] p-2.5 rounded-xl border border-gray-800 flex items-center justify-between">
                          <span className="text-gray-400 font-medium">Extension Req</span>
                          <span className="font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">{extensionOrgTasks}</span>
                        </div>
                        <div className="bg-[#181B22] p-2.5 rounded-xl border border-gray-800 flex items-center justify-between">
                          <span className="text-gray-400 font-medium">Opener Stages</span>
                          <span className="font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">4 Stages</span>
                        </div>
                        <div className="bg-[#181B22] p-2.5 rounded-xl border border-gray-800 flex items-center justify-between">
                          <span className="text-gray-400 font-medium">Active Followers</span>
                          <span className="font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">{orgFollowers.length}</span>
                        </div>
                      </div>

                      {/* Organization Team Followers Mind Map Nodes */}
                      <div className="space-y-2 pt-1 border-t border-gray-800">
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                          <span>Team Followers Assigned in {activeOrg.name} Organization:</span>
                          <span className="text-indigo-400 font-mono">Click task cards below to view per-task mind map</span>
                        </div>

                        <div className="flex flex-wrap gap-2.5 pt-1">
                          {orgFollowers.length === 0 ? (
                            <span className="text-xs text-gray-500 italic">No followers assigned to tasks in this organization yet.</span>
                          ) : (
                            orgFollowers.map(user => {
                              const userOrgTasks = orgTasks.filter(t => t.assigneeId === user.id || t.teamMemberIds?.includes(user.id));
                              const isKeyMaster = activeOrg.keyMasterId === user.id;

                              return (
                                <div
                                  key={user.id}
                                  className="bg-[#181B22] hover:bg-[#1F232D] border border-gray-800 hover:border-indigo-500/60 p-2.5 rounded-xl flex items-center space-x-2.5 transition cursor-pointer shadow-sm group"
                                  onClick={() => setSelectedUserFilter(user.id)}
                                  title={`Click to filter tasks by ${user.name}`}
                                >
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                                    {user.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="flex items-center space-x-1">
                                      <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition">{user.name}</span>
                                      {isKeyMaster && (
                                        <Crown className="h-3 w-3 text-amber-400" title="Key Master" />
                                      )}
                                    </div>
                                    <div className="text-[10px] text-gray-400 flex items-center space-x-2">
                                      <span>{user.title || user.role}</span>
                                      <span className="text-indigo-400 font-bold">• {userOrgTasks.length} tasks</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Vertical Line Connector to 4 Openers */}
                    <div className="w-0.5 h-8 bg-gradient-to-b from-indigo-500 via-purple-500 to-emerald-500 my-1" />
                  </div>
                );
              })()}

              {/* FLOW NODE 3: THE 4 OPENER STAGES HORIZONTAL GRID */}
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    4 Mind Map Stage Openers (Tasks move from one person to another inside stage openers)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {activeOrg.openers.map((opener) => {
                    const isLocked = isOpenerStageLocked(activeOrg, opener.stage);
                    const stageTasks = filteredTasks.filter(t => t.department === activeOrg.id && t.openerStage === opener.stage);
                    const completedCount = stageTasks.filter(t => t.status === 'completed').length;
                    const isActive = activeOrg.currentActiveOpener === opener.stage;

                    return (
                      <div
                        key={opener.stage}
                        className={`border-2 rounded-2xl p-4 flex flex-col justify-between space-y-4 transition-all duration-300 relative ${
                          isLocked
                            ? 'bg-[#121317]/80 border-gray-800 opacity-75'
                            : isActive
                              ? 'bg-[#171A21] border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.25)]'
                              : 'bg-[#15171C] border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        {/* Stage Top Bar */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                              isLocked
                                ? 'bg-gray-800 text-gray-400 border-gray-700'
                                : isActive
                                  ? 'bg-purple-600 text-white border-purple-400'
                                  : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                            }`}>
                              Stage {opener.stage}
                            </span>

                            {isLocked ? (
                              <span className="flex items-center space-x-1 text-red-400 text-[10px] font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30">
                                <Lock className="h-3 w-3" />
                                <span>Locked</span>
                              </span>
                            ) : (
                              <span className="flex items-center space-x-1 text-emerald-400 text-[10px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                                <Unlock className="h-3 w-3" />
                                <span>Unlocked</span>
                              </span>
                            )}
                          </div>

                          <h4 className="font-bold text-sm text-white">{opener.title}</h4>
                          <p className="text-[11px] text-gray-400 leading-relaxed">{opener.description}</p>
                          <div className="text-[10px] text-amber-300/90 font-mono bg-amber-500/10 p-1.5 rounded border border-amber-500/20">
                            <strong>Deliverable:</strong> {opener.deliverable}
                          </div>
                        </div>

                        {/* Stage Tasks List */}
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center justify-between border-t border-gray-800 pt-2 text-[11px]">
                            <span className="font-bold text-gray-300">Opener Tasks:</span>
                            <span className="text-gray-400 font-semibold">{completedCount} / {stageTasks.length} Completed</span>
                          </div>

                          {isLocked ? (
                            <div className="p-4 bg-[#0E0F12] border border-gray-800/80 rounded-xl text-center space-y-2 text-xs">
                              <Lock className="h-5 w-5 text-gray-500 mx-auto" />
                              <p className="text-gray-400 text-[11px]">
                                Tasks in this stage are locked until Stage {opener.stage - 1} tasks are completed or Key Master unlocks.
                              </p>
                              <button
                                onClick={() => handleAdvanceKeyMasterOpener(activeOrg.id, opener.stage)}
                                className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                Key Master Force Unlock
                              </button>
                            </div>
                          ) : stageTasks.length === 0 ? (
                            <div className="text-center py-6 text-gray-500 text-xs border border-dashed border-gray-800 rounded-xl">
                              No tasks in this opener yet.
                            </div>
                          ) : (
                            stageTasks.map(task => {
                              const isExtensionPending = task.status === 'extension_requested' && task.extensionRequest?.status === 'pending';

                              return (
                                <div
                                  key={task.id}
                                  onClick={() => setSelectedTask(task)}
                                  className="bg-[#0E0F12] border border-gray-800 hover:border-purple-500/60 p-3 rounded-xl space-y-2 cursor-pointer transition group"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${getPriorityBadge(task.priority)}`}>
                                      {task.priority}
                                    </span>
                                    <span className="text-[9px] text-gray-400">{task.dueDate}</span>
                                  </div>

                                  <h5 className="font-bold text-xs text-white group-hover:text-purple-300 transition line-clamp-2">
                                    {task.title}
                                  </h5>

                                  {isExtensionPending && (
                                    <div className="bg-amber-500/15 border border-amber-500/30 p-1.5 rounded text-[10px] text-amber-300 font-bold flex items-center justify-between">
                                      <span>Asked for extension</span>
                                      <span className="font-mono">{task.extensionRequest?.requestedDate}</span>
                                    </div>
                                  )}

                                  {/* Assignee & Team Members */}
                                  <div className="flex items-center justify-between pt-1 border-t border-gray-800/60 text-[10px]">
                                    <div className="flex items-center space-x-1">
                                      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-[9px]">
                                        {task.assigneeName.charAt(0)}
                                      </div>
                                      <span className="text-gray-300 truncate max-w-[80px]">{task.assigneeName}</span>
                                    </div>

                                    {task.teamMemberIds && task.teamMemberIds.length > 0 && (
                                      <div className="flex items-center -space-x-1.5">
                                        {task.teamMemberIds.slice(0, 3).map((mId, idx) => {
                                          const tm = users.find(u => u.id === mId);
                                          return (
                                            <div key={idx} className="w-4 h-4 rounded-full bg-gray-700 text-gray-200 border border-gray-900 flex items-center justify-center text-[8px] font-bold">
                                              {tm ? tm.name.charAt(0) : 'T'}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Add Task to Opener */}
                        {!isLocked && (
                          <button
                            onClick={() => {
                              setNewTaskDept(activeOrg.id);
                              setNewTaskOpenerStage(opener.stage);
                              setIsCreateModalOpen(true);
                            }}
                            className="w-full py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs rounded-xl flex items-center justify-center space-x-1 cursor-pointer transition"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add Task to Opener {opener.stage}</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* FLOW NODE 4: END POINT */}
              <div className="flex flex-col items-center justify-center pt-4">
                <div className="w-0.5 h-8 bg-gradient-to-b from-indigo-500 to-amber-500 my-1" />
                <div className="bg-amber-950/80 border-2 border-amber-400/80 px-6 py-3 rounded-full text-center shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-amber-400" />
                  <span className="font-extrabold text-white text-sm tracking-wide">🏆 END POINT: {activeOrg.name} Project Handover & Production Delivery</span>
                </div>
              </div>

            </div>
          </div>
        ) : viewMode === 'kanban' ? (
          
          /* ========================================================= */
          /* TRELLO KANBAN BOARD VIEW */
          /* ========================================================= */
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 h-full min-w-[1100px]">
            {KANBAN_COLUMNS.map((col) => {
              const colTasks = filteredTasks.filter(t => t.status === col.id);
              const ColIcon = col.icon;

              return (
                <div 
                  key={col.id} 
                  className="bg-[#1A1D21] border border-gray-800 rounded-2xl flex flex-col max-h-full overflow-hidden shadow-lg"
                >
                  <div className="p-3.5 border-b border-gray-800/80 flex items-center justify-between bg-[#121317]">
                    <div className="flex items-center space-x-2">
                      <ColIcon className={`h-4 w-4 ${col.color}`} />
                      <h3 className="font-bold text-xs text-white uppercase tracking-wider">{col.title}</h3>
                    </div>
                    <span className="px-2 py-0.5 bg-gray-800 text-gray-300 font-extrabold text-[11px] rounded-full">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="p-3 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                    {colTasks.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-xs border-2 border-dashed border-gray-800/60 rounded-xl">
                        No tasks in this stage
                      </div>
                    ) : (
                      colTasks.map(task => {
                        const isExtensionPending = task.status === 'extension_requested' && task.extensionRequest?.status === 'pending';

                        return (
                          <div
                            key={task.id}
                            onClick={() => setSelectedTask(task)}
                            className={`bg-[#121317] border ${
                              isExtensionPending 
                                ? 'border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                                : 'border-gray-800 hover:border-blue-500/60'
                            } p-4 rounded-xl transition-all duration-200 cursor-pointer group hover:bg-[#16181F] space-y-3 relative`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide ${getPriorityBadge(task.priority)}`}>
                                {task.priority}
                              </span>

                              <span className="text-[10px] bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-full font-semibold border border-purple-500/20">
                                Opener {task.openerStage} • {task.department}
                              </span>
                            </div>

                            <div>
                              <h4 className="font-bold text-xs text-white group-hover:text-blue-400 transition leading-snug">
                                {task.title}
                              </h4>
                              <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                                {task.description}
                              </p>
                            </div>

                            {isExtensionPending && (
                              <div className="bg-amber-500/15 border border-amber-500/40 p-2 rounded-lg text-[11px] space-y-1">
                                <div className="flex items-center justify-between text-amber-300 font-bold">
                                  <div className="flex items-center space-x-1">
                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                                    <span>Asked for extension</span>
                                  </div>
                                  <span className="text-[10px] text-amber-400 font-mono">➡ {task.extensionRequest?.requestedDate}</span>
                                </div>
                                <p className="text-[10px] text-amber-200/90 italic truncate">
                                  "{task.extensionRequest?.reason}"
                                </p>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-gray-800/60 text-[11px]">
                              <div className="flex items-center space-x-1.5">
                                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-[9px]">
                                  {task.assigneeName.charAt(0)}
                                </div>
                                <span className="text-gray-300 font-medium truncate max-w-[90px]">{task.assigneeName}</span>
                              </div>

                              <div className="flex items-center space-x-2">
                                {task.notes.length > 0 && (
                                  <span className="flex items-center text-[10px] text-gray-400">
                                    <MessageSquare className="h-3 w-3 mr-0.5" />
                                    {task.notes.length}
                                  </span>
                                )}
                                <span className={`flex items-center font-semibold text-[10px] px-1.5 py-0.5 rounded ${
                                  task.dueDate < '2026-07-30' && task.status !== 'completed'
                                    ? 'bg-red-500/20 text-red-400 font-bold border border-red-500/30'
                                    : 'text-gray-400 bg-gray-800'
                                }`}>
                                  <Clock className="h-3 w-3 mr-1" />
                                  {task.dueDate}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (

          /* ========================================================= */
          /* MONDAY.COM TABLE VIEW (Organized by Organizations & People) */
          /* ========================================================= */
          <div className="space-y-6">
            {organizations.map((org) => {
              const orgTasks = filteredTasks.filter(t => t.department === org.id);
              if (selectedDeptFilter !== 'all' && selectedDeptFilter !== org.id) return null;

              return (
                <div key={org.id} className="bg-[#1A1D21] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                  {/* Organization Group Header */}
                  <div className="p-4 bg-[#121317] border-b border-gray-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-xl">
                        <Building className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-white text-base">{org.name} Organization</h3>
                          <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-full border border-amber-500/30 flex items-center space-x-1">
                            <Crown className="h-3 w-3" />
                            <span>Key Master: {org.keyMasterName}</span>
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">Active Opener Stage: Stage {org.currentActiveOpener}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-gray-400 font-semibold">{orgTasks.length} total tasks</span>
                      <button
                        onClick={() => {
                          setNewTaskDept(org.id);
                          setIsCreateModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-bold rounded-xl border border-blue-500/30 flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Task to {org.name}</span>
                      </button>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-gray-300">
                      <thead className="bg-[#15171C] text-gray-400 font-bold uppercase tracking-wider text-[11px] border-b border-gray-800">
                        <tr>
                          <th className="p-4">Task & What is needed</th>
                          <th className="p-4">Opener Stage</th>
                          <th className="p-4">Assigned Employee & Team</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Priority</th>
                          <th className="p-4">Due Date</th>
                          <th className="p-4">Extension Request</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/80">
                        {orgTasks.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-gray-500">
                              No tasks assigned under {org.name} Organization.
                            </td>
                          </tr>
                        ) : (
                          orgTasks.map(task => {
                            const statusInfo = getStatusBadge(task.status);
                            const isExtensionPending = task.status === 'extension_requested' && task.extensionRequest?.status === 'pending';

                            return (
                              <tr 
                                key={task.id}
                                className="hover:bg-[#1E2228] transition cursor-pointer group"
                                onClick={() => setSelectedTask(task)}
                              >
                                <td className="p-4 min-w-[240px]">
                                  <div className="font-bold text-white group-hover:text-blue-400 transition text-sm">
                                    {task.title}
                                  </div>
                                  <div className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                                    {task.description}
                                  </div>
                                </td>

                                <td className="p-4 whitespace-nowrap">
                                  <span className="px-2.5 py-1 bg-amber-500/15 text-amber-300 font-bold rounded-lg border border-amber-500/30">
                                    Stage {task.openerStage}
                                  </span>
                                </td>

                                <td className="p-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow">
                                      {task.assigneeName.charAt(0)}
                                    </div>
                                    <div>
                                      <div className="font-bold text-gray-200">{task.assigneeName}</div>
                                      {task.teamMemberIds && task.teamMemberIds.length > 0 && (
                                        <div className="text-[10px] text-gray-400">
                                          + {task.teamMemberIds.length} team members
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                <td className="p-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                  <select
                                    value={task.status}
                                    onChange={(e) => handleUpdateStatus(task.id, e.target.value as WorkflowTask['status'])}
                                    className={`px-3 py-1.5 rounded-xl font-bold text-xs border cursor-pointer focus:outline-none ${statusInfo.bg}`}
                                  >
                                    <option value="todo" className="bg-gray-900 text-gray-200">To Do</option>
                                    <option value="in_progress" className="bg-gray-900 text-blue-400">In Progress</option>
                                    <option value="extension_requested" className="bg-gray-900 text-amber-400">Extension Requested</option>
                                    <option value="review" className="bg-gray-900 text-purple-400">Under Review</option>
                                    <option value="completed" className="bg-gray-900 text-emerald-400">Completed</option>
                                  </select>
                                </td>

                                <td className="p-4 whitespace-nowrap">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getPriorityBadge(task.priority)}`}>
                                    {task.priority}
                                  </span>
                                </td>

                                <td className="p-4 whitespace-nowrap font-medium">
                                  <div className="flex items-center space-x-1 text-gray-300">
                                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                    <span className={task.dueDate < '2026-07-30' && task.status !== 'completed' ? 'text-red-400 font-bold' : ''}>
                                      {task.dueDate}
                                    </span>
                                  </div>
                                </td>

                                <td className="p-4 max-w-[180px]" onClick={(e) => e.stopPropagation()}>
                                  {isExtensionPending ? (
                                    <div className="space-y-1">
                                      <div className="text-amber-400 font-bold text-[11px] flex items-center space-x-1">
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                        <span>Req: {task.extensionRequest?.requestedDate}</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <button
                                          onClick={() => handleAcceptExtension(task.id)}
                                          className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded cursor-pointer"
                                        >
                                          Accept
                                        </button>
                                        <button
                                          onClick={() => handleRejectExtension(task.id)}
                                          className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold rounded cursor-pointer"
                                        >
                                          Reject
                                        </button>
                                      </div>
                                    </div>
                                  ) : task.extensionRequest?.status === 'accepted' ? (
                                    <span className="text-emerald-400 font-semibold text-[11px] flex items-center space-x-1">
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      <span>Extension Approved</span>
                                    </span>
                                  ) : (
                                    <span className="text-gray-500 italic text-[11px]">None</span>
                                  )}
                                </td>

                                <td className="p-4 text-right whitespace-nowrap">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedTask(task);
                                    }}
                                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold rounded-lg text-xs"
                                  >
                                    Open Details
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE TASK MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1D21] border border-gray-800 rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white">Create New Task for Employee</h3>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Audit API Performance & Telemetry Leaks"
                  className="w-full bg-[#121317] border border-gray-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Primary Assignee *</label>
                  <select
                    value={newTaskAssigneeId}
                    onChange={(e) => setNewTaskAssigneeId(e.target.value)}
                    className="w-full bg-[#121317] border border-gray-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id} className="bg-gray-900">
                        {u.name} — {u.title || u.role}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-bold mb-1">Organization / Dept *</label>
                  <select
                    value={newTaskDept}
                    onChange={(e) => setNewTaskDept(e.target.value)}
                    className="w-full bg-[#121317] border border-gray-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-blue-500 text-xs"
                  >
                    {departments.map(d => (
                      <option key={d} value={d} className="bg-gray-900">{d} Org</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Team Members Selection */}
              <div>
                <label className="block text-gray-300 font-bold mb-1">Add Team Members / Collaborators</label>
                <div className="flex flex-wrap gap-2 bg-[#121317] p-2.5 rounded-xl border border-gray-700 max-h-24 overflow-y-auto">
                  {users.map(u => {
                    if (u.id === newTaskAssigneeId) return null;
                    const isSelected = newTaskTeamMembers.includes(u.id);

                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setNewTaskTeamMembers(prev => prev.filter(id => id !== u.id));
                          } else {
                            setNewTaskTeamMembers(prev => [...prev, u.id]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center space-x-1 ${
                          isSelected 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        <span>{u.name}</span>
                        {isSelected && <Check className="h-3 w-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">What is needed exactly from him? (Instructions) *</label>
                <textarea
                  rows={3}
                  required
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Detailed instructions, requirements, deliverables, and expected output..."
                  className="w-full bg-[#121317] border border-gray-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-blue-500 text-xs custom-scrollbar"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Mind Map Opener Stage</label>
                  <select
                    value={newTaskOpenerStage}
                    onChange={(e) => setNewTaskOpenerStage(parseInt(e.target.value) as any)}
                    className="w-full bg-[#121317] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none text-xs"
                  >
                    <option value={1} className="bg-gray-900">Opener 1: Scope & Arch</option>
                    <option value={2} className="bg-gray-900">Opener 2: Dev & Execution</option>
                    <option value={3} className="bg-gray-900">Opener 3: QA & Testing</option>
                    <option value={4} className="bg-gray-900">Opener 4: Deploy & Handover</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-bold mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full bg-[#121317] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none text-xs"
                  >
                    <option value="low" className="bg-gray-900">Low</option>
                    <option value="medium" className="bg-gray-900">Medium</option>
                    <option value="high" className="bg-gray-900">High</option>
                    <option value="urgent" className="bg-gray-900">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-bold mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full bg-[#121317] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-900/30"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK DETAIL & SUB-MIND-MAP POPUP MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#1A1D21] border border-gray-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header Bar with View Switcher */}
            <div className="p-5 bg-[#121317] border-b border-gray-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl text-white shadow-lg">
                  <Workflow className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Task Sub-Mind-Map
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide ${getPriorityBadge(selectedTask.priority)}`}>
                      {selectedTask.priority} Priority
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-0.5 line-clamp-1">{selectedTask.title}</h2>
                </div>
              </div>

              {/* View Mode Switcher Tabs */}
              <div className="flex items-center space-x-2 bg-[#1A1D21] p-1.5 rounded-2xl border border-gray-800">
                <button
                  onClick={() => setTaskModalTab('sub_mindmap')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    taskModalTab === 'sub_mindmap'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Workflow className="h-3.5 w-3.5" />
                  <span>Interactive Task Mind Map</span>
                </button>
                <button
                  onClick={() => setTaskModalTab('details')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    taskModalTab === 'details'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Task Details & Notes</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedTask(null);
                    setIsRequestingExtension(false);
                    setIsReassigning(false);
                  }}
                  className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 ml-2"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* MODAL BODY */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gradient-to-b from-[#1A1D21] to-[#14161B]">
              
              {taskModalTab === 'sub_mindmap' ? (
                /* ========================================================= */
                /* TASK SUB-MIND-MAP POPUP (Assigned People + Stages + What He Made) */
                /* ========================================================= */
                <div className="space-y-8">
                  
                  {/* CENTRAL ROOT NODE: THE TASK CORE HUB */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-gradient-to-r from-purple-950/90 via-indigo-950/90 to-slate-900/90 border-2 border-purple-500/80 p-6 rounded-3xl max-w-2xl w-full shadow-2xl space-y-3 text-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                      <div className="flex items-center justify-center space-x-2">
                        <span className="px-3 py-1 bg-amber-500/20 text-amber-300 font-bold text-xs rounded-full border border-amber-500/40 flex items-center space-x-1">
                          <Crown className="h-3.5 w-3.5 text-amber-400" />
                          <span>Stage {selectedTask.openerStage} Opener • {selectedTask.department} Org</span>
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(selectedTask.status).bg}`}>
                          {selectedTask.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      <h3 className="text-xl font-extrabold text-white leading-snug">🎯 {selectedTask.title}</h3>
                      
                      {/* What is needed exactly box */}
                      <div className="bg-[#121317]/90 border border-purple-500/30 p-3.5 rounded-2xl text-left text-xs space-y-1">
                        <div className="font-bold text-purple-300 uppercase tracking-wider text-[10px] flex items-center space-x-1">
                          <FileText className="h-3.5 w-3.5" />
                          <span>What is needed exactly (Instructions):</span>
                        </div>
                        <p className="text-gray-300 leading-relaxed">{selectedTask.description}</p>
                      </div>

                      {/* Timeline & Due Date */}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-purple-500/20 px-2">
                        <span className="text-gray-400">Due Date SLA: <strong className="text-emerald-300">{selectedTask.dueDate}</strong></span>
                        <span className="text-gray-400">Assigned People: <strong className="text-indigo-300">{(selectedTask.teamMemberIds?.length || 0) + 1} Members</strong></span>
                      </div>
                    </div>

                    {/* Root Connector Branch Line */}
                    <div className="w-0.5 h-8 bg-gradient-to-b from-purple-500 to-indigo-500 my-1" />
                    <div className="text-[11px] font-extrabold text-purple-300 uppercase tracking-widest bg-purple-950/80 px-4 py-1 rounded-full border border-purple-500/40 shadow">
                      Assignees & Team Collaborator Mind Map Nodes
                    </div>
                    <div className="w-0.5 h-6 bg-gradient-to-b from-purple-500 to-indigo-500 my-1" />
                  </div>

                  {/* ASSIGNED PEOPLE MIND MAP NODES GRID (Primary + Team Members) */}
                  {(() => {
                    const primaryUser = users.find(u => u.id === selectedTask.assigneeId);
                    const teamUsers = users.filter(u => selectedTask.teamMemberIds?.includes(u.id));
                    const allAssigned = [
                      { user: primaryUser || { id: selectedTask.assigneeId, name: selectedTask.assigneeName, role: 'Employee', title: 'Primary Assignee' }, isPrimary: true },
                      ...teamUsers.map(u => ({ user: u, isPrimary: false }))
                    ];

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {allAssigned.map(({ user, isPrimary }) => {
                          // Find notes/contributions made by this specific user
                          const userNotes = selectedTask.notes.filter(n => n.author.toLowerCase().includes(user.name.split(' ')[0].toLowerCase()));

                          return (
                            <div
                              key={user.id}
                              className={`border-2 rounded-2xl p-5 space-y-4 shadow-xl relative transition ${
                                isPrimary
                                  ? 'bg-[#151720] border-purple-500/90 shadow-purple-900/20'
                                  : 'bg-[#14161C] border-gray-800 hover:border-indigo-500/60'
                              }`}
                            >
                              {/* Person Node Header */}
                              <div className="flex items-start justify-between border-b border-gray-800 pb-3">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm text-white shadow-lg ${
                                    isPrimary
                                      ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 border border-purple-400'
                                      : 'bg-gradient-to-tr from-blue-600 to-indigo-600 border border-blue-400'
                                  }`}>
                                    {user.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="flex items-center space-x-1.5">
                                      <h4 className="font-bold text-sm text-white">{user.name}</h4>
                                      {isPrimary ? (
                                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 font-extrabold text-[9px] rounded-full border border-purple-500/40">
                                          PRIMARY LEAD
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 font-bold text-[9px] rounded-full border border-blue-500/40">
                                          COLLABORATOR
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-400">{user.title || user.role}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Individual Stage Node */}
                              <div className="bg-[#0F1014] border border-gray-800 p-3 rounded-xl space-y-2 text-xs">
                                <div className="flex items-center justify-between text-gray-400">
                                  <span className="font-bold text-[10px] uppercase tracking-wider">Individual Work Stage:</span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusBadge(selectedTask.status).bg}`}>
                                    {selectedTask.status.replace('_', ' ')}
                                  </span>
                                </div>

                                <div className="text-[11px] text-gray-300 flex items-center justify-between pt-1">
                                  <span>Update Member Status:</span>
                                  <select
                                    value={selectedTask.status}
                                    onChange={(e) => handleUpdateStatus(selectedTask.id, e.target.value as WorkflowTask['status'])}
                                    className="bg-[#1A1D21] text-xs text-white border border-gray-700 rounded-lg px-2 py-1 font-semibold cursor-pointer"
                                  >
                                    <option value="todo">To Do</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="extension_requested">Extension Requested</option>
                                    <option value="review">Under Review</option>
                                    <option value="completed">Completed</option>
                                  </select>
                                </div>
                              </div>

                              {/* What He Made / Contributions Node */}
                              <div className="space-y-2">
                                <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center justify-between">
                                  <span>What He Made / Contribution:</span>
                                  <span className="text-gray-400">{userNotes.length} updates</span>
                                </div>

                                <div className="bg-[#0F1014] border border-gray-800 rounded-xl p-3 space-y-2 min-h-[90px] max-h-[140px] overflow-y-auto custom-scrollbar text-xs">
                                  {userNotes.length === 0 ? (
                                    <div className="text-center py-4 text-gray-500 text-[11px] italic">
                                      No contributions logged by {user.name} yet.
                                    </div>
                                  ) : (
                                    userNotes.map(n => (
                                      <div key={n.id} className="bg-[#181B22] p-2 rounded-lg border border-gray-800 space-y-1">
                                        <div className="flex justify-between text-[10px] text-gray-400">
                                          <span className="font-bold text-purple-300">{n.author}</span>
                                          <span>{n.createdAt}</span>
                                        </div>
                                        <p className="text-gray-200 text-[11px] leading-relaxed">{n.text}</p>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>

                              {/* Direct Note / Contribution Log Input for this Member */}
                              <div className="pt-1">
                                <div className="flex items-center space-x-1.5">
                                  <input
                                    type="text"
                                    placeholder={`Log work made by ${user.name.split(' ')[0]}...`}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                        const text = `[Work by ${user.name}]: ${e.currentTarget.value.trim()}`;
                                        const note = {
                                          id: `note-${Date.now()}`,
                                          author: user.name,
                                          text: text,
                                          createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                        };
                                        const updatedTasks = tasks.map(t => t.id === selectedTask.id ? { ...t, notes: [note, ...t.notes] } : t);
                                        setTasks(updatedTasks);
                                        localStorage.setItem('demo_followup_tasks', JSON.stringify(updatedTasks));
                                        setSelectedTask({ ...selectedTask, notes: [note, ...selectedTask.notes] });
                                        e.currentTarget.value = '';
                                      }
                                    }}
                                    className="flex-1 bg-[#0F1014] border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* BOTTOM HUB: MANAGEMENT DECISION NODE */}
                  <div className="bg-gradient-to-r from-amber-950/80 via-purple-950/80 to-slate-900/80 border-2 border-amber-500/60 p-5 rounded-3xl space-y-4 shadow-2xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-amber-500/30 pb-3">
                      <div className="flex items-center space-x-2">
                        <Crown className="h-5 w-5 text-amber-400" />
                        <h4 className="font-bold text-base text-white">Key Master Management Decision Control</h4>
                      </div>
                      <span className="text-xs text-amber-300 font-mono">
                        Key Master: {activeOrg.keyMasterName} ({activeOrg.keyMasterRole})
                      </span>
                    </div>

                    {/* Pending Extension Request Decisions */}
                    {selectedTask.extensionRequest && selectedTask.extensionRequest.status === 'pending' && (
                      <div className="bg-amber-500/15 border border-amber-500/40 p-4 rounded-2xl space-y-2 text-xs">
                        <div className="flex items-center justify-between text-amber-300 font-bold">
                          <span className="flex items-center space-x-1">
                            <AlertTriangle className="h-4 w-4 text-amber-400" />
                            <span>Employee Requested Extension to Date: {selectedTask.extensionRequest.requestedDate}</span>
                          </span>
                        </div>
                        <p className="text-amber-200/90 italic">"{selectedTask.extensionRequest.reason}"</p>
                        
                        <div className="pt-2 flex items-center space-x-3">
                          <button
                            onClick={() => {
                              handleAcceptExtension(selectedTask.id);
                              setSelectedTask({ ...selectedTask, dueDate: selectedTask.extensionRequest!.requestedDate, status: 'in_progress', extensionRequest: { ...selectedTask.extensionRequest!, status: 'accepted' } });
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center space-x-1"
                          >
                            <Check className="h-4 w-4" />
                            <span>Approve Extension Request</span>
                          </button>
                          <button
                            onClick={() => {
                              handleRejectExtension(selectedTask.id);
                              setSelectedTask({ ...selectedTask, status: 'in_progress', extensionRequest: { ...selectedTask.extensionRequest!, status: 'rejected' } });
                            }}
                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center space-x-1"
                          >
                            <X className="h-4 w-4" />
                            <span>Reject Request</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Quick Management Actions Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-300 font-bold">Move Opener Stage:</span>
                        {[1, 2, 3, 4].map(sNum => (
                          <button
                            key={sNum}
                            onClick={() => {
                              const updated = tasks.map(t => t.id === selectedTask.id ? { ...t, openerStage: sNum as any } : t);
                              setTasks(updated);
                              localStorage.setItem('demo_followup_tasks', JSON.stringify(updated));
                              setSelectedTask({ ...selectedTask, openerStage: sNum as any });
                            }}
                            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                              selectedTask.openerStage === sNum
                                ? 'bg-amber-400 text-black shadow-lg'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            }`}
                          >
                            Stage {sNum}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            const newStatus = selectedTask.status === 'completed' ? 'in_progress' : 'completed';
                            handleUpdateStatus(selectedTask.id, newStatus);
                            setSelectedTask({ ...selectedTask, status: newStatus });
                          }}
                          className={`px-4 py-2 rounded-xl font-bold text-xs shadow cursor-pointer transition flex items-center space-x-1.5 ${
                            selectedTask.status === 'completed'
                              ? 'bg-amber-500 text-black hover:bg-amber-400'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>{selectedTask.status === 'completed' ? 'Reopen Task' : 'Mark Task 100% Completed'}</span>
                        </button>
                      </div>
                    </div>

                  </div>

                </div>
              ) : (
                /* ========================================================= */
                /* LINEAR DETAILS & DOCUMENTATION TAB */
                /* ========================================================= */
                <div className="space-y-6">
                  {/* Task Title & Reassign Control */}
                  <div className="space-y-3">
                    <h2 className="text-xl font-bold text-white leading-snug">{selectedTask.title}</h2>
                    
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-[#121317] p-4 rounded-2xl border border-gray-800">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow">
                          {selectedTask.assigneeName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-gray-400 text-[10px]">Primary Assignee:</div>
                          <div className="font-bold text-white text-sm">{selectedTask.assigneeName}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setIsReassigning(!isReassigning)}
                          className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-blue-300 font-bold text-xs rounded-xl flex items-center space-x-1.5 border border-gray-700 cursor-pointer"
                        >
                          <UserPlus className="h-4 w-4" />
                          <span>Reassign Task</span>
                        </button>
                      </div>
                    </div>

                    {/* Reassign Dropdown Panel */}
                    {isReassigning && (
                      <div className="bg-[#171A21] border border-blue-500/40 p-4 rounded-2xl space-y-3 animate-in fade-in text-xs">
                        <span className="font-bold text-white block">Move Task to another employee:</span>
                        <div className="flex items-center space-x-2">
                          <select
                            value={reassignUserId}
                            onChange={(e) => setReassignUserId(e.target.value)}
                            className="flex-1 bg-[#121317] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                          >
                            <option value="">Select Employee...</option>
                            {users.map(u => (
                              <option key={u.id} value={u.id}>{u.name} — {u.title || u.role}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              handleReassignTask(selectedTask.id, reassignUserId);
                              const newAssignee = users.find(u => u.id === reassignUserId);
                              if (newAssignee) setSelectedTask({ ...selectedTask, assigneeId: newAssignee.id, assigneeName: newAssignee.name });
                            }}
                            disabled={!reassignUserId}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl disabled:opacity-50 cursor-pointer"
                          >
                            Confirm Move
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* What is needed exactly */}
                  <div className="bg-[#121317] border border-gray-800 p-5 rounded-2xl space-y-2">
                    <h4 className="font-bold text-xs text-blue-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <FileText className="h-4 w-4" />
                      <span>What is needed exactly from him (Instructions)</span>
                    </h4>
                    <p className="text-xs text-gray-200 leading-relaxed whitespace-pre-wrap">
                      {selectedTask.description}
                    </p>
                  </div>

                  {/* Due Date & Time Extension Section */}
                  <div className="bg-[#121317] border border-gray-800 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs font-bold text-white">Due Date & Timeline SLA</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        {selectedTask.dueDate}
                      </span>
                    </div>

                    {/* Request More Time Button */}
                    {!isRequestingExtension && selectedTask.status !== 'completed' && (
                      <button
                        onClick={() => setIsRequestingExtension(true)}
                        className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/30 flex items-center justify-center space-x-1.5 cursor-pointer transition"
                      >
                        <Hourglass className="h-4 w-4" />
                        <span>Employee Request More Time (Ask for Extension)</span>
                      </button>
                    )}

                    {/* Extension Form */}
                    {isRequestingExtension && (
                      <div className="bg-[#171A21] border border-amber-500/40 p-4 rounded-2xl space-y-3 text-xs animate-in fade-in">
                        <h5 className="font-bold text-amber-300 flex items-center space-x-1">
                          <Hourglass className="h-4 w-4" />
                          <span>Ask Key Master for More Time</span>
                        </h5>
                        <div>
                          <label className="block text-gray-300 font-semibold mb-1">Requested New Due Date</label>
                          <input
                            type="date"
                            value={extensionNewDate}
                            onChange={(e) => setExtensionNewDate(e.target.value)}
                            className="w-full bg-[#121317] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-300 font-semibold mb-1">Reason for Extension</label>
                          <textarea
                            rows={2}
                            value={extensionReason}
                            onChange={(e) => setExtensionReason(e.target.value)}
                            placeholder="Explain why extra time is required to finalize this task..."
                            className="w-full bg-[#121317] border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none custom-scrollbar"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setIsRequestingExtension(false)}
                            className="px-3.5 py-2 bg-gray-800 text-gray-300 font-bold rounded-xl text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRequestExtensionSubmit(selectedTask.id)}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs cursor-pointer"
                          >
                            Submit Request
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Internal Documentation Notes */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs text-gray-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <MessageSquare className="h-4 w-4 text-purple-400" />
                      <span>Internal Documentation Notes ({selectedTask.notes.length})</span>
                    </h4>

                    <div className="bg-[#121317] border border-gray-800 rounded-2xl p-4 space-y-2 min-h-[140px] max-h-[260px] overflow-y-auto custom-scrollbar">
                      {selectedTask.notes.length === 0 ? (
                        <div className="text-center py-6 text-gray-500 text-xs">
                          No internal notes logged yet. Add documentation below.
                        </div>
                      ) : (
                        selectedTask.notes.map(note => (
                          <div key={note.id} className="bg-[#171A21] border border-gray-800 p-3 rounded-xl space-y-1 text-xs">
                            <div className="flex items-center justify-between text-gray-400 text-[10px]">
                              <span className="font-bold text-purple-300">{note.author}</span>
                              <span>{note.createdAt}</span>
                            </div>
                            <p className="text-gray-200">{note.text}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Note Input */}
                    <div className="flex items-center space-x-2 pt-1">
                      <input
                        type="text"
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddNote(selectedTask.id);
                        }}
                        placeholder="Add internal documentation note..."
                        className="flex-1 bg-[#121317] border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={() => handleAddNote(selectedTask.id)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                      >
                        Add Note
                      </button>
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
