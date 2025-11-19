import React, { useState } from 'react';
import { Mail, User as UserIcon, Lock, ArrowLeft, Check, Loader2, Eye, EyeOff, AlertCircle, Copy } from 'lucide-react';
import { User } from '../types';
import { fetchUserProfile } from '../services/gmailService';

// ==========================================
// إعدادات المطور (Developer Configuration)
// ==========================================
// ضع Google Client ID الخاص بك هنا ليعمل تسجيل الدخول الحقيقي
// احصل عليه من: https://console.cloud.google.com/apis/credentials
const GOOGLE_CLIENT_ID = "PUT_YOUR_GOOGLE_CLIENT_ID_HERE"; 

interface AuthProps {
  onLogin: (user: User) => void;
}

declare global {
  interface Window {
    google: any;
  }
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Developer helper to copy origin
  const currentOrigin = window.location.origin;
  const isConfigured = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== "PUT_YOUR_GOOGLE_CLIENT_ID_HERE";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // المحاكاة (Simulator Login)
    setTimeout(() => {
      const name = email.split('@')[0] || "مستخدم Jomail";
      const user: User = {
        name: name,
        email: email || "user@jomail.com",
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563EB&color=fff`
      };
      onLogin(user);
      setIsLoading(false);
    }, 1500);
  };

  const handleGoogleLogin = () => {
    setAuthError('');
    
    // التحقق من وجود المكتبة
    if (!window.google) {
      setAuthError("تعذر تحميل مكتبة Google. يرجى التحقق من اتصالك بالإنترنت وتحديث الصفحة.");
      return;
    }

    // التحقق من إعداد الـ Client ID في الكود
    if (!isConfigured) {
      setAuthError("لم يتم إعداد Google Client ID في كود التطبيق (ملف Auth.tsx). انظر التعليمات أدناه.");
      return;
    }

    setIsLoading(true);

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
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
             } catch (err) {
                console.error(err);
                setAuthError("فشل في جلب بيانات الملف الشخصي.");
                setIsLoading(false);
             }
          } else {
             setIsLoading(false);
          }
        },
        error_callback: (err: any) => {
            console.error(err);
            // Handle standard errors
            if (err.type === 'popup_closed') {
                 setAuthError("تم إغلاق نافذة تسجيل الدخول.");
            } else {
                 setAuthError("حدث خطأ أثناء المصادقة. تأكد من إضافة الرابط الحالي في 'Authorized JavaScript origins' في Google Console.");
            }
            setIsLoading(false);
        }
      });

      client.requestAccessToken();
    } catch (err) {
        console.error(err);
        setAuthError("حدث خطأ غير متوقع أثناء تهيئة Google Sign-In.");
        setIsLoading(false);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== confirmPassword) {
        alert("كلمات المرور غير متطابقة");
        return;
    }
    setIsLoading(true);

    setTimeout(() => {
        const fullName = `${firstName} ${lastName}`;
        const fullEmail = `${username}@jomail.com`;
        const user: User = {
            name: fullName,
            email: fullEmail,
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + ' ' + lastName)}&background=2563EB&color=fff`
        };
        onLogin(user);
        setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-64 bg-blue-600 transform -skew-y-3 origin-top-left z-0"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-20 z-0"></div>

      <div className="flex flex-col gap-4 w-full max-w-[450px] relative z-10">
        
        {/* Developer Setup Helper - Only shows if Client ID is missing */}
        {!isConfigured && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 shadow-sm animate-fadeIn">
                <h3 className="text-sm font-bold text-yellow-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    إعدادات المطور مطلوبة
                </h3>
                <p className="text-xs text-yellow-700 mb-3 leading-relaxed">
                    لـتفعيل تسجيل الدخول عبر Google، قم بإنشاء Client ID وضع الرابط التالي في خانة <b>Authorized JavaScript origins</b>:
                </p>
                <div className="flex items-center gap-2 bg-white border border-yellow-200 rounded px-3 py-2">
                    <code className="text-xs text-gray-600 font-mono flex-1 truncate dir-ltr text-left">{currentOrigin}</code>
                    <button 
                        onClick={() => navigator.clipboard.writeText(currentOrigin)}
                        className="text-yellow-600 hover:text-yellow-800"
                        title="نسخ الرابط"
                    >
                        <Copy className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-[10px] text-yellow-600 mt-2">
                    بعد الحصول على Client ID، ألصقه في ملف <code>Auth.tsx</code> في المتغير <code>GOOGLE_CLIENT_ID</code>.
                </p>
            </div>
        )}

        <div className="bg-white w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100">
            
            {/* Header */}
            <div className="pt-10 pb-6 px-8 text-center bg-white">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-200 rotate-3 hover:rotate-6 transition-transform duration-300">
                <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight mb-1">Jomail</h1>
            <p className="text-gray-500 text-sm">بريدك الإلكتروني.. أذكى وأسرع</p>
            </div>

            {/* Tabs */}
            <div className="flex px-8 border-b border-gray-100">
            <button 
                onClick={() => setMode('login')}
                className={`flex-1 pb-3 text-sm font-bold transition-all relative ${mode === 'login' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
                تسجيل الدخول
                {mode === 'login' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full"></div>}
            </button>
            <button 
                onClick={() => setMode('register')}
                className={`flex-1 pb-3 text-sm font-bold transition-all relative ${mode === 'register' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
                إنشاء حساب جديد
                {mode === 'register' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full"></div>}
            </button>
            </div>

            <div className="p-8 bg-white">
            {mode === 'login' ? (
                <div className="animate-fadeIn space-y-5">
                    
                    {authError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{authError}</span>
                        </div>
                    )}

                    {/* Google Login Button */}
                    <button
                        onClick={handleGoogleLogin}
                        type="button"
                        disabled={isLoading}
                        className={`w-full bg-white border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-3 shadow-sm ${!isConfigured ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        ) : (
                            <>
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                <span>المتابعة باستخدام Google</span>
                            </>
                        )}
                    </button>
                    {!isConfigured && (
                        <p className="text-[10px] text-center text-gray-400 -mt-3">
                            * يتطلب إعداد Client ID (انظر التعليمات أعلاه)
                        </p>
                    )}

                    <div className="relative flex py-1 items-center">
                        <div className="flex-grow border-t border-gray-200"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">أو عبر البريد الإلكتروني</span>
                        <div className="flex-grow border-t border-gray-200"></div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">البريد الإلكتروني</label>
                        <div className="relative group">
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <UserIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input 
                            type="email" 
                            required
                            className="block w-full pr-10 pl-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-800 placeholder-gray-400"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">كلمة المرور</label>
                        <div className="relative group">
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input 
                            type={showPassword ? "text" : "password"}
                            required
                            className="block w-full pr-10 pl-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-800 placeholder-gray-400"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 left-0 pl-3 flex items-center cursor-pointer text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        </div>
                    </div>
                        
                    <div className="flex items-center justify-between text-sm pt-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center">
                            <input type="checkbox" className="peer sr-only" />
                            <div className="w-4 h-4 border-2 border-gray-300 rounded peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all"></div>
                            <Check className="w-3 h-3 text-white absolute top-0.5 right-0.5 opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-gray-600 select-none">تذكرني</span>
                        </label>
                        <a href="#" className="text-blue-600 hover:text-blue-700 font-bold text-xs">نسيت كلمة المرور؟</a>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 transform active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                <span>دخول</span>
                                <ArrowLeft className="w-5 h-5" />
                            </>
                        )}
                    </button>
                    </form>
                </div>
            ) : (
                <form onSubmit={handleRegister} className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">الاسم الأول</label>
                        <input 
                        type="text" 
                        required
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">اسم العائلة</label>
                        <input 
                        type="text" 
                        required
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">اسم المستخدم المرغوب</label>
                    <div className="flex flex-row-reverse border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all bg-gray-50">
                        <span className="bg-gray-100 text-gray-500 px-3 py-2.5 flex items-center text-sm border-r border-gray-200 dir-ltr font-mono">
                        @jomail.com
                        </span>
                        <input 
                        type="text" 
                        required
                        className="flex-1 px-3 py-2.5 outline-none text-left dir-ltr bg-transparent placeholder-right font-medium text-gray-800"
                        placeholder="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase())}
                        />
                    </div>
                    {username && (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <Check className="w-3 h-3" /> متاح للاستخدام
                        </p>
                    )}
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">كلمة المرور</label>
                        <input 
                        type="password" 
                        required
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">تأكيد كلمة المرور</label>
                        <input 
                        type="password" 
                        required
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/30 mt-2 flex items-center justify-center gap-2 disabled:opacity-70 transition-all"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "إنشاء حساب Jomail"}
                </button>
                </form>
            )}
            </div>

            <div className="bg-gray-50 px-8 py-4 text-center border-t border-gray-100">
                <p className="text-xs text-gray-500">
                    باستخدامك لـ Jomail فإنك توافق على <a href="#" className="text-blue-600 hover:underline">شروط الخدمة</a> و <a href="#" className="text-blue-600 hover:underline">سياسة الخصوصية</a>
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;