import { Email, FolderType } from '../types';

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';
const USER_INFO_API = 'https://www.googleapis.com/oauth2/v1/userinfo';

// Modern Base64URL encoding for UTF-8 content using TextEncoder
// This prevents 'deprecated' warnings and 'Invalid character' errors
const base64Encode = (str: string) => {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
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
      const messageId = getHeader(headers, 'Message-ID');
      
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
        threadId: detail.threadId,
        headerMessageId: messageId,
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

export const sendGmail = async (
    accessToken: string, 
    to: string, 
    subject: string, 
    body: string, 
    threadId?: string, 
    inReplyTo?: string
) => {
  
  // Encode subject using RFC 2047 to support Arabic characters in headers
  // We use base64Encode helper for consistent encoding
  const encodedSubject = `=?utf-8?B?${base64Encode(subject)}?=`;

  const headers = [
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'MIME-Version: 1.0',
  ];

  // Add Threading Headers if replying
  if (inReplyTo) {
      headers.push(`In-Reply-To: ${inReplyTo}`);
      headers.push(`References: ${inReplyTo}`);
  }

  const emailContent = [
    ...headers,
    '',
    body
  ].join('\n');

  // Encode entire message using safe Base64URL
  const raw = base64Encode(emailContent);

  const payload: any = { raw };
  if (threadId) {
      payload.threadId = threadId;
  }

  const response = await fetch(`${GMAIL_API_BASE}/messages/send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Failed to send email');
  }
  
  return response.json();
};