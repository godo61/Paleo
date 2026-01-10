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
    // CONTENEDOR PRINCIPAL: Añadido efecto "FuelMaster Premium" (Lift + Shine)
    <div className="group relative bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-xl shadow-xl border border-slate-200 dark:border-white/10 mb-6 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/5 dark:hover:shadow-blue-900/10">
      
      {/* CAPA DE BRILLO (SHINE) */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {/* Cabecera */}
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="bg-emerald-100/50 dark:bg-emerald-500/20 p-2.5 rounded-xl text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shadow-sm transition-transform duration-300 group-hover:scale-110">
          <Calendar size={22} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-wide transition-colors">{t.dailyLog}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium transition-colors">{t.dailyLogDesc}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative z-10">
        <div className="flex flex-col sm:flex-row gap-5 items-end">
          
          {/* Input Fecha */}
          <div className="w-full sm:w-auto flex-grow space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1 transition-colors">{t.date}</label>
            <input 
              type="date" 
              required
              className="w-full px-4 py-2.5 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none text-slate-700 dark:text-white font-medium transition-all hover:bg-white/80 dark:hover:bg-slate-800/80"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
            />
          </div>

          {/* Input Distancia */}
          <div className="w-full sm:w-auto flex-grow space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1 transition-colors">{t.distance}</label>
            <div className="relative">
                <input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  className="w-full pl-4 pr-12 py-2.5 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none text-slate-800 dark:text-white font-bold text-lg placeholder-slate-400 dark:placeholder-slate-600 transition-all hover:bg-white/80 dark:hover:bg-slate-800/80"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm font-bold">km</span>
            </div>
          </div>
        </div>

        {/* Input Notas */}
        <div className="w-full space-y-1.5">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1 transition-colors">{t.notes}</label>
          <div className="relative group/input">
             <div className="absolute top-3 left-3 text-slate-400 dark:text-slate-500 group-focus-within/input:text-blue-500 dark:group-focus-within/input:text-blue-400 transition-colors pointer-events-none">
                <StickyNote size={18} />
             </div>
             <textarea 
              className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none text-slate-700 dark:text-slate-200 text-sm resize-none h-24 placeholder-slate-400 dark:placeholder-slate-600 transition-all hover:bg-white/80 dark:hover:bg-slate-800/80"
              placeholder={t.notesPlaceholder}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        {/* Botón de Acción */}
        <button 
          type="submit"
          className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 border border-blue-400/20 flex items-center justify-center gap-2 self-end transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <PlusCircle size={20} />
          {t.addEntry}
        </button>
      </form>

      {/* Mensajes de Estado */}
      {status.message && (
        <div className={`mt-4 p-4 rounded-xl flex items-start gap-3 text-sm backdrop-blur-md border animate-in fade-in slide-in-from-bottom-2 ${
          status.type === 'success' 
            ? 'bg-emerald-100/60 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' 
            : 'bg-red-100/60 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400'
        }`}>
          <div className={`p-1 rounded-full ${status.type === 'success' ? 'bg-emerald-200/50 dark:bg-emerald-500/20' : 'bg-red-200/50 dark:bg-red-500/20'}`}>
            {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          </div>
          <span className="font-medium mt-0.5">{status.message}</span>
        </div>
      )}
    </div>
  );
};

export default DailyEntryForm;