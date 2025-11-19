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