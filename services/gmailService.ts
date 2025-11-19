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

export const fetchEmails = async (accessToken: string, maxResults: number = 10): Promise<Email[]> => {
  // 1. List messages
  const listResponse = await fetch(`${GMAIL_API_BASE}/messages?maxResults=${maxResults}&q=category:primary`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  if (!listResponse.ok) throw new Error('Failed to list messages');
  const listData = await listResponse.json();
  
  if (!listData.messages) return [];

  // 2. Fetch details for each message
  const emails: Email[] = await Promise.all(
    listData.messages.map(async (msg: { id: string; threadId: string }) => {
      const detailResponse = await fetch(`${GMAIL_API_BASE}/messages/${msg.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const detail = await detailResponse.json();
      
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

      return {
        id: detail.id,
        senderName: senderName || 'Unknown',
        senderEmail: senderEmail || '',
        subject: subject || '(No Subject)',
        body: body, // Using snippet for preview, full body parsing is complex
        timestamp: new Date(parseInt(detail.internalDate)),
        isRead: !detail.labelIds.includes('UNREAD'),
        isStarred: detail.labelIds.includes('STARRED'),
        folder: FolderType.INBOX,
        avatarColor: 'bg-blue-600' // Default, can be randomized
      };
    })
  );

  return emails;
};

export const sendGmail = async (accessToken: string, to: string, subject: string, body: string) => {
  // FIX: Encode subject using RFC 2047 to support Arabic characters in headers
  // Format: =?utf-8?B?base64_encoded_string?=
  const encodedSubject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;

  // Gmail API requires raw base64url encoded email
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