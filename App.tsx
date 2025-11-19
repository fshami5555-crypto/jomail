import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import EmailList from './components/EmailList';
import EmailDetail from './components/EmailDetail';
import ComposeModal from './components/ComposeModal';
import Auth from './components/Auth';
import { Email, FolderType, INITIAL_USER, User } from './types';
import { generateInitialEmails } from './services/geminiService';
import { fetchEmails, sendGmail } from './services/gmailService';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [currentFolder, setCurrentFolder] = useState<FolderType>(FolderType.INBOX);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
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
    } else {
        setLoading(false);
    }
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
          case FolderType.SCHEDULED: return 'in:scheduled'; // or label:SCHEDULED
          case FolderType.PURCHASES: return 'category:purchases';
          case FolderType.ALL_MAIL: return 'in:all'; // everything including archive
          default: return 'label:INBOX';
      }
  };

  // 3. Load Emails
  useEffect(() => {
    if (!isLoggedIn) return;

    const loadEmails = async () => {
      setLoading(true);
      // Reset emails list when switching folders to show loading state clearly
      setEmails([]); 
      
      try {
        if (user.accessToken) {
          // Construct query based on current folder
          const query = getGmailQuery(currentFolder);
          // Fetch emails using dynamic query
          const realEmails = await fetchEmails(user.accessToken, query, 30); // Fetching 30 items for "full" feel
          
          if (realEmails.length > 0) {
             setEmails(realEmails);
          } else {
             // Empty state logic
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
          // Fallback for simulator mode (unchanged)
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
  }, [isLoggedIn, user.name, user.accessToken, currentFolder]);

  const handleLogin = (loggedInUser: User) => {
      setUser(loggedInUser);
      setIsLoggedIn(true);
      localStorage.setItem('jomail_user', JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
      setIsLoggedIn(false);
      setEmails([]);
      setSelectedEmail(null);
      setUser(INITIAL_USER);
      localStorage.removeItem('jomail_user');
      setCurrentFolder(FolderType.INBOX);
  };

  const handleSendEmail = async (to: string, subject: string, body: string) => {
    const newEmail: Email = {
      id: `sent-${Date.now()}`,
      senderName: user.name,
      senderEmail: user.email,
      subject: subject,
      body: body,
      timestamp: new Date(),
      isRead: true,
      isStarred: false,
      folder: FolderType.SENT,
      avatarColor: 'bg-gray-500'
    };
    
    // If in Sent folder, add to list immediately
    if (currentFolder === FolderType.SENT) {
        setEmails(prev => [newEmail, ...prev]);
    }
    
    setIsComposeOpen(false);

    if (user.accessToken) {
        try {
            await sendGmail(user.accessToken, to, subject, body);
        } catch (error) {
            console.error("Failed to send email via Gmail API", error);
            alert("فشل إرسال الرسالة الحقيقية: " + error);
        }
    }
  };

  const handleDeleteEmail = (id: string) => {
    setEmails(prev => prev.filter(email => email.id !== id)); // Remove from view
    // Note: Real deletion via API requires another call (trash), simplified for UI here
    if (selectedEmail?.id === id) {
      setSelectedEmail(null);
    }
  };

  const handleToggleStar = (e: React.MouseEvent | string, id?: string) => {
    const emailId = typeof e === 'string' ? e : id;
    if (typeof e !== 'string' && e) e.stopPropagation();
    
    if (!emailId) return;

    setEmails(prev => prev.map(email => 
      email.id === emailId 
        ? { ...email, isStarred: !email.isStarred } 
        : email
    ));
  };

  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, isRead: true } : e));
    }
  };

  // Filtering within the loaded batch
  const filteredEmails = emails.filter(email => {
    // Note: Folder filtering is now handled by the API query in loadEmails
    // So we mainly filter by search term here
    const matchesSearch = 
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.body.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const unreadCount = emails.filter(e => !e.isRead).length;

  if (!isLoggedIn) {
      return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-[#f6f8fc] overflow-hidden">
      <Sidebar 
        currentFolder={currentFolder}
        onFolderChange={(folder) => { setCurrentFolder(folder); setSelectedEmail(null); setIsSidebarOpen(false); }}
        onCompose={() => setIsComposeOpen(true)}
        unreadCount={unreadCount}
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
        
        <main className="flex-1 p-2 sm:p-4 overflow-hidden flex">
          <div className={`bg-white rounded-2xl shadow-sm flex-1 flex overflow-hidden relative transition-all duration-300`}>
            {loading ? (
                 <div className="w-full h-full flex items-center justify-center flex-col gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500 text-sm">جاري تحميل رسائلك...</p>
                 </div>
            ) : selectedEmail ? (
              <EmailDetail 
                email={selectedEmail} 
                onBack={() => setSelectedEmail(null)} 
                onDelete={handleDeleteEmail}
                onToggleStar={(id) => handleToggleStar(id, id)}
              />
            ) : (
              <EmailList 
                emails={filteredEmails}
                onSelectEmail={handleSelectEmail}
                onToggleStar={handleToggleStar}
                selectedEmailId={selectedEmail?.id}
              />
            )}
          </div>
        </main>
      </div>

      <ComposeModal 
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSend={handleSendEmail}
      />
    </div>
  );
};

export default App;