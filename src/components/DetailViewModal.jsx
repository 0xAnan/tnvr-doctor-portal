import React from 'react';
import { X, Printer, MapPin, Calendar, User, FileText, Camera, Dog, ShieldCheck, Tag } from 'lucide-react';

export default function DetailViewModal({ isOpen, onClose, committee, onOpenLightbox, onAddPhoto }) {
  if (!isOpen || !committee) return null;

  const handlePrint = () => {
    window.print();
  };

  const mCount = Number(committee.malesCount) || 0;
  const fCount = Number(committee.femalesCount) || 0;
  const combinedCount = committee.count ?? (mCount + fCount) ?? committee.totalDogs ?? 0;

  const doctorsList = committee.doctors && committee.doctors.length > 0
    ? committee.doctors
    : (committee.doctorInCharge ? [committee.doctorInCharge] : []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl clean-card rounded-2xl shadow-xl overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 no-print">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              تقرير اللجنة: {committee.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              <Printer className="w-4 h-4 text-emerald-500" />
              <span>طباعة التقرير</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Main Stat Banner */}
          <div className="p-5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                إجمالي أعداد الكلاب المعقمة والمحصنة باللجنة
              </span>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {combinedCount} <span className="text-sm font-bold">كلب</span>
              </div>
              <div className="flex items-center gap-3 pt-2 text-xs font-bold">
                <span className="text-blue-700 dark:text-blue-300">♂️ ذكور: {mCount}</span>
                <span className="text-rose-700 dark:text-rose-300">♀️ إناث: {fCount}</span>
              </div>
            </div>
            <Dog className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>

          {/* Details Table */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span className="font-bold">الموقع:</span>
              <span>{committee.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="font-bold">التاريخ:</span>
              <span>{committee.date}</span>
            </div>
            {committee.monthYear && (
              <div className="flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-slate-400" />
                <span className="font-bold">فترة الحملة:</span>
                <span>{committee.monthYear}</span>
              </div>
            )}
            <div className="flex items-start gap-1.5">
              <User className="w-4 h-4 text-slate-400 mt-0.5" />
              <span className="font-bold">الأطباء المسؤولون:</span>
              <span>{doctorsList.join(' ، ')}</span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <FileText className="w-4 h-4 text-slate-400" />
              الملاحظات والتقرير الطبي الميداني
            </h3>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {committee.notes || 'لا توجد ملاحظات إضافية مضافة.'}
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1">
                <Camera className="w-4 h-4 text-slate-400" />
                الصور المرفقة باللجنة ({committee.images?.length || 0})
              </span>
            </div>

            {committee.images && committee.images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {committee.images.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => onOpenLightbox(committee, idx)}
                    className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 aspect-video cursor-pointer"
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                لا توجد صور مرفقة لهذه اللجنة بعد.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
