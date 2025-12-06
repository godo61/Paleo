import React from 'react';
import { X, User, UserPlus, Database, FileSpreadsheet, Download, LayoutDashboard } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'es' | 'en';
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, lang }) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[lang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-1.5 rounded-lg">?</span>
            {t.helpTitle}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {t.helpIntro}
            </p>
          </div>

          {/* Section 1: Guest vs User */}
          <div className="bg-slate-50 dark:bg-slate-700/30 p-5 rounded-xl border border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              {t.helpGuestVsUserTitle}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                <div className="flex items-center gap-2 mb-2 text-orange-600 dark:text-orange-400 font-bold text-sm uppercase">
                  <User size={16} /> Invitado (Guest)
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {t.helpGuest}
                </p>
              </div>
              <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400 font-bold text-sm uppercase">
                  <UserPlus size={16} /> Registrado
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {t.helpUser}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Features */}
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 mt-1 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg h-fit">
                <LayoutDashboard size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white mb-1">{t.helpDashboardTitle}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{t.helpDashboard}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 mt-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg h-fit">
                <FileSpreadsheet size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white mb-1">{t.helpDataEntryTitle}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{t.helpDataEntry}</p>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 italic pl-3 border-l-2 border-slate-300 dark:border-slate-600">
                  {t.helpGrid}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 mt-1 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg h-fit">
                <Download size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white mb-1">{t.helpCsvTitle}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{t.helpCsv}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-slate-800 p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            {t.close}
          </button>
        </div>

      </div>
    </div>
  );
};

export default HelpModal;