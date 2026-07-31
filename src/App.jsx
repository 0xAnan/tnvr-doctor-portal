import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TopCounters from './components/TopCounters';
import CommitteeCard from './components/CommitteeCard';
import CommitteeModal from './components/CommitteeModal';
import ImageLightboxModal from './components/ImageLightboxModal';
import DetailViewModal from './components/DetailViewModal';
import { initialCommittees, monthYearOptions } from './data/mockData';
import {
  fetchCloudCommittees,
  upsertCommitteeInCloud,
  deleteCommitteeFromCloudDB,
  resetCloudDBToDefault
} from './cloudDb';
import { loadCommittees, saveCommittees } from './storage';
import { Search, Plus, Dog, RefreshCw, Tag, Cloud, CheckCircle2, Loader2 } from 'lucide-react';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);

  // Load from local storage initially for instant render, then sync live with Firebase Cloud DB
  const [committees, setCommittees] = useState(loadCommittees);
  const [isCloudConnected, setIsCloudConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync with Live Firebase Cloud DB on mount & poll every 3 seconds for real-time cross-device sync
  useEffect(() => {
    let isMounted = true;

    async function syncWithCloud() {
      const cloudData = await fetchCloudCommittees();
      if (isMounted && cloudData && Array.isArray(cloudData)) {
        setCommittees(cloudData);
        saveCommittees(cloudData);
        setIsCloudConnected(true);
      }
    }

    // Initial sync
    syncWithCloud();

    // Poll Firebase Cloud DB every 3 seconds for instant updates from other devices/incognito tabs
    const interval = setInterval(syncWithCloud, 3000);

    // Sync on tab focus
    const handleFocus = () => syncWithCloud();
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [darkMode]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonthYear, setSelectedMonthYear] = useState('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCommittee, setEditingCommittee] = useState(null);

  const [lightboxData, setLightboxData] = useState({
    isOpen: false,
    committee: null,
    imageIndex: 0
  });

  const [detailCommittee, setDetailCommittee] = useState(null);

  // Extract unique doctor names for autocomplete
  const existingDoctors = Array.from(
    new Set(
      committees.flatMap(c => c.doctors || [c.doctorInCharge]).filter(Boolean)
    )
  );

  const handleSaveCommittee = async (committeeData) => {
    setIsSyncing(true);
    // Optimistic UI update
    let tempNext;
    if (committeeData.id) {
      tempNext = committees.map(c => c.id === committeeData.id ? committeeData : c);
    } else {
      tempNext = [{ ...committeeData, id: `cm-${Date.now().toString().slice(-4)}` }, ...committees];
    }
    setCommittees(tempNext);
    saveCommittees(tempNext);

    // Write directly to Firebase Cloud DB
    const cloudList = await upsertCommitteeInCloud(committeeData);
    if (cloudList && Array.isArray(cloudList)) {
      setCommittees(cloudList);
      saveCommittees(cloudList);
    }
    setIsSyncing(false);
  };

  const handleDeleteCommittee = async (id) => {
    if (window.confirm('هل أنت تأكد من حذف هذه اللجنة نهائياً من السحابة والجميع؟')) {
      setIsSyncing(true);
      // Optimistic UI delete
      const tempNext = committees.filter(c => c.id !== id);
      setCommittees(tempNext);
      saveCommittees(tempNext);

      // Delete directly from Firebase Cloud DB
      const cloudList = await deleteCommitteeFromCloudDB(id);
      if (cloudList && Array.isArray(cloudList)) {
        setCommittees(cloudList);
        saveCommittees(cloudList);
      }
      setIsSyncing(false);
    }
  };

  const handleResetData = async () => {
    if (window.confirm('هل تريد استعادة البيانات النموذجية الافتراضية في السحابة؟')) {
      setIsSyncing(true);
      const cloudList = await resetCloudDBToDefault();
      setCommittees(cloudList);
      saveCommittees(cloudList);
      setIsSyncing(false);
    }
  };

  const handleExportData = () => {
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
      JSON.stringify(committees, null, 2)
    )}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `TNVR_Committees_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // Filter logic
  const filteredCommittees = committees.filter(c => {
    const docs = c.doctors || [c.doctorInCharge];
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      docs.some(d => d && d.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMonthYear =
      selectedMonthYear === 'all' || c.monthYear === selectedMonthYear;

    return matchesSearch && matchesMonthYear;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-cairo">
      
      {/* Top Navbar */}
      <Navbar
        onOpenAddModal={() => {
          setEditingCommittee(null);
          setIsAddModalOpen(true);
        }}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onExportData={handleExportData}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        
        {/* Firebase Live Cloud DB Banner */}
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <Cloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>متصل بقاعدة البيانات السحابية (Firebase Cloud DB): مُزامنة حية بين جميع الهواتف والأجهزة والأطقم البيطرية</span>
          </div>
          {isSyncing ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              جاري المزاحمة...
            </span>
          ) : (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
              أي إضافة أو حذف يظهر فوراً للجميع وفي التصفح الخفي
            </span>
          )}
        </div>

        {/* Top Counters Banner */}
        <TopCounters committees={committees} />

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              قائمة اللجان الميدانية ({filteredCommittees.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              عرض وتقارير اللجان الميدانية والمواقع وأعداد الكلاب المعقمة والمحصنة
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetData}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs font-semibold hover:bg-slate-100 flex items-center gap-1"
              title="إعادة تصفير البيانات للنموذجي في السحابة"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>إعادة تصفير للنموذجي</span>
            </button>
            
            <button
              onClick={() => {
                setEditingCommittee(null);
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة لجنة جديدة</span>
            </button>
          </div>
        </div>

        {/* Search and Month-Year Category Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-6">
          
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث بالموقع، الحي، أو اسم الطبيب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="sm:col-span-4 relative">
            <Tag className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <select
              value={selectedMonthYear}
              onChange={(e) => setSelectedMonthYear(e.target.value)}
              className="w-full pl-4 pr-10 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
            >
              <option value="all">جميع فترات الحملات (2024 - 2027) 📅</option>
              {monthYearOptions.map((opt, idx) => (
                <option key={idx} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Committees Grid */}
        {filteredCommittees.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCommittees.map(committee => (
              <CommitteeCard
                key={committee.id}
                committee={committee}
                onOpenLightbox={(c, imgIdx) => {
                  setLightboxData({
                    isOpen: true,
                    committee: c,
                    imageIndex: imgIdx
                  });
                }}
                onOpenDetail={(c) => setDetailCommittee(c)}
                onOpenEdit={(c) => {
                  setEditingCommittee(c);
                  setIsAddModalOpen(true);
                }}
                onDelete={handleDeleteCommittee}
                onAddPhoto={(c) => {
                  setEditingCommittee(c);
                  setIsAddModalOpen(true);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="clean-card rounded-2xl p-8 text-center space-y-2 border border-slate-200 dark:border-slate-800 max-w-md mx-auto my-8">
            <Dog className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">لا توجد لجان حالياً في السحابة</h3>
            <p className="text-xs text-slate-400">يمكنك إضافة لجنة جديدة من الزر بأعلى الشاشة</p>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400 no-print">
        منظومة متابعة اللجان الميدانية وتعقيم الكلاب الضالة
      </footer>

      {/* Modals */}
      <CommitteeModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingCommittee(null);
        }}
        onSave={handleSaveCommittee}
        editingCommittee={editingCommittee}
        existingDoctors={existingDoctors}
      />

      <ImageLightboxModal
        isOpen={lightboxData.isOpen}
        onClose={() => setLightboxData({ isOpen: false, committee: null, imageIndex: 0 })}
        committee={lightboxData.committee}
        initialImageIndex={lightboxData.imageIndex}
      />

      <DetailViewModal
        isOpen={!!detailCommittee}
        onClose={() => setDetailCommittee(null)}
        committee={detailCommittee}
        onOpenLightbox={(c, imgIdx) => {
          setLightboxData({
            isOpen: true,
            committee: c,
            imageIndex: imgIdx
          });
        }}
        onAddPhoto={(c) => {
          setEditingCommittee(c);
          setIsAddModalOpen(true);
        }}
      />

    </div>
  );
}
