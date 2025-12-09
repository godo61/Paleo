
import React, { useState } from 'react';
import { X, Calendar, Search } from 'lucide-react';
import { LogEntry } from '../types';
import { TRANSLATIONS } from '../constants';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: LogEntry[];
  lang: 'es' | 'en';
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, logs, lang }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const t = TRANSLATIONS[lang];

  if (!isOpen) return null;

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const dateStr = log.date instanceof Date 
      ? log.date.toLocaleDateString() 
      : new Date(log.date).toLocaleDateString();
    
    return (
      (log.note && log.note.toLowerCase().includes(term)) ||
      dateStr.includes(term) ||
      log.value.toString().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-1.5 rounded-lg">
              <Calendar size={20} />
            </span>
            {t.activityHistory}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder={t.searchLogs}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-slate-800 dark:text-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <p className="italic">{t.noActivity}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div key={log.id} className="bg-white dark:bg-slate-700/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-xs font-bold">
                        {log.date instanceof Date ? log.date.toLocaleDateString() : new Date(log.date).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-slate-400">
                         {log.timestamp instanceof Date ? log.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                      </span>
                    </div>
                    <span className="font-bold text-lg text-red-600 dark:text-red-400">{log.value} km</span>
                  </div>
                  {log.note && (
                    <div className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border-l-4 border-emerald-400 dark:border-emerald-600">
                      {log.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white dark:bg-slate-800 p-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center rounded-b-2xl">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {filteredLogs.length} {filteredLogs.length === 1 ? 'entrada' : 'entradas'}
          </span>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded-lg hover:opacity-90 transition-opacity text-sm"
          >
            {t.close}
          </button>
        </div>

      </div>
    </div>
  );
};

export default HistoryModal;
