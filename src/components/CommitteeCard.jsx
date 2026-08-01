import React from 'react';
import { MapPin, Calendar, Image as ImageIcon, Plus, Trash2, Edit3, UserCheck, Dog, FileText, Tag } from 'lucide-react';

export default function CommitteeCard({ committee, onOpenLightbox, onOpenDetail, onOpenEdit, onDelete, onAddPhoto }) {
  const imagesLoaded = Array.isArray(committee.images);
  const images = imagesLoaded ? committee.images : [];
  const imagePreviews = Array.isArray(committee.imagePreviews)
    ? committee.imagePreviews
    : [];
  const displayImages = imagesLoaded ? images : imagePreviews;
  const imageCount = imagesLoaded ? images.length : Number(committee.imageCount) || 0;

  const mCount = Number(committee.malesCount) || 0;
  const fCount = Number(committee.femalesCount) || 0;
  const combinedCount = committee.count ?? (mCount + fCount) ?? committee.totalDogs ?? 0;

  const doctorsList = committee.doctors && committee.doctors.length > 0
    ? committee.doctors
    : (committee.doctorInCharge ? [committee.doctorInCharge] : []);

  return (
    <div className="clean-card rounded-2xl flex flex-col justify-between overflow-hidden transition-all hover:shadow-md">
      
      {/* Content */}
      <div className="p-5 space-y-3.5">
        
        {/* Title & Category & Actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1.5">
            {committee.monthYear && (
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-400" />
                فترة الحملة: {committee.monthYear}
              </span>
            )}

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

        {/* DOGS STAT CARD */}
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <Dog className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              الكلاب المعقمة والمحصنة
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {combinedCount}
            </span>
          </div>

          {(mCount > 0 || fCount > 0) && (
            <div className="flex items-center gap-2 pt-1 border-t border-emerald-200/50 dark:border-emerald-800/40 text-xs font-bold">
              <span className="text-blue-700 dark:text-blue-300">♂️ ذكور: {mCount}</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="text-rose-700 dark:text-rose-300">♀️ إناث: {fCount}</span>
            </div>
          )}
        </div>

        {/* Location & Date */}
        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-start gap-1.5">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span className="font-semibold">{committee.location}</span>
          </div>

          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>تاريخ اللجنة: {committee.date}</span>
          </div>

          {doctorsList.length > 0 && (
            <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300 pt-0.5">
              <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span className="font-semibold">الأطباء: {doctorsList.join(' ، ')}</span>
            </div>
          )}
        </div>

        {/* Attached Photos Row */}
        <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
              الصور المرفقة ({imageCount})
            </span>
            <button
              onClick={() => onAddPhoto(committee)}
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-0.5"
            >
              <Plus className="w-3.5 h-3.5" />
              إضافة صور
            </button>
          </div>

          {displayImages.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {displayImages.slice(0, 3).map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => onOpenLightbox(committee, idx)}
                  className="relative aspect-video rounded-lg overflow-hidden cursor-pointer bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group/img"
                >
                  <img src={img.thumbnailUrl || img.url} alt={img.caption || ''} loading="lazy" className="w-full h-full object-cover group-hover/img:scale-105 transition-transform" />
                  {idx === 2 && imageCount > 3 && (
                    <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center text-xs font-bold text-white">
                      +{imageCount - 3}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : imageCount > 0 ? (
            <button
              onClick={() => onOpenLightbox(committee, 0)}
              className="w-full py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:border-emerald-500 transition-colors text-center"
            >
              عرض الصور عند الطلب ({imageCount})
            </button>
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

      {/* Footer */}
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
