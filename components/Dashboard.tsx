import React, { useState, useEffect, useMemo } from 'react';
import { YearData } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, AreaChart, Area, Cell
} from 'recharts';
import { TrendingUp, Calendar, Trophy, Activity, Zap, Calculator } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { calculatePace } from '../utils/dataProcessor';

// --- COMPONENTE STATCARD (RESTAURADO ENERO) ---
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  trendData?: any[]; 
  color?: "blue" | "green" | "orange" | "purple" | "red";
  subtext?: string;
  subtextColor?: string;
  paceValue?: number;      
  historicalAvg?: number;  
  unit?: string;           
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, value, icon: Icon, trendData, color = "blue", 
  subtext, subtextColor, paceValue, historicalAvg, unit 
}) => {
  const colors = {
    blue:   { stroke: "#3b82f6", fill: "#3b82f6", bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20" },
    green:  { stroke: "#22c55e", fill: "#22c55e", bg: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20" },
    orange: { stroke: "#f97316", fill: "#f97316", bg: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20" },
    purple: { stroke: "#a855f7", fill: "#a855f7", bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20" },
    red:    { stroke: "#ef4444", fill: "#ef4444", bg: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20" },
  };
  const activeColor = colors[color];

  let paceElement = null;
  if (paceValue !== undefined && historicalAvg !== undefined && historicalAvg > 0) {
    const diff = paceValue - historicalAvg;
    const percent = (diff / historicalAvg) * 100;
    const isPositive = diff >= 0;
    const sign = isPositive ? "+" : "";
    const statusColor = isPositive ? "text-green-500" : "text-red-500"; 
    const dot = isPositive ? "🟢" : "🔴";
    
    paceElement = (
      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5 relative z-20">
        <p className={`text-xs font-bold ${statusColor} flex items-center gap-1`}>
          {dot} Ritmo actual: {paceValue.toFixed(1)} {unit}
        </p>
        <p className="text-[10px] text-slate-400 font-medium ml-5">
            ({sign}{percent.toFixed(0)}% vs histórica)
        </p>
      </div>
    );
  } else if (subtext) {
    paceElement = (
      <p className={`text-xs font-bold mt-1 relative z-20 ${subtextColor || 'text-slate-400 dark:text-slate-500'}`}>{subtext}</p>
    );
  }

  return (
    <div className="group relative bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-blue-900/10 overflow-hidden flex flex-col justify-between min-h-[140px] transition-all duration-300 hover:-translate-y-1">
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider transition-colors">{title}</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{value}</h3>
          </div>
          <div className={`p-2 rounded-lg border ${activeColor.bg} transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
            <Icon size={20} />
          </div>
        </div>
        {paceElement}
      </div>

      {trendData && trendData.length > 0 && (
        <div className="absolute bottom-0 right-0 w-36 h-20 opacity-30 group-hover:opacity-80 transition-all duration-500 ease-out origin-bottom-right group-hover:scale-110 pointer-events-none z-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={activeColor.fill} stopOpacity={0.5}/>
                  <stop offset="100%" stopColor={activeColor.fill} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={activeColor.stroke} 
                strokeWidth={3} 
                fill={`url(#grad-${color})`} 
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

// --- DASHBOARD PRINCIPAL ---
const Dashboard: React.FC<DashboardProps> = ({ data, lang, darkMode }) => {
  const t = TRANSLATIONS[lang];
  const currentSystemYear = new Date().getFullYear();

  // 1. FILTRADO
  const historicalData = data.filter(d => d.year < currentSystemYear);
  const currentYearData = data.find(d => d.year === currentSystemYear);
  const validData = data.filter(d => d.year <= currentSystemYear);
  const sortedDataDesc = [...validData].sort((a, b) => b.year - a.year);

  // 2. PROYECCIÓN FANTASMA (Lógica de marzo 2026)
  const currentTotal = currentYearData?.total || 0;
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const daysPassed = Math.max(1, Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)));
  const projectedFullYear = (currentTotal / daysPassed) * 365;

  // 3. DATOS ANUALES CON BARRA FANTASMA
  const annualData = sortedDataDesc
    .slice(0, 10)
    .sort((a, b) => a.year - b.year)
    .map(d => {
      const isCurrentYear = d.year === currentSystemYear;
      return {
        year: d.year,
        real: d.total,
        ghost: isCurrentYear ? Math.max(0, projectedFullYear - d.total) : 0,
        fullLabel: isCurrentYear ? `Actual: ${d.total.toFixed(1)}km | Proyección: ${projectedFullYear.toFixed(1)}km` : `${d.total} km`
      };
    });

  // 4. CÁLCULOS HISTÓRICOS
  const trendHistory = useMemo(() => {
    return [...validData]
      .sort((a, b) => a.year - b.year)
      .flatMap(yearData => yearData.months.map(m => ({ value: m.total })))
      .filter(point => point.value > 0);
  }, [validData]);

  const historicalTotalKm = historicalData.reduce((acc, curr) => acc + curr.total, 0);
  const numHistoricalYears = historicalData.length;
  const monthlyAvgHist = numHistoricalYears > 0 ? historicalTotalKm / (numHistoricalYears * 12) : 0;
  const weeklyAvgHist = numHistoricalYears > 0 ? historicalTotalKm / (numHistoricalYears * 52) : 0;
  const dailyAvgHist = numHistoricalYears > 0 ? historicalTotalKm / (numHistoricalYears * 365) : 0;
  const currentPace = calculatePace(currentTotal); 

  // Comparación Mensual
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  useEffect(() => {
    if (sortedDataDesc.length > 0 && selectedYears.length === 0) {
      setSelectedYears(sortedDataDesc.slice(0, 3).map(d => d.year));
    }
  }, [sortedDataDesc.length]);

  const toggleYear = (year: number) => {
    setSelectedYears(prev => prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year].sort((a, b) => b - a));
  };

  const comparisonDataSrc = sortedDataDesc.filter(d => selectedYears.includes(d.year));
  const monthlyComparisonData = Array.from({ length: 12 }, (_, i) => {
    const point: any = { name: t.months[i].substring(0, 3).toUpperCase() };
    comparisonDataSrc.forEach(y => { point[y.year] = y.months[i].total; });
    return point;
  });

  const chartColors = ['#2563eb', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
  const axisColor = darkMode ? '#94a3b8' : '#64748b';
  const gridColor = darkMode ? '#334155' : '#e2e8f0';
  const tooltipStyle = {
    backgroundColor: darkMode ? '#1e293b' : '#fff',
    color: darkMode ? '#f1f5f9' : '#0f172a',
    borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title={t.allTimeDistance} value={`${(historicalTotalKm + currentTotal).toLocaleString(undefined, { maximumFractionDigits: 1 })} km`} icon={Trophy} color="blue" subtext="Total acumulado" trendData={trendHistory} />
        <StatCard title={`${t.currentTotal} (${currentSystemYear})`} value={`${currentTotal.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`} icon={Zap} color="green" subtext={t.keepPushing} subtextColor="text-green-500" trendData={currentYearData?.months.map(m => ({ value: m.total }))} />
        <StatCard title={t.activeYears} value={validData.length.toString()} icon={Calendar} color="orange" subtext="Temporadas" />
        <StatCard title={t.monthlyAvg} value={`${monthlyAvgHist.toFixed(1)} km`} icon={TrendingUp} color="blue" paceValue={currentPace.monthly} historicalAvg={monthlyAvgHist} unit="km/mes" trendData={trendHistory.slice(-12)} />
        <StatCard title={t.weeklyAvg} value={`${weeklyAvgHist.toFixed(1)} km`} icon={Activity} color="purple" paceValue={currentPace.weekly} historicalAvg={weeklyAvgHist} unit="km/sem" trendData={trendHistory.slice(-8)} />
        <StatCard title={t.dailyAvg} value={`${dailyAvgHist.toFixed(2)} km`} icon={Calculator} color="blue" paceValue={currentPace.daily} historicalAvg={dailyAvgHist} unit="km/día" trendData={trendHistory.slice(-14)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico Comparativo Líneas */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{t.monthlyComparison}</h3>
          <div className="flex flex-wrap gap-2 mb-6">
            {sortedDataDesc.map((d, idx) => (
              <button key={d.year} onClick={() => toggleYear(d.year)} className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${selectedYears.includes(d.year) ? 'text-white' : 'text-slate-500 border-slate-200 dark:border-slate-600'}`} style={{ backgroundColor: selectedYears.includes(d.year) ? chartColors[idx % chartColors.length] : 'transparent' }}>{d.year}</button>
            ))}
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyComparisonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="name" tick={{fill: axisColor}} />
                <YAxis tick={{fill: axisColor}} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend verticalAlign="bottom" height={36} />
                {comparisonDataSrc.map((yearData, idx) => (
                  <Line key={yearData.year} type="monotone" dataKey={yearData.year} stroke={chartColors[sortedDataDesc.findIndex(s => s.year === yearData.year) % chartColors.length]} strokeWidth={3} dot={{r: 4}} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico Anual con BARRA FANTASMA */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{t.annualProgress}</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={annualData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="year" tick={{fill: axisColor}} />
                <YAxis tick={{fill: axisColor}} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={tooltipStyle} labelFormatter={(year) => `Año ${year}`} />
                <Bar dataKey="real" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="ghost" stackId="a" fill="#3b82f6" fillOpacity={0.2} radius={[4, 4, 0, 0]} stroke="#3b82f6" strokeDasharray="4 4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-slate-400 mt-4 text-center italic">
            * La sección clara en 2026 representa la proyección estimada a final de año según tu ritmo actual.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
