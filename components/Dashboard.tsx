import React, { useState, useEffect, useMemo } from 'react';
import { YearData } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, AreaChart, Area 
} from 'recharts';
import { TrendingUp, Calendar, Trophy, Activity, Zap, Calculator } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { calculatePace } from '../utils/dataProcessor';

// --- COMPONENTE STATCARD ---
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
    const statusColor = isPositive ? "text-green-500" : "text-red-500"; 
    
    paceElement = (
      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5 relative z-20">
        <p className={`text-xs font-bold ${statusColor}`}>
          Ritmo actual: {paceValue.toFixed(1)} {unit} ({isPositive ? "+" : ""}{percent.toFixed(0)}%)
        </p>
      </div>
    );
  } else if (subtext) {
    paceElement = (
      <p className={`text-xs font-bold mt-1 relative z-20 ${subtextColor || 'text-slate-400 dark:text-slate-500'}`}>{subtext}</p>
    );
  }

  return (
    <div className="group relative bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col justify-between min-h-[140px] transition-all">
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{title}</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{value}</h3>
          </div>
          <div className={`p-2 rounded-lg border ${activeColor.bg}`}>
            <Icon size={20} />
          </div>
        </div>
        {paceElement}
      </div>
      {trendData && trendData.length > 0 && (
        <div className="absolute bottom-0 right-0 w-36 h-20 opacity-30 z-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <Area type="monotone" dataKey="value" stroke={activeColor.stroke} strokeWidth={3} fill={activeColor.fill} fillOpacity={0.2} isAnimationActive={false} />
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
  const currentSystemYear = 2026; // Forzado para este contexto

  // 1. FILTRADO
  const validData = data.filter(d => d.year <= currentSystemYear);
  const historicalData = validData.filter(d => d.year < currentSystemYear);
  const currentYearData = validData.find(d => d.year === currentSystemYear);
  const sortedDataDesc = [...validData].sort((a, b) => b.year - a.year);

  // 2. CÁLCULO PROYECCIÓN (MARZO 2026)
  const currentTotal = currentYearData?.total || 0;
  const now = new Date();
  const startOfYear = new Date(2026, 0, 1);
  const daysPassed = Math.max(1, Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)));
  
  const dailyPace = currentTotal / daysPassed;
  const projectedTotal = dailyPace * 365;
  const projectedRemaining = Math.max(0, projectedTotal - currentTotal);

  const annualData = sortedDataDesc
    .slice(0, 10)
    .sort((a, b) => a.year - b.year)
    .map(d => {
      const isCurrentYear = d.year === currentSystemYear;
      return { 
        year: d.year, 
        total: d.total,
        projected: isCurrentYear ? projectedRemaining : undefined,
        totalEstimado: isCurrentYear ? projectedTotal : d.total
      };
    });

  const historicalTotalKm = historicalData.reduce((acc, curr) => acc + curr.total, 0);
  const numYears = historicalData.length || 1;
  const monthlyAvgHist = historicalTotalKm / (numYears * 12);

  const currentPace = calculatePace(currentTotal);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title={t.currentTotal} value={`${currentTotal.toFixed(1)} km`} icon={Zap} color="green" subtext={`Proyección: ${projectedTotal.toFixed(0)} km`} />
        <StatCard title={t.monthlyAvg} value={`${monthlyAvgHist.toFixed(1)} km`} icon={TrendingUp} color="blue" paceValue={currentPace.monthly} historicalAvg={monthlyAvgHist} unit="km/m" />
        <StatCard title="AÑO 2026" value={`Día ${daysPassed}/365`} icon={Calendar} color="orange" />
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{t.annualProgress}</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={annualData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip formatter={(value: number) => [`${value.toFixed(1)} km`]} />
              <Bar dataKey="total" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="projected" stackId="a" fill="#3b82f6" fillOpacity={0.3} stroke="#3b82f6" strokeDasharray="3 3" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
