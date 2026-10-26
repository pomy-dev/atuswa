// User/Auth Types
export enum UserRole {
  SECRETARY_GENERAL = 'sg',
  BRANCH_ADMIN = 'branch_admin',
  TREASURER = 'treasurer',
  PROJECT_COORDINATOR = 'project_coordinator',
  EVENTS_MANAGER = 'events_manager'
}

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  branchId: string
  photo?: string
  password: string
  createdAt: Date
}

// Branch Types
export interface Branch {
  id: string
  name: string
  location: string
  adminId: string
  createdAt: Date
}

// Board Member Types
export interface BoardMember {
  id: string
  name: string
  email: string
  position: string
  responsibilities: string
  branchId: string
  photo?: string
  isAdmin?: boolean
  createdAt: Date
}

// TUCOSWA Affiliate Types
export type AffiliateStatus = 'Active' | 'Provisional' | 'Suspended' | 'Expelled' | 'Withdrawn'
export type FinancialStanding = 'Good standing' | 'Arrears' | 'Suspended'

export interface AffiliateLeadership {
  position: string
  name: string
  email?: string
  phone?: string
  termOfOffice?: string
}

export interface AffiliateStatusChange {
  status: AffiliateStatus
  reason: string
  changedAt: Date
  changedBy: string
}

export interface AffiliateDocument {
  id: string
  name: string
  category: 'Constitution' | 'Registration' | 'Minutes' | 'Resolution' | 'Financial' | 'Other'
  version?: string
  url?: string
  uploadedAt: Date
}

export interface Affiliate {
  id: string
  affiliateId: string
  officialName: string
  acronym: string
  registrationNumber?: string
  affiliationDate: string
  foundingDate?: string
  physicalAddress: string
  postalAddress?: string
  phoneNumbers: string[]
  email?: string
  website?: string
  socialMedia?: string
  correspondenceContact: { name: string; email?: string; phone?: string }
  leadership: AffiliateLeadership[]
  lastCongressDate?: string
  constitutionVersion?: string
  executiveCommitteeSize: number
  declaredMembership: number
  paidUpMembership: number
  genderBreakdown: { female: number; male: number; other: number }
  ageGroups: string
  sectors: string[]
  regions: string[]
  shopStewards: number
  duesRate?: string
  paymentHistory?: string
  financialStanding: FinancialStanding
  bankDetails?: string
  status: AffiliateStatus
  statusHistory: AffiliateStatusChange[]
  documents: AffiliateDocument[]
  notes?: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

// Member Types
export interface Member {
  id: string
  branchId?: string
  affiliateId?: string
  name: string
  email: string
  memberId: string
  phone: string
  address: string
  dob: string
  workplace: string
  nextOfKin: string
  nextOfKinPhone: string
  gender: 'Male' | 'Female' | 'Other'
  jobCategory?: string
  subscriptionStatus?: 'Paid' | 'Pending' | 'In arrears'
  tucoswaStatus?: 'Active' | 'Resigned' | 'Deceased' | 'Transferred'
  photo?: string
  joinDate: Date
}

// Financial Types
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense'
}

export enum IncomeSource {
  GRANT = 'grant',
  SALARY = 'salary',
  LOAN = 'loan',
  SUBSCRIPTION = 'subscription',
  OTHER = 'other'
}

export enum ExpenseCategory {
  UTILITIES = 'utilities',
  MORTGAGE = 'mortgage',
  EQUIPMENT = 'equipment',
  TRAVEL = 'travel',
  OTHER = 'other'
}

export interface FinancialRecord {
  id: string
  branchId: string
  type: TransactionType
  amount: number
  source?: IncomeSource
  category?: ExpenseCategory
  description: string
  date: Date
  createdBy: string
}

// Project Types
export enum ProjectStatus {
  STARTING = 'starting',
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished',
  PLANNING = 'planning',
  ONGOING = 'ongoing',
  COMPLETED = 'completed'
}

export interface ProjectPhase {
  id: string
  name: string
  description: string
  startDate: Date
  endDate?: Date
  status: ProjectStatus
}

export interface ProjectTeamMember {
  id: string
  userId: string
  role: string
  assignedDate: Date
}

export interface ProjectResource {
  id: string
  name: string
  quantity: number
  unit: string
  cost: number
  usedDate: Date
}

export interface ProjectImage {
  id: string
  name: string
  url: string
  size: number
  uploadedAt: Date
}

export interface ProjectDocument {
  id: string
  name: string
  url: string
  size: number
  uploadedAt: Date
}

export interface Project {
  id: string
  branchId: string
  title: string
  description: string
  coordinator: string
  phases: ProjectPhase[]
  status: ProjectStatus
  budget: number
  teamMembers: ProjectTeamMember[]
  resources: ProjectResource[]
  images: ProjectImage[]
  documents: ProjectDocument[]
  timeline: string
  startDate?: Date
  endDate?: Date
  createdBy: string
  createdAt: Date
}

// Event Types
export interface EventFile {
  id?: string
  name?: string
  url?: string
  type?: 'image' | 'pdf'
  uploadedAt?: Date
}

export interface EventInvitation {
  id: string
  email?: string
  phone?: string
  name: string
  status: 'invited' | 'accepted' | 'declined'
  sentAt: Date
}

export interface Event {
  id: string
  branchId: string
  title: string
  notes: string
  date: Date
  location: string
  stakeholders: string[]
  images: EventFile[]
  documents: EventFile[]
  invitations: EventInvitation[]
  createdBy: string
  createdAt: Date
}

// Helpdesk Types
export enum HelpDeskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export interface CaseHandler {
  userId: string
  userName: string
  handledAt: Date
  action: string
}

export interface CaseNote {
  id: string
  content: string
  createdBy: string
  createdByName: string
  createdAt: Date
}

export interface CaseDocument {
  id?: string
  name: string
  url?: string
  uploadedAt?: Date
}

export interface HelpDeskCase {
  id: string
  branchId?: string
  title: string
  memberName: string
  memberPhone: string
  memberEmail: string
  description: string
  status: HelpDeskStatus
  handlers: CaseHandler[]
  documents: CaseDocument[]
  notes: CaseNote[]
  createdBy: string
  createdByName: string
  createdAt: Date
  updatedAt: Date
}

// E-Filing Types
export interface EFile {
  id: string
  branchId: string
  folderId: string

  name: string
  type: string
  size: number

  uploadedBy: string
  uploadedAt: Date

  file: File
}

export interface EFileFolder {
  id: string
  branchId: string
  name: string
  notes?: string
  createdAt: Date
}

// Auth Context
export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => void
  logout: () => void
  register: (email: string, name: string, password: string, role: UserRole) => void
}
