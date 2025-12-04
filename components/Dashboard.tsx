import React from 'react';
import { YearData } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, Calendar, Trophy, Activity, Zap, Calculator } from 'lucide-react';
import StatCard from './StatCard';
import { TRANSLATIONS } from '../constants';

interface DashboardProps {
  data: YearData[];
  lang: 'es' | 'en';
  darkMode: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ data, lang, darkMode }) => {
  const t = TRANSLATIONS[lang];

  // Sort data descending by year to easily get the most recent ones
  const sortedDataDesc = [...data].sort((a, b) => b.year - a.year);

  // Annual Progress: Last 10 years, but displayed in chronological order (ascending)
  const annualData = sortedDataDesc
    .slice(0, 10)
    .sort((a, b) => a.year - b.year)
    .map(d => ({
      year: d.year,
      total: d.total
    }));

  // Monthly Comparison: Only the last 3 years
  const comparisonYears = sortedDataDesc.slice(0, 3);
  const comparisonYearsLabel = comparisonYears.map(y => y.year).join(', ');
  
  const monthlyComparisonData = Array.from({ length: 12 }, (_, i) => {
    // Use translated month names for the axis
    const monthName = t.months[i].substring(0, 3);
    const point: any = { name: monthName.toUpperCase() };
    comparisonYears.forEach(y => {
      point[y.year] = y.months[i].total;
    });
    return point;
  });

  const totalKm = data.reduce((acc, curr) => acc + curr.total, 0);
  const currentYear = sortedDataDesc[0]; // Most recent year
  
  const currentYearTotal = currentYear?.total || 0;

  // Calculate All-time Averages
  // Based on the grid structure: 12 months * 5 weeks = 60 weeks per year
  const totalWeeks = data.length * 60; 
  const weeklyAvgAllTime = totalWeeks > 0 ? totalKm / totalWeeks : 0;
  const monthlyAvgAllTime = data.length > 0 ? totalKm / (data.length * 12) : 0;
  const dailyAvgAllTime = data.length > 0 ? totalKm / (data.length * 365) : 0;

  // Colors for the lines
  const colors = [
    '#2563eb', '#ef4444', '#10b981', '#f59e0b', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', 
    '#6366f1', '#14b8a6', '#f43f5e', '#64748b'
  ];

  // Chart Styles based on Dark Mode
  const axisColor = darkMode ? '#94a3b8' : '#64748b'; // slate-400 vs slate-500
  const gridColor = darkMode ? '#334155' : '#e2e8f0'; // slate-700 vs slate-200
  const tooltipStyle = {
    backgroundColor: darkMode ? '#1e293b' : '#fff',
    color: darkMode ? '#f1f5f9' : '#0f172a',
    borderRadius: '8px', 
    border: 'none', 
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
  };

  return (
    <div className="space-y-6">
      {/* High Level Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard 
          title={t.allTimeDistance} 
          value={`${totalKm.toLocaleString()} km`} 
          icon={<Trophy className="w-5 h-5" />} 
        />
        <StatCard 
          title={`${t.currentTotal} (${currentYear?.year || ''})`} 
          value={`${currentYearTotal.toLocaleString()} km`} 
          icon={<Zap className="w-5 h-5" />}
          trend={t.keepPushing}
          trendUp={true}
        />
        <StatCard 
          title={t.activeYears} 
          value={data.length} 
          icon={<Calendar className="w-5 h-5" />} 
        />
         <StatCard 
          title={t.monthlyAvg} 
          value={`${monthlyAvgAllTime.toFixed(1)} km`} 
          icon={<TrendingUp className="w-5 h-5" />} 
        />
        <StatCard 
          title={t.weeklyAvg} 
          value={`${weeklyAvgAllTime.toFixed(1)} km`} 
          icon={<Activity className="w-5 h-5" />} 
        />
        <StatCard 
          title={t.dailyAvg} 
          value={`${dailyAvgAllTime.toFixed(2)} km`} 
          icon={<Calculator className="w-5 h-5" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Annual Progress */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-300">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{t.annualProgress}</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={annualData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="year" tick={{fill: axisColor}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill: axisColor}} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: darkMode ? '#334155' : '#f1f5f9'}}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} name={t.kilometers} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Comparison */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-300">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{t.monthlyComparison} ({comparisonYearsLabel})</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyComparisonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="name" tick={{fill: axisColor}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill: axisColor}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span className="text-slate-600 dark:text-slate-300 font-medium ml-1">{value}</span>}
                />
                {comparisonYears.map((y, idx) => (
                  <Line 
                    key={y.year} 
                    type="monotone" 
                    dataKey={y.year}
                    name={String(y.year)}
                    stroke={colors[idx % colors.length]} 
                    strokeWidth={2}
                    dot={{r: 3}}
                    activeDot={{r: 5}}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;