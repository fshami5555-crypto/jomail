import React, { useState } from 'react';
import { Search, Menu, Bell, HelpCircle, Settings, LogOut } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User;
  onMenuClick: () => void;
  searchTerm: string;
  onSearch: (term: string) => void;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onMenuClick, searchTerm, onSearch, onLogout }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-20">
      <div className="flex items-center gap-3 md:w-64">
        <button 
          onClick={onMenuClick}
          className="p-2 hover:bg-gray-100 rounded-full md:hidden text-gray-600"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-gray-700 md:hidden">Jomail</h1>
      </div>

      <div className="flex-1 max-w-3xl px-4">
        <div className={`relative flex items-center bg-gray-100 rounded-lg transition-all duration-200 ${isFocused ? 'bg-white shadow-md ring-1 ring-gray-200' : ''}`}>
          <button className="p-3 text-gray-500 hover:text-gray-700">
            <Search className="w-5 h-5" />
          </button>
          <input
            type="text"
            placeholder="البحث في البريد"
            className="w-full bg-transparent border-none outline-none py-2 px-2 text-gray-700 placeholder-gray-500"
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full hidden sm:block">
          <HelpCircle className="w-6 h-6" />
        </button>
        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full hidden sm:block">
          <Settings className="w-6 h-6" />
        </button>
         <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
          <Bell className="w-6 h-6" />
        </button>
        
        <div className="mr-2 relative group cursor-pointer z-50">
           <img 
             src={user.avatarUrl} 
             alt={user.name} 
             className="w-9 h-9 rounded-full border border-gray-300 object-cover"
           />
           <div className="absolute left-0 top-10 w-56 bg-white shadow-xl rounded-xl p-2 hidden group-hover:block border border-gray-100">
              <div className="px-3 py-2 border-b border-gray-100 mb-2">
                <p className="font-bold text-gray-800 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              
              {onLogout && (
                <button 
                  onClick={onLogout}
                  className="w-full text-right flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  تسجيل الخروج
                </button>
              )}
           </div>
        </div>
      </div>
    </header>
  );
};

export default Header;