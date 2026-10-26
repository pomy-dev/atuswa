import {
  User,
  UserRole,
  Branch,
  Member,
  Affiliate,
  AffiliateStatus,
  FinancialStanding,
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
    email: 'sg@tucoswa.org',
    name: 'Ngcebo Simelane',
    role: UserRole.SECRETARY_GENERAL,
    branchId: 'branch_main',
    password: 'demo123',
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'user_2',
    email: 'branch@tucoswa.org',
    name: 'Sarah Mkhonta',
    role: UserRole.BRANCH_ADMIN,
    branchId: 'branch_1',
    password: 'demo123',
    createdAt: new Date('2024-01-15')
  },
  {
    id: 'user_3',
    email: 'treasurer@tucoswa.org',
    name: 'James Lukhele',
    role: UserRole.TREASURER,
    branchId: 'branch_main',
    password: 'demo123',
    createdAt: new Date('2024-01-20')
  },
  {
    id: 'user_4',
    email: 'projects@tucoswa.org',
    name: 'Maria Santos',
    role: UserRole.PROJECT_COORDINATOR,
    branchId: 'branch_2',
    password: 'demo123',
    createdAt: new Date('2024-02-01')
  },
  {
    id: 'user_5',
    email: 'events@tucoswa.org',
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
    name: 'Headquarters',
    location: 'Mbabane',
    adminId: 'user_1',
    createdAt: new Date('2023-01-01')
  },
  {
    id: 'branch_1',
    name: 'Manzini Branch',
    location: 'Manzini',
    adminId: 'user_2',
    createdAt: new Date('2023-06-01')
  },
  {
    id: 'branch_2',
    name: 'Siteki Branch',
    location: 'Lubombo',
    adminId: 'user_3',
    createdAt: new Date('2023-09-01')
  }
]

export const dummyBoardMembers: BoardMember[] = [
  {
    id: 'board_1',
    name: 'Ngcebo Simelane',
    email: 'ngcebo@tucoswa.org',
    position: 'Secretary General',
    responsibilities: 'Overall leadership and strategic direction',
    branchId: 'branch_main',
    isAdmin: true,
    createdAt: new Date('2023-01-01')
  },
  {
    id: 'board_2',
    name: 'Amara Obi',
    email: 'amara@tucoswa.org',
    position: 'Vice Secretary',
    responsibilities: 'Deputy to Secretary General',
    branchId: 'branch_main',
    isAdmin: false,
    createdAt: new Date('2023-01-01')
  },
  {
    id: 'board_3',
    name: 'Siza Maseko',
    email: 'siza@tucoswa.org',
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
  name: ['Futhi Zulu', 'Mandla Tsela', 'Peter Magongo', 'Phila Sibandze', 'Lungile Mkhatjwa'][i % 5],
  email: ['zulu.f@gmail.com', 'tsela.m@gmail.com', 'magongo.p@gmail.com', 'sibandze.p@gmail.com', 'mkhatjwa.l@gmail.com'][i % 5],
  memberId: `ATU-${String(i + 1).padStart(4, '0')}`,
  phone: `+268-${80 + (i % 5)}-${Math.floor(1000000 + Math.random() * 8000000)}`,
  address: [
    '123 Vuvulane street, Mbabane',
    '456 Mhlangazane Road, Maznini',
    '789 Inshi Road, Mhlosheni'
  ][i % 3],
  dob: '01/01/1999',
  workplace: ['Manufacturing', 'Transport', 'Agriculture', 'Services', 'Technology'][i % 5],
  nextOfKin: `Family Member ${i + 1}`,
  nextOfKinPhone: `+268-${80 + (i % 5)}-${Math.floor(1000000 + Math.random() * 8000000)}`,
  gender: i % 2 === 0 ? 'Male' : 'Female',
  joinDate: new Date(2023, Math.floor(i / 5), (i % 28) + 1)
}))

export const dummyAffiliates: Affiliate[] = [
  {
    id: 'affiliate_1', affiliateId: 'TUC-AFF-001', officialName: 'Swaziland National Association of Teachers', acronym: 'SNAT',
    registrationNumber: 'REG-1974-018', affiliationDate: '2012-01-15', foundingDate: '1974-03-12',
    physicalAddress: 'SNAT House, Mbabane', postalAddress: 'P.O. Box 1020, Mbabane', phoneNumbers: ['+268 2404 1234'], email: 'info@snat.org.sz', website: 'https://snat.org.sz', socialMedia: '@SNATEswatini',
    correspondenceContact: { name: 'Lindiwe Dlamini', email: 'secretary@snat.org.sz', phone: '+268 7600 1100' },
    leadership: [
      { position: 'President', name: 'Thulani Maseko', termOfOffice: '2023–2026' },
      { position: 'Secretary General', name: 'Lindiwe Dlamini', email: 'secretary@snat.org.sz', termOfOffice: '2023–2026' },
      { position: 'Treasurer', name: 'Bongani Hlophe', termOfOffice: '2023–2026' }
    ],
    lastCongressDate: '2023-08-18', constitutionVersion: '2023 revision', executiveCommitteeSize: 15,
    declaredMembership: 8200, paidUpMembership: 7600, genderBreakdown: { female: 4800, male: 3250, other: 150 }, ageGroups: '18–30: 1,250; 31–50: 5,200; 51+: 1,750',
    sectors: ['Education', 'Public service'], regions: ['Hhohho', 'Manzini', 'Shiselweni', 'Lubombo'], shopStewards: 124,
    duesRate: 'E35 per month', paymentHistory: 'Up to date through September 2026', financialStanding: 'Good standing' as FinancialStanding, bankDetails: 'On file with national office',
    status: 'Active' as AffiliateStatus, statusHistory: [{ status: 'Active' as AffiliateStatus, reason: 'Affiliation verified', changedAt: new Date('2012-01-15'), changedBy: 'system' }],
    documents: [{ id: 'doc_1', name: 'SNAT Constitution 2023.pdf', category: 'Constitution', version: '2023', uploadedAt: new Date('2023-09-01') }], notes: 'Largest education affiliate.', active: true, createdAt: new Date('2012-01-15'), updatedAt: new Date('2026-09-30')
  },
  {
    id: 'affiliate_2', affiliateId: 'TUC-AFF-002', officialName: 'Swaziland Transport, Communication and Allied Workers Union', acronym: 'SWATCAWU',
    registrationNumber: 'REG-1998-044', affiliationDate: '2012-01-15', foundingDate: '1998-06-20', physicalAddress: 'Manzini Industrial Area', postalAddress: 'P.O. Box 334, Manzini', phoneNumbers: ['+268 2505 2211'], email: 'office@swatcawu.org.sz', website: '', socialMedia: '@SWATCAWU',
    correspondenceContact: { name: 'Mduduzi Gina', email: 'office@swatcawu.org.sz', phone: '+268 7800 2244' }, leadership: [{ position: 'President', name: 'Sibusiso Shongwe', termOfOffice: '2024–2027' }, { position: 'Secretary General', name: 'Mduduzi Gina', termOfOffice: '2024–2027' }],
    lastCongressDate: '2024-05-10', constitutionVersion: '2024 revision', executiveCommitteeSize: 9, declaredMembership: 3100, paidUpMembership: 2400, genderBreakdown: { female: 620, male: 2400, other: 80 }, ageGroups: '18–30: 410; 31–50: 1,980; 51+: 710', sectors: ['Transport', 'Communications'], regions: ['Manzini', 'Hhohho'], shopStewards: 66, duesRate: 'E50 per month', paymentHistory: 'Two months outstanding', financialStanding: 'Arrears' as FinancialStanding, bankDetails: 'Pending verification', status: 'Provisional' as AffiliateStatus, statusHistory: [{ status: 'Provisional' as AffiliateStatus, reason: 'Awaiting updated financial statements', changedAt: new Date('2026-04-01'), changedBy: 'user_1' }], documents: [], notes: 'Follow up on audited statements and dues reconciliation.', active: true, createdAt: new Date('2012-01-15'), updatedAt: new Date('2026-10-01')
  },
  {
    id: 'affiliate_3', affiliateId: 'TUC-AFF-003', officialName: 'Eswatini Textile and Garment Workers Union', acronym: 'ETGWU', registrationNumber: 'REG-2006-087', affiliationDate: '2016-03-22', foundingDate: '2006-11-04', physicalAddress: 'Matsapha Textile Park', postalAddress: 'P.O. Box 818, Matsapha', phoneNumbers: ['+268 2518 9090'], email: 'admin@etgwu.org.sz', website: '', socialMedia: '@ETGWU', correspondenceContact: { name: 'Nokuthula Mamba', email: 'admin@etgwu.org.sz', phone: '+268 7912 4455' }, leadership: [{ position: 'President', name: 'Nokuthula Mamba', termOfOffice: '2025–2028' }], lastCongressDate: '2025-02-14', constitutionVersion: '2025 revision', executiveCommitteeSize: 7, declaredMembership: 1850, paidUpMembership: 1850, genderBreakdown: { female: 1200, male: 610, other: 40 }, ageGroups: '18–30: 780; 31–50: 920; 51+: 150', sectors: ['Manufacturing', 'Textiles'], regions: ['Manzini'], shopStewards: 42, duesRate: 'E25 per month', paymentHistory: 'Up to date through September 2026', financialStanding: 'Good standing' as FinancialStanding, bankDetails: 'On file with national office', status: 'Active' as AffiliateStatus, statusHistory: [{ status: 'Active' as AffiliateStatus, reason: 'Annual compliance review completed', changedAt: new Date('2026-02-20'), changedBy: 'user_1' }], documents: [], notes: '', active: true, createdAt: new Date('2016-03-22'), updatedAt: new Date('2026-09-30')
  }
]

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
    status: ProjectStatus.ONGOING,
    coordinator: "Mr. Gule",
    budget: 15000,
    timeline: "3 Months",
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
        status: ProjectStatus.ONGOING
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
    status: ProjectStatus.PLANNING,
    coordinator: "Mr. Gule",
    budget: 9000,
    timeline: "8 Months",
    phases: [
      {
        id: 'phase_3',
        name: 'Community Mapping',
        description: 'Identify target communities',
        startDate: new Date('2024-07-01'),
        status: ProjectStatus.ONGOING
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
  const storedUsers = localStorage.getItem('users')
  if (storedUsers) {
    const users = JSON.parse(storedUsers)
    const migratedUsers = users.map((user: User) => ({
      ...user,
      email: user.email.replace(/@xn--atusw-1qa\.org$/i, '@tucoswa.org')
    }))
    localStorage.setItem('users', JSON.stringify(migratedUsers))
  }

  const storedAuthUser = localStorage.getItem('auth_user')
  if (storedAuthUser) {
    const authUser = JSON.parse(storedAuthUser) as User
    authUser.email = authUser.email.replace(/@xn--atusw-1qa\.org$/i, '@tucoswa.org')
    localStorage.setItem('auth_user', JSON.stringify(authUser))
  }

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
  if (!localStorage.getItem('affiliates')) {
    localStorage.setItem('affiliates', JSON.stringify(dummyAffiliates))
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
