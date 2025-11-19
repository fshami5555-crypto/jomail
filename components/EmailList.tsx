import React from 'react';
import { Star, Paperclip } from 'lucide-react';
import { Email } from '../types';

interface EmailListProps {
  emails: Email[];
  onSelectEmail: (email: Email) => void;
  onToggleStar: (e: React.MouseEvent, id: string) => void;
  selectedEmailId?: string;
}

const EmailList: React.FC<EmailListProps> = ({ emails, onSelectEmail, onToggleStar, selectedEmailId }) => {
  
  const formatDate = (date: Date) => {
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    
    if (isToday) {
      return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
  };

  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 mt-20">
        <div className="bg-gray-100 p-6 rounded-full mb-4">
          <Star className="w-12 h-12 text-gray-300" />
        </div>
        <p className="text-lg">لا يوجد رسائل هنا</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-gray-100 bg-white shadow-sm rounded-lg mx-2 mt-2">
      {emails.map((email) => (
        <div 
          key={email.id}
          onClick={() => onSelectEmail(email)}
          className={`
            group flex items-center gap-4 px-4 py-3 cursor-pointer transition-all hover:shadow-md hover:z-10 border-l-4
            ${selectedEmailId === email.id ? 'bg-blue-50 border-blue-600' : 'bg-white border-transparent hover:bg-gray-50'}
            ${!email.isRead ? 'font-bold bg-slate-50' : 'text-gray-600'}
          `}
        >
          <button 
            onClick={(e) => onToggleStar(e, email.id)}
            className="text-gray-300 hover:text-yellow-400 focus:outline-none"
          >
             <Star className={`w-5 h-5 ${email.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          </button>

          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0 ${email.avatarColor}`}>
            {email.senderName.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between mb-1">
              <h3 className={`truncate text-base ${!email.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                {email.senderName}
              </h3>
              <span className={`text-xs shrink-0 ${!email.isRead ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
                {formatDate(email.timestamp)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <p className="truncate text-sm text-gray-600">
                <span className={!email.isRead ? 'font-bold text-gray-800' : ''}>{email.subject}</span>
                <span className="text-gray-400 mx-2">-</span>
                <span className="text-gray-500 font-normal">{email.body.substring(0, 60)}...</span>
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EmailList;