import React, { useState, useEffect, useMemo } from 'react';
import { YearData } from '../types';
import { Calculator, Calendar, TrendingUp } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface YearGridProps {
  data: YearData;
  onUpdate: (year: number, monthIndex: number, weekIndex: number, value: number) => void;
  lang: 'es' | 'en';
}

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
      className={`w-20 text-center border text-sm rounded px-1 py-1 transition-all outline-none font-medium text-red-600 dark:text-red-400
        ${isFocused 
          ? 'border-blue-500 ring-1 ring-blue-500 bg-white dark:bg-slate-600' 
          : isHighlight
            ? 'border-amber-400 ring-2 ring-amber-300 dark:ring-amber-600 bg-amber-50 dark:bg-amber-900/30' 
            : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 hover:bg-white dark:hover:bg-slate-600 hover:border-slate-300'}`}
      value={localStr}
      onChange={handleChange}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    />
  );
};

const YearGrid: React.FC<YearGridProps> = ({ data, onUpdate, lang }) => {
  const t = TRANSLATIONS[lang];

  // Calculate vertical totals for each week column
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

  // Calculate Averages
  const stats = useMemo(() => {
    const total = data.total || 0;
    return {
      monthly: total / 12,
      weekly: total / 60, // Based on 5 weeks per month grid structure (12 * 5 = 60 slots)
      daily: total / 365
    };
  }, [data.total]);

  // Determine current week context for highlighting
  const currentContext = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-11
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
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-colors duration-300">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-4 py-3 font-semibold">{t.month}</th>
              <th className="px-4 py-3 text-center text-blue-700 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-900/20">{t.totalKm}</th>
              {[1, 2, 3, 4, 5].map(w => (
                <th key={w} className="px-4 py-3 text-center">{t.week} {w}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.months.map((month, mIdx) => (
              <tr key={mIdx} className="border-b border-slate-100 dark:border-slate-700 last:border-none hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-200 capitalize">{t.months[mIdx]}</td>
                <td className="px-4 py-3 text-center font-bold text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/10">
                  {month.total.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                </td>
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
          <tfoot className="bg-slate-50 dark:bg-slate-700 font-semibold text-slate-800 dark:text-white border-t border-slate-200 dark:border-slate-700">
              <tr>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">{t.totals}</td>
                  <td className="px-4 py-3 text-center text-blue-700 dark:text-blue-400 font-bold bg-blue-50/30 dark:bg-blue-900/20">
                    {data.total.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                  </td>
                  {weeklyTotals.map((total, idx) => (
                    <td key={idx} className="px-2 py-3 text-center text-red-700 dark:text-red-400 font-bold">
                      {total > 0 ? total.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '-'}
                    </td>
                  ))}
              </tr>
              {/* Monthly Average Row */}
              <tr className="border-t border-slate-200 dark:border-slate-600 text-sm">
                  <td className="px-4 py-2 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">{t.monthlyMean}</td>
                  <td className="px-4 py-2 text-center text-blue-600 dark:text-blue-300 font-medium">
                    {(data.total / 12).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                  </td>
                  {weeklyTotals.map((total, idx) => (
                    <td key={idx} className="px-2 py-2 text-center text-slate-600 dark:text-slate-300 font-medium">
                      {(total / 12).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                    </td>
                  ))}
              </tr>
          </tfoot>
        </table>
      </div>

      {/* Averages Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">{t.monthlyMean}</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.monthly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-medium text-slate-400">km</span>
            </p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-slate-700 rounded-lg text-blue-500 dark:text-blue-400">
             <Calendar size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">{t.weeklyMean}</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.weekly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-medium text-slate-400">km</span>
            </p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-slate-700 rounded-lg text-indigo-500 dark:text-indigo-400">
             <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">{t.dailyMean}</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.daily.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-medium text-slate-400">km</span>
            </p>
          </div>
           <div className="p-3 bg-emerald-50 dark:bg-slate-700 rounded-lg text-emerald-500 dark:text-emerald-400">
             <Calculator size={24} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default YearGrid;