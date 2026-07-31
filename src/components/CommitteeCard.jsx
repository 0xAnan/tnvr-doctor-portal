import React from 'react';
import { MapPin, Calendar, Clock, Image as ImageIcon, Plus, Eye, Trash2, Edit3, UserCheck, Dog, FileText } from 'lucide-react';

export default function CommitteeCard({ committee, onOpenLightbox, onOpenDetail, onOpenEdit, onDelete, onAddPhoto }) {
  const images = committee.images || [];

  // Combined count fallback logic
  const combinedCount = committee.count ?? committee.totalDogs ?? Math.max(committee.sterilizedCount || 0, committee.vaccinatedCount || 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">مكتملة 🟢</span>;
      case 'active':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">جاري اليوم 🟡</span>;
      default:
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">مجدولة 🔵</span>;
    }
  };

  return (
    <div className="clean-card rounded-2xl flex flex-col justify-between overflow-hidden transition-all hover:shadow-md">
      
      {/* Card Header & Content */}
      <div className="p-5 space-y-4">
        
        {/* Top Status & Title */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              {getStatusBadge(committee.status)}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {committee.title}
            </h3>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onOpenEdit(committee)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="تعديل اللجنة"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(committee.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="حذف اللجنة"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Unified Primary Stat: الكلاب المعقمة والمحصنة */}
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
            <Dog className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            الكلاب المعقمة والمحصنة
          </span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {combinedCount}
          </span>
        </div>

        {/* Location & Metadata */}
        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-start gap-1.5">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span className="font-semibold">{committee.location}</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{committee.date}</span>
            </div>
            {committee.time && (
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{committee.time}</span>
              </div>
            )}
          </div>

          {committee.doctorInCharge && (
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>الطبيب: {committee.doctorInCharge}</span>
            </div>
          )}
        </div>

        {/* Attached Photos Row */}
        <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
              الصور المرفقة ({images.length})
            </span>
            <button
              onClick={() => onAddPhoto(committee)}
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-0.5"
            >
              <Plus className="w-3.5 h-3.5" />
              إضافة صور
            </button>
          </div>

          {images.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {images.slice(0, 3).map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => onOpenLightbox(committee, idx)}
                  className="relative aspect-video rounded-lg overflow-hidden cursor-pointer bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group/img"
                >
                  <img src={img.url} alt={img.caption || ''} className="w-full h-full object-cover group-hover/img:scale-105 transition-transform" />
                  {idx === 2 && images.length > 3 && (
                    <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center text-xs font-bold text-white">
                      +{images.length - 2}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <button
              onClick={() => onAddPhoto(committee)}
              className="w-full py-2.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-400 hover:border-emerald-500 hover:text-emerald-600 transition-colors text-center"
            >
              + إرفاق صور لهذه اللجنة
            </button>
          )}
        </div>

      </div>

      {/* Footer Action */}
      <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={() => onOpenDetail(committee)}
          className="w-full py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5"
        >
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span>عرض التقرير التفصيلي والطباعة</span>
        </button>
      </div>

    </div>
  );
}
