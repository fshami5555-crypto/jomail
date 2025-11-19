import React from 'react';
import { Inbox, Send, File, Trash2, Star, Plus, Mail } from 'lucide-react';
import { FolderType } from '../types';

interface SidebarProps {
  currentFolder: FolderType;
  onFolderChange: (folder: FolderType) => void;
  onCompose: () => void;
  unreadCount: number;
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentFolder, onFolderChange, onCompose, unreadCount, isOpen }) => {
  const menuItems = [
    { id: FolderType.INBOX, label: 'البريد الوارد', icon: Inbox, count: unreadCount },
    { id: FolderType.STARRED, label: 'المميزة بنجمة', icon: Star, count: 0 },
    { id: FolderType.SENT, label: 'البريد المرسل', icon: Send, count: 0 },
    { id: FolderType.DRAFTS, label: 'المسودات', icon: File, count: 0 },
    { id: FolderType.TRASH, label: 'المهملات', icon: Trash2, count: 0 },
  ];

  const sidebarClasses = `
    fixed inset-y-0 right-0 z-30 w-64 bg-gray-50 border-l border-gray-200 transform transition-transform duration-300 ease-in-out
    ${isOpen ? 'translate-x-0' : 'translate-x-full'}
    md:relative md:translate-x-0 md:block
  `;

  return (
    <aside className={sidebarClasses}>
      <div className="p-6 flex items-center gap-3 border-b border-gray-200/50">
        <div className="bg-blue-600 p-2 rounded-lg">
            <Mail className="text-white w-6 h-6" />
        </div>
        <span className="text-2xl font-bold text-gray-800 tracking-tight">Jomail</span>
      </div>

      <div className="p-4">
        <button
          onClick={onCompose}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-4 px-6 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all duration-200 group"
        >
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
          <span className="font-semibold text-lg">إنشاء رسالة</span>
        </button>
      </div>

      <nav className="px-2 py-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentFolder === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onFolderChange(item.id)}
              className={`w-full flex items-center justify-between px-6 py-3 rounded-r-full text-right transition-colors mb-1
                ${isActive 
                  ? 'bg-blue-100 text-blue-800 font-semibold' 
                  : 'text-gray-600 hover:bg-gray-200'
                }`}
            >
              <div className="flex items-center gap-4">
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.count > 0 && (
                <span className={`text-xs font-bold ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;