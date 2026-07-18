import {
  User,
  UserRole,
  Branch,
  Member,
  FinancialRecord,
  Project,
  ProjectStatus,
  Event,
  HelpDeskCase,
  HelpDeskStatus,
  BoardMember,
  TransactionType,
  IncomeSource,
  ExpenseCategory
} from './types'

export const dummyUsers: User[] = [
  {
    id: 'user_1',
    email: 'sg@xn--atusw-1qa.org',
    name: 'Charles Mandela',
    role: UserRole.SECRETARY_GENERAL,
    branchId: 'branch_main',
    password: 'demo123',
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'user_2',
    email: 'branch@xn--atusw-1qa.org',
    name: 'Sarah Johnson',
    role: UserRole.BRANCH_ADMIN,
    branchId: 'branch_1',
    password: 'demo123',
    createdAt: new Date('2024-01-15')
  },
  {
    id: 'user_3',
    email: 'treasurer@xn--atusw-1qa.org',
    name: 'James Okonkwo',
    role: UserRole.TREASURER,
    branchId: 'branch_main',
    password: 'demo123',
    createdAt: new Date('2024-01-20')
  },
  {
    id: 'user_4',
    email: 'projects@xn--atusw-1qa.org',
    name: 'Maria Santos',
    role: UserRole.PROJECT_COORDINATOR,
    branchId: 'branch_2',
    password: 'demo123',
    createdAt: new Date('2024-02-01')
  },
  {
    id: 'user_5',
    email: 'events@xn--atusw-1qa.org',
    name: 'David Thompson',
    role: UserRole.EVENTS_MANAGER,
    branchId: 'branch_1',
    password: 'demo123',
    createdAt: new Date('2024-02-10')
  }
]

export const dummyBranches: Branch[] = [
  {
    id: 'branch_main',
    name: 'Atuswá Headquarters',
    location: 'Lagos, Nigeria',
    adminId: 'user_1',
    createdAt: new Date('2023-01-01')
  },
  {
    id: 'branch_1',
    name: 'Western Region',
    location: 'Ibadan, Nigeria',
    adminId: 'user_2',
    createdAt: new Date('2023-06-01')
  },
  {
    id: 'branch_2',
    name: 'Eastern Region',
    location: 'Enugu, Nigeria',
    adminId: 'user_3',
    createdAt: new Date('2023-09-01')
  }
]

export const dummyBoardMembers: BoardMember[] = [
  {
    id: 'board_1',
    name: 'Charles Mandela',
    email: 'charles@xn--atusw-1qa.org',
    position: 'Secretary General',
    responsibilities: 'Overall leadership and strategic direction',
    branchId: 'branch_main',
    isAdmin: true,
    createdAt: new Date('2023-01-01')
  },
  {
    id: 'board_2',
    name: 'Amara Obi',
    email: 'amara@xn--atusw-1qa.org',
    position: 'Vice Secretary',
    responsibilities: 'Deputy to Secretary General',
    branchId: 'branch_main',
    isAdmin: false,
    createdAt: new Date('2023-01-01')
  },
  {
    id: 'board_3',
    name: 'Kehinde Adeyemi',
    email: 'kehinde@xn--atusw-1qa.org',
    position: 'General Treasurer',
    responsibilities: 'Financial management and reporting',
    branchId: 'branch_main',
    isAdmin: false,
    createdAt: new Date('2023-01-01')
  }
]

export const dummyMembers: Member[] = Array.from({ length: 45 }, (_, i) => ({
  id: `member_${i + 1}`,
  branchId: ['branch_main', 'branch_1', 'branch_2'][i % 3],
  name: ['Emeka Chukwu', 'Zainab Hassan', 'Peter Ogbonna', 'Chioma Eze', 'Segun Adebayo'][i % 5],
  memberId: `ATU-${String(i + 1).padStart(4, '0')}`,
  phone: `+234-${80 + (i % 5)}-${Math.floor(1000000 + Math.random() * 8000000)}`,
  physicalAddress: [
    '123 Lagos Street, Lagos',
    '456 Ibadan Road, Ibadan',
    '789 Enugu Avenue, Enugu'
  ][i % 3],
  age: 25 + (i % 40),
  workplace: ['Manufacturing', 'Transport', 'Agriculture', 'Services', 'Technology'][i % 5],
  nextOfKin: `Family Member ${i + 1}`,
  gender: i % 2 === 0 ? 'M' : 'F',
  joinDate: new Date(2023, Math.floor(i / 5), (i % 28) + 1)
}))

export const dummyFinancialRecords: FinancialRecord[] = [
  {
    id: 'fin_1',
    branchId: 'branch_main',
    type: TransactionType.INCOME,
    amount: 50000,
    source: IncomeSource.SUBSCRIPTION,
    description: 'Monthly membership dues',
    date: new Date('2024-07-01'),
    createdBy: 'user_3'
  },
  {
    id: 'fin_2',
    branchId: 'branch_main',
    type: TransactionType.INCOME,
    amount: 30000,
    source: IncomeSource.GRANT,
    description: 'Government grant for community project',
    date: new Date('2024-07-05'),
    createdBy: 'user_3'
  },
  {
    id: 'fin_3',
    branchId: 'branch_1',
    type: TransactionType.EXPENSE,
    amount: 15000,
    category: ExpenseCategory.UTILITIES,
    description: 'Office electricity and water',
    date: new Date('2024-07-08'),
    createdBy: 'user_3'
  },
  {
    id: 'fin_4',
    branchId: 'branch_2',
    type: TransactionType.EXPENSE,
    amount: 25000,
    category: ExpenseCategory.EQUIPMENT,
    description: 'Office equipment upgrade',
    date: new Date('2024-07-10'),
    createdBy: 'user_3'
  },
  {
    id: 'fin_5',
    branchId: 'branch_main',
    type: TransactionType.INCOME,
    amount: 45000,
    source: IncomeSource.SUBSCRIPTION,
    description: 'Monthly membership dues',
    date: new Date('2024-07-15'),
    createdBy: 'user_3'
  }
]

export const dummyProjects: Project[] = [
  {
    id: 'proj_1',
    branchId: 'branch_main',
    title: 'Skills Training Initiative',
    description: 'Comprehensive vocational training for union members',
    status: ProjectStatus.IN_PROGRESS,
    phases: [
      {
        id: 'phase_1',
        name: 'Planning & Assessment',
        description: 'Assess training needs',
        startDate: new Date('2024-05-01'),
        endDate: new Date('2024-05-31'),
        status: ProjectStatus.COMPLETED
      },
      {
        id: 'phase_2',
        name: 'Curriculum Development',
        description: 'Develop training materials',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-30'),
        status: ProjectStatus.IN_PROGRESS
      }
    ],
    teamMembers: [
      {
        id: 'tm_1',
        userId: 'user_4',
        role: 'Project Lead',
        assignedDate: new Date('2024-05-01')
      }
    ],
    resources: [
      {
        id: 'res_1',
        name: 'Computers',
        quantity: 10,
        unit: 'units',
        cost: 500000,
        usedDate: new Date('2024-06-15')
      }
    ],
    images: [],
    documents: [],
    startDate: new Date('2024-05-01'),
    createdBy: 'user_4',
    createdAt: new Date('2024-05-01')
  },
  {
    id: 'proj_2',
    branchId: 'branch_1',
    title: 'Community Outreach Program',
    description: 'Expand union presence in communities',
    status: ProjectStatus.STARTING,
    phases: [
      {
        id: 'phase_3',
        name: 'Community Mapping',
        description: 'Identify target communities',
        startDate: new Date('2024-07-01'),
        status: ProjectStatus.STARTING
      }
    ],
    teamMembers: [],
    resources: [],
    images: [],
    documents: [],
    startDate: new Date('2024-07-01'),
    createdBy: 'user_2',
    createdAt: new Date('2024-07-01')
  }
]

export const dummyEvents: Event[] = [
  {
    id: 'event_1',
    branchId: 'branch_main',
    title: 'Annual General Meeting',
    notes: 'Quarterly gathering for member engagement',
    date: new Date('2024-08-15'),
    location: 'Lagos Convention Center',
    stakeholders: ['Government representatives', 'Media'],
    images: [],
    documents: [],
    invitations: [
      {
        id: 'inv_1',
        email: 'member@example.com',
        name: 'John Doe',
        status: 'invited',
        sentAt: new Date('2024-07-10')
      }
    ],
    createdBy: 'user_5',
    createdAt: new Date('2024-07-10')
  },
  {
    id: 'event_2',
    branchId: 'branch_1',
    title: 'Workers Memorial Day',
    notes: 'Remembrance and celebration',
    date: new Date('2024-09-01'),
    location: 'Ibadan Sports Complex',
    stakeholders: [],
    images: [],
    documents: [],
    invitations: [],
    createdBy: 'user_5',
    createdAt: new Date('2024-07-05')
  }
]

export const dummyHelpDeskCases: HelpDeskCase[] = [
  {
    id: 'case_1',
    branchId: 'branch_main',
    title: 'Salary Payment Dispute',
    memberName: 'Emeka Chukwu',
    memberPhone: '+234-801-2345678',
    memberEmail: 'emeka@example.com',
    description: 'Member reports unpaid salary for the last 2 months',
    status: HelpDeskStatus.IN_PROGRESS,
    handlers: [
      {
        userId: 'user_1',
        userName: 'Charles Mandela',
        handledAt: new Date('2024-07-10'),
        action: 'Filed case'
      },
      {
        userId: 'user_3',
        userName: 'James Okonkwo',
        handledAt: new Date('2024-07-11'),
        action: 'Started investigation'
      }
    ],
    documents: [],
    notes: [
      {
        id: 'note_1',
        content: 'Verified claim with employer. Following up on payment',
        createdBy: 'user_3',
        createdByName: 'James Okonkwo',
        createdAt: new Date('2024-07-11')
      }
    ],
    createdBy: 'user_1',
    createdByName: 'Charles Mandela',
    createdAt: new Date('2024-07-10'),
    updatedAt: new Date('2024-07-11')
  },
  {
    id: 'case_2',
    branchId: 'branch_1',
    title: 'Workplace Safety Concern',
    memberName: 'Zainab Hassan',
    memberPhone: '+234-802-3456789',
    memberEmail: 'zainab@example.com',
    description: 'Member reports unsafe working conditions at factory',
    status: HelpDeskStatus.PENDING,
    handlers: [
      {
        userId: 'user_2',
        userName: 'Sarah Johnson',
        handledAt: new Date('2024-07-12'),
        action: 'Filed case'
      }
    ],
    documents: [],
    notes: [],
    createdBy: 'user_2',
    createdByName: 'Sarah Johnson',
    createdAt: new Date('2024-07-12'),
    updatedAt: new Date('2024-07-12')
  },
  {
    id: 'case_3',
    branchId: 'branch_main',
    title: 'Benefits Claim',
    memberName: 'Peter Ogbonna',
    memberPhone: '+234-803-4567890',
    memberEmail: 'peter@example.com',
    description: 'Member seeking assistance with benefits claim process',
    status: HelpDeskStatus.COMPLETED,
    handlers: [
      {
        userId: 'user_1',
        userName: 'Charles Mandela',
        handledAt: new Date('2024-07-08'),
        action: 'Filed case'
      },
      {
        userId: 'user_3',
        userName: 'James Okonkwo',
        handledAt: new Date('2024-07-09'),
        action: 'Completed and closed'
      }
    ],
    documents: [],
    notes: [
      {
        id: 'note_2',
        content: 'Claim processed successfully',
        createdBy: 'user_3',
        createdByName: 'James Okonkwo',
        createdAt: new Date('2024-07-09')
      }
    ],
    createdBy: 'user_1',
    createdByName: 'Charles Mandela',
    createdAt: new Date('2024-07-08'),
    updatedAt: new Date('2024-07-09')
  }
]

export function initializeDummyData() {
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify(dummyUsers))
  }
  if (!localStorage.getItem('branches')) {
    localStorage.setItem('branches', JSON.stringify(dummyBranches))
  }
  if (!localStorage.getItem('boardMembers')) {
    localStorage.setItem('boardMembers', JSON.stringify(dummyBoardMembers))
  }
  if (!localStorage.getItem('members')) {
    localStorage.setItem('members', JSON.stringify(dummyMembers))
  }
  if (!localStorage.getItem('financialRecords')) {
    localStorage.setItem('financialRecords', JSON.stringify(dummyFinancialRecords))
  }
  if (!localStorage.getItem('projects')) {
    localStorage.setItem('projects', JSON.stringify(dummyProjects))
  }
  if (!localStorage.getItem('events')) {
    localStorage.setItem('events', JSON.stringify(dummyEvents))
  }
  if (!localStorage.getItem('helpDeskCases')) {
    localStorage.setItem('helpDeskCases', JSON.stringify(dummyHelpDeskCases))
  }
}
