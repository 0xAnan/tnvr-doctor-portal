import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Calendar, MapPin, Tag } from 'lucide-react';

export default function ImageLightboxModal({ isOpen, onClose, committee, initialImageIndex = 0 }) {
  if (!isOpen || !committee || !committee.images || committee.images.length === 0) return null;

  const [currentIndex, setCurrentIndex] = useState(initialImageIndex);
  const images = committee.images;
  const currentImg = images[currentIndex] || images[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/95 backdrop-blur-lg">
      
      {/* Top Header Control */}
      <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10 max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
            {committee.title}
          </span>
          <span className="text-xs text-slate-400">
            صورة {currentIndex + 1} من {images.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Download button */}
          <a
            href={currentImg.url}
            download={`committee-image-${currentIndex + 1}.jpg`}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="تحميل الصورة"
          >
            <Download className="w-5 h-5" />
          </a>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-200 hover:text-rose-400 border border-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div className="relative w-full max-w-5xl h-[80vh] flex flex-col items-center justify-center">
        
        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute right-4 z-10 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 shadow-xl backdrop-blur-md transition-all hover:scale-110"
              title="الصورة التالية"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute left-4 z-10 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 shadow-xl backdrop-blur-md transition-all hover:scale-110"
              title="الصورة السابقة"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Displayed Image */}
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <img
            src={currentImg.url}
            alt={currentImg.caption || 'صورة اللجنة'}
            className="max-w-full max-h-full object-contain rounded-2xl border border-slate-800 shadow-2xl"
          />
        </div>

        {/* Caption & Metadata Footer */}
        <div className="w-full max-w-2xl glass-panel rounded-2xl p-4 border border-slate-800 text-center space-y-2 mt-2">
          <p className="text-sm sm:text-base font-bold text-white">
            {currentImg.caption || 'صورة توثيقية من أعمال اللجنة الميدانية'}
          </p>
          
          <div className="flex items-center justify-center gap-4 text-xs text-slate-400 flex-wrap">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>{committee.location}</span>
            </div>
            {currentImg.date && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-teal-400" />
                <span>{currentImg.date}</span>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
