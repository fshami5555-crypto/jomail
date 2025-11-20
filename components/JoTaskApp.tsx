import React, { useState, useEffect } from 'react';
import { 
  Layout, Plus, Search, Bell, Calendar, Clock, 
  MoreVertical, AlertCircle, Paperclip, CheckCircle2, 
  X, User as UserIcon, Moon, Sun, Flag, Lock, Send,
  Wand2, Image as ImageIcon, Loader2, ChevronDown, Star
} from 'lucide-react';
import { Task, TaskStatus, UserRole, Project, TaskPriority, Attachment, User } from '../types';
import { generateTaskDescription, refineTaskFeedback } from '../services/geminiService';

interface JoTaskAppProps {
  user: User;
  onBack: () => void;
}

// ImgBB API Key
const IMGBB_API_KEY = "8651c8d21d91d90c780590fa34ee35aa";

const JoTaskApp: React.FC<JoTaskAppProps> = ({ user, onBack }) => {
  const [role, setRole] = useState<UserRole>('Director'); // Default role for testing
  const [darkMode, setDarkMode] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects] = useState<Project[]>([
    { id: 'p1', name: 'حملة رمضان', progress: 65 },
    { id: 'p2', name: 'تطوير الموقع', progress: 30 },
    { id: 'p3', name: 'تصميم الهوية', progress: 90 },
  ]);
  
  // Modal States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null); // For viewing details
  
  // New Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskProject, setNewTaskProject] = useState(projects[0].id);
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // File Upload State
  const [uploading, setUploading] = useState(false);

  // Initial Dummy Data
  useEffect(() => {
    const initialTasks: Task[] = [
      {
        id: 't1',
        title: 'تصميم بوستر الحملة الرئيسي',
        description: 'المطلوب تصميم بوستر بمقاسات السوشيال ميديا يبرز العروض الجديدة.',
        projectId: 'p1',
        department: 'Design',
        assigneeId: 'u1',
        assigneeName: 'أحمد محمد',
        assigneeAvatar: 'bg-blue-500',
        priority: 'high',
        status: 'in_progress',
        deadline: new Date(Date.now() + 86400000 * 2), // 2 days left
        isLocked: false,
        createdAt: new Date(),
        attachments: []
      },
      {
        id: 't2',
        title: 'كتابة سيناريو الإعلان',
        description: 'كتابة سيناريو فيديو 30 ثانية.',
        projectId: 'p1',
        department: 'Content',
        assigneeId: 'u2',
        assigneeName: 'سارة علي',
        assigneeAvatar: 'bg-pink-500',
        priority: 'medium',
        status: 'review',
        deadline: new Date(Date.now() - 86400000), // Overdue
        isLocked: true, // Locked because overdue
        createdAt: new Date(),
        attachments: []
      }
    ];
    setTasks(initialTasks);
  }, []);

  // --- Actions ---

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    const taskId = e.dataTransfer.getData("taskId");
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Role-based restrictions
    if (role === 'Employee') {
        if (task.isLocked) {
            alert("هذه المهمة مغلقة بسبب انتهاء الوقت. اطلب تمديداً.");
            return;
        }
        if (status === 'done') {
            alert("ليس لديك صلاحية اعتماد المهمة. انقلها للمراجعة.");
            return;
        }
        if (task.status === 'done') {
            alert("لا يمكنك تعديل مهمة تم اعتمادها.");
            return;
        }
    }

    if (task.isLocked && role !== 'Director') {
         alert("المهمة مغلقة. المدير العام فقط يمكنه تعديلها.");
         return;
    }

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleAiGenerateDesc = async () => {
      if (!newTaskTitle) return;
      setIsGeneratingAi(true);
      const desc = await generateTaskDescription(newTaskTitle, "General");
      setNewTaskDesc(desc);
      setIsGeneratingAi(false);
  };

  const handleCreateTask = () => {
      if (!newTaskTitle || !newTaskDeadline) return;
      
      const newTask: Task = {
          id: `t-${Date.now()}`,
          title: newTaskTitle,
          description: newTaskDesc,
          projectId: newTaskProject,
          department: 'General',
          assigneeId: 'current-user',
          assigneeName: role === 'Employee' ? user.name : 'موظف جديد',
          assigneeAvatar: 'bg-purple-500',
          priority: newTaskPriority,
          status: 'todo',
          deadline: new Date(newTaskDeadline),
          isLocked: false,
          createdAt: new Date(),
          attachments: []
      };

      setTasks([...tasks, newTask]);
      setIsTaskModalOpen(false);
      resetForm();
  };

  const resetForm = () => {
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskPriority('medium');
      setNewTaskDeadline('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, taskId: string) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      const formData = new FormData();
      formData.append('image', file);

      try {
          const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
              method: 'POST',
              body: formData
          });
          const data = await res.json();
          
          if (data.success) {
              const newAttachment: Attachment = {
                  id: `att-${Date.now()}`,
                  name: file.name,
                  url: data.data.url,
                  type: 'image',
                  uploadedBy: user.name,
                  accessLevel: 'public'
              };

              setTasks(prev => prev.map(t => {
                  if (t.id === taskId) {
                      return { ...t, attachments: [...t.attachments, newAttachment] };
                  }
                  return t;
              }));
              alert("تم رفع الملف بنجاح");
          } else {
              alert("فشل الرفع");
          }
      } catch (err) {
          console.error(err);
          alert("خطأ في الاتصال");
      } finally {
          setUploading(false);
      }
  };

  const getPriorityColor = (p: TaskPriority) => {
      switch(p) {
          case 'high': return 'text-red-600 bg-red-50 border-red-100';
          case 'medium': return 'text-blue-600 bg-blue-50 border-blue-100';
          case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-100';
      }
  };

  const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
  };

  // --- Render Components ---

  const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
      const isOverdue = new Date() > new Date(task.deadline) && task.status !== 'done';
      
      return (
        <div 
            draggable 
            onDragStart={(e) => handleDragStart(e, task.id)}
            onClick={() => setSelectedTask(task)}
            className={`
                ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
                p-4 rounded-xl shadow-sm border hover:shadow-md transition-all cursor-grab mb-3 relative group
                ${task.isLocked ? 'opacity-75' : ''}
            `}
        >
            {task.isLocked && (
                <div className="absolute -top-2 -left-2 bg-red-500 text-white p-1 rounded-full shadow-sm z-10">
                    <Lock className="w-4 h-4" />
                </div>
            )}
            
            <div className="flex justify-between items-start mb-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium border ${getPriorityColor(task.priority)}`}>
                    {task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                </span>
                <button className={`text-gray-400 hover:text-gray-600 ${darkMode ? 'hover:text-gray-200' : ''}`}>
                    <MoreVertical className="w-4 h-4" />
                </button>
            </div>
            
            <h3 className={`font-bold text-sm mb-2 leading-relaxed ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                {task.title}
            </h3>
            
            {task.attachments.length > 0 && (
                 <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                     <Paperclip className="w-3 h-3" />
                     <span>{task.attachments.length} مرفقات</span>
                 </div>
            )}

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${task.assigneeAvatar}`}>
                        {task.assigneeName.charAt(0)}
                    </div>
                    <div className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(task.deadline)}</span>
                    </div>
                </div>
            </div>
            
            {task.status === 'done' && task.rating && (
                <div className="absolute bottom-2 left-2 flex gap-0.5">
                    {[...Array(task.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    ))}
                </div>
            )}
        </div>
      );
  };

  const Column: React.FC<{ title: string, status: TaskStatus, icon: any, color: string }> = ({ title, status, icon: Icon, color }) => {
      const colTasks = tasks.filter(t => t.status === status);
      
      return (
          <div 
            onDrop={(e) => handleDrop(e, status)}
            onDragOver={handleDragOver}
            className={`flex-1 min-w-[280px] flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} rounded-2xl p-4 h-full`}
          >
              <div className={`flex items-center justify-between mb-4 pb-2 border-b-2 ${color}`}>
                  <div className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                      <h2 className={`font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{title}</h2>
                      <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold dark:bg-gray-700 dark:text-gray-300">
                          {colTasks.length}
                      </span>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><Plus className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-1">
                  {colTasks.map(task => <TaskCard key={task.id} task={task} />)}
              </div>
          </div>
      );
  };

  return (
    <div className={`h-screen flex flex-col transition-colors duration-300 ${darkMode ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'} dir-rtl`}>
      
      {/* Header */}
      <header className={`h-16 px-6 flex items-center justify-between border-b ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center gap-4">
              <div className="bg-emerald-600 p-2 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold font-sans tracking-tight">JO task</h1>
              
              {/* Projects Quick Switch */}
              <div className="hidden md:flex items-center gap-2 mr-6">
                  {projects.map(p => (
                      <div key={p.id} className={`px-3 py-1 rounded-full text-xs cursor-pointer border ${p.id === 'p1' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-transparent text-gray-500'}`}>
                          {p.name} ({p.progress}%)
                      </div>
                  ))}
              </div>
          </div>

          <div className="flex items-center gap-3">
              {/* Role Simulator */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <UserIcon className="w-4 h-4 text-gray-500" />
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

              <button onClick={onBack} className="text-sm text-red-500 hover:text-red-600 font-medium px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors">
                  خروج
              </button>
          </div>
      </header>

      {/* Toolbar */}
      <div className={`px-6 py-4 flex flex-wrap items-center justify-between gap-4 ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-3 w-full md:w-auto">
              <div className={`flex items-center px-3 py-2 rounded-xl border w-full md:w-64 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <Search className="w-4 h-4 text-gray-400 ml-2" />
                  <input type="text" placeholder="بحث في المهام..." className="bg-transparent border-none outline-none text-sm w-full" />
              </div>
              {/* Only Manager/Director can create tasks */}
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

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
          <div className="flex h-full gap-6 min-w-max pb-4">
              <Column title="قائمة المهام" status="todo" icon={Layout} color="border-gray-300" />
              <Column title="جاري التنفيذ" status="in_progress" icon={Clock} color="border-blue-400" />
              <Column title="مراجعة / تسليم" status="review" icon={AlertCircle} color="border-purple-400" />
              <Column title="تم الاعتماد" status="done" icon={CheckCircle2} color="border-emerald-400" />
          </div>
      </div>

      {/* --- New Task Modal --- */}
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
                          <input 
                            type="text" 
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} outline-none focus:ring-2 focus:ring-emerald-500/20`}
                            placeholder="مثال: مونتاج فيديو البرومو..."
                          />
                      </div>
                      <div>
                          <div className="flex justify-between items-center mb-1.5">
                              <label className="block text-sm font-bold">الوصف</label>
                              <button 
                                onClick={handleAiGenerateDesc}
                                disabled={!newTaskTitle || isGeneratingAi}
                                className="text-xs flex items-center gap-1 text-purple-600 hover:bg-purple-50 px-2 py-1 rounded"
                              >
                                  {isGeneratingAi ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                                  <span>توليد بالذكاء الاصطناعي</span>
                              </button>
                          </div>
                          <textarea 
                            value={newTaskDesc}
                            onChange={(e) => setNewTaskDesc(e.target.value)}
                            className={`w-full p-3 rounded-xl border h-32 resize-none ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} outline-none focus:ring-2 focus:ring-emerald-500/20`}
                            placeholder="تفاصيل المهمة..."
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-bold mb-1.5">الأولوية</label>
                              <select 
                                value={newTaskPriority}
                                onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                                className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} outline-none`}
                              >
                                  <option value="low">منخفضة</option>
                                  <option value="medium">متوسطة</option>
                                  <option value="high">عالية</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-bold mb-1.5">الموعد النهائي</label>
                              <input 
                                type="date" 
                                value={newTaskDeadline}
                                onChange={(e) => setNewTaskDeadline(e.target.value)}
                                className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} outline-none`}
                              />
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

      {/* --- Task Detail/View Modal --- */}
      {selectedTask && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className={`${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]`}>
                  {/* Modal Header */}
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start">
                      <div>
                          <div className="flex items-center gap-2 mb-2">
                               <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(selectedTask.priority)}`}>
                                    {selectedTask.priority === 'high' ? 'أولوية عالية' : 'أولوية عادية'}
                               </span>
                               {selectedTask.isLocked && <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full flex items-center gap-1"><Lock className="w-3 h-3"/> مغلقة</span>}
                          </div>
                          <h2 className="text-2xl font-bold leading-snug">{selectedTask.title}</h2>
                      </div>
                      <button onClick={() => setSelectedTask(null)}><X className="w-6 h-6 text-gray-400" /></button>
                  </div>

                  {/* Modal Body */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-8">
                      <div className="prose max-w-none dark:prose-invert">
                          <h4 className="text-sm text-gray-500 font-bold mb-2 uppercase">الوصف</h4>
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">{selectedTask.description}</p>
                      </div>

                      {/* Attachments Section */}
                      <div>
                           <h4 className="text-sm text-gray-500 font-bold mb-3 uppercase flex items-center justify-between">
                               <span>المرفقات ({selectedTask.attachments.length})</span>
                               <label className="cursor-pointer text-emerald-600 text-xs flex items-center gap-1 hover:underline">
                                    <Plus className="w-3 h-3" /> إضافة ملف
                                    <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, selectedTask.id)} />
                               </label>
                           </h4>
                           
                           {uploading && <div className="text-xs text-emerald-600 mb-2">جاري رفع الملف...</div>}

                           <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                               {selectedTask.attachments.map(att => (
                                   <a key={att.id} href={att.url} target="_blank" rel="noreferrer" className="group relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                        <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">
                                            فتح الصورة
                                        </div>
                                   </a>
                               ))}
                           </div>
                      </div>
                  </div>
                  
                  {/* Action Footer */}
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 rounded-b-2xl flex justify-between items-center">
                      <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${selectedTask.assigneeAvatar}`}>
                              {selectedTask.assigneeName.charAt(0)}
                          </div>
                          <div className="text-xs">
                              <p className="font-bold">{selectedTask.assigneeName}</p>
                              <p className="text-gray-500">المسؤول</p>
                          </div>
                      </div>
                      
                      {role === 'Employee' && selectedTask.isLocked && (
                           <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-bold hover:bg-yellow-600">
                               طلب تمديد وقت
                           </button>
                      )}
                      
                      {role !== 'Employee' && (
                          <button className="text-red-500 text-sm hover:bg-red-50 px-3 py-2 rounded-lg transition-colors">
                              حذف المهمة
                          </button>
                      )}
                  </div>
               </div>
          </div>
      )}

    </div>
  );
};

export default JoTaskApp;