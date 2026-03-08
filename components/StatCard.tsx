import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendUp }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-start justify-between transition-colors duration-300">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{value}</h3>
        {trend && (
          <p className={`text-xs font-medium mt-2 ${trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
            {trend}
          </p>
        )}
      </div>
      {icon && (
        <div className="p-3 bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-lg">
          {icon}
        </div>
      )}
    </div>
  );
};

export default StatCard;