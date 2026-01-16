import React from 'react';
import { X, User, UserPlus, Download, Zap, TrendingUp, Activity, Info, LogOut, Share2, MousePointerClick, FileInput } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'es' | 'en';
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, lang }) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[lang];
  const isEs = lang === 'es';

  // Textos específicos definidos localmente
  const content = {
    // SECCIÓN 1: ANALÍTICA (Teoría)
    analyticsTitle: isEs ? "Interpretación de Datos" : "Data Interpretation",
    semaphoreTitle: isEs ? "Semáforo de Rendimiento" : "Performance Traffic Light",
    semaphoreDesc: isEs 
      ? "🟢 Verde / 🔴 Rojo: Indica si tu proyección actual supera tu media histórica."
      : "🟢 Green / 🔴 Red: Indicates if your current projection exceeds your historical average.",
    smartTitle: isEs ? "Medias Vivas" : "Live Averages",
    smartDesc: isEs
      ? "🚀 Año Actual: Se calcula sobre días transcurridos (no sobre año completo) para darte una proyección real diaria."
      : "🚀 Current Year: Calculated on elapsed days (not full year) to give you a real daily projection.",

    // SECCIÓN 2: USO PRÁCTICO (Manual)
    usageTitle: isEs ? "Funciones Interactivas" : "Interactive Features",
    
    // Dashboard Interactivo
    interactiveDashTitle: isEs ? "Gráficas Comparativas" : "Comparative Charts",
    interactiveDashDesc: isEs
      ? "En 'Comparación Mensual', los años son botones. Púlsalos para activar o desactivar años específicos y comparar épocas distintas (ej: 2026 vs 2018)."
      : "In 'Monthly Comparison', years are buttons. Click them to toggle specific years on/off and compare different eras (e.g., 2026 vs 2018).",
    
    // Entrada de Datos
    entryTitle: isEs ? "Cómo introducir datos" : "How to enter data",
    entryMethod1: isEs
      ? "1. Registro Diario: Usa el formulario superior para añadir entrenamientos con fecha y notas. Se suman automáticamente."
      : "1. Daily Entry: Use the top form to add workouts with date and notes. They sum up automatically.",
    entryMethod2: isEs
      ? "2. Tabla Directa: Pulsa cualquier celda de la tabla anual para editar el número rápidamente."
      : "2. Direct Table: Click any cell in the annual grid to edit the number quickly.",

    // CSV & Compartir
    csvTitle: isEs ? "Datos y Compartir" : "Data & Share",
    csvDesc: isEs 
      ? "Usa los botones para Importar, Descargar CSV o Compartir el archivo directamente con otras apps (WhatsApp, Drive, Email)."
      : "Use the buttons to Import, Download CSV, or Share the file directly with other apps (WhatsApp, Drive, Email).",

    // Registro Hint
    registerHint: isEs
      ? "Nota: Para registrarte, cierra sesión (botón Salir) y elige 'Crear Cuenta' en la pantalla de inicio."
      : "Note: To register, log out (Exit button) and choose 'Create Account' on the home screen."
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-1.5 rounded-lg">
              <Info size={20} />
            </span>
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
          
          {/* BLOQUE 1: CÓMO FUNCIONA (NUEVA LÓGICA) */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2">
              {content.analyticsTitle}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
               <div className="bg-slate-50 dark:bg-slate-700/30 p-3 rounded-xl border border-slate-100 dark:border-slate-600">
                  <h4 className="font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2 text-sm">
                    <Activity size={16} className="text-blue-500" /> {content.semaphoreTitle}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{content.semaphoreDesc}</p>
               </div>
               <div className="bg-slate-50 dark:bg-slate-700/30 p-3 rounded-xl border border-slate-100 dark:border-slate-600">
                  <h4 className="font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2 text-sm">
                    <TrendingUp size={16} className="text-emerald-500" /> {content.smartTitle}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{content.smartDesc}</p>
               </div>
            </div>
          </div>

          {/* BLOQUE 2: GUÍA DE USO (INTERACTIVIDAD) */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2">
              {content.usageTitle}
            </h3>
            
            {/* Gráficas Interactivas */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 mt-1 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg h-fit">
                <MousePointerClick size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white text-sm">{content.interactiveDashTitle}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                  {content.interactiveDashDesc}
                </p>
              </div>
            </div>

            {/* Entrada de Datos */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 mt-1 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg h-fit">
                <FileInput size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white text-sm">{content.entryTitle}</h4>
                <ul className="mt-1 space-y-1">
                  <li className="text-xs text-slate-600 dark:text-slate-300">{content.entryMethod1}</li>
                  <li className="text-xs text-slate-600 dark:text-slate-300">{content.entryMethod2}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* BLOQUE 3: CSV & COMPARTIR */}
          <div className="flex gap-4 items-center bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
            <div className="text-blue-600 dark:text-blue-400">
              <Share2 size={24} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white text-sm">{content.csvTitle}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300">{content.csvDesc}</p>
            </div>
          </div>

          {/* BLOQUE 4: GUEST VS USER */}
          <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              {t.helpGuestVsUserTitle}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                <div className="flex items-center gap-2 mb-2 text-orange-600 dark:text-orange-400 font-bold text-sm uppercase">
                  <User size={16} /> Invitado
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {t.helpGuest}
                </p>
              </div>
              <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400 font-bold text-sm uppercase">
                    <UserPlus size={16} /> Registrado
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
                    {t.helpUser}
                  </p>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900/50 p-2 rounded border border-slate-100 dark:border-slate-700/50 flex gap-2 items-start">
                  <LogOut size={12} className="mt-0.5 shrink-0" />
                  {content.registerHint}
                </div>
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
