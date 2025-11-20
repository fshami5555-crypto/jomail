import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import EmailList from './components/EmailList';
import EmailDetail from './components/EmailDetail';
import ComposeModal, { ComposeInitialData } from './components/ComposeModal';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';
import JoTaskApp from './components/JoTaskApp';
import { Email, FolderType, INITIAL_USER, User, AppType } from './types';
import { generateInitialEmails } from './services/geminiService';
import { fetchEmails, sendGmail } from './services/gmailService';

const App: React.FC = () => {
  // Use AppType to track current view
  const [view, setView] = useState<AppType>('landing');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User>(INITIAL_USER);
  
  // Jomail State
  const [currentFolder, setCurrentFolder] = useState<FolderType>(FolderType.INBOX);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeInitialData, setComposeInitialData] = useState<ComposeInitialData | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Restore session on app load
  useEffect(() => {
    const savedUserStr = localStorage.getItem('jomail_user');
    if (savedUserStr) {
      try {
        const savedUser = JSON.parse(savedUserStr);
        setUser(savedUser);
        setIsLoggedIn(true);
      } catch (e) {
        console.error("Failed to parse saved user", e);
        localStorage.removeItem('jomail_user');
      }
    }
    setLoading(false);
  }, []);

  // 2. Map FolderType to Gmail Query
  const getGmailQuery = (folder: FolderType): string => {
      switch (folder) {
          case FolderType.INBOX: return 'label:INBOX';
          case FolderType.SENT: return 'label:SENT';
          case FolderType.DRAFTS: return 'label:DRAFT';
          case FolderType.STARRED: return 'label:STARRED';
          case FolderType.IMPORTANT: return 'label:IMPORTANT';
          case FolderType.SPAM: return 'label:SPAM';
          case FolderType.TRASH: return 'label:TRASH';
          case FolderType.SNOOZED: return 'in:snoozed';
          case FolderType.SCHEDULED: return 'in:scheduled';
          case FolderType.PURCHASES: return 'category:purchases';
          case FolderType.ALL_MAIL: return 'in:all'; 
          default: return 'label:INBOX';
      }
  };

  // 3. Load Emails (Only for Jomail)
  useEffect(() => {
    if (!isLoggedIn || view !== 'jomail') return;

    const loadEmails = async () => {
      setLoading(true);
      setEmails([]); 
      
      try {
        if (user.accessToken) {
          const query = getGmailQuery(currentFolder);
          const realEmails = await fetchEmails(user.accessToken, query, 30);
          
          if (realEmails.length > 0) {
             setEmails(realEmails);
          } else {
             const emptyState: Email = {
                id: 'empty-folder',
                senderName: 'Jomail',
                senderEmail: 'system@jomail.com',
                subject: 'هذا المجلد فارغ',
                body: `لا توجد رسائل في ${currentFolder} حالياً.`,
                timestamp: new Date(),
                isRead: true,
                isStarred: false,
                folder: currentFolder,
                avatarColor: 'bg-gray-400'
             };
             setEmails([emptyState]);
          }
        } else {
          // Simulator fallback
          const generated = await generateInitialEmails(user.name);
          const formattedEmails: Email[] = generated.map((e: any, index: number) => ({
            id: `init-${index}`,
            senderName: e.senderName,
            senderEmail: e.senderEmail,
            subject: e.subject,
            body: e.body,
            timestamp: new Date(Date.now() - (e.dateOffset || 1) * 3600000),
            isRead: false,
            isStarred: false,
            folder: FolderType.INBOX,
            avatarColor: ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500'][index % 5]
          }));
          setEmails(formattedEmails.length > 0 ? formattedEmails : []);
        }
      } catch (error: any) {
        console.error("Error loading emails", error);
        
        if (String(error).includes('401') || String(error).toLowerCase().includes('invalid credentials')) {
            handleLogout();
            alert("انتهت صلاحية جلسة العمل. يرجى تسجيل الدخول مرة أخرى.");
            return;
        }

        setEmails([{
           id: 'error',
           senderName: 'System Error',
           senderEmail: 'error@jomail.com',
           subject: 'خطأ في جلب البيانات',
           body: 'تعذر جلب رسائلك الحقيقية. يرجى التأكد من اتصال الإنترنت أو صلاحيات التطبيق.\n' + String(error),
           timestamp: new Date(),
           isRead: false,
           isStarred: false,
           folder: FolderType.INBOX,
           avatarColor: 'bg-red-600'
        }]);
      } finally {
        setLoading(false);
      }
    };

    loadEmails();
  }, [isLoggedIn, user.name, user.accessToken, currentFolder, view]);

  const handleLogin = (loggedInUser: User) => {
      setUser(loggedInUser);
      setIsLoggedIn(true);
      localStorage.setItem('jomail_user', JSON.stringify(loggedInUser));
      // If user was trying to access a specific app, go there. Default to Landing.
      setView('jomail'); // Or stay on landing? Requirement says "Opens JO mail automatically" if logged in from landing page google btn.
      // But for general login flow, we might want to direct them to what they selected.
  };

  const handleLogout = () => {
      setIsLoggedIn(false);
      setEmails([]);
      setSelectedEmail(null);
      setUser(INITIAL_USER);
      localStorage.removeItem('jomail_user');
      setCurrentFolder(FolderType.INBOX);
      setView('landing');
  };

  const handleSelectApp = (appName: string) => {
      if (appName === 'jomail') setView('jomail');
      if (appName === 'jotask') setView('jotask');
  };

  // --- Rendering Logic ---

  // 1. Landing Page
  if (view === 'landing') {
      return <LandingPage 
        onSelectApp={handleSelectApp} 
        onLogin={(u) => {
            handleLogin(u);
            setView('jomail'); // Landing page login defaults to mail per user request
        }} 
      />;
  }

  // 2. Auth Guard
  if (!isLoggedIn) {
      return <Auth onLogin={(u) => {
          handleLogin(u);
          // Stay on the view the user tried to access
      }} />;
  }

  // 3. JO Task
  if (view === 'jotask') {
      return <JoTaskApp user={user} onBack={() => setView('landing')} />;
  }

  // 4. JO Mail (Default App)
  return (
    <div className="flex h-screen bg-[#f6f8fc] overflow-hidden">
      <Sidebar 
        currentFolder={currentFolder}
        onFolderChange={(folder) => { setCurrentFolder(folder); setSelectedEmail(null); setIsSidebarOpen(false); }}
        onCompose={() => { setComposeInitialData(null); setIsComposeOpen(true); }}
        unreadCount={emails.filter(e => !e.isRead).length}
        isOpen={isSidebarOpen}
      />
      
      {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          user={user} 
          searchTerm={searchTerm}
          onSearch={setSearchTerm}
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          onLogout={handleLogout}
        />
        
        {/* Header with App Switcher or Back to Landing */}
        <div className="bg-white border-b px-4 py-1 flex gap-2 md:hidden">
             <button onClick={() => setView('landing')} className="text-xs text-blue-600">العودة للرئيسية</button>
        </div>
        
        <main className="flex-1 p-2 sm:p-4 overflow-hidden flex">
          <div className={`bg-white rounded-2xl shadow-sm flex-1 flex flex-col overflow-hidden relative transition-all duration-300`}>
            {loading ? (
                 <div className="w-full h-full flex items-center justify-center flex-col gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500 text-sm">جاري تحميل رسائلك...</p>
                 </div>
            ) : selectedEmail ? (
              <EmailDetail 
                email={selectedEmail} 
                onBack={() => setSelectedEmail(null)} 
                onDelete={(id) => setEmails(prev => prev.filter(e => e.id !== id))}
                onToggleStar={(id) => setEmails(prev => prev.map(e => e.id === id ? { ...e, isStarred: !e.isStarred } : e))}
                canGoNewer={emails.findIndex(e => e.id === selectedEmail.id) > 0}
                canGoOlder={emails.findIndex(e => e.id === selectedEmail.id) < emails.length - 1}
                onNavigate={(dir) => {
                    const idx = emails.findIndex(e => e.id === selectedEmail.id);
                    const newIdx = dir === 'newer' ? idx - 1 : idx + 1;
                    if (emails[newIdx]) setSelectedEmail(emails[newIdx]);
                }}
                onReply={(replyAll) => {
                    const prefix = selectedEmail.subject.toLowerCase().startsWith('re:') ? '' : 'Re: ';
                    setComposeInitialData({
                        to: selectedEmail.senderEmail,
                        subject: prefix + selectedEmail.subject,
                        body: `\n\n\nOn ${selectedEmail.timestamp}, ${selectedEmail.senderName} wrote:\n> ${selectedEmail.body}`,
                        threadId: selectedEmail.threadId,
                        replyToMessageId: selectedEmail.headerMessageId
                    });
                    setIsComposeOpen(true);
                }}
              />
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <EmailList 
                    emails={emails.filter(e => e.subject.includes(searchTerm) || e.senderName.includes(searchTerm))}
                    onSelectEmail={(e) => { setSelectedEmail(e); if(!e.isRead) setEmails(prev => prev.map(el => el.id === e.id ? {...el, isRead:true}:el)); }}
                    onToggleStar={(ev, id) => { ev.stopPropagation(); setEmails(prev => prev.map(e => e.id === id ? {...e, isStarred: !e.isStarred} : e)); }}
                    selectedEmailId={selectedEmail?.id}
                  />
              </div>
            )}
          </div>
        </main>
      </div>

      <ComposeModal 
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSend={async (to, sub, body, tId, rId) => {
            setIsComposeOpen(false);
            // Optimistic UI update
            if(currentFolder === FolderType.SENT) {
                 setEmails(prev => [{ id: Date.now().toString(), senderName: user.name, senderEmail: user.email, subject: sub, body, timestamp: new Date(), isRead: true, isStarred: false, folder: FolderType.SENT, avatarColor: 'bg-gray-500' }, ...prev]);
            }
            if (user.accessToken) await sendGmail(user.accessToken, to, sub, body, tId, rId);
        }}
        initialData={composeInitialData}
      />
    </div>
  );
};

export default App;
