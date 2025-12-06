import React, { useState, useEffect } from 'react';
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
  const currentSystemYear = new Date().getFullYear();

  // FILTER LOGIC: Exclude future years
  const validData = data.filter(d => d.year <= currentSystemYear);
  const sortedDataDesc = [...validData].sort((a, b) => b.year - a.year);

  // Annual Progress: Last 10 years
  const annualData = sortedDataDesc
    .slice(0, 10)
    .sort((a, b) => a.year - b.year)
    .map(d => ({
      year: d.year,
      total: d.total
    }));

  // --- Monthly Comparison Logic ---
  // State to track which years are selected for comparison
  const [selectedYears, setSelectedYears] = useState<number[]>([]);

  // Initialize with the top 3 most recent years
  useEffect(() => {
    if (sortedDataDesc.length > 0 && selectedYears.length === 0) {
      const initialSelection = sortedDataDesc.slice(0, 3).map(d => d.year);
      setSelectedYears(initialSelection);
    }
  }, [sortedDataDesc.length]);

  const toggleYear = (year: number) => {
    setSelectedYears(prev => {
      if (prev.includes(year)) {
        return prev.filter(y => y !== year);
      } else {
        return [...prev, year].sort((a, b) => b - a);
      }
    });
  };

  // Filter data based on selection
  const comparisonDataSrc = sortedDataDesc.filter(d => selectedYears.includes(d.year));
  
  const monthlyComparisonData = Array.from({ length: 12 }, (_, i) => {
    const monthName = t.months[i].substring(0, 3);
    const point: any = { name: monthName.toUpperCase() };
    comparisonDataSrc.forEach(y => {
      point[y.year] = y.months[i].total;
    });
    return point;
  });

  const totalKm = validData.reduce((acc, curr) => acc + curr.total, 0);

  // Determine "Current Year"
  let currentYear = validData.find(d => d.year === currentSystemYear);
  if (!currentYear && validData.length > 0) {
    currentYear = validData[0];
  }
  const currentYearTotal = currentYear?.total || 0;

  // Averages
  const totalWeeks = validData.length * 60; 
  const weeklyAvgAllTime = totalWeeks > 0 ? totalKm / totalWeeks : 0;
  const monthlyAvgAllTime = validData.length > 0 ? totalKm / (validData.length * 12) : 0;
  const dailyAvgAllTime = validData.length > 0 ? totalKm / (validData.length * 365) : 0;

  const colors = [
    '#2563eb', '#ef4444', '#10b981', '#f59e0b', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', 
    '#6366f1', '#14b8a6', '#f43f5e', '#64748b'
  ];

  const axisColor = darkMode ? '#94a3b8' : '#64748b';
  const gridColor = darkMode ? '#334155' : '#e2e8f0';
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
          value={`${totalKm.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`} 
          icon={<Trophy className="w-5 h-5" />} 
        />
        <StatCard 
          title={`${t.currentTotal} (${currentYear?.year || currentSystemYear})`} 
          value={`${currentYearTotal.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`} 
          icon={<Zap className="w-5 h-5" />}
          trend={t.keepPushing}
          trendUp={true}
        />
        <StatCard 
          title={t.activeYears} 
          value={validData.length} 
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
        {/* Monthly Comparison */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-300">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3">{t.monthlyComparison}</h3>
            
            {/* Year Selector Chips */}
            <div className="flex flex-wrap gap-2 mb-2">
              {sortedDataDesc.map((d, idx) => {
                const isSelected = selectedYears.includes(d.year);
                const color = colors[idx % colors.length];
                
                return (
                  <button
                    key={d.year}
                    onClick={() => toggleYear(d.year)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                      isSelected 
                        ? 'text-white shadow-sm' 
                        : 'bg-transparent text-slate-500 border-slate-200 dark:border-slate-600 dark:text-slate-400'
                    }`}
                    style={{
                      backgroundColor: isSelected ? color : undefined,
                      borderColor: isSelected ? color : undefined,
                    }}
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
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span className="text-slate-600 dark:text-slate-300 font-medium ml-1">{value}</span>}
                />
                {comparisonDataSrc.map((yearData, idx) => {
                   // Ensure consistent color
                   const originalIdx = sortedDataDesc.findIndex(d => d.year === yearData.year);
                   const color = colors[originalIdx % colors.length];

                   return (
                    <Line 
                      key={yearData.year} 
                      type="monotone" 
                      dataKey={yearData.year}
                      name={String(yearData.year)}
                      stroke={color} 
                      strokeWidth={2}
                      dot={{r: 3}}
                      activeDot={{r: 5}}
                      connectNulls
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

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
      </div>
    </div>
  );
};

export default Dashboard;