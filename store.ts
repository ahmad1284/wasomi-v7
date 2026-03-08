
import { Research, User, AuditLog, UserRole, ResearchStatus, Notification, University, SystemSettings } from './types';
import { supabase, isConfigured as isSupabaseConfigured } from './lib/supabase';

const USERS_KEY = 'wasomi_users';
const RESEARCH_KEY = 'wasomi_research';
const AUDIT_KEY = 'wasomi_audit';
const AUTH_KEY = 'wasomi_auth';
const NOTIFICATIONS_KEY = 'wasomi_notifications';
const UNIVERSITIES_KEY = 'wasomi_universities';
const SETTINGS_KEY = 'wasomi_settings';

const DEFAULT_SETTINGS: SystemSettings = {
  degreeLevels: ['Diploma', 'BSc', 'MSc', 'PhD', 'Post-Doc'],
  sessionTimeoutMinutes: 240
};

const INITIAL_UNIVERSITIES: University[] = [
  { id: '1', name: 'State University of Zanzibar (SUZA)', location: 'Zanzibar', verified: true, shortName: 'SUZA', programmes: ['BSc in CS', 'BSc in IT', 'BSc in Public Health', 'MSc in Education'] },
  { id: '2', name: 'Zanzibar University (ZU)', location: 'Zanzibar', verified: true, shortName: 'ZU', programmes: ['LLB in Law', 'BBA in Accounting', 'BSc in Nursing'] },
  { id: '3', name: 'Abdulrahman Al-Sumait University (SUMAIT)', location: 'Zanzibar', verified: true, shortName: 'SUMAIT', programmes: ['BA in Arts', 'BSc in Biology'] },
  { id: '4', name: 'University of Dar es Salaam', location: 'Dar es Salaam', verified: true, shortName: 'UDSM', programmes: ['BSc in Engineering', 'BA in Economics'] },
  { id: '5', name: 'Karume Institute of Science and Technology', location: 'Zanzibar', verified: true, shortName: 'KIST', programmes: ['Diploma in Engineering'] },
  { id: 'independent', name: 'Independent Research Hub', location: 'Wasomi Global', verified: true, shortName: 'IRH' },
];

const generateUsers = (): User[] => {
  const base: User[] = [
    { id: 's1', email: 'student@suza.ac.tz', name: 'Ali Bakari', role: UserRole.STUDENT, universityId: '1', verified: true, idNumber: '2024/SUZA/001' },
    { id: 'v1', email: 'supervisor@suza.ac.tz', name: 'Dr. Sarah Juma', role: UserRole.SUPERVISOR, universityId: '1', verified: true },
    { id: 'p1', email: 'staff@wasomi.org', name: 'Hamad Wasomi', role: UserRole.PUBLISHER, universityId: '', verified: true },
    { id: 'a1', email: 'admin@wasomi.org', name: 'System Admin', role: UserRole.ADMIN, universityId: '', verified: true },
  ];

  for (let i = 1; i <= 20; i++) {
    base.push({
      id: `u-gen-${i}`,
      email: `user${i}@university.ac.tz`,
      name: `Scholar ${i} Bakari`,
      role: i % 5 === 0 ? UserRole.SUPERVISOR : UserRole.STUDENT,
      universityId: (i % 4 + 1).toString(),
      verified: i % 3 !== 0,
      idNumber: `REG/2024/${1000 + i}`
    });
  }
  return base;
};

const generateResearch = (): Research[] => {
  const base: Research[] = [
    {
      id: 'r1',
      title: 'Epidemiology of Malaria in Urban Zanzibar: A Five-Year Retrospective Study',
      abstract: 'This research examines the trends of malaria incidence in urban areas of Zanzibar from 2018 to 2023.',
      discipline: 'health',
      course: 'BSc in Public Health',
      primaryAuthorId: 's1',
      coAuthors: [],
      supervisorId: 'v1',
      universityId: '1',
      degreeLevel: 'BSc',
      year: 2023,
      status: ResearchStatus.PUBLISHED,
      urn: 'urn:wasomi:research:r1',
      pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      createdAt: '2023-05-15T10:00:00Z',
      updatedAt: '2023-06-20T14:30:00Z',
    }
  ];

  for (let i = 1; i <= 30; i++) {
    const statuses = Object.values(ResearchStatus).filter(s => s !== ResearchStatus.DELETED);
    const status = i < 15 ? ResearchStatus.PUBLISHED : statuses[i % statuses.length];
    base.push({
      id: `r-gen-${i}`,
      title: `Academic Study ${i}: Impact of Digital Transformation in ${i % 2 === 0 ? 'Tunguu' : 'Stone Town'}`,
      abstract: `Extended abstract for research ${i}. This study explores the socio-economic variables affecting local development in Zanzibar through the lens of modern academic inquiry.`,
      discipline: i % 2 === 0 ? 'ict' : 'soc',
      course: 'General Studies',
      primaryAuthorId: i % 5 === 0 ? 's1' : `u-gen-${i}`,
      coAuthors: [],
      supervisorId: 'v1',
      universityId: (i % 4 + 1).toString(),
      degreeLevel: i % 3 === 0 ? 'MSc' : 'BSc',
      year: 2024,
      status: status,
      urn: status === ResearchStatus.PUBLISHED ? `urn:wasomi:research:gen-${i}` : undefined,
      pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      createdAt: new Date(Date.now() - (i * 86400000)).toISOString(),
      updatedAt: new Date(Date.now() - (i * 3600000)).toISOString(),
    });
  }
  return base;
};

export const getStore = () => {
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || JSON.stringify(generateUsers()));
  const researchData = JSON.parse(localStorage.getItem(RESEARCH_KEY) || JSON.stringify(generateResearch()));
  // Migration for mock data: ensure all research have pdfUrl for testing
  const research = researchData.map((r: Research) => ({
    ...r,
    pdfUrl: r.pdfUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  }));
  const audit = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
  const auth = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
  const notifications = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
  const universities = JSON.parse(localStorage.getItem(UNIVERSITIES_KEY) || JSON.stringify(INITIAL_UNIVERSITIES));
  const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || JSON.stringify(DEFAULT_SETTINGS));
  return { users, research, audit, auth, notifications, universities, settings };
};

export const saveStore = (data: {
  users?: User[],
  research?: Research[],
  audit?: AuditLog[],
  auth?: User | null,
  notifications?: Notification[],
  universities?: University[],
  settings?: SystemSettings
}) => {
  if (data.users) localStorage.setItem(USERS_KEY, JSON.stringify(data.users));
  if (data.research) localStorage.setItem(RESEARCH_KEY, JSON.stringify(data.research));
  if (data.audit) localStorage.setItem(AUDIT_KEY, JSON.stringify(data.audit));
  if (data.notifications) localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(data.notifications));
  if (data.auth !== undefined) localStorage.setItem(AUTH_KEY, JSON.stringify(data.auth));
  if (data.universities) localStorage.setItem(UNIVERSITIES_KEY, JSON.stringify(data.universities));
  if (data.settings) localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
};

export const deleteResearch = (id: string, user: User) => {
  const { research } = getStore();
  const r = research.find((res: Research) => res.id === id);
  if (!r) return false;

  const isAuthor = r.primaryAuthorId === user.id;
  const isAdmin = user.role === UserRole.ADMIN;
  const isDraft = r.status === ResearchStatus.DRAFT;

  // Rule: Students only delete drafts. Admins can delete anything not Published.
  if ((isAuthor && isDraft) || (isAdmin && r.status !== ResearchStatus.PUBLISHED)) {
    const updated = research.map((res: Research) =>
      res.id === id ? { ...res, status: ResearchStatus.DELETED, updatedAt: new Date().toISOString() } : res
    );
    saveStore({ research: updated });
    createAuditEntry(id, user.id, user.name, 'Marked as Deleted (Soft Delete)', r.status, ResearchStatus.DELETED);
    return true;
  }
  return false;
};

export const createNotification = (userId: string, title: string, message: string, type: Notification['type'] = 'info', link?: string) => {
  const { notifications } = getStore();
  const newNotification: Notification = {
    id: Math.random().toString(36).substr(2, 9),
    userId, title, message, timestamp: new Date().toISOString(), read: false, dismissed: false, type, link
  };
  saveStore({ notifications: [newNotification, ...notifications] });
  return newNotification;
};

export const notifyRole = (role: UserRole, title: string, message: string, type: Notification['type'] = 'info', link?: string) => {
  const { users } = getStore();
  const targetUsers = users.filter((u: User) => u.role === role);
  targetUsers.forEach((u: User) => {
    createNotification(u.id, title, message, type, link);
  });
};

export const sendEmailNotification = async (email: string, subject: string, body: string) => {
  console.log(`[Email Simulation] To: ${email} | Subject: ${subject} | Body: ${body}`);
  return true;
};

export const createAuditEntry = async (researchId: string, userId: string, userName: string, action: string, prev: ResearchStatus | null, next: ResearchStatus, comments?: string, emailDetails?: any) => {
  const { research, audit } = getStore();
  const r = research.find((res: Research) => res.id === researchId);
  const snapshot = r ? { ...r } : null;
  const newEntry: AuditLog = {
    id: Math.random().toString(36).substr(2, 9),
    researchId,
    userId,
    userName,
    action,
    previousStatus: prev,
    newStatus: next,
    timestamp: new Date().toISOString(),
    comments,
    emailSent: !!emailDetails,
    metadataSnapshot: snapshot
  };
  saveStore({ audit: [newEntry, ...audit] });
};

export const uploadFileToSupabase = async (file: File, path: string) => {
  try {
    if (!isSupabaseConfigured) return null;
    const { data } = supabase.storage.from('research-docs').getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.error("Upload failure:", err);
    return null;
  }
};

export const saveResearchToSupabase = async (research: Research) => {
  if (!isSupabaseConfigured) return;
  await supabase.from('research').upsert(research);
};
