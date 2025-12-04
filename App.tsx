import React, { useState, useEffect } from 'react';
import { parseCSVData, exportToCSV } from './utils/dataProcessor';
import { INITIAL_CSV_DATA, TRANSLATIONS } from './constants';
import { YearData, LogEntry } from './types';
import Dashboard from './components/Dashboard';
import YearGrid from './components/YearGrid';
import DailyEntryForm from './components/DailyEntryForm';
import { LayoutDashboard, FileSpreadsheet, Download, Upload, StickyNote, History, Sun, Moon } from 'lucide-react';

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
    {/* Hull */}
    <path d="M2 16c0-1.1 2-2 10-2s10 .9 10 2-2 2-10 2-10-.9-10-2Z" />
    {/* Person */}
    <path d="M12 14v-5" />
    <circle cx="12" cy="6" r="2" />
    {/* Paddle */}
    <path d="M4 6l16 12" />
  </svg>
);

function App() {
  const [data, setData] = useState<YearData[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'manage'>('dashboard');
  const [selectedYearIndex, setSelectedYearIndex] = useState(0);
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [activityLog, setActivityLog] = useState<LogEntry[]>([]);
  const [darkMode, setDarkMode] = useState(false);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    // Load data from LocalStorage or fall back to initial CSV
    const savedData = localStorage.getItem('paleoData');
    const savedLog = localStorage.getItem('paleoLog');

    if (savedData) {
      try {
        const parsedSavedData = JSON.parse(savedData);
        if (Array.isArray(parsedSavedData) && parsedSavedData.length > 0) {
          setData(parsedSavedData);
        } else {
           setData(parseCSVData(INITIAL_CSV_DATA));
        }
      } catch (e) {
        console.error("Failed to parse saved data, reverting to default.", e);
        setData(parseCSVData(INITIAL_CSV_DATA));
      }
    } else {
      setData(parseCSVData(INITIAL_CSV_DATA));
    }

    if (savedLog) {
      try {
        const parsedLog = JSON.parse(savedLog).map((entry: any) => ({
          ...entry,
          date: new Date(entry.date),
          timestamp: new Date(entry.timestamp)
        }));
        setActivityLog(parsedLog);
      } catch (e) {
        console.error("Failed to parse activity log.", e);
      }
    }
  }, []);

  // Save to LocalStorage whenever data changes
  useEffect(() => {
    if (data.length > 0) {
      localStorage.setItem('paleoData', JSON.stringify(data));
    }
  }, [data]);

  // Save activity log to LocalStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('paleoLog', JSON.stringify(activityLog));
  }, [activityLog]);


  const handleDataUpdate = (year: number, monthIdx: number, weekIdx: number, newVal: number) => {
    setData(prevData => {
      const newData = [...prevData];
      const yearIndex = newData.findIndex(d => d.year === year);
      if (yearIndex === -1) return prevData;

      const yearRecord = { ...newData[yearIndex] };
      const months = [...yearRecord.months];
      const monthRecord = { ...months[monthIdx] };
      const weeks = [...monthRecord.weeks];
      
      // Update the specific week
      weeks[weekIdx] = { ...weeks[weekIdx], value: newVal };
      
      // Recalculate month total
      const newMonthTotal = weeks.reduce((sum, w) => sum + w.value, 0);
      
      // Update structures
      monthRecord.weeks = weeks;
      monthRecord.total = parseFloat(newMonthTotal.toFixed(2));
      months[monthIdx] = monthRecord;
      yearRecord.months = months;
      
      // Recalculate year total
      yearRecord.total = parseFloat(months.reduce((sum, m) => sum + m.total, 0).toFixed(2));
      
      newData[yearIndex] = yearRecord;
      return newData;
    });
  };

  const handleDailyAdd = (date: Date, value: number, note: string): { success: boolean; message: string } => {
    const year = date.getFullYear();
    const monthIdx = date.getMonth(); // 0-11
    const day = date.getDate();

    // Determine Week Index (0-4) based on Day of Month
    let weekIdx = 0;
    if (day <= 7) weekIdx = 0;
    else if (day <= 14) weekIdx = 1;
    else if (day <= 21) weekIdx = 2;
    else if (day <= 28) weekIdx = 3;
    else weekIdx = 4;

    // Find if year exists
    const yearIndex = data.findIndex(d => d.year === year);
    if (yearIndex === -1) {
      return { 
        success: false, 
        message: `${t.yearNotFound} ${year}` 
      };
    }

    // Get current value
    const currentVal = data[yearIndex].months[monthIdx].weeks[weekIdx].value || 0;
    const newVal = parseFloat((currentVal + value).toFixed(2));

    // Update state
    handleDataUpdate(year, monthIdx, weekIdx, newVal);

    // Update activity log
    const newLog: LogEntry = {
      id: Date.now().toString(),
      date: date,
      value: value,
      note: note,
      timestamp: new Date()
    };
    setActivityLog(prev => [newLog, ...prev]);

    // If the updated year is different from the currently selected one in the view, switch to it
    if (yearIndex !== selectedYearIndex) {
        setSelectedYearIndex(yearIndex);
    }

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
    // Reset the input value so the same file can be selected again if needed
    event.target.value = '';
  };

  const selectedYearData = data[selectedYearIndex];

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 pb-20 transition-colors duration-300">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg text-white">
                  <KayakIcon size={24} />
                </div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Master Paleo <span className="text-blue-600 dark:text-blue-400">Analytics</span></h1>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Desktop Navigation */}
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

                {/* Language Selector */}
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                  <button 
                    onClick={() => setLang('es')}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${lang === 'es' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    ES
                  </button>
                  <button 
                    onClick={() => setLang('en')}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${lang === 'en' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    EN
                  </button>
                </div>

                 {/* Dark Mode Toggle */}
                 <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  aria-label="Toggle Dark Mode"
                >
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <div className="hidden md:flex gap-2">
                   <input 
                      type="file" 
                      id="csvInput" 
                      accept=".csv" 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                    <button
                      onClick={handleImportClick}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                      title={t.importCSV}
                    >
                      <Upload size={18} />
                    </button>
                    <button
                      onClick={handleExport}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                      title={t.exportCSV}
                    >
                      <Download size={18} />
                    </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Bar (Bottom) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-2 flex justify-around z-50">
           <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center p-2 text-xs font-medium ${activeTab === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
            >
              <LayoutDashboard size={20} className="mb-1" />
              {t.dashboard}
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`flex flex-col items-center p-2 text-xs font-medium ${activeTab === 'manage' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
            >
              <FileSpreadsheet size={20} className="mb-1" />
              {t.dataEntry}
            </button>
             <button
              onClick={handleImportClick}
              className="flex flex-col items-center p-2 text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              <Upload size={20} className="mb-1" />
              CSV
            </button>
            <button
              onClick={handleExport}
              className="flex flex-col items-center p-2 text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              <Download size={20} className="mb-1" />
              CSV
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
                  
                  {/* Left Column: Form & Recent Activity */}
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

                    {/* Recent Activity Log */}
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
                  </div>

                  {/* Right Column: Year Grid */}
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