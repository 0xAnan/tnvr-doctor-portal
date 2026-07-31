import React from 'react';
import { Dog, Building2 } from 'lucide-react';

export default function TopCounters({ committees }) {
  const totalCommittees = committees.length;
  
  // Single unified combined number for "الكلاب المعقمة والمحصنة"
  const totalDogsCombined = committees.reduce(
    (sum, c) => sum + (Number(c.count) || Number(c.totalDogs) || Math.max(Number(c.sterilizedCount) || 0, Number(c.vaccinatedCount) || 0)),
    0
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      
      {/* Primary Banner: الكلاب المعقمة والمحصنة (Combined number) */}
      <div className="md:col-span-2 clean-card rounded-2xl p-6 flex items-center justify-between border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20">
        <div className="space-y-1">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2.5 py-1 rounded-md">
            المؤشر الإجمالي
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white pt-1">
            الكلاب المعقمة والمحصنة
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            إجمالي العدد الموثق بجميع اللجان الميدانية
          </p>
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
          <span className="text-xs text-slate-400 mt-1 block">لجنة مسجلة بالصور</span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          <Building2 className="w-6 h-6" />
        </div>
      </div>

    </div>
  );
}
