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
        // If no user saved, ensure loading stops
        setLoading(false);
    }
  }, []);

  // Load initial data only after login
  useEffect(() => {
    if (!isLoggedIn) return;

    const loadEmails = async () => {
      setLoading(true);
      try {
        if (user.accessToken) {
          // If user is logged in with Google, fetch REAL emails
          const realEmails = await fetchEmails(user.accessToken);
          if (realEmails.length > 0) {
             setEmails(realEmails);
          } else {
             // If empty real inbox, show a welcome placeholder
             const emptyState: Email = {
                id: 'welcome-real',
                senderName: 'Jomail System',
                senderEmail: 'system@jomail.com',
                subject: 'مرحباً بك في Jomail المتصل بـ Gmail',
                body: 'لقد تم ربط حسابك بنجاح. ستظهر رسائلك الحقيقية هنا. إذا كانت القائمة فارغة، فقد لا يكون لديك رسائل حديثة في صندوق الوارد الرئيسي.',
                timestamp: new Date(),
                isRead: false,
                isStarred: true,
                folder: FolderType.INBOX,
                avatarColor: 'bg-blue-600'
             };
             setEmails([emptyState]);
          }
        } else {
          // Otherwise, generate AI fake emails for demo
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
          
          if (formattedEmails.length === 0) {
              const fallbackEmails: Email[] = [
                   {
                      id: '1',
                      senderName: 'فريق Jomail',
                      senderEmail: 'welcome@jomail.com',
                      subject: `مرحباً بك يا ${user.name} في منصة Jomail`,
                      body: 'أهلاً بك في تطبيق البريد الإلكتروني الذكي. نحن سعداء بانضمامك إلينا. يمكنك استخدام أدوات الذكاء الاصطناعي لإنشاء الرسائل وتلخيصها.',
                      timestamp: new Date(),
                      isRead: false,
                      isStarred: true,
                      folder: FolderType.INBOX,
                      avatarColor: 'bg-blue-600'
                   }
              ];
              setEmails(fallbackEmails);
          } else {
              setEmails(formattedEmails);
          }
        }
      } catch (error: any) {
        console.error("Error loading emails", error);
        
        // Handle Token Expiration (401 Unauthorized)
        if (String(error).includes('401') || String(error).toLowerCase().includes('invalid credentials')) {
            handleLogout(); // Force logout so user can refresh token
            alert("انتهت صلاحية جلسة العمل. يرجى تسجيل الدخول مرة أخرى.");
            return;
        }

        // Show error in UI via an email
        setEmails([{
           id: 'error',
           senderName: 'System Error',
           senderEmail: 'error@jomail.com',
           subject: 'خطأ في جلب البيانات',
           body: 'تعذر جلب رسائلك الحقيقية. يرجى التأكد من اتصال الإنترنت أو صلاحيات التطبيق.\n\n' + String(error),
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
  }, [isLoggedIn, user.name, user.accessToken]);

  const handleLogin = (loggedInUser: User) => {
      setUser(loggedInUser);
      setIsLoggedIn(true);
      // Save to LocalStorage
      localStorage.setItem('jomail_user', JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
      setIsLoggedIn(false);
      setEmails([]);
      setSelectedEmail(null);
      setUser(INITIAL_USER);
      // Remove from LocalStorage
      localStorage.removeItem('jomail_user');
  };

  const handleSendEmail = async (to: string, subject: string, body: string) => {
    // Optimistic UI update
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
    
    setEmails(prev => [newEmail, ...prev]);
    setIsComposeOpen(false);

    // Actual Send Logic
    if (user.accessToken) {
        try {
            await sendGmail(user.accessToken, to, subject, body);
            console.log("Email sent successfully via Gmail API");
        } catch (error) {
            console.error("Failed to send email via Gmail API", error);
            alert("فشل إرسال الرسالة الحقيقية: " + error);
        }
    }
  };

  const handleDeleteEmail = (id: string) => {
    setEmails(prev => prev.map(email => 
      email.id === id 
        ? { ...email, folder: FolderType.TRASH } 
        : email
    ));
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

  // Filtering
  const filteredEmails = emails.filter(email => {
    const inFolder = currentFolder === FolderType.STARRED 
      ? email.isStarred 
      : email.folder === currentFolder;
    
    const matchesSearch = 
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.body.toLowerCase().includes(searchTerm.toLowerCase());

    return inFolder && matchesSearch;
  }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const unreadCount = emails.filter(e => e.folder === FolderType.INBOX && !e.isRead).length;

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
      
      {/* Overlay for mobile sidebar */}
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
            {loading && emails.length === 0 ? (
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