
export enum FolderType {
  INBOX = 'inbox',
  STARRED = 'starred',
  SNOOZED = 'snoozed',
  SENT = 'sent',
  DRAFTS = 'drafts',
  PURCHASES = 'purchases',
  IMPORTANT = 'important',
  SCHEDULED = 'scheduled',
  ALL_MAIL = 'all_mail',
  SPAM = 'spam',
  TRASH = 'trash'
}

export interface Email {
  id: string;
  threadId?: string; // For grouping replies
  headerMessageId?: string; // The unique Message-ID header
  senderName: string;
  senderEmail: string;
  subject: string;
  body: string;
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  folder: FolderType;
  avatarColor: string;
}

export interface User {
  name: string;
  email: string;
  avatarUrl?: string;
  accessToken?: string; // Token for Gmail API access
}

export const INITIAL_USER: User = {
  name: "المستخدم الجديد",
  email: "user@jomail.com",
  avatarUrl: "https://picsum.photos/200/200"
};

// --- JO TASK TYPES ---

export type AppType = 'landing' | 'jomail' | 'jotask' | 'jodoc' | 'jolearn';

export type UserRole = 'Director' | 'Manager' | 'Employee';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export type TaskPriority = 'high' | 'medium' | 'low';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'file';
  uploadedBy: string;
  accessLevel: 'public' | 'management' | 'director'; // الصلاحيات
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  department: string;
  assigneeId: string;
  assigneeName: string;
  assigneeAvatar: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: Date;
  isLocked: boolean; // If deadline passed
  createdAt: Date;
  attachments: Attachment[];
  rating?: number; // 1-5 stars (only when Done)
  managerFeedback?: string;
}

export interface Project {
  id: string;
  name: string;
  progress: number;
}

// --- JO TASK COMPANY & TEAM TYPES ---

export interface CompanyProfile {
  name: string;
  employeesCount: string;
  contactEmail: string;
  phone: string;
  website: string;
}

export interface TeamMember {
  id: string;
  name: string;
  jobTitle: string;
  role: UserRole;
  email: string;
  password?: string; // Stored locally for simulation
  avatarColor: string;
  joinedAt: Date;
}
