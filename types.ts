
export enum UserRole {
  STUDENT = 'Researcher',
  SUPERVISOR = 'Supervisor',
  PUBLISHER = 'Publisher',
  ADMIN = 'Admin',
  PUBLIC = 'Public'
}

export enum ResearchStatus {
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  UNDER_REVIEW = 'Under Review',
  REVISIONS_REQUESTED = 'Revisions Requested',
  APPROVED = 'Approved',
  PUBLISHED = 'Published',
  WITHDRAWN = 'Withdrawn',
  REJECTED_FINAL = 'Rejected Final',
  DELETED = 'Deleted'
}

export enum DegreeLevel {
  DIPLOMA = 'Diploma',
  BSC = 'BSc',
  MSC = 'MSc',
  PHD = 'PhD'
}

export interface ImpactTarget {
  personName?: string;
  department?: string;
  email?: string;
}

export interface AISuggestion {
  orgName: string;
  sector: 'Public' | 'Private' | 'NGO';
  reasoning: string;
  emailTemplate: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  universityId: string;
  verified: boolean;
  isSuspended?: boolean;
  idNumber?: string;
  credentialLink?: string;
  assignedSupervisorId?: string;
}

export interface University {
  id: string;
  name: string;
  location: string;
  verified: boolean;
  shortName?: string;
  programmes?: string[];
}

export interface SystemSettings {
  degreeLevels: string[];
  sessionTimeoutMinutes: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  dismissed: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}

export interface AuditLog {
  id: string;
  researchId: string;
  userId: string;
  userName: string;
  action: string;
  previousStatus: ResearchStatus | null;
  newStatus: ResearchStatus;
  timestamp: string;
  comments?: string;
  emailSent?: boolean;
  metadataSnapshot?: any;
}

export interface Research {
  id: string;
  title: string;
  abstract: string;
  discipline: string;
  course: string;
  primaryAuthorId: string; 
  coAuthors: string[]; 
  supervisorId: string;
  universityId: string;
  degreeLevel: string;
  year: number;
  status: ResearchStatus;
  pdfUrl?: string;
  urn?: string;
  license?: string;
  createdAt: string;
  updatedAt: string;
  isArchived?: boolean;
  impactTarget?: ImpactTarget;
  aiSuggestions?: AISuggestion[];
  versions?: any[];
}
