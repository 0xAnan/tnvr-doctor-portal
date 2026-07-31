import React from 'react';
import { Dog, Building2 } from 'lucide-react';

export default function TopCounters({ committees }) {
  const totalCommittees = committees.length;
  
  // Total Male & Female calculation
  const totalMales = committees.reduce((sum, c) => sum + (Number(c.malesCount) || 0), 0);
  const totalFemales = committees.reduce((sum, c) => sum + (Number(c.femalesCount) || 0), 0);

  // Total combined dogs
  const totalDogsCombined = committees.reduce((sum, c) => {
    if (c.malesCount !== undefined || c.femalesCount !== undefined) {
      return sum + (Number(c.malesCount) || 0) + (Number(c.femalesCount) || 0);
    }
    return sum + (Number(c.count) || Number(c.totalDogs) || 0);
  }, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      
      {/* Primary Banner: الكلاب المعقمة والمحصنة (Combined number + Male/Female breakdown) */}
      <div className="md:col-span-2 clean-card rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20">
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2.5 py-1 rounded-md">
            المؤشر الإجمالي
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white pt-1">
            الكلاب المعقمة والمحصنة
          </h2>
          
          {/* Males & Females breakdown tags */}
          <div className="flex items-center gap-3 pt-1 text-xs font-bold">
            <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
              ♂️ ذكور: {totalMales.toLocaleString('ar-EG')}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
              ♀️ إناث: {totalFemales.toLocaleString('ar-EG')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-4xl sm:text-5xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {totalDogsCombined.toLocaleString('ar-EG')}
            </span>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 mr-2">كَلْب</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hidden sm:block">
            <Dog className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Secondary Card: عدد اللجان الميدانية */}
      <div className="clean-card rounded-2xl p-6 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
            إجمالي اللجان الميدانية
          </span>
          <div className="text-3xl font-black text-slate-800 dark:text-slate-100">
            {totalCommittees.toLocaleString('ar-EG')}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">لجنة موثقة</span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          <Building2 className="w-6 h-6" />
        </div>
      </div>

    </div>
  );
}
