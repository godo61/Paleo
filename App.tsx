import React, { useState, useEffect } from 'react';
import { parseCSVData, exportToCSV } from './utils/dataProcessor';
import { TRANSLATIONS, MONTH_NAMES } from './constants';
import { YearData, LogEntry } from './types';
import Dashboard from './components/Dashboard';
import YearGrid from './components/YearGrid';
import DailyEntryForm from './components/DailyEntryForm';
import HelpModal from './components/HelpModal';
import HistoryModal from './components/HistoryModal';
// Añadida la 'Search' a los iconos importados
import { LayoutDashboard, FileSpreadsheet, Download, Upload, History, Sun, Moon, LogIn, Lock, User, Trash2, Smartphone, ArrowRight, Share2, Calendar, HelpCircle, LogOut, Search } from 'lucide-react';

// --- IMPORTACIÓN CORRECTA (RAÍZ) ---
import { supabase, isConfigured } from './supabaseClient';

// --- COMPONENTES AUXILIARES ---

const KayakIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 16c0-1.1 2-2 10-2s10 .9 10 2-2 2-10 2-10-.9-10-2Z" />
    <path d="M12 14v-5" />
    <circle cx="12" cy="6" r="2" />
    <path d="M4 6l16 12" />
  </svg>
);

// GlassCard
const GlassCard = ({ children, className = "", noHover = false }: { children: React.ReactNode, className?: string, noHover?: boolean }) => (
  <div className={`group relative bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-xl border border-slate-200 dark:border-white/10 shadow-xl transition-all duration-300 overflow-hidden ${className} ${!noHover ? 'hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/5 dark:hover:shadow-blue-900/10' : ''}`}>
    {!noHover && (
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    )}
    <div className="relative z-10">
      {children}
    </div>
  </div>
);

// --- APP PRINCIPAL ---

function App() {
  const [userEmail, setUserEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const [data, setData] = useState<YearData[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'manage'>('dashboard');
  const [selectedYearIndex, setSelectedYearIndex] = useState(0);
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [activityLog, setActivityLog] = useState<LogEntry[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
   
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) { setDarkMode(true); }
    
    try {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session && session.user && isConfigured()) {
            setUserEmail(session.user.email || '');
            loadUserData(session.user.id, session.user.email || '');
            setIsLoggedIn(true);
          }
        });
    } catch (err) { console.error("Error sesión:", err); }

    return () => { window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt); };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    } else if (isIOS) {
      alert("iOS: Botón Compartir > Añadir a pantalla de inicio");
    } else {
      alert("Busca 'Instalar aplicación' en el menú de tu navegador.");
    }
  };

  const setDefaultYear = (dataset: YearData[]) => {
    if (!dataset || dataset.length === 0) return;
    const currentYear = new Date().getFullYear();
    const idx = dataset.findIndex(d => d.year === currentYear);
    if (idx !== -1) setSelectedYearIndex(idx);
    else {
      const validIdx = dataset.findIndex(d => d.year < currentYear);
      setSelectedYearIndex(validIdx !== -1 ? validIdx : 0);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured()) { alert("⚠️ Falta configurar Supabase"); return; }
    if (!userEmail || !password) { alert("Introduce email y contraseña"); return; }
    setAuthLoading(true);
    try {
      let authResponse;
      if (authMode === 'signup') authResponse = await supabase.auth.signUp({ email: userEmail, password: password });
      else authResponse = await supabase.auth.signInWithPassword({ email: userEmail, password: password });
      
      if (authResponse.error) throw authResponse.error;
      const user = authResponse.data.user;
      if (!user) throw new Error("No user");

      await loadUserData(user.id, user.email || userEmail);
      setIsLoggedIn(true); setIsOfflineMode(false);
      localStorage.setItem('paleoUser', userEmail); 
    } catch (err: any) {
      console.error("Auth error:", err);
      alert(err.message || "Error de autenticación.");
    } finally { setAuthLoading(false); }
  };

  const loadUserData = async (userId: string, email: string) => {
    try {
      const { data: dbData, error } = await supabase.from('user_data').select('*').maybeSingle();
      if (error) throw error;

      if (dbData) {
        if (dbData.years_data) { setData(dbData.years_data); setDefaultYear(dbData.years_data); }
        if (dbData.activity_log) {
           const parsedLog = dbData.activity_log.map((entry: any) => ({ ...entry, date: new Date(entry.date), timestamp: new Date(entry.timestamp) }));
           setActivityLog(parsedLog);
        }
      } else {
        const currentYear = new Date().getFullYear();
        const emptyYearData: YearData = { year: currentYear, total: 0, months: MONTH_NAMES.map(name => ({ name, total: 0, weeks: Array.from({ length: 5 }, (_, i) => ({ weekNum: i + 1, value: 0 })) })) };
        const initialData = [emptyYearData];
        const { error: insertError } = await supabase.from('user_data').insert([{ id: userId, user_email: email, years_data: initialData, activity_log: [] }]);
        if (!insertError) { setData(initialData); setDefaultYear(initialData); } 
        else { setData(initialData); setDefaultYear(initialData); }
      }
    } catch (e) {
      console.error("Error loading:", e);
      alert("Error cargando datos. Modo local.");
    }
  };

  const enterOfflineMode = () => {
    setIsLoggedIn(true); setIsOfflineMode(true); setUserEmail('Invitado');
    const localData = localStorage.getItem('paleoData');
    const localLog = localStorage.getItem('paleoLog');
    
    if (localData) {
        const parsed = JSON.parse(localData); setData(parsed); setDefaultYear(parsed);
    } else {
        const currentYear = new Date().getFullYear();
        const emptyYearData: YearData = { year: currentYear, total: 0, months: MONTH_NAMES.map(name => ({ name, total: 0, weeks: Array.from({ length: 5 }, (_, i) => ({ weekNum: i + 1, value: 0 })) })) };
        setData([emptyYearData]); setDefaultYear([emptyYearData]);
    }
    if (localLog) {
        try {
            const parsed = JSON.parse(localLog).map((entry: any) => ({ ...entry, date: new Date(entry.date), timestamp: new Date(entry.timestamp) }));
            setActivityLog(parsed);
        } catch (e) { setActivityLog([]); }
    }
  };

  const syncData = async (newData: YearData[], newLog: LogEntry[]) => {
    localStorage.setItem('paleoData', JSON.stringify(newData));
    localStorage.setItem('paleoLog', JSON.stringify(newLog));
    if (isOfflineMode || !isLoggedIn) return;
    setIsSyncing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('user_data').update({ years_data: newData, activity_log: newLog, updated_at: new Date() }).eq('id', user.id); 
    } catch (err) { console.error("Sync error:", err); } 
    finally { setIsSyncing(false); }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm(t.deleteAccountConfirm)) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await supabase.from('user_data').delete().eq('id', user.id);
      await supabase.auth.signOut();
      setIsLoggedIn(false); setUserEmail(''); setPassword(''); setAuthMode('login');
    } catch (err: any) { alert("Error: " + err.message); }
  };

  const handleClearLocalData = () => {
    if (confirm("¿Borrar datos locales?")) {
      localStorage.removeItem('paleoData'); localStorage.removeItem('paleoLog'); localStorage.removeItem('paleoUser');
      const currentYear = new Date().getFullYear();
      const emptyYearData: YearData = { year: currentYear, total: 0, months: MONTH_NAMES.map(name => ({ name, total: 0, weeks: Array.from({ length: 5 }, (_, i) => ({ weekNum: i + 1, value: 0 })) })) };
      setData([emptyYearData]); setActivityLog([]); setDefaultYear([emptyYearData]);
    }
  };

  const handleDataUpdate = (year: number, monthIdx: number, weekIdx: number, newVal: number) => {
    const newData = [...data];
    const yearIndex = newData.findIndex(d => d.year === year);
    if (yearIndex === -1) return;
    const yearRecord = { ...newData[yearIndex] };
    const months = [...yearRecord.months];
    const monthRecord = { ...months[monthIdx] };
    const weeks = [...monthRecord.weeks];
    weeks[weekIdx] = { ...weeks[weekIdx], value: newVal };
    const newMonthTotal = weeks.reduce((sum, w) => sum + w.value, 0);
    monthRecord.weeks = weeks;
    monthRecord.total = parseFloat(newMonthTotal.toFixed(2));
    months[monthIdx] = monthRecord;
    yearRecord.months = months;
    yearRecord.total = parseFloat(months.reduce((sum, m) => sum + m.total, 0).toFixed(2));
    newData[yearIndex] = yearRecord;
    setData(newData);
    syncData(newData, activityLog);
  };

  const handleDailyAdd = (date: Date, value: number, note: string): { success: boolean; message: string } => {
    const year = date.getFullYear();
    const monthIdx = date.getMonth(); 
    const day = date.getDate();
    let weekIdx = day <= 7 ? 0 : day <= 14 ? 1 : day <= 21 ? 2 : day <= 28 ? 3 : 4;

    let newData = [...data];
    let yearIndex = newData.findIndex(d => d.year === year);

    if (yearIndex === -1) {
      const newYearData: YearData = {
        year: year, total: 0,
        months: MONTH_NAMES.map(name => ({ name, total: 0, weeks: Array.from({ length: 5 }, (_, i) => ({ weekNum: i + 1, value: 0 })) }))
      };
      newData = [newYearData, ...newData].sort((a, b) => b.year - a.year);
      yearIndex = newData.findIndex(d => d.year === year);
    }

    const currentVal = newData[yearIndex].months[monthIdx].weeks[weekIdx].value || 0;
    const newVal = parseFloat((currentVal + value).toFixed(2));

    const newLogEntry: LogEntry = { id: Date.now().toString(), date, value, note, timestamp: new Date() };
    const newActivityLog = [newLogEntry, ...activityLog];
    setActivityLog(newActivityLog);

    const yearRecord = { ...newData[yearIndex] };
    const months = [...yearRecord.months];
    const monthRecord = { ...months[monthIdx] };
    const weeks = [...monthRecord.weeks];
    weeks[weekIdx] = { ...weeks[weekIdx], value: newVal };
    monthRecord.weeks = weeks;
    monthRecord.total = parseFloat(weeks.reduce((sum, w) => sum + w.value, 0).toFixed(2));
    months[monthIdx] = monthRecord;
    yearRecord.months = months;
    yearRecord.total = parseFloat(months.reduce((sum, m) => sum + m.total, 0).toFixed(2));
    newData[yearIndex] = yearRecord;

    setData(newData);
    syncData(newData, newActivityLog);
    if (yearIndex !== selectedYearIndex) setSelectedYearIndex(yearIndex);

    return { success: true, message: `${t.successAdd}: ${value}km -> ${t.months[monthIdx]} ${year}` };
  };

  const handleExport = () => { 
    const csvContent = exportToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'master_paleo_data.csv';
    link.click();
  };
  const handleShareExport = async () => { 
    const csvContent = exportToCSV(data);
    const file = new File([csvContent], "master_paleo_data.csv", { type: "text/csv" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ title: 'Master Paleo Data', files: [file] }); } catch (err) {}
    } else { handleExport(); alert(t.shareFallback); }
  };
  const handleImportClick = () => document.getElementById('csvInput')?.click();
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
          const parsed = parseCSVData(content);
          if (parsed.length > 0) { setData(parsed); setDefaultYear(parsed); syncData(parsed, activityLog); alert(t.importSuccess); }
          else alert(t.importError);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };
  const handleLogout = async () => {
      await supabase.auth.signOut(); setIsLoggedIn(false); setUserEmail(''); setPassword(''); setAuthMode('login');
  };

  const selectedYearData = data[selectedYearIndex];

  // LOGIN SCREEN
  if (!isLoggedIn) {
      return (
        <div className={darkMode ? 'dark' : ''}>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 transition-colors duration-300">
              <div className="bg-white/90 dark:bg-slate-800/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 max-w-md w-full text-center relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-purple-500/5 pointer-events-none" />
                  
                  <div className="bg-gradient-to-br from-blue-600 to-blue-500 p-4 rounded-full text-white inline-block mb-4 shadow-lg shadow-blue-500/30 relative z-10">
                      <KayakIcon size={40} />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 relative z-10">Master Paleo Analytics</h1>
                  
                  <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg mb-6 relative z-10">
                      <button onClick={() => setAuthMode('login')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${authMode === 'login' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>Entrar</button>
                      <button onClick={() => setAuthMode('signup')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${authMode === 'signup' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>Registrarse</button>
                  </div>

                  <form onSubmit={handleAuth} className="space-y-4 relative z-10">
                      <div className="text-left">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Email</label>
                        <input 
                          type="email" required
                          className="w-full mt-1 px-4 py-3 bg-white border border-slate-300 dark:bg-slate-900/50 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all shadow-sm"
                          value={userEmail} onChange={(e) => setUserEmail(e.target.value)}
                        />
                      </div>
                      <div className="text-left">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Contraseña</label>
                        <input 
                          type="password" required
                          className="w-full mt-1 px-4 py-3 bg-white border border-slate-300 dark:bg-slate-900/50 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all shadow-sm"
                          value={password} onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                      <button type="submit" disabled={authLoading} className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transform hover:-translate-y-0.5">
                          {authLoading ? 'Procesando...' : (authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta')}
                      </button>
                  </form>
                  <button onClick={enterOfflineMode} className="mt-6 w-full bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 relative z-10">
                    <User size={20} /> {t.guestMode}
                  </button>
              </div>
          </div>
        </div>
      )
  }

  // APP LOGUEADA
  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 pb-20 transition-colors duration-300">
        <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} lang={lang} />
        <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} logs={activityLog} lang={lang} />
        
        {/* Header */}
        <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              
              {/* Logo y Usuario */}
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-600 to-blue-500 p-2 rounded-lg text-white shadow-lg shadow-blue-500/20">
                  <KayakIcon size={24} />
                </div>
                <div className="leading-tight">
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Master Paleo</h1>
                    <div className="flex items-center gap-1 text-xs font-medium">
                        {isOfflineMode ? <span className="text-orange-500 flex items-center gap-1"><User size={10} /> Invitado</span> : <span className="text-green-500 flex items-center gap-1"><Lock size={10} /> {userEmail}</span>}
                    </div>
                </div>
              </div>

              {/* Barra de Herramientas Completa */}
              <div className="flex items-center gap-4">
                
                {/* Tabs Tablero / Entrada */}
                <div className="hidden md:flex gap-2 bg-slate-100/50 dark:bg-slate-700/50 p-1 rounded-lg backdrop-blur-sm">
                  <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}><LayoutDashboard size={18} /> {t.dashboard}</button>
                  <button onClick={() => setActiveTab('manage')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'manage' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}><FileSpreadsheet size={18} /> {t.dataEntry}</button>
                </div>

                {/* Idioma */}
                <div className="flex gap-1 bg-slate-100/50 dark:bg-slate-700/50 p-1 rounded-lg backdrop-blur-sm">
                  <button onClick={() => setLang('es')} className={`px-3 py-1 rounded text-xs font-bold transition-all ${lang === 'es' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>ES</button>
                  <button onClick={() => setLang('en')} className={`px-3 py-1 rounded text-xs font-bold transition-all ${lang === 'en' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>EN</button>
                </div>

                {/* Botones de Acción Extra */}
                <button onClick={handleInstallClick} className="p-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 dark:border-blue-800" title="Instalar App"><Smartphone size={20} /></button>
                <button onClick={() => setShowHistory(true)} className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" title={t.activityHistory}><History size={20} /></button>
                <button onClick={() => setShowHelp(true)} className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" title={t.help}><HelpCircle size={20} /></button>
                <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
                
                {/* Import/Export/Logout */}
                <div className="hidden md:flex gap-2">
                   <input type="file" id="csvInput" accept=".csv" className="hidden" onChange={handleFileChange} />
                    <button onClick={handleImportClick} className="p-2 text-slate-600 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 transition-colors" title={t.importCSV}><Upload size={18} /></button>
                    <button onClick={handleExport} className="p-2 text-slate-600 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 transition-colors" title={t.exportCSV}><Download size={18} /></button>
                    <button onClick={handleShareExport} className="p-2 text-slate-600 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 transition-colors" title={t.shareCSV}><Share2 size={18} /></button>
                     <button onClick={handleLogout} className="p-2 text-red-500 dark:text-red-400 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 transition-colors" title="Cerrar Sesión"><LogOut size={18} /></button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Navegación Móvil */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 p-2 flex justify-around z-50">
           <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center p-2 text-xs font-medium ${activeTab === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}><LayoutDashboard size={20} className="mb-1" />{t.dashboard}</button>
            <button onClick={() => setActiveTab('manage')} className={`flex flex-col items-center p-2 text-xs font-medium ${activeTab === 'manage' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}><FileSpreadsheet size={20} className="mb-1" />{t.dataEntry}</button>
             <button onClick={handleLogout} className="flex flex-col items-center p-2 text-xs font-medium text-red-500 dark:text-red-400"><LogOut size={20} className="mb-1" />Salir</button>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {data.length === 0 ? (
             <div className="flex items-center justify-center h-64"><div className="text-slate-500 dark:text-slate-400 animate-pulse">{t.loading}</div></div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard data={data} lang={lang} darkMode={darkMode} />
              )}

              {activeTab === 'manage' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                  <div className="lg:col-span-1 space-y-6">
                    
                    {/* Selector Año (GlassCard) */}
                    <GlassCard>
                      <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">{t.selectYear}:</label>
                      <div className="relative">
                        <select
                          value={selectedYearIndex}
                          onChange={(e) => setSelectedYearIndex(Number(e.target.value))}
                          className="w-full bg-slate-50/50 dark:bg-slate-700/50 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white text-lg rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3 outline-none font-bold transition-all cursor-pointer appearance-none hover:bg-slate-100 dark:hover:bg-slate-600/50"
                        >
                          {data.map((d, idx) => (
                            <option key={d.year} value={idx} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">{d.year}</option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><Calendar size={18} /></div>
                      </div>
                    </GlassCard>

                    <DailyEntryForm onAdd={handleDailyAdd} availableYears={data.map(d => d.year)} lang={lang} />

                    {/* Actividad Reciente (GlassCard) */}
                    <GlassCard>
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200 dark:border-white/10">
                        <History size={18} className="text-blue-500" /><h3 className="font-bold text-slate-700 dark:text-slate-200">{t.recentActivity}</h3>
                      </div>
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar mb-4">
                        {activityLog.length === 0 ? (
                          <p className="text-sm text-slate-400 italic text-center py-4">{t.noActivity}</p>
                        ) : (
                          activityLog.slice(0, 10).map((log) => (
                            <div key={log.id} className="bg-slate-50/80 dark:bg-slate-700/30 p-3 rounded-lg border border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-slate-600/50 transition-colors">
                              <div className="flex justify-between items-start">
                                <div><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{new Date(log.date).toLocaleDateString()}</p><p className="font-bold text-slate-800 dark:text-slate-200">{log.value} km</p></div>
                                <span className="text-[10px] text-slate-400">{log.timestamp instanceof Date ? log.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                              </div>
                              {log.note && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic border-l-2 border-blue-400 pl-2">{log.note}</p>}
                            </div>
                          ))
                        )}
                      </div>
                      {/* BOTÓN ACTUALIZADO A "BUSCAR ACTIVIDAD" */}
                      <button onClick={() => setShowHistory(true)} className="w-full py-2 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                        <Search size={14} />
                        {lang === 'es' ? 'Buscar Actividad' : 'Search Activity'}
                      </button>
                    </GlassCard>

                    {!isOfflineMode && isLoggedIn && (
                       <GlassCard noHover className="!border-red-200 dark:!border-red-900/30 !bg-red-50/50 dark:!bg-red-900/10">
                          <button onClick={handleDeleteAccount} className="w-full bg-white/50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold py-2 rounded-lg border border-red-200 dark:border-red-800 transition-colors flex items-center justify-center gap-2 text-sm">
                            <Trash2 size={16} />{t.deleteAccount}
                          </button>
                       </GlassCard>
                    )}
                    {isOfflineMode && (
                        <GlassCard noHover className="!border-orange-200 dark:!border-orange-900/30 !bg-orange-50/50 dark:!bg-orange-900/10">
                           <button onClick={handleClearLocalData} className="w-full bg-white/50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 text-orange-600 dark:text-orange-400 font-bold py-2 rounded-lg border border-orange-200 dark:border-orange-800 transition-colors flex items-center justify-center gap-2 text-sm">
                             <Trash2 size={16} />Borrar Datos Locales
                           </button>
                        </GlassCard>
                    )}
                  </div>

                  {/* Grid de Datos (Tabla) */}
                  <div className="lg:col-span-2">
                    {selectedYearData ? (
                      <YearGrid data={selectedYearData} onUpdate={handleDataUpdate} lang={lang} />
                    ) : (
                      <div className="bg-white/50 dark:bg-slate-800/50 p-10 rounded-xl text-center text-slate-500">
                        No hay datos para el año seleccionado.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;