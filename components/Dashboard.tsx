import React, { useState, useEffect, useMemo } from 'react';
import { YearData } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, AreaChart, Area 
} from 'recharts';
import { TrendingUp, Calendar, Trophy, Activity, Zap, Calculator } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

// --- COMPONENTE DE TARJETA ESTILO FUELMASTER (INTERACTIVO) ---
interface FuelCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  trendData?: any[]; 
  color?: "blue" | "green" | "orange" | "purple" | "red";
  subtext?: string;
  subtextColor?: string;
}

const FuelCard: React.FC<FuelCardProps> = ({ title, value, icon: Icon, trendData, color = "blue", subtext, subtextColor }) => {
  const colors = {
    blue:   { stroke: "#3b82f6", fill: "#3b82f6", bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20" },
    green:  { stroke: "#22c55e", fill: "#22c55e", bg: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20" },
    orange: { stroke: "#f97316", fill: "#f97316", bg: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20" },
    purple: { stroke: "#a855f7", fill: "#a855f7", bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20" },
    red:    { stroke: "#ef4444", fill: "#ef4444", bg: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20" },
  };
  const activeColor = colors[color];

  return (
    <div className="group relative bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-blue-900/10 overflow-hidden flex flex-col justify-between h-32 transition-all duration-300 hover:-translate-y-1">
      
      {/* Efecto de Brillo/Destello al pasar el ratón */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Cabecera */}
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider transition-colors">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{value}</h3>
          {subtext && (
             <p className={`text-xs font-bold mt-1 ${subtextColor || 'text-slate-400 dark:text-slate-500'}`}>{subtext}</p>
          )}
        </div>
        <div className={`p-2 rounded-lg border ${activeColor.bg} transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
          <Icon size={20} />
        </div>
      </div>

      {/* Gráfico Sparkline */}
      {trendData && trendData.length > 0 && (
        <div className="absolute bottom-0 right-0 w-36 h-20 opacity-40 group-hover:opacity-100 transition-all duration-500 ease-out origin-bottom-right group-hover:scale-110 pointer-events-none">
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
interface DashboardProps {
  data: YearData[];
  lang: 'es' | 'en';
  darkMode: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ data, lang, darkMode }) => {
  const t = TRANSLATIONS[lang];
  const currentSystemYear = new Date().getFullYear();

  // 1. FILTRADO
  const validData = data.filter(d => d.year <= currentSystemYear);
  const sortedDataDesc = [...validData].sort((a, b) => b.year - a.year);

  // 2. TENDENCIAS
  const trendHistory = useMemo(() => {
    return [...validData]
      .sort((a, b) => a.year - b.year)
      .flatMap(yearData => yearData.months.map(m => ({ value: m.total })))
      .filter(point => point.value > 0);
  }, [validData]);

  const monthlyTrend = trendHistory.slice(-12);
  const weeklyTrend = trendHistory.slice(-8).map(d => ({ value: d.value / 4 }));

  // 3. CÁLCULOS
  const annualData = sortedDataDesc
    .slice(0, 10)
    .sort((a, b) => a.year - b.year)
    .map(d => ({ year: d.year, total: d.total }));

  const totalKm = validData.reduce((acc, curr) => acc + curr.total, 0);
  let currentYear = validData.find(d => d.year === currentSystemYear);
  if (!currentYear && validData.length > 0) currentYear = validData[0];
  const currentYearTotal = currentYear?.total || 0;

  const totalWeeks = validData.length * 52; 
  const weeklyAvgAllTime = totalWeeks > 0 ? totalKm / totalWeeks : 0;
  const monthlyAvgAllTime = validData.length > 0 ? totalKm / (validData.length * 12) : 0;
  const dailyAvgAllTime = validData.length > 0 ? totalKm / (validData.length * 365) : 0;

  // Comparación Mensual
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  useEffect(() => {
    if (sortedDataDesc.length > 0 && selectedYears.length === 0) {
      const initialSelection = sortedDataDesc.slice(0, 3).map(d => d.year);
      setSelectedYears(initialSelection);
    }
  }, [sortedDataDesc.length]);

  const toggleYear = (year: number) => {
    setSelectedYears(prev => {
      if (prev.includes(year)) return prev.filter(y => y !== year);
      else return [...prev, year].sort((a, b) => b - a);
    });
  };

  const comparisonDataSrc = sortedDataDesc.filter(d => selectedYears.includes(d.year));
  const monthlyComparisonData = Array.from({ length: 12 }, (_, i) => {
    const monthName = t.months[i].substring(0, 3);
    const point: any = { name: monthName.toUpperCase() };
    comparisonDataSrc.forEach(y => { point[y.year] = y.months[i].total; });
    return point;
  });

  const colors = ['#2563eb', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
  const axisColor = darkMode ? '#94a3b8' : '#64748b';
  const gridColor = darkMode ? '#334155' : '#e2e8f0';
  const tooltipStyle = {
    backgroundColor: darkMode ? '#1e293b' : '#fff',
    color: darkMode ? '#f1f5f9' : '#0f172a',
    borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* GRID SUPERIOR DE TARJETAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        <FuelCard 
          title={t.allTimeDistance}
          value={`${totalKm.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`}
          icon={Trophy}
          color="blue"
          subtext="Total acumulado"
          trendData={trendHistory} 
        />
        
        <FuelCard 
          title={`${t.currentTotal} (${currentYear?.year || currentSystemYear})`}
          value={`${currentYearTotal.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`}
          icon={Zap}
          color="green"
          subtext={t.keepPushing}
          subtextColor="text-green-500"
          trendData={currentYear?.months.map(m => ({ value: m.total }))}
        />

        <FuelCard 
          title={t.activeYears}
          value={validData.length.toString()}
          icon={Calendar}
          color="orange"
          subtext="Temporadas"
        />

        <FuelCard 
          title={t.monthlyAvg}
          value={`${monthlyAvgAllTime.toFixed(1)} km`}
          icon={TrendingUp}
          color="blue"
          subtext="Promedio mensual"
          trendData={monthlyTrend}
        />

        <FuelCard 
          title={t.weeklyAvg}
          value={`${weeklyAvgAllTime.toFixed(1)} km`}
          icon={Activity}
          color="purple"
          subtext="Promedio semanal"
          trendData={weeklyTrend}
        />

        <FuelCard 
          title={t.dailyAvg}
          value={`${dailyAvgAllTime.toFixed(2)} km`}
          icon={Calculator}
          color="blue"
          subtext="Promedio diario"
          trendData={weeklyTrend}
        />
      </div>

      {/* GRÁFICAS GRANDES INTERACTIVAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Comparación Mensual */}
        <div className="group relative bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-blue-900/10 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          
          {/* Brillo de fondo */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3">{t.monthlyComparison}</h3>
              <div className="flex flex-wrap gap-2 mb-2">
                {sortedDataDesc.map((d, idx) => {
                  const isSelected = selectedYears.includes(d.year);
                  const color = colors[idx % colors.length];
                  return (
                    <button
                      key={d.year}
                      onClick={() => toggleYear(d.year)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                        isSelected ? 'text-white shadow-sm scale-105' : 'bg-transparent text-slate-500 border-slate-200 dark:border-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500'
                      }`}
                      style={{ backgroundColor: isSelected ? color : undefined, borderColor: isSelected ? color : undefined }}
                    >
                      {d.year}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis dataKey="name" tick={{fill: axisColor}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill: axisColor}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-slate-600 dark:text-slate-300 font-medium ml-1">{value}</span>} />
                  {comparisonDataSrc.map((yearData, idx) => {
                    const originalIdx = sortedDataDesc.findIndex(d => d.year === yearData.year);
                    const color = colors[originalIdx % colors.length];
                    return (
                      <Line key={yearData.year} type="monotone" dataKey={yearData.year} name={String(yearData.year)} stroke={color} strokeWidth={2} dot={{r: 3}} activeDot={{r: 5}} connectNulls />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Progreso Anual */}
        <div className="group relative bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-blue-900/10 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          
          {/* Brillo de fondo */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{t.annualProgress}</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={annualData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis dataKey="year" tick={{fill: axisColor}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill: axisColor}} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: darkMode ? '#334155' : '#f1f5f9'}} contentStyle={tooltipStyle} />
                  <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} name={t.kilometers} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;