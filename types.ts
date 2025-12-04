export interface WeekData {
  weekNum: number;
  value: number;
}

export interface MonthData {
  name: string;
  total: number;
  weeks: WeekData[];
}

export interface YearData {
  year: number;
  months: MonthData[];
  total: number;
}

export interface ParsedData {
  years: YearData[];
}

export interface LogEntry {
  id: string;
  date: Date;
  value: number;
  note: string;
  timestamp: Date;
}