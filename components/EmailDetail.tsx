import React, { useState } from 'react';
import { ArrowRight, Star, Reply, Trash2, MoreVertical, Sparkles, ChevronLeft, ChevronRight, ReplyAll } from 'lucide-react';
import { Email } from '../types';
import { summarizeEmail } from '../services/geminiService';

interface EmailDetailProps {
  email: Email;
  onBack: () => void;
  onDelete: (id: string) => void;
  onToggleStar: (id: string) => void;
  canGoNewer: boolean;
  canGoOlder: boolean;
  onNavigate: (direction: 'newer' | 'older') => void;
  onReply: (replyAll: boolean) => void;
}

const EmailDetail: React.FC<EmailDetailProps> = ({ 
  email, 
  onBack, 
  onDelete, 
  onToggleStar,
  canGoNewer,
  canGoOlder,
  onNavigate,
  onReply
}) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const handleSummarize = async () => {
    setIsSummarizing(true);
    const result = await summarizeEmail(email.body);
    setSummary(result);
    setIsSummarizing(false);
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-tl-2xl shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-600" title="عودة">
            <ArrowRight className="w-5 h-5" />
          </button>
          
          {/* Navigation Buttons */}
          <div className="flex items-center border-r border-gray-300 pr-2 mr-2 gap-1">
             <button 
               onClick={() => onNavigate('newer')} 
               disabled={!canGoNewer}
               className="p-2 hover:bg-gray-100 rounded-full text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent"
               title="الأحدث"
             >
                <ChevronRight className="w-5 h-5" />
             </button>
             <button 
               onClick={() => onNavigate('older')} 
               disabled={!canGoOlder}
               className="p-2 hover:bg-gray-100 rounded-full text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent"
               title="الأقدم"
             >
                <ChevronLeft className="w-5 h-5" />
             </button>
          </div>

          <button onClick={() => onDelete(email.id)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 hover:text-red-500" title="حذف">
            <Trash2 className="w-5 h-5" />
          </button>
          <button onClick={() => onToggleStar(email.id)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600" title="تمييز">
            <Star className={`w-5 h-5 ${email.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          </button>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="flex items-start justify-between mb-8">
          <h1 className="text-2xl font-medium text-gray-900 leading-relaxed">{email.subject}</h1>
          <div className="flex items-center gap-2">
            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
              {email.folder}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-8">
           <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-medium ${email.avatarColor}`}>
            {email.senderName.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-baseline justify-between">
              <h3 className="font-bold text-gray-900 text-lg">{email.senderName}</h3>
              <span className="text-sm text-gray-500">{email.timestamp.toLocaleString('ar-EG')}</span>
            </div>
            <p className="text-sm text-gray-500">{`<${email.senderEmail}>`}</p>
          </div>
        </div>

        {/* Gemini AI Feature: Summarize */}
        {!summary && (
          <button 
            onClick={handleSummarize}
            disabled={isSummarizing}
            className="mb-6 flex items-center gap-2 text-sm text-purple-700 bg-purple-50 px-4 py-2 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {isSummarizing ? 'جاري التلخيص...' : 'تلخيص باستخدام الذكاء الاصطناعي'}
          </button>
        )}

        {summary && (
           <div className="mb-8 p-4 bg-gradient-to-r from-purple-50 to-white border border-purple-100 rounded-xl">
             <div className="flex items-center gap-2 mb-2 text-purple-800 font-bold text-sm">
               <Sparkles className="w-4 h-4" />
               <span>ملخص الذكاء الاصطناعي</span>
             </div>
             <p className="text-gray-700 leading-relaxed text-sm">{summary}</p>
           </div>
        )}

        <div className="prose max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed">
          {email.body}
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-100 flex gap-4">
           <button 
            onClick={() => onReply(false)}
            className="flex items-center gap-2 px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors"
           >
             <Reply className="w-4 h-4" />
             <span>رد</span>
           </button>
           <button 
            onClick={() => onReply(true)}
            className="flex items-center gap-2 px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors"
           >
             <ReplyAll className="w-4 h-4" />
             <span>رد على الكل</span>
           </button>
        </div>
      </div>
    </div>
  );
};

export default EmailDetail;