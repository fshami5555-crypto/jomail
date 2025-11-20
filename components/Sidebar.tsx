import React, { useState } from 'react';
import { 
  Inbox, 
  Send, 
  File, 
  Trash2, 
  Star, 
  Plus, 
  Mail, 
  Clock, 
  ShoppingBag, 
  AlertOctagon, 
  CalendarClock, 
  Bookmark,
  ChevronDown,
  ChevronUp,
  Settings,
  Tag,
  LayoutGrid
} from 'lucide-react';
import { FolderType } from '../types';

interface SidebarProps {
  currentFolder: FolderType;
  onFolderChange: (folder: FolderType) => void;
  onCompose: () => void;
  unreadCount: number;
  isOpen: boolean;
  onGoHome?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentFolder, onFolderChange, onCompose, unreadCount, isOpen, onGoHome }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const mainItems = [
    { id: FolderType.INBOX, label: 'البريد الوارد', icon: Inbox, count: unreadCount },
    { id: FolderType.STARRED, label: 'المميزة بنجمة', icon: Star, count: 0 },
    { id: FolderType.SNOOZED, label: 'المؤجلة', icon: Clock, count: 0 },
    { id: FolderType.SENT, label: 'البريد المرسل', icon: Send, count: 0 },
    { id: FolderType.DRAFTS, label: 'المسودات', icon: File, count: 0 },
  ];

  const moreItems = [
    { id: FolderType.PURCHASES, label: 'المشتريات', icon: ShoppingBag, count: 0, bold: true },
    { id: FolderType.IMPORTANT, label: 'مهم', icon: Bookmark, count: 0 },
    { id: FolderType.SCHEDULED, label: 'مجدولة', icon: CalendarClock, count: 0 },
    { id: FolderType.ALL_MAIL, label: 'كل البريد', icon: Mail, count: 0 },
    { id: FolderType.SPAM, label: 'الرسائل غير المرغوب فيها', icon: AlertOctagon, count: 0 },
    { id: FolderType.TRASH, label: 'المهملات', icon: Trash2, count: 0 },
  ];

  const displayedMoreItems = isExpanded ? moreItems : moreItems.slice(0, 1);

  const sidebarClasses = `
    fixed inset-y-0 right-0 z-30 w-64 bg-gray-50 border-l border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col
    ${isOpen ? 'translate-x-0' : 'translate-x-full'}
    md:relative md:translate-x-0 md:block
  `;

  return (
    <aside className={sidebarClasses}>
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="text-blue-600">
                <Mail className="w-7 h-7" />
            </div>
            <span className="text-2xl font-bold text-gray-600 tracking-tight font-sans">Jomail</span>
        </div>
        
        {onGoHome && (
            <button 
                onClick={onGoHome}
                className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
                title="JO Workspace"
            >
                <LayoutGrid className="w-5 h-5" />
            </button>
        )}
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={onCompose}
          className="w-14 h-14 md:w-36 md:h-14 bg-[#c2e7ff] hover:bg-[#b3d7ef] text-gray-800 rounded-2xl flex items-center justify-center md:justify-start md:px-5 gap-4 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <Plus className="w-6 h-6" />
          <span className="hidden md:block font-semibold text-sm">إنشاء</span>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 custom-scrollbar">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentFolder === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onFolderChange(item.id)}
              className={`w-full flex items-center justify-between px-4 py-1.5 rounded-full text-right transition-colors
                ${isActive 
                  ? 'bg-[#d3e3fd] text-gray-800 font-bold' 
                  : 'text-gray-600 hover:bg-gray-200'
                }`}
            >
              <div className="flex items-center gap-4">
                <Icon className={`w-4 h-4 ${isActive ? 'text-gray-800' : 'text-gray-600'}`} />
                <span className="text-sm">{item.label}</span>
              </div>
              {item.count > 0 && (
                <span className={`text-xs font-bold ${isActive ? 'text-gray-800' : 'text-gray-600'}`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}

        {/* Toggle Button */}
        <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center px-4 py-1.5 rounded-full text-right text-gray-600 hover:bg-gray-200"
        >
             <div className="flex items-center gap-4">
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span className="text-sm">{isExpanded ? 'أقل' : 'المزيد'}</span>
            </div>
        </button>

        {isExpanded && (
            <div className="animate-fadeIn">
                {moreItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentFolder === item.id;
                    return (
                        <button
                        key={item.id}
                        onClick={() => onFolderChange(item.id)}
                        className={`w-full flex items-center justify-between px-4 py-1.5 rounded-full text-right transition-colors
                            ${isActive 
                            ? 'bg-[#d3e3fd] text-gray-800 font-bold' 
                            : 'text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                        <div className="flex items-center gap-4">
                            <Icon className={`w-4 h-4 ${isActive ? 'text-gray-800' : 'text-gray-600'}`} />
                            <span className={`text-sm ${item.bold ? 'font-bold' : ''}`}>{item.label}</span>
                        </div>
                        {item.count > 0 && (
                            <span className="text-xs font-bold text-gray-600">
                            {item.count}
                            </span>
                        )}
                        </button>
                    );
                })}
            </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200 mx-2">
             <div className="flex items-center justify-between px-2 mb-2">
                 <span className="text-sm font-medium text-gray-600">التصنيفات</span>
                 <Plus className="w-4 h-4 text-gray-500 cursor-pointer hover:bg-gray-200 rounded" />
             </div>
             <button className="w-full flex items-center gap-4 px-4 py-1.5 rounded-full text-right text-gray-600 hover:bg-gray-200">
                 <Settings className="w-4 h-4" />
                 <span className="text-sm">إدارة التصنيفات</span>
             </button>
             <button className="w-full flex items-center gap-4 px-4 py-1.5 rounded-full text-right text-gray-600 hover:bg-gray-200">
                 <Tag className="w-4 h-4" />
                 <span className="text-sm">إنشاء تصنيف جديد</span>
             </button>
        </div>

      </nav>
    </aside>
  );
};

export default Sidebar;