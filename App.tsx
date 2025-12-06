import React, { useState, useEffect } from 'react';
import { parseCSVData, exportToCSV } from './utils/dataProcessor';
import { TRANSLATIONS, MONTH_NAMES } from './constants';
import { YearData, LogEntry } from './types';
import Dashboard from './components/Dashboard';
import YearGrid from './components/YearGrid';
import DailyEntryForm from './components/DailyEntryForm';
import HelpModal from './components/HelpModal';
import { LayoutDashboard, FileSpreadsheet, Download, Upload, History, Sun, Moon, LogIn, RefreshCw, Lock, UserPlus, LogOut, User, HelpCircle, Trash2, ShieldAlert, Smartphone } from 'lucide-react';
import { supabase, isConfigured } from './supabaseClient';

// Custom Icon for Piragua (Kayak)
const KayakIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M2 16c0-1.1 2-2 10-2s10 .9 10 2-2 2-10 2-10-.9-10-2Z" />
    <path d="M12 14v-5" />
    <circle cx="12" cy="6" r="2" />
    <path d="M4 6l16 12" />
  </svg>
);

function App() {
  // Auth State
  const [userEmail, setUserEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // App State
  const [data, setData] = useState<YearData[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'manage'>('dashboard');
  const [selectedYearIndex, setSelectedYearIndex] = useState(0);
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [activityLog, setActivityLog] = useState<LogEntry[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  const t = TRANSLATIONS[lang];

  // --- INSTALLATION LOGIC ---
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log("Install prompt captured");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      alert("Para instalar en iOS:\n1. Pulsa el botón 'Compartir' (cuadrado con flecha)\n2. Selecciona 'Añadir a pantalla de inicio'");
    } else {
      alert("La instalación automática no está disponible o la app ya está instalada.\n\nBusca la opción 'Instalar aplicación' en el menú de tu navegador.");
    }
  };

  // --- HELPER FOR DEFAULT YEAR ---
  const setDefaultYear = (dataset: YearData[]) => {
    if (!dataset || dataset.length === 0) return;
    const currentYear = new Date().getFullYear();
    const idx = dataset.findIndex(d => d.year === currentYear);
    if (idx !== -1) {
      setSelectedYearIndex(idx);
      return;
    }
    const validIdx = dataset.findIndex(d => d.year < currentYear);
    if (validIdx !== -1) {
      setSelectedYearIndex(validIdx);
    } else {
      setSelectedYearIndex(0);
    }
  };

  // --- AUTH & DATA LOADING ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured()) {
      alert("⚠️ FALTAN LAS CLAVES DE SUPABASE\n\nEdita 'supabaseClient.ts' con tus claves reales.");
      return;
    }
    if (!userEmail || !password) {
      alert("Por favor introduce email y contraseña");
      return;
    }
    setAuthLoading(true);
    try {
      let authResponse;
      if (authMode === 'signup') {
        authResponse = await supabase.auth.signUp({
          email: userEmail,
          password: password,
        });
      } else {
        authResponse = await supabase.auth.signInWithPassword({
          email: userEmail,
          password: password,
        });
      }
      if (authResponse.error) throw authResponse.error;
      const user = authResponse.data.user;
      if (!user) throw new Error("No user returned");

      await loadUserData(user.id, user.email || userEmail);
      setIsLoggedIn(true);
      setIsOfflineMode(false);
      localStorage.setItem('paleoUser', userEmail); 
    } catch (err: any) {
      console.error("Auth error:", err);
      alert(err.message || "Error de autenticación. Revisa tus credenciales.");
    } finally {
      setAuthLoading(false);
    }
  };

  const loadUserData = async (userId: string, email: string) => {
    try {
      const { data: dbData, error } = await supabase
        .from('user_data')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (dbData) {
        if (dbData.years_data) {
          setData(dbData.years_data);
          setDefaultYear(dbData.years_data);
        }
        if (dbData.activity_log) {
             const parsedLog = dbData.activity_log.map((entry: any) => ({
                ...entry,
                date: new Date(entry.date),
                timestamp: new Date(entry.timestamp)
             }));
             setActivityLog(parsedLog);
        }
      } else {
        // BLANK SLATE FOR NEW REGISTERED USERS
        // Instead of loading INITIAL_CSV_DATA, we create a fresh year
        const currentYear = new Date().getFullYear();
        const emptyYearData: YearData = {
          year: currentYear,
          total: 0,
          months: MONTH_NAMES.map(name => ({
            name: name,
            total: 0,
            weeks: Array.from({ length: 5 }, (_, i) => ({ weekNum: i + 1, value: 0 }))
          }))
        };
        const initialData = [emptyYearData];
        const { error: insertError } = await supabase
          .from('user_data')
          .insert([{ 
            id: userId,
            user_email: email, 
            years_data: initialData, 
            activity_log: [] 
          }]);
        if (!insertError) {
          setData(initialData);
          setDefaultYear(initialData);
        } else {
            console.error("Insert error (RLS):", insertError);
            setData(initialData);
            setDefaultYear(initialData);
        }
      }
    } catch (e) {
      console.error("Load Data Error:", e);
      alert("Error cargando datos. Se usará modo local temporalmente.");
    }
  };

  const enterOfflineMode = () => {
    setIsLoggedIn(true);
    setIsOfflineMode(true);
    setUserEmail('Invitado');
    const localData = localStorage.getItem('paleoData');
    const localLog = localStorage.getItem('paleoLog');
    
    if (localData) {
        const parsed = JSON.parse(localData);
        setData(parsed);
        setDefaultYear(parsed);
    } else {
        // BLANK SLATE FOR GUESTS
        const currentYear = new Date().getFullYear();
        const emptyYearData: YearData = {
          year: currentYear,
          total: 0,
          months: MONTH_NAMES.map(name => ({
            name: name,
            total: 0,
            weeks: Array.from({ length: 5 }, (_, i) => ({ weekNum: i + 1, value: 0 }))
          }))
        };
        const initialData = [emptyYearData];
        setData(initialData);
        setDefaultYear(initialData);
    }
    
    if (localLog) {
        try {
            const parsed = JSON.parse(localLog).map((entry: any) => ({
                ...entry,
                date: new Date(entry.date),
                timestamp: new Date(entry.timestamp)
             }));
             setActivityLog(parsed);
        } catch (e) {
            setActivityLog([]);
        }
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
      await supabase
        .from('user_data')
        .update({ years_data: newData, activity_log: newLog, updated_at: new Date() })
        .eq('id', user.id); 
    } catch (err) {
      console.error("Error syncing:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm(t.deleteAccountConfirm)) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('user_data').delete().eq('id', user.id);
        if (error) throw error;
      }
      await supabase.auth.signOut();
      setIsLoggedIn(false);
      setUserEmail('');
      setPassword('');
      setAuthMode('login');
      alert(t.deleteAccountSuccess);
    } catch (err: any) {
      console.error("Delete Error:", err);
      alert("Error: " + err.message);
    }
  };

  const handleClearLocalData = () => {
    if (confirm("¿Estás seguro? Se borrarán todos los datos DE ESTE DISPOSITIVO. Usa esta opción si eres un usuario nuevo y quieres limpiar los datos de prueba.")) {
      localStorage.removeItem('paleoData');
      localStorage.removeItem('paleoLog');
      localStorage.removeItem('paleoUser');
      const currentYear = new Date().getFullYear();
      const emptyYearData: YearData = {
        year: currentYear,
        total: 0,
        months: MONTH_NAMES.map(name => ({
          name: name,
          total: 0,
          weeks: Array.from({ length: 5 }, (_, i) => ({ weekNum: i + 1, value: 0 }))
        }))
      };
      setData([emptyYearData]);
      setActivityLog([]);
      setDefaultYear([emptyYearData]);
      alert("Datos locales borrados.");
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user && isConfigured()) {
        setUserEmail(session.user.email || '');
        loadUserData(session.user.id, session.user.email || '');
        setIsLoggedIn(true);
      }
    });
  }, []);

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
    let weekIdx = 0;
    if (day <= 7) weekIdx = 0;
    else if (day <= 14) weekIdx = 1;
    else if (day <= 21) weekIdx = 2;
    else if (day <= 28) weekIdx = 3;
    else weekIdx = 4;

    let newData = [...data];
    let yearIndex = newData.findIndex(d => d.year === year);

    if (yearIndex === -1) {
      const newYearData: YearData = {
        year: year,
        total: 0,
        months: MONTH_NAMES.map(name => ({
          name: name,
          total: 0,
          weeks: Array.from({ length: 5 }, (_, i) => ({ weekNum: i + 1, value: 0 }))
        }))
      };
      newData = [newYearData, ...newData].sort((a, b) => b.year - a.year);
      yearIndex = newData.findIndex(d => d.year === year);
    }

    const currentVal = newData[yearIndex].months[monthIdx].weeks[weekIdx].value || 0;
    const newVal = parseFloat((currentVal + value).toFixed(2));

    const newLogEntry: LogEntry = {
      id: Date.now().toString(),
      date: date,
      value: value,
      note: note,
      timestamp: new Date()
    };
    const newActivityLog = [newLogEntry, ...activityLog];
    setActivityLog(newActivityLog);

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
    syncData(newData, newActivityLog);

    if (yearIndex !== selectedYearIndex) setSelectedYearIndex(yearIndex);

    return {
      success: true,
      message: `${t.successAdd}: ${value}km -> ${t.months[monthIdx]} ${year} (${t.week} ${weekIdx + 1})`
    };
  };

  const handleExport = () => {
    const csvContent = exportToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'row_master_data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    document.getElementById('csvInput')?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        try {
          const parsed = parseCSVData(content);
          if (parsed.length > 0) {
            setData(parsed);
            setDefaultYear(parsed);
            syncData(parsed, activityLog);
            alert(t.importSuccess);
          } else {
            alert(t.importError);
          }
        } catch (error) {
          console.error("Import error:", error);
          alert(t.importError);
        }
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
      setIsLoggedIn(false);
      setUserEmail('');
      setPassword('');
      setAuthMode('login');
  };

  if (!isLoggedIn) {
      return (
          <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 max-w-md w-full text-center">
                  <div className="bg-blue-600 p-4 rounded-full text-white inline-block mb-4">
                      <KayakIcon size={40} />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800 mb-2">Master Paleo Analytics</h1>
                  <p className="text-slate-500 mb-6">Gestiona tus entrenamientos</p>
                  
                  <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
                      <button 
                        onClick={() => setAuthMode('login')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${authMode === 'login' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                      >
                        Entrar
                      </button>
                      <button 
                        onClick={() => setAuthMode('signup')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${authMode === 'signup' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                      >
                        Registrarse
                      </button>
                  </div>

                  <form onSubmit={handleAuth} className="space-y-4">
                      <div className="text-left">
                        <label className="text-xs font-bold text-slate-400 uppercase">Email</label>
                        <input 
                          type="email" 
                          required
                          className="w-full mt-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                        />
                      </div>
                      <div className="text-left">
                        <label className="text-xs font-bold text-slate-400 uppercase">Contraseña</label>
                        <input 
                          type="password" 
                          required
                          className="w-full mt-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                      
                      <button 
                        type="submit" 
                        disabled={authLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                          {authLoading ? 'Procesando...' : (
                              <>
                                {authMode === 'login' ? <LogIn size={20} /> : <UserPlus size={20} />}
                                {authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                              </>
                          )}
                      </button>
                  </form>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-slate-500">O bien</span>
                    </div>
                  </div>

                  <button 
                    onClick={enterOfflineMode}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <User size={20} className="text-slate-500" />
                    {t.guestMode}
                  </button>
                  <p className="text-[10px] text-slate-400 mt-2">{t.guestModeDesc}</p>

                  <p className="text-xs text-slate-400 mt-6 text-center">
                      {!isConfigured() 
                        ? "⚠️ Nube no configurada. Edita supabaseClient.ts para activarla." 
                        : authMode === 'signup' 
                            ? "Al registrarte aceptas guardar tus datos en la nube."
                            : "Tus datos están seguros y encriptados."}
                  </p>
              </div>
          </div>
      )
  }

  // --- MAIN APP ---
  const selectedYearData = data[selectedYearIndex];

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 pb-20 transition-colors duration-300">
        
        {/* Help Modal */}
        <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} lang={lang} />
        
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg text-white">
                  <KayakIcon size={24} />
                </div>
                <div className="leading-tight">
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Master Paleo</h1>
                    <div className="flex items-center gap-1 text-xs font-medium">
                        {isOfflineMode ? (
                           <span className="text-orange-500 flex items-center gap-1"><User size={10} /> Invitado</span>
                        ) : (
                           <div className="flex items-center gap-2">
                               <span className="text-green-500 flex items-center gap-1"><Lock size={10} /> {userEmail}</span>
                               {isSyncing && (
                                   <span className="flex items-center gap-1 text-blue-500 animate-pulse">
                                       <RefreshCw size={10} className="animate-spin" />
                                   </span>
                               )}
                           </div>
                        )}
                    </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="hidden md:flex gap-2 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      activeTab === 'dashboard' 
                        ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' 
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <LayoutDashboard size={18} />
                    {t.dashboard}
                  </button>
                  <button
                    onClick={() => setActiveTab('manage')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      activeTab === 'manage' 
                        ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' 
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <FileSpreadsheet size={18} />
                    {t.dataEntry}
                  </button>
                </div>

                <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                  <button onClick={() => setLang('es')} className={`px-3 py-1 rounded text-xs font-bold transition-all ${lang === 'es' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>ES</button>
                  <button onClick={() => setLang('en')} className={`px-3 py-1 rounded text-xs font-bold transition-all ${lang === 'en' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>EN</button>
                </div>

                 <button
                  onClick={handleInstallClick}
                  className="p-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
                  title="Instalar App"
                >
                  <Smartphone size={20} />
                </button>

                 <button
                  onClick={() => setShowHelp(true)}
                  className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  title={t.help}
                >
                  <HelpCircle size={20} />
                </button>

                 <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <div className="hidden md:flex gap-2">
                   <input type="file" id="csvInput" accept=".csv" className="hidden" onChange={handleFileChange} />
                    <button onClick={handleImportClick} className="p-2 text-slate-600 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 transition-colors" title={t.importCSV}>
                      <Upload size={18} />
                    </button>
                    <button onClick={handleExport} className="p-2 text-slate-600 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 transition-colors" title={t.exportCSV}>
                      <Download size={18} />
                    </button>
                     <button onClick={handleLogout} className="p-2 text-red-500 dark:text-red-400 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 transition-colors" title="Cerrar Sesión">
                      <LogOut size={18} />
                    </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-2 flex justify-around z-50">
           <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center p-2 text-xs font-medium ${activeTab === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
              <LayoutDashboard size={20} className="mb-1" />
              {t.dashboard}
            </button>
            <button onClick={() => setActiveTab('manage')} className={`flex flex-col items-center p-2 text-xs font-medium ${activeTab === 'manage' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
              <FileSpreadsheet size={20} className="mb-1" />
              {t.dataEntry}
            </button>
             <button onClick={handleImportClick} className="flex flex-col items-center p-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Upload size={20} className="mb-1" />
              CSV
            </button>
            <button onClick={handleExport} className="flex flex-col items-center p-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Download size={20} className="mb-1" />
              Exportar
            </button>
             <button onClick={handleLogout} className="flex flex-col items-center p-2 text-xs font-medium text-red-500 dark:text-red-400">
              <LogOut size={20} className="mb-1" />
              Salir
            </button>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {data.length === 0 ? (
             <div className="flex items-center justify-center h-64">
               <div className="text-slate-500 dark:text-slate-400 animate-pulse">{t.loading}</div>
             </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard data={data} lang={lang} darkMode={darkMode} />
              )}

              {activeTab === 'manage' && selectedYearData && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">{t.selectYear}:</label>
                      <select
                        value={selectedYearIndex}
                        onChange={(e) => setSelectedYearIndex(Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none font-bold"
                      >
                        {data.map((d, idx) => (
                          <option key={d.year} value={idx}>{d.year}</option>
                        ))}
                      </select>
                    </div>

                    <DailyEntryForm 
                      onAdd={handleDailyAdd}
                      availableYears={data.map(d => d.year)}
                      lang={lang}
                    />

                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">
                        <History size={18} className="text-slate-400" />
                        <h3 className="font-bold text-slate-700 dark:text-slate-200">{t.recentActivity}</h3>
                      </div>
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                        {activityLog.length === 0 ? (
                          <p className="text-sm text-slate-400 italic text-center py-4">{t.noActivity}</p>
                        ) : (
                          activityLog.map((log) => (
                            <div key={log.id} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    {log.date instanceof Date ? log.date.toLocaleDateString() : new Date(log.date).toLocaleDateString()}
                                  </p>
                                  <p className="font-bold text-slate-800 dark:text-slate-200">{log.value} km</p>
                                </div>
                                <span className="text-[10px] text-slate-400">
                                  {log.timestamp instanceof Date ? log.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                </span>
                              </div>
                              {log.note && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic border-l-2 border-slate-300 dark:border-slate-600 pl-2">
                                  {log.note}
                                </p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {!isOfflineMode && isLoggedIn && (
                       <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30">
                          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-red-100 dark:border-red-900/30">
                             <ShieldAlert size={18} className="text-red-500" />
                             <h3 className="font-bold text-red-700 dark:text-red-400">{t.accountSettings}</h3>
                          </div>
                          <button 
                            onClick={handleDeleteAccount}
                            className="w-full bg-white dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold py-2 rounded-lg border border-red-200 dark:border-red-800 transition-colors flex items-center justify-center gap-2 text-sm"
                          >
                            <Trash2 size={16} />
                            {t.deleteAccount}
                          </button>
                       </div>
                    )}
                    
                    {isOfflineMode && (
                        <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl shadow-sm border border-orange-100 dark:border-orange-900/30">
                           <div className="flex items-center gap-2 mb-3 pb-2 border-b border-orange-100 dark:border-orange-900/30">
                              <ShieldAlert size={18} className="text-orange-500" />
                              <h3 className="font-bold text-orange-700 dark:text-orange-400">Zona de Invitado</h3>
                           </div>
                           <button 
                             onClick={handleClearLocalData}
                             className="w-full bg-white dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 text-orange-600 dark:text-orange-400 font-bold py-2 rounded-lg border border-orange-200 dark:border-orange-800 transition-colors flex items-center justify-center gap-2 text-sm"
                           >
                             <Trash2 size={16} />
                             Borrar Datos Locales
                           </button>
                        </div>
                    )}
                  </div>

                  <div className="lg:col-span-2">
                    <YearGrid 
                      data={selectedYearData} 
                      onUpdate={handleDataUpdate}
                      lang={lang}
                    />
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