export enum FolderType {
  INBOX = 'inbox',
  SENT = 'sent',
  DRAFTS = 'drafts',
  TRASH = 'trash',
  STARRED = 'starred'
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