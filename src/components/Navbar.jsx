import React from 'react';
import { Plus, Sun, Moon, Download, Dog, LogOut, History } from 'lucide-react';

export default function Navbar({ onOpenAddModal, darkMode, setDarkMode, onExportData, onLogout, onOpenAuditModal }) {
  return (
    <header className="sticky top-0 z-30 clean-header backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm">
              <Dog className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-none">
                سجل اللجان الميدانية
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                متابعة أعداد الكلاب المعقمة والمحصنة
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            
            {/* Audit Log & Trash Center Button */}
            <button
              onClick={onOpenAuditModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
              title="سجل التوثيق والعمليات وسلة المحذوفات"
            >
              <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden md:inline">سجل التوثيق والسلة</span>
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={darkMode ? "التحويل للوضع المضيء" : "التحويل للوضع الداكن"}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>

            <button
              onClick={onExportData}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>تصدير البيانات</span>
            </button>

            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة لجنة</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
