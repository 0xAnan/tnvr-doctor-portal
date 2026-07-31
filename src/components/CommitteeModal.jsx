import React, { useState, useEffect } from 'react';
import { X, Upload, Plus, Trash2, Camera, MapPin, Calendar, Dog, User, FileText, Check } from 'lucide-react';
import { sampleImageOptions } from '../data/mockData';

export default function CommitteeModal({ isOpen, onClose, onSave, editingCommittee }) {
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00 ص',
    count: 0, // Combined single number for "الكلاب المعقمة والمحصنة"
    doctorInCharge: '',
    status: 'completed',
    notes: '',
    images: []
  });

  useEffect(() => {
    if (editingCommittee) {
      setFormData({
        ...editingCommittee,
        count: editingCommittee.count ?? editingCommittee.totalDogs ?? Math.max(editingCommittee.sterilizedCount || 0, editingCommittee.vaccinatedCount || 0),
        images: editingCommittee.images ? [...editingCommittee.images] : []
      });
    } else {
      setFormData({
        title: '',
        location: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00 ص',
        count: 0,
        doctorInCharge: 'د. طبيب بيطري',
        status: 'completed',
        notes: '',
        images: []
      });
    }
  }, [editingCommittee, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          images: [
            ...prev.images,
            {
              url: reader.result,
              caption: file.name.replace(/\.[^/.]+$/, ""),
              date: new Date().toISOString().replace('T', ' ').substring(0, 16)
            }
          ]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddSampleImage = (sample) => {
    setFormData(prev => ({
      ...prev,
      images: [
        ...prev.images,
        {
          url: sample.url,
          caption: sample.caption,
          date: new Date().toISOString().replace('T', ' ').substring(0, 16)
        }
      ]
    }));
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.location) {
      alert('يرجى كتابة اسم اللجنة والموقع');
      return;
    }
    onSave({
      ...formData,
      count: Number(formData.count) || 0
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl clean-card rounded-2xl shadow-xl overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingCommittee ? 'تعديل بيانات اللجنة' : 'إضافة لجنة جديدة'}
            </h2>
            <p className="text-xs text-slate-500">
              سجل تفاصيل الموقع وتاريخ اللجنة وأعداد الكلاب المعقمة والمحصنة
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              اسم اللجنة / الحملة *
            </label>
            <input
              type="text"
              name="title"
              required
              placeholder="مثال: لجنة حي المعادي - الحملة الأولى"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              الموقع *
            </label>
            <input
              type="text"
              name="location"
              required
              placeholder="مثال: القاهرة - حي المعادي (شارع 9 والزهراء)"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                التاريخ
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                الوقت
              </label>
              <input
                type="text"
                name="time"
                placeholder="09:00 ص"
                value={formData.time}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* COMBINED COUNT FIELD: عدد الكلاب المعقمة والمحصنة */}
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 space-y-1.5">
            <label className="block text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <Dog className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              عدد الكلاب المعقمة والمحصنة (العدد الإجمالي)
            </label>
            <input
              type="number"
              min="0"
              name="count"
              value={formData.count}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-extrabold text-xl focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                الطبيب المسؤول
              </label>
              <input
                type="text"
                name="doctorInCharge"
                placeholder="د. محمد أحمد"
                value={formData.doctorInCharge}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                حالة اللجنة
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="completed">مكتملة 🟢</option>
                <option value="active">جاري اليوم 🟡</option>
                <option value="pending">مجدولة 🔵</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              الملاحظات والتقرير
            </label>
            <textarea
              name="notes"
              rows="2"
              placeholder="أي ملاحظات بيطرية إضافية..."
              value={formData.notes}
              onChange={handleChange}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Attached Images */}
          <div className="pt-2 space-y-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>إرفاق صور اللجنة ({formData.images.length})</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <label className="px-3 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer hover:border-emerald-500 transition-colors flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-emerald-500" />
                <span>رفع صورة</span>
                <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
              </label>

              {sampleImageOptions.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddSampleImage(sample)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-colors"
                >
                  + {sample.caption}
                </button>
              ))}
            </div>

            {formData.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {formData.images.map((img, index) => (
                  <div key={index} className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 p-1 rounded-md bg-rose-600 text-white text-xs"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1"
            >
              <Check className="w-4 h-4" />
              <span>حفظ البيانات</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
