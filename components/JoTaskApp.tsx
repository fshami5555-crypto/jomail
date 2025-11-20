
import React, { useState, useEffect } from 'react';
import { 
  Layout, Plus, Search, Calendar, Clock, 
  MoreVertical, AlertCircle, Paperclip, CheckCircle2, 
  X, User as UserIcon, Moon, Sun, Lock,
  Wand2, Loader2, LayoutGrid, Building2, Users, ArrowLeft,
  Briefcase, Phone, Mail, Shield, Trash2, Edit2
} from 'lucide-react';
import { Task, TaskStatus, UserRole, Project, TaskPriority, Attachment, User, CompanyProfile, TeamMember } from '../types';
import { generateTaskDescription } from '../services/geminiService';

interface JoTaskAppProps {
  user: User;
  onBack: () => void;
}

// ImgBB API Key
const IMGBB_API_KEY = "8651c8d21d91d90c780590fa34ee35aa";

const JoTaskApp: React.FC<JoTaskAppProps> = ({ user, onBack }) => {
  // --- Global State ---
  const [darkMode, setDarkMode] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [activeTab, setActiveTab] = useState<'board' | 'team'>('board');

  // --- Onboarding State ---
  const [step, setStep] = useState(1);
  const [obCompanyName, setObCompanyName] = useState('');
  const [obEmpCount, setObEmpCount] = useState('');
  const [obContactEmail, setObContactEmail] = useState('');
  const [obPhone, setObPhone] = useState('');
  // Onboarding Team (Temporary list)
  const [obTempTeam, setObTempTeam] = useState<{name: string, title: string}[]>([]);
  const [obNewMemberName, setObNewMemberName] = useState('');
  const [obNewMemberTitle, setObNewMemberTitle] = useState('');

  // --- Workspace State ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [role, setRole] = useState<UserRole>('Director'); 
  const [projects] = useState<Project[]>([
    { id: 'p1', name: 'مشاريع عامة', progress: 0 },
  ]);

  // --- Modals ---
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  // --- New Task Form ---
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // --- New Team Member Form ---
  const [tmName, setTmName] = useState('');
  const [tmTitle, setTmTitle] = useState('');
  const [tmRole, setTmRole] = useState<UserRole>('Employee');
  const [tmEmail, setTmEmail] = useState('');
  const [tmPassword, setTmPassword] = useState('');

  // --- Initialization ---
  useEffect(() => {
    const savedCompany = localStorage.getItem('jotask_company');
    const savedTeam = localStorage.getItem('jotask_team');
    const savedTasks = localStorage.getItem('jotask_tasks');

    if (savedCompany) {
      setCompany(JSON.parse(savedCompany));
      setHasOnboarded(true);
    }
    
    if (savedTeam) {
      setTeam(JSON.parse(savedTeam));
    } else {
      // Default Admin User
      setTeam([{
        id: 'admin',
        name: user.name,
        jobTitle: 'المدير العام',
        role: 'Director',
        email: user.email,
        avatarColor: 'bg-blue-600',
        joinedAt: new Date()
      }]);
    }

    if (savedTasks) {
        setTasks(JSON.parse(savedTasks).map((t: any) => ({
            ...t,
            deadline: new Date(t.deadline),
            createdAt: new Date(t.createdAt)
        })));
    }
  }, [user]);

  // Save data on changes
  useEffect(() => {
      if (hasOnboarded && company) localStorage.setItem('jotask_company', JSON.stringify(company));
      if (team.length > 0) localStorage.setItem('jotask_team', JSON.stringify(team));
      if (tasks.length > 0) localStorage.setItem('jotask_tasks', JSON.stringify(tasks));
  }, [company, team, tasks, hasOnboarded]);


  // --- Onboarding Handlers ---

  const handleAddTempMember = () => {
      if (obNewMemberName && obNewMemberTitle) {
          setObTempTeam([...obTempTeam, { name: obNewMemberName, title: obNewMemberTitle }]);
          setObNewMemberName('');
          setObNewMemberTitle('');
      }
  };

  const handleFinishOnboarding = () => {
      const newCompany: CompanyProfile = {
          name: obCompanyName,
          employeesCount: obEmpCount,
          contactEmail: obContactEmail,
          phone: obPhone,
          website: ''
      };

      // Create Team Members from onboarding
      const newTeamMembers: TeamMember[] = obTempTeam.map((m, idx) => ({
          id: `tm-${Date.now()}-${idx}`,
          name: m.name,
          jobTitle: m.title,
          role: 'Employee',
          email: `emp${idx}@${obCompanyName.replace(/\s/g, '').toLowerCase()}.com`, // Dummy email generation
          avatarColor: ['bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-red-500'][idx % 4],
          joinedAt: new Date()
      }));

      // Add Admin
      const admin: TeamMember = {
          id: 'admin-1',
          name: user.name,
          jobTitle: 'المدير العام',
          role: 'Director',
          email: user.email,
          avatarColor: 'bg-blue-600',
          joinedAt: new Date()
      };

      setCompany(newCompany);
      setTeam([admin, ...newTeamMembers]);
      setHasOnboarded(true);
  };

  // --- Workspace Handlers ---

  const handleCreateTask = () => {
      if (!newTaskTitle || !newTaskDeadline) return;
      
      const assignee = team.find(m => m.id === newTaskAssignee) || team[0];

      const newTask: Task = {
          id: `t-${Date.now()}`,
          title: newTaskTitle,
          description: newTaskDesc,
          projectId: projects[0].id,
          department: 'General',
          assigneeId: assignee.id,
          assigneeName: assignee.name,
          assigneeAvatar: assignee.avatarColor,
          priority: newTaskPriority,
          status: 'todo',
          deadline: new Date(newTaskDeadline),
          isLocked: false,
          createdAt: new Date(),
          attachments: []
      };

      setTasks([...tasks, newTask]);
      setIsTaskModalOpen(false);
      // Reset form
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskAssignee('');
      setNewTaskDeadline('');
  };

  const handleAddTeamMember = () => {
      if (!tmName || !tmEmail) return;

      const newMember: TeamMember = {
          id: `tm-${Date.now()}`,
          name: tmName,
          jobTitle: tmTitle || 'موظف',
          role: tmRole,
          email: tmEmail,
          password: tmPassword,
          avatarColor: 'bg-emerald-500',
          joinedAt: new Date()
      };

      setTeam([...team, newMember]);
      setIsTeamModalOpen(false);
      // Reset
      setTmName('');
      setTmTitle('');
      setTmEmail('');
      setTmPassword('');
  };

  const handleDeleteMember = (id: string) => {
      if (confirm('هل أنت متأكد من حذف هذا العضو؟')) {
          setTeam(prev => prev.filter(m => m.id !== id));
      }
  };

  const handleAiGenerateDesc = async () => {
      if (!newTaskTitle) return;
      setIsGeneratingAi(true);
      const desc = await generateTaskDescription(newTaskTitle, "General");
      setNewTaskDesc(desc);
      setIsGeneratingAi(false);
  };

  // --- Render Components ---

  if (!hasOnboarded) {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 dir-rtl font-sans">
              <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl p-8 md:p-12">
                  {/* Progress Bar */}
                  <div className="flex items-center justify-between mb-10 relative">
                      <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-10 rounded-full"></div>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>3</div>
                  </div>

                  {/* Step 1: Company Info */}
                  {step === 1 && (
                      <div className="animate-fadeIn">
                          <h2 className="text-3xl font-bold text-gray-800 mb-2">أهلاً بك في JO task</h2>
                          <p className="text-gray-500 mb-8">لنبدأ بإعداد مساحة العمل الخاصة بشركتك.</p>
                          
                          <div className="space-y-6">
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-2">اسم الشركة / المؤسسة</label>
                                  <div className="relative">
                                      <Building2 className="absolute right-4 top-3.5 text-gray-400 w-5 h-5" />
                                      <input 
                                          type="text" 
                                          value={obCompanyName}
                                          onChange={(e) => setObCompanyName(e.target.value)}
                                          className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                          placeholder="مثال: شركة الأفق للإنتاج"
                                      />
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-2">عدد الموظفين</label>
                                  <select 
                                      value={obEmpCount}
                                      onChange={(e) => setObEmpCount(e.target.value)}
                                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                  >
                                      <option value="">اختر العدد التقريبي</option>
                                      <option value="1-10">1 - 10 موظفين</option>
                                      <option value="11-50">11 - 50 موظف</option>
                                      <option value="50+">أكثر من 50 موظف</option>
                                  </select>
                              </div>
                          </div>

                          <div className="mt-10 flex justify-end">
                              <button 
                                  onClick={() => setStep(2)}
                                  disabled={!obCompanyName || !obEmpCount}
                                  className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                              >
                                  <span>التالي</span>
                                  <ArrowLeft className="w-5 h-5" />
                              </button>
                          </div>
                      </div>
                  )}

                  {/* Step 2: Team */}
                  {step === 2 && (
                      <div className="animate-fadeIn">
                          <h2 className="text-2xl font-bold text-gray-800 mb-2">فريق العمل</h2>
                          <p className="text-gray-500 mb-6">أضف بعض الأعضاء الرئيسيين الآن (يمكنك إضافة المزيد لاحقاً).</p>
                          
                          <div className="bg-blue-50 p-6 rounded-2xl mb-6 border border-blue-100">
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                  <input 
                                      type="text" 
                                      placeholder="اسم الموظف"
                                      value={obNewMemberName}
                                      onChange={(e) => setObNewMemberName(e.target.value)}
                                      className="px-4 py-2 rounded-lg border border-gray-200 text-sm"
                                  />
                                  <input 
                                      type="text" 
                                      placeholder="المسمى الوظيفي"
                                      value={obNewMemberTitle}
                                      onChange={(e) => setObNewMemberTitle(e.target.value)}
                                      className="px-4 py-2 rounded-lg border border-gray-200 text-sm"
                                  />
                              </div>
                              <button 
                                  onClick={handleAddTempMember}
                                  className="w-full bg-white border border-blue-200 text-blue-600 py-2 rounded-lg font-bold text-sm hover:bg-blue-50"
                              >
                                  + إضافة للقائمة
                              </button>
                          </div>

                          <div className="space-y-2 mb-8 max-h-48 overflow-y-auto">
                              {obTempTeam.length === 0 && <p className="text-center text-gray-400 text-sm py-4">لم تتم إضافة أعضاء بعد</p>}
                              {obTempTeam.map((m, i) => (
                                  <div key={i} className="flex justify-between items-center bg-white border border-gray-100 p-3 rounded-lg shadow-sm">
                                      <div>
                                          <p className="font-bold text-sm">{m.name}</p>
                                          <p className="text-xs text-gray-500">{m.title}</p>
                                      </div>
                                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                                  </div>
                              ))}
                          </div>

                          <div className="flex justify-between">
                               <button onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-800 font-medium">رجوع</button>
                               <div className="flex gap-3">
                                  <button onClick={() => setStep(3)} className="text-blue-600 font-medium hover:bg-blue-50 px-4 py-2 rounded-lg">تخطي</button>
                                  <button onClick={() => setStep(3)} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700">التالي</button>
                               </div>
                          </div>
                      </div>
                  )}

                  {/* Step 3: Contact */}
                  {step === 3 && (
                      <div className="animate-fadeIn">
                          <h2 className="text-2xl font-bold text-gray-800 mb-2">بيانات التواصل</h2>
                          <p className="text-gray-500 mb-6">كيف يمكن التواصل مع إدارة الشركة؟</p>

                          <div className="space-y-4 mb-8">
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-2">البريد الإلكتروني الرسمي</label>
                                  <div className="relative">
                                      <Mail className="absolute right-4 top-3.5 text-gray-400 w-5 h-5" />
                                      <input 
                                          type="email" 
                                          value={obContactEmail}
                                          onChange={(e) => setObContactEmail(e.target.value)}
                                          className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                          placeholder="contact@company.com"
                                      />
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهاتف</label>
                                  <div className="relative">
                                      <Phone className="absolute right-4 top-3.5 text-gray-400 w-5 h-5" />
                                      <input 
                                          type="text" 
                                          value={obPhone}
                                          onChange={(e) => setObPhone(e.target.value)}
                                          className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                          placeholder="+962..."
                                      />
                                  </div>
                              </div>
                          </div>

                          <div className="flex justify-between">
                               <button onClick={() => setStep(2)} className="text-gray-500 hover:text-gray-800 font-medium">رجوع</button>
                               <button 
                                  onClick={handleFinishOnboarding}
                                  className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                               >
                                  <span>إطلاق مساحة العمل</span>
                                  <CheckCircle2 className="w-5 h-5" />
                               </button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      );
  }

  // --- Main Application UI ---

  return (
    <div className={`h-screen flex flex-col transition-colors duration-300 ${darkMode ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'} dir-rtl`}>
      
      {/* Header */}
      <header className={`h-16 px-6 flex items-center justify-between border-b ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center gap-4">
              <div className="bg-emerald-600 p-2 rounded-lg shadow-md">
                  <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                  <h1 className="text-lg font-bold font-sans tracking-tight leading-tight">{company?.name || 'JO Task'}</h1>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                      <span className="bg-gray-100 px-1.5 rounded text-gray-600">{role === 'Director' ? 'الإدارة العامة' : 'مساحة العمل'}</span>
                      <span>•</span>
                      <span>{team.length} أعضاء</span>
                  </div>
              </div>
          </div>

          {/* Navigation Tabs */}
          <div className="hidden md:flex bg-gray-100 p-1 rounded-lg dark:bg-gray-800">
              <button 
                  onClick={() => setActiveTab('board')}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'board' ? 'bg-white text-emerald-600 shadow-sm dark:bg-gray-700 dark:text-emerald-400' : 'text-gray-500 hover:text-gray-700'}`}
              >
                  لوحة المهام
              </button>
              <button 
                  onClick={() => setActiveTab('team')}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'team' ? 'bg-white text-emerald-600 shadow-sm dark:bg-gray-700 dark:text-emerald-400' : 'text-gray-500 hover:text-gray-700'}`}
              >
                  <Users className="w-4 h-4" />
                  فريق العمل
              </button>
          </div>

          <div className="flex items-center gap-3">
               <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <Shield className="w-4 h-4 text-gray-500" />
                  <select 
                    value={role} 
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className={`bg-transparent outline-none text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                      <option value="Director">مدير عام</option>
                      <option value="Manager">مدير قسم</option>
                      <option value="Employee">موظف</option>
                  </select>
              </div>

              <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full ${darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}>
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <button 
                onClick={onBack} 
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 font-medium px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors"
              >
                  <LayoutGrid className="w-5 h-5" />
              </button>
          </div>
      </header>

      {/* Tab Content: Team Management */}
      {activeTab === 'team' && (
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-black/20">
              <div className="max-w-5xl mx-auto">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">إدارة فريق العمل</h2>
                      <button 
                          onClick={() => setIsTeamModalOpen(true)}
                          className="bg-blue-600 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700"
                      >
                          <Plus className="w-5 h-5" />
                          <span>إضافة موظف</span>
                      </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {team.map(member => (
                          <div key={member.id} className={`p-5 rounded-2xl border shadow-sm ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                              <div className="flex justify-between items-start mb-4">
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${member.avatarColor}`}>
                                      {member.name.charAt(0)}
                                  </div>
                                  {member.role !== 'Director' && (
                                      <button onClick={() => handleDeleteMember(member.id)} className="text-gray-400 hover:text-red-500">
                                          <Trash2 className="w-4 h-4" />
                                      </button>
                                  )}
                              </div>
                              <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{member.name}</h3>
                              <p className="text-sm text-gray-500 mb-1">{member.jobTitle}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                                  <Mail className="w-3 h-3" />
                                  <span className="truncate">{member.email}</span>
                              </div>
                              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                  <span className={`px-2 py-1 rounded-md text-xs font-bold 
                                      ${member.role === 'Director' ? 'bg-purple-50 text-purple-600' : 
                                        member.role === 'Manager' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                                      {member.role === 'Director' ? 'مدير عام' : member.role === 'Manager' ? 'مدير قسم' : 'موظف'}
                                  </span>
                                  {member.password && (
                                      <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">Pass: {member.password}</span>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* Tab Content: Tasks Board */}
      {activeTab === 'board' && (
        <>
          {/* Toolbar */}
          <div className={`px-6 py-4 flex flex-wrap items-center justify-between gap-4 ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className={`flex items-center px-3 py-2 rounded-xl border w-full md:w-64 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                      <Search className="w-4 h-4 text-gray-400 ml-2" />
                      <input type="text" placeholder="بحث في المهام..." className="bg-transparent border-none outline-none text-sm w-full" />
                  </div>
                  {role !== 'Employee' && (
                      <button 
                        onClick={() => setIsTaskModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all"
                      >
                          <Plus className="w-4 h-4" />
                          <span>مهمة جديدة</span>
                      </button>
                  )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
              </div>
          </div>

          {/* Kanban Board Columns (Reused existing logic) */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
              <div className="flex h-full gap-6 min-w-max pb-4">
                  {/* Reuse existing Column & TaskCard Logic Here but omitted for brevity since logic is same as previous version, just rendering tasks state */}
                  {['todo', 'in_progress', 'review', 'done'].map(status => (
                       <div key={status} className={`flex-1 min-w-[280px] flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} rounded-2xl p-4 h-full`}>
                            <div className="flex justify-between mb-4">
                                <h3 className="font-bold capitalize">{status === 'todo' ? 'قائمة المهام' : status === 'in_progress' ? 'جاري التنفيذ' : status === 'review' ? 'مراجعة' : 'تم الاعتماد'}</h3>
                                <span className="bg-gray-200 px-2 rounded-full text-xs py-1">{tasks.filter(t => t.status === status).length}</span>
                            </div>
                            <div className="space-y-3 overflow-y-auto custom-scrollbar">
                                {tasks.filter(t => t.status === status).map(task => (
                                    <div key={task.id} onClick={() => setSelectedTask(task)} className={`p-4 rounded-xl border cursor-pointer hover:shadow-md ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                        <h4 className="font-bold text-sm mb-2">{task.title}</h4>
                                        <div className="flex justify-between items-center">
                                             <div className={`w-6 h-6 rounded-full text-white flex items-center justify-center text-xs ${task.assigneeAvatar}`}>
                                                 {task.assigneeName.charAt(0)}
                                             </div>
                                             <span className={`text-xs px-2 py-0.5 rounded ${task.priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                 {task.priority === 'high' ? 'عالي' : 'عادي'}
                                             </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                       </div>
                  ))}
              </div>
          </div>
        </>
      )}

      {/* --- Modals --- */}

      {/* New Team Member Modal */}
      {isTeamModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-fadeIn">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-lg text-gray-800">إضافة عضو جديد للفريق</h3>
                      <button onClick={() => setIsTeamModalOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">الاسم الكامل</label>
                          <input type="text" value={tmName} onChange={e => setTmName(e.target.value)} className="w-full p-2 border rounded-lg" />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">المسمى الوظيفي</label>
                          <input type="text" value={tmTitle} onChange={e => setTmTitle(e.target.value)} className="w-full p-2 border rounded-lg" />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">الصلاحية</label>
                          <select value={tmRole} onChange={e => setTmRole(e.target.value as UserRole)} className="w-full p-2 border rounded-lg">
                              <option value="Employee">موظف</option>
                              <option value="Manager">مدير قسم</option>
                              <option value="Director">مدير عام</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">البريد الإلكتروني</label>
                          <input type="email" value={tmEmail} onChange={e => setTmEmail(e.target.value)} className="w-full p-2 border rounded-lg" />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">كلمة المرور (للدخول)</label>
                          <input type="text" value={tmPassword} onChange={e => setTmPassword(e.target.value)} className="w-full p-2 border rounded-lg font-mono bg-gray-50" />
                      </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                      <button onClick={() => setIsTeamModalOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">إلغاء</button>
                      <button onClick={handleAddTeamMember} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">إضافة</button>
                  </div>
              </div>
          </div>
      )}

      {/* New Task Modal (Updated with Team Selection) */}
      {isTaskModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className={`${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]`}>
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <h3 className="font-bold text-lg">إضافة مهمة جديدة</h3>
                      <button onClick={() => setIsTaskModalOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
                  </div>
                  <div className="p-6 space-y-4 overflow-y-auto">
                      <div>
                          <label className="block text-sm font-bold mb-1.5">عنوان المهمة</label>
                          <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} outline-none`} />
                      </div>
                      
                      {/* Assignee Selection */}
                      <div>
                          <label className="block text-sm font-bold mb-1.5">المسؤول عن التنفيذ</label>
                          <select 
                            value={newTaskAssignee}
                            onChange={(e) => setNewTaskAssignee(e.target.value)}
                            className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} outline-none`}
                          >
                              <option value="">اختر موظفاً</option>
                              {team.map(m => (
                                  <option key={m.id} value={m.id}>{m.name} ({m.jobTitle})</option>
                              ))}
                          </select>
                      </div>

                      <div>
                          <div className="flex justify-between items-center mb-1.5">
                              <label className="block text-sm font-bold">الوصف</label>
                              <button onClick={handleAiGenerateDesc} disabled={!newTaskTitle || isGeneratingAi} className="text-xs flex items-center gap-1 text-purple-600 hover:bg-purple-50 px-2 py-1 rounded">
                                  {isGeneratingAi ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} <span>توليد AI</span>
                              </button>
                          </div>
                          <textarea value={newTaskDesc} onChange={(e) => setNewTaskDesc(e.target.value)} className={`w-full p-3 rounded-xl border h-24 resize-none ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} outline-none`} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-bold mb-1.5">الأولوية</label>
                              <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)} className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} outline-none`}>
                                  <option value="medium">متوسطة</option>
                                  <option value="high">عالية</option>
                                  <option value="low">منخفضة</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-bold mb-1.5">الموعد النهائي</label>
                              <input type="date" value={newTaskDeadline} onChange={(e) => setNewTaskDeadline(e.target.value)} className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} outline-none`} />
                          </div>
                      </div>
                  </div>
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                      <button onClick={() => setIsTaskModalOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">إلغاء</button>
                      <button onClick={handleCreateTask} className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700">إنشاء المهمة</button>
                  </div>
              </div>
          </div>
      )}

      {/* Task Detail Modal (Simplified for View) */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
           <div className={`w-full max-w-lg rounded-2xl p-6 relative ${darkMode ? 'bg-gray-900 text-white' : 'bg-white'}`}>
               <button onClick={() => setSelectedTask(null)} className="absolute left-4 top-4"><X className="w-5 h-5" /></button>
               <h2 className="text-2xl font-bold mb-2">{selectedTask.title}</h2>
               <span className="text-gray-500 text-sm mb-4 block">المسؤول: {selectedTask.assigneeName}</span>
               <p className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">{selectedTask.description || 'لا يوجد وصف'}</p>
               <div className="flex justify-end">
                  <button onClick={() => setSelectedTask(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-bold">إغلاق</button>
               </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default JoTaskApp;
