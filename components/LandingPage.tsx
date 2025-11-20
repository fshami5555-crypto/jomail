import React, { useState, useRef } from 'react';
import { Mail, CheckSquare, FileText, GraduationCap, ArrowLeft, Loader2, AlertCircle, LogOut, LayoutGrid } from 'lucide-react';
import { User } from '../types';
import { fetchUserProfile } from '../services/gmailService';

const GOOGLE_CLIENT_ID = "1060283634284-jc286ddjc8r7nsgs78cvkptrefhmsf7g.apps.googleusercontent.com";

interface LandingPageProps {
  onSelectApp: (appName: string) => void;
  onLogin: (user: User) => void;
  user?: User;
  isLoggedIn?: boolean;
}

declare global {
  interface Window {
    google: any;
  }
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelectApp, onLogin, user, isLoggedIn }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tokenClient = useRef<any>(null);

  const handleGoogleLogin = () => {
    setError(null);

    if (!GOOGLE_CLIENT_ID || (GOOGLE_CLIENT_ID as string) === "PUT_YOUR_GOOGLE_CLIENT_ID_HERE") {
        setError("لم يتم إعداد Google Client ID.");
        return;
    }

    if (!window.google) {
      setError("تعذر تحميل مكتبة Google. يرجى تحديث الصفحة.");
      return;
    }

    setIsLoading(true);

    try {
      if (!tokenClient.current) {
        tokenClient.current = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.access_token) {
               try {
                  const profile = await fetchUserProfile(tokenResponse.access_token);
                  const user: User = {
                      name: profile.name || "مستخدم Google",
                      email: profile.email,
                      avatarUrl: profile.picture,
                      accessToken: tokenResponse.access_token
                  };
                  onLogin(user);
                  setIsLoading(false);
               } catch (err) {
                  console.error(err);
                  setError("فشل في جلب بيانات الملف الشخصي.");
                  setIsLoading(false);
               }
            } else {
               setIsLoading(false);
            }
          },
          error_callback: (err: any) => {
              console.error("OAuth Error:", err);
              if (err.type === 'popup_closed') {
                   setError("تم إغلاق نافذة تسجيل الدخول.");
              } else {
                   setError(`حدث خطأ أثناء المصادقة (${err.type}).`);
              }
              setIsLoading(false);
          }
        });
      }

      tokenClient.current.requestAccessToken();

    } catch (err) {
        console.error(err);
        setError("حدث خطأ غير متوقع أثناء تهيئة Google Sign-In.");
        setIsLoading(false);
    }
  };

  const apps = [
    { 
      id: 'jomail', 
      name: 'JO mail', 
      icon: Mail, 
      color: 'bg-blue-600', 
      description: 'البريد الإلكتروني الذكي والمتقدم',
      active: true
    },
    { 
      id: 'jotask', 
      name: 'JO task', 
      icon: CheckSquare, 
      color: 'bg-emerald-600', 
      description: 'إدارة المهام والمشاريع بكفاءة',
      active: true
    },
    { 
      id: 'jodoc', 
      name: 'JO doc', 
      icon: FileText, 
      color: 'bg-amber-500', 
      description: 'تحرير المستندات والتعاون الحي',
      active: false
    },
    { 
      id: 'jolearn', 
      name: 'JO learn', 
      icon: GraduationCap, 
      color: 'bg-purple-600', 
      description: 'منصة التعليم وتنمية المهارات',
      active: false
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-6 relative overflow-hidden" dir="rtl">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-white to-transparent opacity-80"></div>
      </div>

      <div className="z-10 text-center mb-10 max-w-2xl">
        <h1 className="text-5xl font-bold text-gray-900 mb-6 tracking-tight">
          مرحباً بك في <span className="text-blue-600">JO Workspace</span>
        </h1>
        <p className="text-xl text-gray-500 leading-relaxed mb-8">
          منصة عمل متكاملة تجمع بين التواصل، الإنتاجية، والتعلم في مكان واحد. اختر التطبيق للبدء.
        </p>

        {/* Dynamic Auth Section */}
        <div className="flex flex-col items-center justify-center gap-4 mb-8">
            {isLoggedIn && user ? (
                <div className="animate-fadeIn flex flex-col items-center gap-2">
                     <div className="flex items-center gap-3 bg-white px-5 py-2 rounded-full shadow-sm border border-gray-200">
                        <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full" />
                        <span className="text-gray-700 font-medium">أهلاً بك، {user.name}</span>
                     </div>
                     <p className="text-sm text-gray-500">تم تسجيل دخولك بنجاح. يمكنك الآن فتح التطبيقات.</p>
                </div>
            ) : (
                <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 font-medium px-6 py-3 rounded-full shadow-sm transition-all flex items-center gap-3 text-lg"
                >
                    {isLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    ) : (
                        <>
                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            <span>تسجيل الدخول السريع عبر Google</span>
                        </>
                    )}
                </button>
            )}
            
            {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-full text-sm animate-fadeIn">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl z-10">
        {apps.map((app) => (
          <button
            key={app.id}
            onClick={() => {
              if (app.active) {
                onSelectApp(app.id);
              } else {
                alert('هذا التطبيق قيد التطوير وسيكون متاحاً قريباً.');
              }
            }}
            className={`
              group relative bg-white p-6 rounded-3xl shadow-sm border border-gray-100
              hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-right overflow-hidden
              ${!app.active ? 'opacity-80 grayscale' : ''}
            `}
          >
            <div className={`absolute top-0 right-0 w-2 h-full ${app.color} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
            
            <div className="flex items-start gap-6">
              <div className={`
                w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg transform group-hover:rotate-6 transition-transform
                ${app.color}
              `}>
                <app.icon className="w-8 h-8" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                   <h3 className="text-2xl font-bold text-gray-800 group-hover:text-blue-900 transition-colors">
                    {app.name}
                  </h3>
                  {!app.active && (
                    <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full font-medium">
                      قريباً
                    </span>
                  )}
                   {app.active && (
                    <span className={`text-xs px-2 py-1 rounded-full font-medium opacity-0 group-hover:opacity-100 transition-opacity ${isLoggedIn ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                      {isLoggedIn ? 'فتح' : 'دخول'}
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {app.description}
                </p>
              </div>
            </div>
            
            {app.active && (
               <div className="absolute bottom-6 left-6 text-gray-300 group-hover:text-blue-600 transform translate-x-4 group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                 <ArrowLeft className="w-6 h-6" />
               </div>
            )}
          </button>
        ))}
      </div>
      
      <footer className="mt-16 text-gray-400 text-sm z-10">
        © 2025 JO Workspace. جميع الحقوق محفوظة.
      </footer>
    </div>
  );
};

export default LandingPage;