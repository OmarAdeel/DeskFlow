export interface EmployeeAnalyticsData {
  userId: string;
  name: string;
  role: string;
  title: string;
  email: string;
  department: 'Engineering' | 'Management' | 'Design' | 'QA' | 'HR' | 'Accounting' | 'Support';
  performanceScore: number; // 0-100
  ratingGrade: 'A+' | 'A' | 'B+' | 'B' | 'C';
  stats: {
    tasksCompleted: number;
    tasksOnTimePct: number;
    avgResponseMinutes: number;
    totalMessagesSent: number;
    threadsResolved: number;
    csatScore: number; // 0-5.0
    karmaPoints: number;
    activeHoursPerDay: number;
    peakProductivityWindow: string;
  };
  weeklyActivity: { day: string; tasks: number; messages: number; hours: number }[];
  workDistribution: { category: string; percentage: number; color: string }[];
  goals: { title: string; current: number; target: number; unit: string; status: 'completed' | 'on-track' | 'at-risk' }[];
  badges: { id: string; title: string; description: string; icon: string; bg: string }[];
  recentActivities: { id: string; action: string; category: string; timestamp: string; impact: string }[];
  notes?: string;
}

export const mockEmployeeAnalytics: Record<string, EmployeeAnalyticsData> = {
  '1': {
    userId: '1',
    name: 'Esraa Al Barsiky',
    role: 'Admin',
    title: 'HR Manager',
    email: 'esraa.barsiky@democompany.com',
    department: 'HR',
    performanceScore: 97,
    ratingGrade: 'A+',
    stats: {
      tasksCompleted: 156,
      tasksOnTimePct: 99,
      avgResponseMinutes: 8,
      totalMessagesSent: 2420,
      threadsResolved: 88,
      csatScore: 4.95,
      karmaPoints: 620,
      activeHoursPerDay: 7.8,
      peakProductivityWindow: '09:00 AM - 01:00 PM'
    },
    weeklyActivity: [
      { day: 'Mon', tasks: 12, messages: 180, hours: 8.0 },
      { day: 'Tue', tasks: 18, messages: 240, hours: 8.2 },
      { day: 'Wed', tasks: 15, messages: 210, hours: 7.5 },
      { day: 'Thu', tasks: 22, messages: 310, hours: 8.5 },
      { day: 'Fri', tasks: 14, messages: 195, hours: 7.0 }
    ],
    workDistribution: [
      { category: 'Recruitment & Onboarding', percentage: 40, color: 'bg-purple-500' },
      { category: 'Team Relations & Ops', percentage: 30, color: 'bg-[#4CAF50]' },
      { category: 'Policy & Compliance', percentage: 20, color: 'bg-blue-500' },
      { category: 'Admin & Syncs', percentage: 10, color: 'bg-amber-500' }
    ],
    goals: [
      { title: 'Q3 Hiring Target', current: 12, target: 12, unit: 'candidates', status: 'completed' },
      { title: 'Employee Satisfaction Rate', current: 94, target: 90, unit: '%', status: 'completed' },
      { title: 'Onboarding SLA', current: 1.5, target: 2.0, unit: 'days', status: 'on-track' }
    ],
    badges: [
      { id: 'b1', title: 'Top Leader', description: 'Consistently highest team satisfaction score', icon: 'Crown', bg: 'bg-amber-500/20 text-amber-400' },
      { id: 'b2', title: 'Speed Demon', description: 'Avg response time under 10 minutes', icon: 'Zap', bg: 'bg-blue-500/20 text-blue-400' },
      { id: 'b3', title: 'Culture Champion', description: 'Awarded 600+ Karma recognition points', icon: 'Heart', bg: 'bg-[#4CAF50]/20 text-[#4CAF50]' }
    ],
    recentActivities: [
      { id: 'a1', action: 'Completed Q3 Performance Reviews for 14 employees', category: 'HR', timestamp: '2 hours ago', impact: 'High' },
      { id: 'a2', action: 'Approved new onboarding workflow in #general-vt-school', category: 'Operations', timestamp: 'Yesterday', impact: 'Medium' },
      { id: 'a3', action: 'Resolved team policy query in DMs', category: 'Support', timestamp: '2 days ago', impact: 'Medium' }
    ],
    notes: 'Exemplary leadership. Consistently maintains fast response times and fosters great culture across the team.'
  },
  '2': {
    userId: '2',
    name: 'Esraa Soliman',
    role: 'Member',
    title: 'Developer',
    email: 'esraa.soliman@democompany.com',
    department: 'Engineering',
    performanceScore: 94,
    ratingGrade: 'A+',
    stats: {
      tasksCompleted: 184,
      tasksOnTimePct: 96,
      avgResponseMinutes: 14,
      totalMessagesSent: 1980,
      threadsResolved: 112,
      csatScore: 4.88,
      karmaPoints: 480,
      activeHoursPerDay: 8.2,
      peakProductivityWindow: '11:00 AM - 04:00 PM'
    },
    weeklyActivity: [
      { day: 'Mon', tasks: 16, messages: 140, hours: 8.5 },
      { day: 'Tue', tasks: 20, messages: 190, hours: 8.0 },
      { day: 'Wed', tasks: 24, messages: 210, hours: 8.8 },
      { day: 'Thu', tasks: 18, messages: 175, hours: 8.1 },
      { day: 'Fri', tasks: 15, messages: 160, hours: 7.6 }
    ],
    workDistribution: [
      { category: 'Frontend Development', percentage: 50, color: 'bg-blue-500' },
      { category: 'API Integration', percentage: 25, color: 'bg-emerald-500' },
      { category: 'Bug Fixes & Refactoring', percentage: 15, color: 'bg-amber-500' },
      { category: 'Code Reviews', percentage: 10, color: 'bg-purple-500' }
    ],
    goals: [
      { title: 'Sprint Feature Delivery', current: 18, target: 20, unit: 'PRs', status: 'on-track' },
      { title: 'Code Coverage', current: 88, target: 85, unit: '%', status: 'completed' },
      { title: 'Zero Critical Bugs', current: 0, target: 0, unit: 'bugs', status: 'completed' }
    ],
    badges: [
      { id: 'b4', title: 'Code Wizard', description: 'Delivered 180+ features with zero major regressions', icon: 'Code', bg: 'bg-indigo-500/20 text-indigo-400' },
      { id: 'b5', title: 'Problem Solver', description: 'Resolved 100+ technical threads in channel', icon: 'CheckCircle2', bg: 'bg-emerald-500/20 text-emerald-400' }
    ],
    recentActivities: [
      { id: 'a4', action: 'Deployed new VChat module build to production', category: 'Engineering', timestamp: '3 hours ago', impact: 'High' },
      { id: 'a5', action: 'Merged PR #342: Optimized message rendering pipeline', category: 'Code Review', timestamp: '5 hours ago', impact: 'High' },
      { id: 'a6', action: 'Answered tech question in #esraa-soliman-communication-channel', category: 'Support', timestamp: 'Yesterday', impact: 'Low' }
    ],
    notes: 'Outstanding technical velocity and clean code output. Keeps channels well-informed on dev milestones.'
  },
  '3': {
    userId: '3',
    name: 'Mohamed Alaa',
    role: 'Member',
    title: 'Designer',
    email: 'mohamed@democompany.com',
    department: 'Design',
    performanceScore: 91,
    ratingGrade: 'A',
    stats: {
      tasksCompleted: 128,
      tasksOnTimePct: 94,
      avgResponseMinutes: 18,
      totalMessagesSent: 1540,
      threadsResolved: 64,
      csatScore: 4.82,
      karmaPoints: 410,
      activeHoursPerDay: 7.5,
      peakProductivityWindow: '01:00 PM - 05:00 PM'
    },
    weeklyActivity: [
      { day: 'Mon', tasks: 10, messages: 110, hours: 7.2 },
      { day: 'Tue', tasks: 14, messages: 160, hours: 8.0 },
      { day: 'Wed', tasks: 12, messages: 140, hours: 7.5 },
      { day: 'Thu', tasks: 18, messages: 190, hours: 8.2 },
      { day: 'Fri', tasks: 11, messages: 125, hours: 6.8 }
    ],
    workDistribution: [
      { category: 'UI/UX Mockups', percentage: 45, color: 'bg-pink-500' },
      { category: 'Design System & Assets', percentage: 30, color: 'bg-purple-500' },
      { category: 'Prototyping & Motion', percentage: 15, color: 'bg-blue-500' },
      { category: 'User Testing', percentage: 10, color: 'bg-teal-500' }
    ],
    goals: [
      { title: 'Dark Mode Redesign UI', current: 100, target: 100, unit: '%', status: 'completed' },
      { title: 'Design System Components', current: 42, target: 50, unit: 'components', status: 'on-track' }
    ],
    badges: [
      { id: 'b6', title: 'Pixel Perfect', description: 'Maintains highest visual fidelity standard across product', icon: 'Sparkles', bg: 'bg-pink-500/20 text-pink-400' }
    ],
    recentActivities: [
      { id: 'a7', action: 'Uploaded new Figma UI kit assets to canvas', category: 'Design', timestamp: '1 hour ago', impact: 'Medium' },
      { id: 'a8', action: 'Reviewed visual specs for mobile sidebar', category: 'Design Review', timestamp: 'Yesterday', impact: 'Low' }
    ],
    notes: 'Produces clean visual layouts and smooth micro-interactions.'
  },
  '4': {
    userId: '4',
    name: 'Mohammed Dwidar',
    role: 'Member',
    title: 'Product Manager',
    email: 'mohammed.d@democompany.com',
    department: 'Management',
    performanceScore: 95,
    ratingGrade: 'A+',
    stats: {
      tasksCompleted: 172,
      tasksOnTimePct: 97,
      avgResponseMinutes: 10,
      totalMessagesSent: 3100,
      threadsResolved: 140,
      csatScore: 4.90,
      karmaPoints: 540,
      activeHoursPerDay: 8.4,
      peakProductivityWindow: '10:00 AM - 02:00 PM'
    },
    weeklyActivity: [
      { day: 'Mon', tasks: 18, messages: 280, hours: 8.5 },
      { day: 'Tue', tasks: 22, messages: 340, hours: 9.0 },
      { day: 'Wed', tasks: 19, messages: 290, hours: 8.2 },
      { day: 'Thu', tasks: 24, messages: 360, hours: 8.6 },
      { day: 'Fri', tasks: 16, messages: 230, hours: 7.8 }
    ],
    workDistribution: [
      { category: 'Product Roadmap & Specs', percentage: 35, color: 'bg-blue-600' },
      { category: 'Sprint Backlog Grooming', percentage: 25, color: 'bg-indigo-500' },
      { category: 'Stakeholder Alignment', percentage: 25, color: 'bg-amber-500' },
      { category: 'Customer Analytics', percentage: 15, color: 'bg-emerald-500' }
    ],
    goals: [
      { title: 'Q3 Product Release', current: 90, target: 100, unit: '%', status: 'on-track' },
      { title: 'Sprint Completion SLA', current: 96, target: 90, unit: '%', status: 'completed' }
    ],
    badges: [
      { id: 'b7', title: 'Roadmap Ace', description: 'On-time delivery across 6 major sprint milestones', icon: 'Target', bg: 'bg-blue-500/20 text-blue-400' },
      { id: 'b8', title: 'Super Communicator', description: 'Over 3,000 active workspace messages logged', icon: 'MessageSquare', bg: 'bg-purple-500/20 text-purple-400' }
    ],
    recentActivities: [
      { id: 'a9', action: 'Finalized Q4 product roadmap specs', category: 'Management', timestamp: '4 hours ago', impact: 'High' },
      { id: 'a10', action: 'Hosted sprint planning meeting in #general', category: 'Meeting', timestamp: 'Yesterday', impact: 'High' }
    ],
    notes: 'Strong product direction and great cross-functional coordination.'
  },
  '5': {
    userId: '5',
    name: 'Omar Adel',
    role: 'Super Admin',
    title: 'Engineer',
    email: 'omar.hitman2010@gmail.com',
    department: 'Engineering',
    performanceScore: 89,
    ratingGrade: 'B+',
    stats: {
      tasksCompleted: 130,
      tasksOnTimePct: 92,
      avgResponseMinutes: 22,
      totalMessagesSent: 1120,
      threadsResolved: 52,
      csatScore: 4.75,
      karmaPoints: 320,
      activeHoursPerDay: 7.8,
      peakProductivityWindow: '02:00 PM - 07:00 PM'
    },
    weeklyActivity: [
      { day: 'Mon', tasks: 11, messages: 95, hours: 7.5 },
      { day: 'Tue', tasks: 15, messages: 130, hours: 8.0 },
      { day: 'Wed', tasks: 13, messages: 110, hours: 7.8 },
      { day: 'Thu', tasks: 16, messages: 140, hours: 8.2 },
      { day: 'Fri', tasks: 10, messages: 90, hours: 7.0 }
    ],
    workDistribution: [
      { category: 'Backend Microservices', percentage: 60, color: 'bg-blue-500' },
      { category: 'Database Optimization', percentage: 25, color: 'bg-teal-500' },
      { category: 'Security & Auth', percentage: 15, color: 'bg-red-500' }
    ],
    goals: [
      { title: 'Database Query Latency', current: 45, target: 50, unit: 'ms', status: 'completed' }
    ],
    badges: [
      { id: 'b9', title: 'Backend Guardian', description: 'Maintained 99.9% API uptime', icon: 'Shield', bg: 'bg-teal-500/20 text-teal-400' }
    ],
    recentActivities: [
      { id: 'a11', action: 'Optimized PostgreSQL queries for messaging engine', category: 'Engineering', timestamp: '5 hours ago', impact: 'High' }
    ],
    notes: 'Solid backend engineer. Very focused deep-work periods in the afternoons.'
  },
  '6': {
    userId: '6',
    name: 'Salma Sabeb',
    role: 'Member',
    title: 'QA Engineer',
    email: 'salma@democompany.com',
    department: 'QA',
    performanceScore: 93,
    ratingGrade: 'A',
    stats: {
      tasksCompleted: 195,
      tasksOnTimePct: 98,
      avgResponseMinutes: 12,
      totalMessagesSent: 1850,
      threadsResolved: 94,
      csatScore: 4.89,
      karmaPoints: 460,
      activeHoursPerDay: 8.0,
      peakProductivityWindow: '10:00 AM - 03:00 PM'
    },
    weeklyActivity: [
      { day: 'Mon', tasks: 18, messages: 160, hours: 8.0 },
      { day: 'Tue', tasks: 22, messages: 210, hours: 8.4 },
      { day: 'Wed', tasks: 19, messages: 180, hours: 7.9 },
      { day: 'Thu', tasks: 24, messages: 230, hours: 8.5 },
      { day: 'Fri', tasks: 17, messages: 150, hours: 7.4 }
    ],
    workDistribution: [
      { category: 'Automated E2E Testing', percentage: 40, color: 'bg-emerald-500' },
      { category: 'Manual Regression Tests', percentage: 30, color: 'bg-amber-500' },
      { category: 'Bug Triage & Verification', percentage: 20, color: 'bg-red-500' },
      { category: 'Test Plan Docs', percentage: 10, color: 'bg-blue-500' }
    ],
    goals: [
      { title: 'Test Automation Coverage', current: 84, target: 80, unit: '%', status: 'completed' }
    ],
    badges: [
      { id: 'b10', title: 'Bug Hunter', description: 'Discovered and verified 140+ critical edge-case bugs', icon: 'AlertTriangle', bg: 'bg-amber-500/20 text-amber-400' }
    ],
    recentActivities: [
      { id: 'a12', action: 'Ran full regression suite on release v2.4', category: 'QA', timestamp: '3 hours ago', impact: 'High' }
    ],
    notes: 'Sharp eye for detail. Ensures zero high-severity bugs slip into production releases.'
  },
  '7': {
    userId: '7',
    name: 'Shaza Ibrahim',
    role: 'Member',
    title: 'Business Analyst',
    email: 'shaza@democompany.com',
    department: 'Accounting',
    performanceScore: 92,
    ratingGrade: 'A',
    stats: {
      tasksCompleted: 144,
      tasksOnTimePct: 95,
      avgResponseMinutes: 15,
      totalMessagesSent: 1620,
      threadsResolved: 72,
      csatScore: 4.84,
      karmaPoints: 390,
      activeHoursPerDay: 7.9,
      peakProductivityWindow: '09:30 AM - 02:30 PM'
    },
    weeklyActivity: [
      { day: 'Mon', tasks: 13, messages: 130, hours: 7.8 },
      { day: 'Tue', tasks: 16, messages: 170, hours: 8.1 },
      { day: 'Wed', tasks: 14, messages: 150, hours: 7.6 },
      { day: 'Thu', tasks: 18, messages: 195, hours: 8.3 },
      { day: 'Fri', tasks: 12, messages: 120, hours: 7.2 }
    ],
    workDistribution: [
      { category: 'Financial Modeling', percentage: 45, color: 'bg-emerald-600' },
      { category: 'Requirements Gathering', percentage: 30, color: 'bg-blue-500' },
      { category: 'Client Reporting', percentage: 25, color: 'bg-purple-500' }
    ],
    goals: [
      { title: 'Monthly Revenue Audit', current: 100, target: 100, unit: '%', status: 'completed' }
    ],
    badges: [
      { id: 'b11', title: 'Data Insight Specialist', description: 'Generated 40+ executive data reports', icon: 'BarChart2', bg: 'bg-emerald-500/20 text-emerald-400' }
    ],
    recentActivities: [
      { id: 'a13', action: 'Submitted Monthly Accounting BA report', category: 'Analytics', timestamp: 'Yesterday', impact: 'Medium' }
    ],
    notes: 'Thorough financial and business process analysis.'
  },
  '8': {
    userId: '8',
    name: 'Abdallah Sayed',
    role: 'Super Admin',
    title: 'CEO',
    email: 'abdallah@democompany.com',
    department: 'Management',
    performanceScore: 98,
    ratingGrade: 'A+',
    stats: {
      tasksCompleted: 210,
      tasksOnTimePct: 100,
      avgResponseMinutes: 5,
      totalMessagesSent: 4500,
      threadsResolved: 190,
      csatScore: 4.98,
      karmaPoints: 890,
      activeHoursPerDay: 9.0,
      peakProductivityWindow: '08:00 AM - 06:00 PM'
    },
    weeklyActivity: [
      { day: 'Mon', tasks: 22, messages: 410, hours: 9.2 },
      { day: 'Tue', tasks: 25, messages: 480, hours: 9.5 },
      { day: 'Wed', tasks: 20, messages: 430, hours: 8.8 },
      { day: 'Thu', tasks: 28, messages: 520, hours: 9.6 },
      { day: 'Fri', tasks: 19, messages: 380, hours: 8.2 }
    ],
    workDistribution: [
      { category: 'Company Strategy & Growth', percentage: 40, color: 'bg-blue-600' },
      { category: 'Operations & Integrations', percentage: 30, color: 'bg-[#4CAF50]' },
      { category: 'Executive Leadership', percentage: 20, color: 'bg-amber-500' },
      { category: 'Client Partnerships', percentage: 10, color: 'bg-purple-500' }
    ],
    goals: [
      { title: 'Annual ARR Expansion', current: 95, target: 100, unit: '%', status: 'on-track' },
      { title: 'Workspace Retention Rate', current: 99, target: 95, unit: '%', status: 'completed' }
    ],
    badges: [
      { id: 'b12', title: 'Visionary Leader', description: 'Founded & directed workspace growth to 99%+ uptime', icon: 'Award', bg: 'bg-amber-500/20 text-amber-400' },
      { id: 'b13', title: 'Master Communicator', description: 'Logged highest overall activity and direct engagements', icon: 'Zap', bg: 'bg-blue-500/20 text-blue-400' }
    ],
    recentActivities: [
      { id: 'a14', action: 'Approved workspace-wide integration upgrades', category: 'Executive', timestamp: '1 hour ago', impact: 'High' },
      { id: 'a15', action: 'Reviewed individual team performance reports', category: 'Management', timestamp: '3 hours ago', impact: 'High' }
    ],
    notes: 'Top performing executive. Ensures continuous innovation and seamless workspace operations.'
  }
};

export const getEmployeeAnalytics = (userId: string, userFallback?: any): EmployeeAnalyticsData => {
  if (mockEmployeeAnalytics[userId]) {
    return mockEmployeeAnalytics[userId];
  }

  // Generic generator for any added employee
  const name = userFallback?.name || 'Workspace Team Member';
  const role = userFallback?.role || 'Member';
  const title = userFallback?.title || 'Specialist';
  const email = userFallback?.email || 'user@democompany.com';

  return {
    userId,
    name,
    role,
    title,
    email,
    department: 'Engineering',
    performanceScore: 90,
    ratingGrade: 'A',
    stats: {
      tasksCompleted: 110,
      tasksOnTimePct: 94,
      avgResponseMinutes: 16,
      totalMessagesSent: 1200,
      threadsResolved: 45,
      csatScore: 4.80,
      karmaPoints: 300,
      activeHoursPerDay: 7.6,
      peakProductivityWindow: '10:00 AM - 02:00 PM'
    },
    weeklyActivity: [
      { day: 'Mon', tasks: 10, messages: 100, hours: 7.5 },
      { day: 'Tue', tasks: 12, messages: 120, hours: 7.8 },
      { day: 'Wed', tasks: 11, messages: 110, hours: 7.6 },
      { day: 'Thu', tasks: 14, messages: 140, hours: 8.0 },
      { day: 'Fri', tasks: 9, messages: 90, hours: 7.0 }
    ],
    workDistribution: [
      { category: 'Core Tasks', percentage: 50, color: 'bg-blue-500' },
      { category: 'Collaboration', percentage: 30, color: 'bg-emerald-500' },
      { category: 'Documentation', percentage: 20, color: 'bg-purple-500' }
    ],
    goals: [
      { title: 'Quarterly Task Target', current: 110, target: 120, unit: 'tasks', status: 'on-track' }
    ],
    badges: [
      { id: 'b_gen', title: 'Dedicated Contributor', description: 'Consistent performance and active teamwork', icon: 'CheckCircle2', bg: 'bg-blue-500/20 text-blue-400' }
    ],
    recentActivities: [
      { id: 'a_gen', action: 'Updated project deliverables', category: 'General', timestamp: '4 hours ago', impact: 'Medium' }
    ],
    notes: 'Valuable team member contributing consistently to daily goals.'
  };
};
