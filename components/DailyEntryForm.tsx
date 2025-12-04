import React, { useState } from 'react';
import { Calendar, PlusCircle, CheckCircle2, AlertCircle, StickyNote } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface DailyEntryFormProps {
  onAdd: (date: Date, value: number, note: string) => { success: boolean; message: string };
  availableYears: number[];
  lang: 'es' | 'en';
}

const DailyEntryForm: React.FC<DailyEntryFormProps> = ({ onAdd, availableYears, lang }) => {
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [distance, setDistance] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const t = TRANSLATIONS[lang];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: null, message: '' });

    if (!dateStr || !distance) {
      setStatus({ type: 'error', message: t.errorFill });
      return;
    }

    const val = parseFloat(distance);
    if (isNaN(val) || val <= 0) {
      setStatus({ type: 'error', message: t.errorValid });
      return;
    }

    const date = new Date(dateStr);
    const result = onAdd(date, val, note);

    if (result.success) {
      setStatus({ type: 'success', message: result.message });
      setDistance(''); 
      setNote('');
      
      setTimeout(() => {
        setStatus(prev => prev.type === 'success' ? { type: null, message: '' } : prev);
      }, 4000);
    } else {
      setStatus({ type: 'error', message: result.message });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 transition-colors duration-300">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg text-emerald-700 dark:text-emerald-400">
          <Calendar size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t.dailyLog}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.dailyLogDesc}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="w-full sm:w-auto flex-grow">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t.date}</label>
            <input 
              type="date" 
              required
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-red-600 dark:text-red-400 bg-white dark:bg-slate-700 font-medium"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-auto flex-grow">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t.distance}</label>
            <input 
              type="number" 
              step="0.01"
              min="0.01"
              required
              placeholder="e.g. 12.5"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-red-600 dark:text-red-400 bg-white dark:bg-slate-700 font-medium"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
            />
          </div>
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t.notes}</label>
          <div className="relative">
             <div className="absolute top-3 left-3 text-slate-400 pointer-events-none">
                <StickyNote size={18} />
             </div>
             <textarea 
              className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 text-sm resize-none h-20"
              placeholder={t.notesPlaceholder}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <button 
          type="submit"
          className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 self-end"
        >
          <PlusCircle size={18} />
          {t.addEntry}
        </button>
      </form>

      {status.message && (
        <div className={`mt-4 p-3 rounded-lg flex items-start gap-2 text-sm ${
          status.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-100 dark:border-red-800'
        }`}>
          {status.type === 'success' ? <CheckCircle2 size={18} className="mt-0.5" /> : <AlertCircle size={18} className="mt-0.5" />}
          <span>{status.message}</span>
        </div>
      )}
    </div>
  );
};

export default DailyEntryForm;