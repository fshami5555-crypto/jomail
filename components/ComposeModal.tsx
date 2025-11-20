import React, { useState, useEffect } from 'react';
import { X, Minimize2, Maximize2, Paperclip, Send, Wand2, Loader2 } from 'lucide-react';
import { draftEmailContent } from '../services/geminiService';

export interface ComposeInitialData {
  to: string;
  subject: string;
  body: string;
  threadId?: string;
  replyToMessageId?: string;
}

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (to: string, subject: string, body: string, threadId?: string, replyToMessageId?: string) => void;
  initialData?: ComposeInitialData | null;
}

const ComposeModal: React.FC<ComposeModalProps> = ({ isOpen, onClose, onSend, initialData }) => {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiInput, setShowAiInput] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Reset or Fill form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTo(initialData.to);
        setSubject(initialData.subject);
        setBody(initialData.body);
      } else {
        // Reset if opening as new message
        setTo('');
        setSubject('');
        setBody('');
      }
      setAiPrompt('');
      setShowAiInput(false);
      setIsMinimized(false);
    }
  }, [isOpen, initialData]);

  if (!isOpen && !isMinimized) return null;
  if (!isOpen) return null;

  const handleSend = () => {
    if (to && subject && body) {
      onSend(
          to, 
          subject, 
          body, 
          initialData?.threadId, 
          initialData?.replyToMessageId
      );
      resetForm();
    }
  };

  const resetForm = () => {
    setTo('');
    setSubject('');
    setBody('');
    setAiPrompt('');
    setShowAiInput(false);
    onClose();
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    const generatedText = await draftEmailContent(aiPrompt);
    setBody(prev => prev ? prev + "\n\n" + generatedText : generatedText);
    setIsGenerating(false);
    setShowAiInput(false);
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-0 left-8 z-50 w-64 bg-white rounded-t-lg shadow-2xl border border-gray-200">
        <div 
          className="bg-gray-900 text-white px-4 py-2 rounded-t-lg flex justify-between items-center cursor-pointer"
          onClick={() => setIsMinimized(false)}
        >
          <span className="truncate font-medium">{subject || 'رسالة جديدة'}</span>
          <div className="flex items-center gap-2">
             <button onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}><Maximize2 className="w-4 h-4" /></button>
             <button onClick={(e) => { e.stopPropagation(); resetForm(); }}><X className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 md:left-24 z-50 w-full md:w-[600px] h-full md:h-[600px] bg-white md:rounded-t-xl shadow-2xl flex flex-col border border-gray-200 ring-1 ring-gray-100">
      {/* Header */}
      <div className="bg-gray-100 px-4 py-3 flex justify-between items-center rounded-t-xl border-b border-gray-200">
        <h3 className="font-bold text-gray-700">
            {initialData ? 'رد على رسالة' : 'رسالة جديدة'}
        </h3>
        <div className="flex items-center gap-3 text-gray-500">
          <button onClick={() => setIsMinimized(true)} className="hover:text-gray-800"><Minimize2 className="w-4 h-4" /></button>
          <button onClick={resetForm} className="hover:text-red-500"><X className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex flex-col p-2">
        <div className="relative">
            <span className="absolute right-3 top-3 text-gray-500 text-sm font-bold">إلى:</span>
            <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full p-3 pr-12 border-b border-gray-100 focus:outline-none focus:border-blue-500 transition-colors text-sm"
            />
        </div>
        <div className="relative">
            <span className="absolute right-3 top-3 text-gray-500 text-sm font-bold">الموضوع:</span>
            <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full p-3 pr-16 border-b border-gray-100 focus:outline-none focus:border-blue-500 transition-colors font-medium text-sm"
            />
        </div>
        
        {/* AI Assistant Area */}
        {showAiInput ? (
          <div className="m-2 p-3 bg-purple-50 rounded-lg border border-purple-100 animate-fadeIn">
            <div className="flex items-center gap-2 text-purple-800 mb-2 font-bold text-sm">
              <Wand2 className="w-4 h-4" />
              <span>مساعد الكتابة الذكي</span>
            </div>
            <input 
              type="text" 
              className="w-full p-2 border border-purple-200 rounded mb-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="عن ماذا تريد أن تكتب؟ (مثلاً: وافق على العرض واشكر المرسل)"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowAiInput(false)} 
                className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1"
              >
                إلغاء
              </button>
              <button 
                onClick={handleAiGenerate}
                disabled={isGenerating}
                className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 flex items-center gap-1"
              >
                {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'توليد النص'}
              </button>
            </div>
          </div>
        ) : (
          <div className="px-2 py-1">
            <button 
              onClick={() => setShowAiInput(true)}
              className="text-xs flex items-center gap-1 text-purple-600 hover:bg-purple-50 px-2 py-1 rounded transition-colors"
            >
              <Wand2 className="w-3 h-3" />
              <span>اطلب من Jomail الكتابة لك</span>
            </button>
          </div>
        )}

        <textarea
          placeholder="اكتب رسالتك هنا..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full flex-1 p-3 resize-none focus:outline-none text-gray-800 leading-relaxed text-sm"
        />
      </div>

      {/* Footer Actions */}
      <div className="p-3 flex items-center justify-between border-t border-gray-100">
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSend}
            disabled={!to || !body}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <span>إرسال</span>
            <Send className="w-4 h-4 rotate-180" />
          </button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
            <Paperclip className="w-5 h-5" />
          </button>
        </div>
        <button 
            onClick={resetForm}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
        >
            <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ComposeModal;