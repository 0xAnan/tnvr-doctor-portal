import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TopCounters from './components/TopCounters';
import CommitteeCard from './components/CommitteeCard';
import CommitteeModal from './components/CommitteeModal';
import ImageLightboxModal from './components/ImageLightboxModal';
import DetailViewModal from './components/DetailViewModal';
import AuditLogModal from './components/AuditLogModal';
import LoginPage from './components/LoginPage';
import {
  loginWithIdentifier,
  logoutFromFirebase,
  subscribeToAuthState
} from './auth';
import { initialCommittees, monthYearOptions } from './data/mockData';
import {
  subscribeToCloudCommittees,
  upsertCommitteeInCloud,
  moveToTrashBin,
  restoreFromTrashBin,
  deletePermanentlyFromTrash,
  resetCloudDBToDefault,
  processOfflineQueue,
  fetchAuditLogs,
  fetchTrashBin,
  fetchCommitteeImages,
  saveAllCommitteesToCloud,
  generateUniqueId
} from './cloudDb';
import { loadCommittees, saveCommittees } from './storage';
import {
  getCommitteeCities,
  groupCommitteesByCity,
  inferCommitteeCity,
  normalizeArabic
} from './utils/committeeCatalog';
import { Search, Plus, Dog, RefreshCw, Tag, Cloud, Loader2, History, MapPin, Calendar, Filter, XCircle, FileSpreadsheet } from 'lucide-react';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);

  const [authState, setAuthState] = useState({ ready: false, user: null });

  useEffect(() => subscribeToAuthState(
    user => setAuthState({ ready: true, user }),
    error => {
      console.error('Firebase authentication state error:', error);
      setAuthState({ ready: true, user: null });
    }
  ), []);

  const handleLogin = (username, password) => loginWithIdentifier(username, password);

  const handleLogout = async () => {
    if (window.confirm('هل تريد تسجيل الخروج من المنظومة؟')) {
      try {
        await logoutFromFirebase();
      } catch (error) {
        console.error('Failed to sign out:', error);
        window.alert('تعذر تسجيل الخروج. يرجى المحاولة مرة أخرى.');
      }
    }
  };

  // State initialization from local storage
  const [committees, setCommittees] = useState(loadCommittees);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudStatus, setCloudStatus] = useState('connecting');

  // Audit Logs & Trash Bin state
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [trashBin, setTrashBin] = useState([]);

  // Keep one realtime connection open. Firebase sends only the committee that
  // changed instead of downloading the full collection every few seconds.
  useEffect(() => {
    if (!authState.user) {
      setCloudStatus('offline');
      return undefined;
    }

    let active = true;
    setCloudStatus(navigator.onLine ? 'connecting' : 'offline');

    const applyCloudData = cloudData => {
      if (!active || !Array.isArray(cloudData)) return;

      setCommittees(previous => {
        const loadedImages = new Map(
          previous
            .filter(item => Array.isArray(item.images))
            .map(item => [item.id, item.images])
        );
        const merged = cloudData.map(item => (
          loadedImages.has(item.id)
            ? { ...item, images: loadedImages.get(item.id) }
            : item
        ));

        saveCommittees(merged);
        return merged;
      });
      setCloudStatus('online');
    };

    const handleCloudError = error => {
      console.error('Firebase realtime sync unavailable; using cached data:', error);
      if (active) setCloudStatus('offline');
    };

    processOfflineQueue().catch(handleCloudError);
    const unsubscribe = subscribeToCloudCommittees(applyCloudData, handleCloudError);

    const retryQueuedWrites = () => {
      if (!active) return;
      setCloudStatus('connecting');
      processOfflineQueue().catch(handleCloudError);
    };
    const handleOffline = () => setCloudStatus('offline');

    window.addEventListener('focus', retryQueuedWrites);
    window.addEventListener('online', retryQueuedWrites);
    window.addEventListener('offline', handleOffline);

    return () => {
      active = false;
      unsubscribe();
      window.removeEventListener('focus', retryQueuedWrites);
      window.removeEventListener('online', retryQueuedWrites);
      window.removeEventListener('offline', handleOffline);
    };
  }, [authState.user?.uid]);

  const loadAuditData = async () => {
    const logs = await fetchAuditLogs();
    const trash = await fetchTrashBin();
    setAuditLogs(logs);
    setTrashBin(trash);
  };

  const handleOpenAuditModal = async () => {
    setIsAuditModalOpen(true);
    await loadAuditData();
  };

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
  const [selectedCity, setSelectedCity] = useState('all');
  const [itemSortOrder, setItemSortOrder] = useState('name');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCommittee, setEditingCommittee] = useState(null);

  const [lightboxData, setLightboxData] = useState({
    isOpen: false,
    committee: null,
    imageIndex: 0
  });

  const [detailCommittee, setDetailCommittee] = useState(null);

  if (!authState.ready) {
    return (
      <div className="min-h-screen bg-slate-950 text-emerald-400 flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-bold">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>جاري التحقق من جلسة الدخول...</span>
        </div>
      </div>
    );
  }

  if (!authState.user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Extract unique doctor names for autocomplete
  const existingDoctors = Array.from(
    new Set(
      committees.flatMap(c => c.doctors || [c.doctorInCharge]).filter(Boolean)
    )
  );

  const handleSaveCommittee = async (committeeData) => {
    setIsSyncing(true);

    const isEdit = Boolean(committeeData.id);
    const targetId = committeeData.id || generateUniqueId();
    const fullEntry = { ...committeeData, id: targetId };

    // Optimistic local state update
    setCommittees(prev => {
      const exists = prev.some(c => c.id === targetId);
      const next = exists
        ? prev.map(c => c.id === targetId ? fullEntry : c)
        : [fullEntry, ...prev];
      saveCommittees(next);
      return next;
    });

    // Atomic cloud update + record audit log
    const cloudList = await upsertCommitteeInCloud(fullEntry, isEdit);
    if (cloudList && Array.isArray(cloudList)) {
      setCommittees(cloudList);
      saveCommittees(cloudList);
    }
    setIsSyncing(false);
  };

  const handleDeleteCommittee = async (id) => {
    const committeeItem = committees.find(c => c.id === id);
    if (!committeeItem) return;

    if (window.confirm(`هل أنت تأكد من نقل "${committeeItem.title}" إلى سلة المحذوفات؟ (يمكنك استعادتها في أي وقت)`)) {
      setIsSyncing(true);

      // Optimistic local state delete
      setCommittees(prev => {
        const next = prev.filter(c => c.id !== id);
        saveCommittees(next);
        return next;
      });

      // Move to Trash Bin in cloud
      const cloudList = await moveToTrashBin(committeeItem);
      if (cloudList && Array.isArray(cloudList)) {
        setCommittees(cloudList);
        saveCommittees(cloudList);
      }
      setIsSyncing(false);
    }
  };

  const handleRestoreFromTrash = async (item) => {
    setIsSyncing(true);
    const cloudList = await restoreFromTrashBin(item);
    if (cloudList && Array.isArray(cloudList)) {
      setCommittees(cloudList);
      saveCommittees(cloudList);
    }
    await loadAuditData();
    setIsSyncing(false);
  };

  const handlePermanentDelete = async (id) => {
    if (window.confirm('هل تريد حذف هذه اللجنة نهائياً من سلة المحذوفات؟ لن يمكنك استعادتها.')) {
      setIsSyncing(true);
      await deletePermanentlyFromTrash(id);
      await loadAuditData();
      setIsSyncing(false);
    }
  };

  const handleRestoreFromBackupFile = async (parsedArray) => {
    setIsSyncing(true);
    await saveAllCommitteesToCloud(parsedArray);
    setCommittees(parsedArray);
    saveCommittees(parsedArray);
    setIsSyncing(false);
  };

  const handleResetData = async () => {
    if (window.confirm('هل تريد استعادة البيانات النموذجية الافتراضية في السحابة؟')) {
      setIsSyncing(true);
      const cloudList = await resetCloudDBToDefault();
      if (cloudList && Array.isArray(cloudList)) {
        setCommittees(cloudList);
        saveCommittees(cloudList);
      }
      setIsSyncing(false);
    }
  };

  const handleExportData = () => {
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
      JSON.stringify(committees, null, 2)
    )}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `TNVR_Committees_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const loadCommitteeImages = async committee => {
    if (Array.isArray(committee.images)) return committee;

    const images = await fetchCommitteeImages(committee.id);
    if (!Array.isArray(images)) {
      return { ...committee, _preserveExistingImages: true };
    }

    const hydrated = { ...committee, images };
    setCommittees(previous => previous.map(item => (
      item.id === committee.id ? hydrated : item
    )));
    return hydrated;
  };

  // Open previews immediately, then replace them with the full images once.
  const openCommitteeLightbox = async (committee, imgIdx) => {
    setLightboxData({
      isOpen: true,
      committee,
      imageIndex: imgIdx
    });

    const hydrated = await loadCommitteeImages(committee);
    setLightboxData(previous => (
      previous.isOpen && previous.committee?.id === committee.id
        ? { ...previous, committee: hydrated }
        : previous
    ));
  };

  const openCommitteeDetails = async committee => {
    setDetailCommittee(committee);
    const hydrated = await loadCommitteeImages(committee);
    setDetailCommittee(previous => previous?.id === committee.id ? hydrated : previous);
  };

  const openCommitteeEditor = async committee => {
    setIsSyncing(true);
    const hydrated = await loadCommitteeImages(committee);
    setEditingCommittee(hydrated);
    setIsAddModalOpen(true);
    setIsSyncing(false);
  };

  // Filter logic
  const cityOptions = getCommitteeCities(committees);
  const filteredCommittees = committees.filter(c => {
    const docs = c.doctors || [c.doctorInCharge];
    const cityKey = normalizeArabic(inferCommitteeCity(c));
    const matchesSearch =
      String(c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(c.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      docs.some(d => d && d.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMonthYear =
      selectedMonthYear === 'all' || c.monthYear === selectedMonthYear;
    const matchesCity = selectedCity === 'all' || cityKey === selectedCity;

    return matchesSearch && matchesMonthYear && matchesCity;
  });

  // Calculate filtered stats overview
  const totalFilteredCommittees = filteredCommittees.length;
  const totalFilteredDogs = filteredCommittees.reduce(
    (acc, c) => acc + (Number(c.count) || ((Number(c.malesCount) || 0) + (Number(c.femalesCount) || 0))),
    0
  );
  const totalFilteredMales = filteredCommittees.reduce(
    (acc, c) => acc + (Number(c.malesCount) || 0),
    0
  );
  const totalFilteredFemales = filteredCommittees.reduce(
    (acc, c) => acc + (Number(c.femalesCount) || 0),
    0
  );

  const isFilterActive = searchQuery !== '' || selectedMonthYear !== 'all' || selectedCity !== 'all';

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedMonthYear('all');
    setSelectedCity('all');
  };

  const committeeGroups = groupCommitteesByCity(filteredCommittees, itemSortOrder);

  const selectedCityLabel = cityOptions.find(o => o.key === selectedCity)?.city || selectedCity;

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
        onLogout={handleLogout}
        onOpenAuditModal={handleOpenAuditModal}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        
        {/* Cloud synchronization status */}
        <div className={`mb-4 px-4 py-2.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
          cloudStatus === 'online'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300'
            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              cloudStatus === 'online' ? 'bg-emerald-500' : 'bg-amber-500'
            } ${cloudStatus === 'connecting' ? 'animate-ping' : ''}`} />
            <Cloud className="w-4 h-4" />
            <span>
              {cloudStatus === 'online' && 'متصل بالمزامنة اللحظية الموفرة للبيانات'}
              {cloudStatus === 'connecting' && 'جاري الاتصال بالسحابة — البيانات المحفوظة متاحة'}
              {cloudStatus === 'offline' && 'وضع محلي آمن — ستتم مزامنة التغييرات عند عودة الخدمة'}
            </span>
          </div>
          {isSyncing ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              جاري المزامنة بالسحابة...
            </span>
          ) : (
            <button
              onClick={handleOpenAuditModal}
              className="text-[11px] text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1"
            >
              <History className="w-3.5 h-3.5" />
              <span>عرض سجل التوثيق والسلة</span>
            </button>
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
              عرض وتقارير اللجان الميدانية مجمعة حسب المدينة ومرتبة حسب اسم الحملة
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

        {/* Search, Month-Year, City, and Date Sorting Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4">
          
          {/* Search bar */}
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث بالموقع، الحي، أو اسم الطبيب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Month Filter */}
          <div className="sm:col-span-3 relative">
            <Tag className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <select
              value={selectedMonthYear}
              onChange={(e) => setSelectedMonthYear(e.target.value)}
              className="w-full pl-4 pr-10 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
            >
              <option value="all">جميع فترات الحملات (2025 - 2027) 📅</option>
              {monthYearOptions.map((opt, idx) => (
                <option key={idx} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* City Filter */}
          <div className="sm:col-span-2 relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <select
              value={selectedCity}
              onChange={(event) => setSelectedCity(event.target.value)}
              className="w-full pl-4 pr-10 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
            >
              <option value="all">جميع المدن</option>
              {cityOptions.map(option => (
                <option key={option.key} value={option.key}>
                  {option.city}
                </option>
              ))}
            </select>
          </div>

          {/* Date Sorting Direction Toggle */}
          <div className="sm:col-span-3 relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <select
              value={itemSortOrder}
              onChange={(e) => setItemSortOrder(e.target.value)}
              className="w-full pl-4 pr-10 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer font-semibold"
            >
              <option value="name">اسم الحملة: الأولى، التانية، التالتة…</option>
              <option value="desc">تاريخ اللجنة: من الأحدث للأقدم ⬇️</option>
              <option value="asc">تاريخ اللجنة: من الأقدم للأحدث ⬆️</option>
            </select>
          </div>

        </div>

        {/* Dynamic Filter Overview Summary Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md border border-slate-700/50 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-2.5">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-black text-slate-100">
                {isFilterActive ? 'ملخص التصفية المحددة:' : 'ملخص إجمالي اللجان المعروضة:'}
              </h3>
            </div>

            {isFilterActive && (
              <button
                onClick={resetAllFilters}
                className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 transition-colors self-start sm:self-auto"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>إلغاء التصفية وإعادة العرض الكلي</span>
              </button>
            )}
          </div>

          {/* Active Filter Badges */}
          {isFilterActive && (
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-slate-400">الفلاتر النشطة:</span>
              {selectedCity !== 'all' && (
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  المدينة: {selectedCityLabel}
                </span>
              )}
              {selectedMonthYear !== 'all' && (
                <span className="px-2.5 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
                  الفترة: {selectedMonthYear}
                </span>
              )}
              {searchQuery !== '' && (
                <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                  البحث: "{searchQuery}"
                </span>
              )}
            </div>
          )}

          {/* Overview Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            
            <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-700/40 text-center">
              <span className="block text-[11px] text-slate-400 font-semibold">عدد اللجان</span>
              <span className="text-base font-black text-emerald-400">{totalFilteredCommittees} لجنة</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-700/40 text-center">
              <span className="block text-[11px] text-slate-400 font-semibold">إجمالي الكلاب المعقمة</span>
              <span className="text-base font-black text-white">{totalFilteredDogs} كلب</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-700/40 text-center">
              <span className="block text-[11px] text-blue-300 font-semibold">♂️ الذكور</span>
              <span className="text-base font-black text-blue-400">{totalFilteredMales}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-700/40 text-center">
              <span className="block text-[11px] text-rose-300 font-semibold">♀️ الإناث</span>
              <span className="text-base font-black text-rose-400">{totalFilteredFemales}</span>
            </div>

          </div>
        </div>

        {/* Committees Grid grouped by city */}
        {filteredCommittees.length > 0 ? (
          <div className="space-y-8">
            {committeeGroups.map(group => (
              <section key={normalizeArabic(group.city)} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        {group.city}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {group.committees.length} {group.committees.length === 1 ? 'لجنة' : 'لجان'} · {
                          itemSortOrder === 'name'
                            ? 'مرتبة بحسب اسم ورقم الحملة'
                            : `مرتبة بحسب تاريخ اللجنة ${itemSortOrder === 'desc' ? '(الأحدث أولاً)' : '(الأقدم أولاً)'}`
                        }
                      </p>
                    </div>
                  </div>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {group.committees.map(committee => (
                    <CommitteeCard
                      key={committee.id}
                      committee={committee}
                      onOpenLightbox={openCommitteeLightbox}
                      onOpenDetail={openCommitteeDetails}
                      onOpenEdit={openCommitteeEditor}
                      onDelete={handleDeleteCommittee}
                      onAddPhoto={openCommitteeEditor}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="clean-card rounded-2xl p-8 text-center space-y-2 border border-slate-200 dark:border-slate-800 max-w-md mx-auto my-8">
            <Dog className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">لا توجد لجان مطابقة للتصفية الحالية</h3>
            <p className="text-xs text-slate-400">يمكنك تعديل التصفية أو إلغائها لعرض باقي اللجان</p>
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
        onOpenLightbox={openCommitteeLightbox}
        onAddPhoto={openCommitteeEditor}
      />

      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        auditLogs={auditLogs}
        trashBin={trashBin}
        onRestoreFromTrash={handleRestoreFromTrash}
        onPermanentDelete={handlePermanentDelete}
        onExportData={handleExportData}
        onRestoreFromBackupFile={handleRestoreFromBackupFile}
      />

    </div>
  );
}
