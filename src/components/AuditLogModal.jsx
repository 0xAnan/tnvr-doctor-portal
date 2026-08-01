import React, { useState } from 'react';
import { X, History, Trash2, RotateCcw, Download, ShieldCheck, Activity, AlertCircle, FileText } from 'lucide-react';

export default function AuditLogModal({
  isOpen,
  onClose,
  auditLogs = [],
  trashBin = [],
  onRestoreFromTrash,
  onPermanentDelete,
  onExportData,
  onRestoreFromBackupFile
}) {
  const [activeTab, setActiveTab] = useState('logs'); // 'logs', 'trash', 'backups'

  if (!isOpen) return null;

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (Array.isArray(parsed)) {
          const restored = await onRestoreFromBackupFile(parsed);
          if (restored) {
            alert('تم استرجاع البيانات بنجاح من الملف!');
            onClose();
          } else {
            alert('تعذر حفظ النسخة الاحتياطية في السحابة. لم يتم استبدال البيانات الحالية.');
          }
        } else {
          alert('ملف غير صالح');
        }
      } catch (err) {
        alert('حدث خطأ أثناء قراءة الملف');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl clean-card rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                سجل التوثيق وسلة المحذوفات
              </h2>
              <p className="text-xs text-slate-500">
                سجل تتبع جميع العمليات، أرشفة المحذوفات، وإمكانية استرجاع البيانات
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-6 pt-3 gap-4">
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'logs'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>سجل العمليات ({auditLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('trash')}
            className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'trash'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>سلة المحذوفات ({trashBin.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('backups')}
            className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'backups'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>النسخ الاحتياطي والاسترجاع</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[65vh] overflow-y-auto">
          
          {/* TAB 1: Activity Audit Log */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>سجل زمني لجميع عمليات الإضافة والتعديل والحذف:</span>
              </div>

              {auditLogs.length > 0 ? (
                <div className="space-y-2">
                  {auditLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            log.type === 'create'
                              ? 'bg-emerald-500'
                              : log.type === 'update'
                              ? 'bg-blue-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            {log.message}
                          </p>
                          <span className="text-[11px] text-slate-400">
                            بواسطة: {log.user || 'الأدمن'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {log.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  لا توجد عمليات بيولوجية مسجلة بعد.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Recycle Bin (Trash) */}
          {activeTab === 'trash' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>أي لجنة يتم حذفها تنتقل هنا أولاً ويمكنك استعادتها بنقرة واحدة في أي وقت.</span>
              </div>

              {trashBin.length > 0 ? (
                <div className="space-y-2">
                  {trashBin.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">{item.title}</h4>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          {item.location} • {item.date} • {item.count || 0} كلب
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onRestoreFromTrash(item)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>استعادة</span>
                        </button>

                        <button
                          onClick={() => onPermanentDelete(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="حذف نهائي"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  سلة المحذوفات فارغة. لا توجد لجان محذوفة مؤقتاً.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Backup & Restore */}
          {activeTab === 'backups' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-500" />
                  تصدير نسخة احتياطية كاملة (JSON)
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  يمكنك تحميل نسخة احتياطية من جميع اللجان والصور المسجلة وحفظها على جهازك في أي وقت.
                </p>
                <button
                  onClick={onExportData}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                >
                  تحميل نسخة احتياطية الآن
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-blue-500" />
                  استرجاع البيانات من ملف JSON
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  إذا أردت استرجاع بيانات سابقة من ملف محلي تم تصديره سابقاً:
                </p>
                <label className="inline-block px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer transition-colors">
                  اختيار ملف الاسترجاع...
                  <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
                </label>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
