import React, { useState, useEffect, useMemo } from 'react';
import { YearData } from '../types';
import { Calculator, Calendar, TrendingUp } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface YearGridProps {
  data: YearData;
  onUpdate: (year: number, monthIndex: number, weekIndex: number, value: number) => void;
  lang: 'es' | 'en';
}

// Célula editable "Dual Glass" (Adaptable Claro/Oscuro)
const EditableCell: React.FC<{ value: number; onChange: (val: number) => void; isHighlight?: boolean }> = ({ value, onChange, isHighlight }) => {
  const [localStr, setLocalStr] = useState(value.toString());
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const parsed = localStr === '' ? 0 : parseFloat(localStr);
    if (parsed !== value) {
      setLocalStr(value.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const str = e.target.value;
    setLocalStr(str);
    
    const num = str === '' ? 0 : parseFloat(str);
    if (!isNaN(num)) {
      onChange(num);
    }
  };

  return (
    <input
      type="number"
      min="0"
      step="0.1"
      className={`w-20 text-center text-sm rounded-lg px-1 py-1.5 transition-all outline-none font-medium backdrop-blur-sm border
        ${isFocused 
          ? 'bg-blue-50/80 dark:bg-blue-500/20 border-blue-500 text-blue-700 dark:text-white ring-2 ring-blue-500/30' 
          : isHighlight
            ? 'bg-amber-50/80 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/50 text-amber-700 dark:text-amber-200 ring-1 ring-amber-500/30' 
            : 'bg-white/60 dark:bg-slate-700/30 border-slate-200 dark:border-transparent text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600/50 hover:border-slate-300'
        }`}
      value={localStr}
      onChange={handleChange}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    />
  );
};

const YearGrid: React.FC<YearGridProps> = ({ data, onUpdate, lang }) => {
  const t = TRANSLATIONS[lang];

  // Totales verticales
  const weeklyTotals = useMemo(() => {
    const totals = [0, 0, 0, 0, 0];
    data.months.forEach(month => {
      month.weeks.forEach((week, idx) => {
        if (idx < 5) {
          totals[idx] += week.value || 0;
        }
      });
    });
    return totals;
  }, [data]);

  // Medias (Divisor 52 para semanas)
  const stats = useMemo(() => {
    const total = data.total || 0;
    return {
      monthly: total / 12,
      weekly: total / 52,
      daily: total / 365
    };
  }, [data.total]);

  // Contexto actual
  const currentContext = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); 
    const day = today.getDate();

    let weekIdx = 0;
    if (day <= 7) weekIdx = 0;
    else if (day <= 14) weekIdx = 1;
    else if (day <= 21) weekIdx = 2;
    else if (day <= 28) weekIdx = 3;
    else weekIdx = 4;

    return { year, month, weekIdx };
  }, []);

  const isCurrentYear = data.year === currentContext.year;

  return (
    <div className="space-y-6">
      
      {/* --- TABLA DUAL GLASS --- */}
      {/* Fondo: Blanco translúcido (Claro) vs Pizarra translúcida (Oscuro) */}
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            {/* Header */}
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-white/5">
              <tr>
                <th className="px-4 py-4 font-semibold tracking-wider">{t.month}</th>
                <th className="px-4 py-4 text-center text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-500/10 backdrop-blur-sm border-x border-slate-200 dark:border-white/5">{t.totalKm}</th>
                {[1, 2, 3, 4, 5].map(w => (
                  <th key={w} className="px-4 py-4 text-center">{t.week} {w}</th>
                ))}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {data.months.map((month, mIdx) => (
                <tr key={mIdx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors duration-200">
                  {/* Mes */}
                  <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 capitalize tracking-wide">{t.months[mIdx]}</td>
                  
                  {/* Total Mes */}
                  <td className="px-4 py-3 text-center font-bold text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-500/5 border-x border-slate-100 dark:border-white/5 shadow-[inset_0_0_10px_rgba(59,130,246,0.05)]">
                    {month.total.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                  </td>
                  
                  {/* Inputs */}
                  {month.weeks.map((week, wIdx) => {
                    const isHighlight = isCurrentYear && mIdx === currentContext.month && wIdx === currentContext.weekIdx;
                    return (
                      <td key={wIdx} className="px-2 py-2 text-center">
                        <EditableCell 
                          value={week.value} 
                          onChange={(val) => onUpdate(data.year, mIdx, wIdx, val)} 
                          isHighlight={isHighlight}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>

            {/* Footer Totales */}
            <tfoot className="bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-white/10 font-semibold text-slate-800 dark:text-white backdrop-blur-xl">
                <tr>
                    <td className="px-4 py-4 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">{t.totals}</td>
                    <td className="px-4 py-4 text-center text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-500/10 border-x border-slate-200 dark:border-white/5 text-lg">
                      {data.total.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                    </td>
                    {weeklyTotals.map((total, idx) => (
                      <td key={idx} className="px-2 py-4 text-center text-slate-400 dark:text-slate-500 font-medium text-xs">
                        {total > 0 ? total.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '-'}
                      </td>
                    ))}
                </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* --- TARJETAS INFERIORES DUAL GLASS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1 */}
        <div className="relative overflow-hidden rounded-xl p-5 border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-800/40 backdrop-blur-md shadow-lg flex items-center justify-between group hover:shadow-xl transition-all duration-300">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">{t.monthlyMean}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white group-hover:scale-105 transition-transform">
              {stats.monthly.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span className="text-sm font-medium text-slate-400 dark:text-slate-500">km</span>
            </p>
          </div>
          <div className="p-3 bg-blue-100 dark:bg-transparent dark:bg-gradient-to-br dark:from-blue-500/20 dark:to-blue-600/5 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-white/5">
              <Calendar size={24} />
          </div>
        </div>

        {/* Card 2 */}
        <div className="relative overflow-hidden rounded-xl p-5 border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-800/40 backdrop-blur-md shadow-lg flex items-center justify-between group hover:shadow-xl transition-all duration-300">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">{t.weeklyMean}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white group-hover:scale-105 transition-transform">
              {stats.weekly.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span className="text-sm font-medium text-slate-400 dark:text-slate-500">km</span>
            </p>
          </div>
          <div className="p-3 bg-purple-100 dark:bg-transparent dark:bg-gradient-to-br dark:from-purple-500/20 dark:to-purple-600/5 rounded-xl text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-white/5">
              <TrendingUp size={24} />
          </div>
        </div>

        {/* Card 3 */}
        <div className="relative overflow-hidden rounded-xl p-5 border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-800/40 backdrop-blur-md shadow-lg flex items-center justify-between group hover:shadow-xl transition-all duration-300">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">{t.dailyMean}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white group-hover:scale-105 transition-transform">
              {stats.daily.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-medium text-slate-400 dark:text-slate-500">km</span>
            </p>
          </div>
           <div className="p-3 bg-emerald-100 dark:bg-transparent dark:bg-gradient-to-br dark:from-emerald-500/20 dark:to-emerald-600/5 rounded-xl text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-white/5">
              <Calculator size={24} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default YearGrid;