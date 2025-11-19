import { Email, FolderType } from '../types';

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';
const USER_INFO_API = 'https://www.googleapis.com/oauth2/v1/userinfo';

// Helper to decode base64url strings from Gmail
const decodeBase64 = (data: string) => {
  try {
    return decodeURIComponent(escape(atob(data.replace(/-/g, '+').replace(/_/g, '/'))));
  } catch (e) {
    return data;
  }
};

const getHeader = (headers: any[], name: string) => {
  if (!headers || !Array.isArray(headers)) return '';
  const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header ? header.value : '';
};

export const fetchUserProfile = async (accessToken: string) => {
  const response = await fetch(`${USER_INFO_API}?alt=json`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) throw new Error('Failed to fetch user profile');
  return response.json();
};

export const fetchEmails = async (accessToken: string, query: string = 'label:INBOX', maxResults: number = 30): Promise<Email[]> => {
  // 1. List messages with dynamic query
  const listResponse = await fetch(`${GMAIL_API_BASE}/messages?maxResults=${maxResults}&q=${encodeURIComponent(query)}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  if (!listResponse.ok) {
      const errorData = await listResponse.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Failed to list messages: ${listResponse.statusText}`);
  }

  const listData = await listResponse.json();
  
  if (!listData.messages) return [];

  // 2. Fetch details for each message safely
  const emailPromises = listData.messages.map(async (msg: { id: string; threadId: string }) => {
    try {
      const detailResponse = await fetch(`${GMAIL_API_BASE}/messages/${msg.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (!detailResponse.ok) return null;

      const detail = await detailResponse.json();
      
      // Safety check: Ensure payload and headers exist
      if (!detail.payload || !detail.payload.headers) {
          return null;
      }
      
      const headers = detail.payload.headers;
      const from = getHeader(headers, 'From');
      const subject = getHeader(headers, 'Subject');
      
      // Simple parsing of sender name and email
      const senderMatch = from.match(/^"?([^"<]*)"? <([^>]*)>$/);
      const senderName = senderMatch ? senderMatch[1].trim() : from.split('@')[0];
      const senderEmail = senderMatch ? senderMatch[2] : from;

      // Extract body (simplified)
      let body = '';
      if (detail.snippet) {
          body = detail.snippet;
      }

      // Determine folder (simplified logic based on labels)
      let folder = FolderType.INBOX;
      if (detail.labelIds) {
          if (detail.labelIds.includes('SENT')) folder = FolderType.SENT;
          else if (detail.labelIds.includes('DRAFT')) folder = FolderType.DRAFTS;
          else if (detail.labelIds.includes('TRASH')) folder = FolderType.TRASH;
          else if (detail.labelIds.includes('SPAM')) folder = FolderType.SPAM;
      }

      return {
        id: detail.id,
        senderName: senderName || 'Unknown',
        senderEmail: senderEmail || '',
        subject: subject || '(No Subject)',
        body: body,
        timestamp: new Date(parseInt(detail.internalDate)),
        isRead: !detail.labelIds.includes('UNREAD'),
        isStarred: detail.labelIds.includes('STARRED'),
        folder: folder,
        avatarColor: 'bg-blue-600' 
      };
    } catch (e) {
      console.warn(`Skipping message ${msg.id} due to error:`, e);
      return null;
    }
  });

  // Filter out nulls (failed messages)
  const results = await Promise.all(emailPromises);
  return results.filter((email): email is Email => email !== null);
};

export const sendGmail = async (accessToken: string, to: string, subject: string, body: string) => {
  // Encode subject using RFC 2047 to support Arabic characters in headers
  const encodedSubject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;

  const emailContent = [
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'MIME-Version: 1.0',
    '',
    body
  ].join('\n');

  const encodedEmail = btoa(unescape(encodeURIComponent(emailContent)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch(`${GMAIL_API_BASE}/messages/send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      raw: encodedEmail
    })
  });

  if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Failed to send email');
  }
  
  return response.json();
};