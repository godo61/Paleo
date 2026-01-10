
import React, { useState, useMemo } from 'react';
import { LogEntry } from '../types';
import { X, Search, Calendar, FileText, Filter } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: LogEntry[];
  lang: 'es' | 'en';
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, logs, lang }) => {
  const [searchText, setSearchText] = useState('');
  const [searchDate, setSearchDate] = useState('');

  const t = TRANSLATIONS[lang];

  // Lógica de filtrado en tiempo real
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // 1. Filtro por Texto (Notas o Valor de km)
      const textMatch = 
        searchText === '' || 
        (log.note && log.note.toLowerCase().includes(searchText.toLowerCase())) ||
        log.value.toString().includes(searchText);

      // 2. Filtro por Fecha Exacta
      let dateMatch = true;
      if (searchDate) {
        // Convertimos la fecha del log a YYYY-MM-DD para comparar
        const logDateStr = new Date(log.date).toISOString().split('T')[0];
        dateMatch = logDateStr === searchDate;
      }

      return textMatch && dateMatch;
    });
  }, [logs, searchText, searchDate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Fondo oscuro desenfocado */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Contenedor Modal con efecto Glass */}
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* --- CABECERA --- */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg text-blue-600 dark:text-blue-400">
              <Search size={20} />
            </div>
            <div>
              {/* CAMBIO AQUÍ: Título coherente con el botón de fuera */}
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {lang === 'es' ? 'Buscador de Actividad' : 'Activity Search'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {filteredLogs.length} {filteredLogs.length === 1 ? (lang === 'es' ? 'resultado' : 'result') : (lang === 'es' ? 'resultados' : 'results')}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* --- FILTROS DE BÚSQUEDA --- */}
        <div className="p-5 bg-slate-50/50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row gap-4">
          
          {/* Input Texto */}
          <div className="flex-1 relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
              <FileText size={18} />
            </div>
            <input
              type="text"
              placeholder={lang === 'es' ? "Buscar notas (ej: 'Nelo 5')..." : "Search notes..."}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 dark:text-white transition-all placeholder-slate-400"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          {/* Input Fecha */}
          <div className="w-full sm:w-auto relative group">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
              <Calendar size={18} />
            </div>
            <input
              type="date"
              className="w-full sm:w-48 pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 dark:text-white transition-all [color-scheme:light] dark:[color-scheme:dark]"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
            />
          </div>

          {/* Botón Borrar Filtros */}
          {(searchText || searchDate) && (
            <button 
              onClick={() => { setSearchText(''); setSearchDate(''); }}
              className="px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800/50"
            >
              {lang === 'es' ? 'Borrar' : 'Clear'}
            </button>
          )}
        </div>

        {/* --- LISTADO DE RESULTADOS --- */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-[300px]">
          {filteredLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 opacity-60">
              <Filter size={48} strokeWidth={1} />
              <p className="text-sm">{lang === 'es' ? 'No se encontraron entrenamientos.' : 'No workouts found.'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="group bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-white/5 hover:border-blue-300 dark:hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-bold text-slate-600 dark:text-slate-300">
                        {new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {log.timestamp instanceof Date ? log.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {log.value} <span className="text-xs font-medium text-slate-500">km</span>
                    </div>
                  </div>
                  
                  {log.note ? (
                    <div className="flex gap-2 items-start">
                      <FileText size={14} className="mt-1 text-slate-400 shrink-0" />
                      <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                        {log.note}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic pl-6">{lang === 'es' ? 'Sin notas' : 'No notes'}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-white/10 text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Master Paleo Search</p>
        </div>

      </div>
    </div>
  );
};

export default HistoryModal;