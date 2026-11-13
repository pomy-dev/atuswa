// ---------- Users ----------
export interface AppUser {
  id: string
  full_name: string
  email: string
  phone?: string
  branchId?: string
  role_id: string
  status: 'active' | 'inactive'
  createdAt: string
  lastLogin?: string
  role?: Role
}

// ---------- Types ----------
export interface Permission {
  id: string
  label: string
  description?: string
}

export interface Role {
  id: string
  name: string
  accesses?: string[]
  description?: string
  permissions: string[]
  createdAt: string
}

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
  role: string
  branchId: string
  photo?: string
  createdAt: Date
}

// Branch Types
export interface Branch {
  id: string
  name: string
  location: string
  contactEmail?: string
  isActive: boolean
  memberCount?: number
  adminId?: string
  admin?: AppUser
  createdAt: Date | string
}

export interface AssignBranchAdminResponse {
  success: boolean
  assigned: boolean
  emailSent: boolean
  emailId?: string
  message: string
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

// Extend these according to your actual data model
export type ScopeType = 'tucoswa' | 'branch' | 'affiliate' | 'member'

export interface ScopeOption {
  id: string
  name: string
  type: ScopeType
}

export interface FinancialRecordPayload {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: Date
  source?: IncomeSource
  branch_id?: string
  affiliate_id?: string
  member_id?: string
  evidence_file?: File | null
  evidence_name?: string
  created_by: string
  receipt_url?: string
}

export type FinancialRecordInput = Omit<FinancialRecordPayload, 'id'> & { id?: string }

export interface AddFinancialModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (record: FinancialRecordInput) => void | Promise<void>
  isLoading?: boolean
  /** Pass true when the current user is HQ (Secretary General / Accountant) */
  isHQ?: boolean
  /** Optional lists – replace with real data from your services */
  branches?: Branch[]
  affiliates?: ScopeOption[]
  members?: ScopeOption[]
  userId: string
  /** Pre-select a branch (e.g. when drilling down from a body card) */
  defaultBranchId?: string
}

export const categories = {
  income: [
    'Member Dues',
    'Donations',
    'Grants',
    'Events Revenue',
    'Sponsorships',
    'Other Income',
  ],
  expense: [
    'Salaries',
    'Utilities',
    'Office Supplies',
    'Events',
    'Travel',
    'Legal & Professional',
    'Equipment',
    'Other Expenses',
  ],
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
  receipt_url?: string
  description: string
  date: Date
  createdBy: string
}

export interface FinancialPayment {
  id: string;
  financial_record_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference: string | null;
  notes: string | null;
  receipt_url: string;
  received_by: string | null;
  created_at: string;
}

export interface FinancialPaymentInput {
  financial_record_id: string;
  amount: number;
  payment_date?: string;
  payment_method: string;
  reference?: string | null;
  notes?: string | null;
}

export interface FinancialRecordFilters {
  branch_id?: string;
  affiliate_id?: string;
  member_id?: string;
  transaction_type?: TransactionType;
  start_date?: string;
  end_date?: string;
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
  id: string;
  event_id: string;
  file_kind: "image" | "document";
  name: string;
  url: string | null;
  mime_type: string | null;
  uploaded_at: string;
}

export interface EventInvitation {
  id: string;
  event_id: string;
  email: string | null;
  phone: string | null;
  name: string;
  status: "invited" | "accepted" | "declined";
  sent_at: Date;
}

export interface BulkEventInvitation {
  event_id: string;
  invitations: {
    name: string;
    email?: string | null;
    phone?: string | null;
  }[];
}

export type EventStatus = 'draft' | 'published' | 'cancelled'

export interface Event {
  id: string;
  branch_id?: string | null;
  affiliate_id?: string | null;
  title: string;
  notes: string;
  event_date: string;
  location: string;
  stakeholders?: string[]
  images?: EventFile[]
  documents?: EventFile[]
  invitations?: EventInvitation[]
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventParticipant {
  id: string;
  event_id: string;
  profile_id: string | null;
  invitation_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  registration_status: "registered" | "cancelled";
  registered_at: string;
  created_at: string;
}

export type AttendanceStatus =
  | "pending"
  | "present"
  | "absent"
  | "late"
  | "excused";


export interface EventAttendance {
  id: string;
  participant_id: string;
  attendance_status: AttendanceStatus;
  notes: string;
  marked_by: string | null;
  marked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceEvent extends Event {
  status?: EventStatus
  branchName?: string
  attendance?: EventAttendance[]
}

// Helpdesk Types
export enum HelpDeskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export interface CaseHandler {
  user_id: string
  user_name: string
  handled_at: Date
  action: string
}

export interface CaseNote {
  id: string
  content: string
  created_by: string
  created_by_name: string
  created_at: Date
}

export interface CaseDocument {
  id?: string
  name: string
  url?: string
  uploaded_at?: Date
}

export interface HelpDeskCase {
  id: string
  branch_id?: string | null
  affiliate_id?: string | null
  title: string
  member_name: string
  member_phone: string
  member_email: string
  description: string
  status: HelpDeskStatus
  handlers: CaseHandler[]
  documents: CaseDocument[]
  notes: CaseNote[]
  created_by: string | null
  created_by_name: string | null
  created_at: Date
  updated_at: Date
}

// E-Filing Types
export interface EFile {
  id: string
  branch_id: string | null
  folder_id: string | null
  name: string
  mime_type: string
  size_bytes: number
  uploaded_by: string | null
  uploaded_at: string
  storage_path: string | null
  /** Present only while uploading a new file; persisted rows contain storage_path. */
  file?: File
}

export interface EFileFolder {
  id: string
  user_id: string
  branch_id: string | null
  affiliate_id?: string | null
  name: string
  notes?: string
  created_at: Date
}

export interface Stakeholder {
  id: string
  name: string
  profession: string
  image?: string
}

// Auth Context
export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  register: (email: string, name: string, password: string) => Promise<void>
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>
}

export interface ActivityLogEntry {
  id: string
  userId?: string
  user_name?: string
  action: string
  details?: string
  created_at: string
  ip?: string
}
