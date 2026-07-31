import React, { useState, useEffect } from 'react';
import { X, Upload, Plus, Trash2, Camera, MapPin, Calendar, Dog, User, FileText, Check, Loader2 } from 'lucide-react';
import { sampleImageOptions, monthYearOptions } from '../data/mockData';
import { compressImage } from '../utils/imageCompressor';

export default function CommitteeModal({ isOpen, onClose, onSave, editingCommittee, existingDoctors = [] }) {
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    monthYear: 'يوليو 2026',
    malesCount: 0,
    femalesCount: 0,
    doctors: ['', ''], // Default 2 slots
    notes: '',
    images: []
  });

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (editingCommittee) {
      let docs = editingCommittee.doctors || [];
      if (editingCommittee.doctorInCharge && docs.length === 0) {
        docs = [editingCommittee.doctorInCharge];
      }
      while (docs.length < 2) {
        docs.push('');
      }

      setFormData({
        ...editingCommittee,
        monthYear: editingCommittee.monthYear || 'يوليو 2026',
        malesCount: Number(editingCommittee.malesCount) || 0,
        femalesCount: Number(editingCommittee.femalesCount) || 0,
        doctors: docs,
        images: editingCommittee.images ? [...editingCommittee.images] : []
      });
    } else {
      setFormData({
        title: '',
        location: '',
        date: new Date().toISOString().split('T')[0],
        monthYear: 'يوليو 2026',
        malesCount: 0,
        femalesCount: 0,
        doctors: ['', ''],
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

  const handleDoctorChange = (index, value) => {
    setFormData(prev => {
      const updatedDocs = [...prev.doctors];
      updatedDocs[index] = value;
      return { ...prev, doctors: updatedDocs };
    });
  };

  const handleAddDoctorSlot = () => {
    setFormData(prev => ({
      ...prev,
      doctors: [...prev.doctors, '']
    }));
  };

  const handleRemoveDoctorSlot = (index) => {
    setFormData(prev => ({
      ...prev,
      doctors: prev.doctors.filter((_, idx) => idx !== index)
    }));
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    for (const file of files) {
      const compressedUrl = await compressImage(file);
      if (compressedUrl) {
        setFormData(prev => ({
          ...prev,
          images: [
            ...prev.images,
            {
              url: compressedUrl,
              caption: file.name.replace(/\.[^/.]+$/, ""),
              date: new Date().toISOString().substring(0, 10)
            }
          ]
        }));
      }
    }
    setIsUploading(false);
  };

  const handleAddSampleImage = (sample) => {
    setFormData(prev => ({
      ...prev,
      images: [
        ...prev.images,
        {
          url: sample.url,
          caption: sample.caption,
          date: new Date().toISOString().substring(0, 10)
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

    const cleanedDoctors = formData.doctors.map(d => d.trim()).filter(Boolean);
    const m = Number(formData.malesCount) || 0;
    const f = Number(formData.femalesCount) || 0;

    onSave({
      ...formData,
      malesCount: m,
      femalesCount: f,
      count: m + f,
      doctors: cleanedDoctors.length > 0 ? cleanedDoctors : ['د. طبيب بيطري'],
      doctorInCharge: cleanedDoctors[0] || 'د. طبيب بيطري'
    });
    onClose();
  };

  const combinedTotal = (Number(formData.malesCount) || 0) + (Number(formData.femalesCount) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      
      <datalist id="existing-doctors-list">
        {existingDoctors.map((doc, idx) => (
          <option key={idx} value={doc} />
        ))}
      </datalist>

      <div className="relative w-full max-w-2xl clean-card rounded-2xl shadow-xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingCommittee ? 'تعديل بيانات اللجنة' : 'إضافة لجنة جديدة'}
            </h2>
            <p className="text-xs text-slate-500">
              سجل تفاصيل الموقع والفترة وأعداد الكلاب والأطباء المسؤولين
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Title */}
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

          {/* Location */}
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

          {/* Date & Month-Year Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Actual Committee Date */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                تاريخ اللجنة الفعلي *
              </label>
              <input
                type="date"
                name="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Campaign Month & Year Category */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                فترة الحملة (الشهر والسنة) *
              </label>
              <select
                name="monthYear"
                value={formData.monthYear}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-emerald-500"
              >
                {monthYearOptions.map((opt, idx) => (
                  <option key={idx} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

          </div>

          {/* DOGS MALE / FEMALE BREAKDOWN */}
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Dog className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                أعداد الكلاب المعقمة والمحصنة (ذُكور وإناث)
              </label>
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-0.5 rounded-full">
                الإجمالي: {combinedTotal} كلب
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-blue-700 dark:text-blue-300">
                  ♂️ عدد الذكور
                </label>
                <input
                  type="number"
                  min="0"
                  name="malesCount"
                  value={formData.malesCount}
                  onChange={handleChange}
                  className="w-full px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800/50 text-blue-800 dark:text-blue-300 font-extrabold text-lg focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-rose-700 dark:text-rose-300">
                  ♀️ عدد الإناث
                </label>
                <input
                  type="number"
                  min="0"
                  name="femalesCount"
                  value={formData.femalesCount}
                  onChange={handleChange}
                  className="w-full px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300 font-extrabold text-lg focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* ASSIGNED DOCTORS SLOTS WITH AUTOCOMPLETE */}
          <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-500" />
                الأطباء البيطريون المسؤولون
              </label>
              <button
                type="button"
                onClick={handleAddDoctorSlot}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                إضافة طبيب آخر
              </button>
            </div>

            <div className="space-y-2">
              {formData.doctors.map((doctorName, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold w-14">
                    طبيب #{idx + 1}:
                  </span>
                  <input
                    type="text"
                    list="existing-doctors-list"
                    placeholder="اكتب اسم الطبيب (يتوفر اقتراح تلقائي)..."
                    value={doctorName}
                    onChange={(e) => handleDoctorChange(idx, e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-emerald-500"
                  />
                  {formData.doctors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDoctorSlot(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="حذف هذا الطبيب"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1 pt-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              الملاحظات والتقرير البيطري
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
              {isUploading && (
                <span className="text-emerald-500 flex items-center gap-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  جاري ضغط وتحسين الصورة...
                </span>
              )}
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

          {/* Form Actions */}
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
              disabled={isUploading}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1 disabled:opacity-50"
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
