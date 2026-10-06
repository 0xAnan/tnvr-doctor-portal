import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Download, Loader2, RefreshCw } from 'lucide-react';
import CommitteeReport from './CommitteeReport';

export default function DetailViewModal({ isOpen, onClose, committee, onOpenLightbox, onRetryImages }) {
  const reportRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setError(''); }, [committee?.id, isOpen]);
  if (!isOpen || !committee) return null;

  const imagesReady = Array.isArray(committee.images);
  const handleExport = async mode => {
    if (exporting || !imagesReady) return;
    setExporting(true);
    setError('');
    try {
      const { downloadCommitteePdf, prepareReportAssets } = await import('../utils/committeePdf');
      if (mode === 'print') {
        await prepareReportAssets(reportRef.current);
        window.print();
      } else {
        await downloadCommitteePdf(reportRef.current, committee);
      }
    } catch (exportError) {
      console.error('Committee report export failed:', exportError);
      setError(exportError.message || 'تعذر إعداد التقرير. يرجى المحاولة مرة أخرى.');
    } finally {
      setExporting(false);
    }
  };

  return createPortal(
    <div className="committee-report-modal fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm">
      <div className="committee-report-dialog w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 shadow-xl overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
        <div className="no-print flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 id="report-modal-title" className="text-base font-bold text-slate-900 dark:text-white">تقرير اللجنة</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => handleExport('pdf')} disabled={exporting || !imagesReady} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-50 disabled:cursor-wait">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{exporting ? 'جاري إعداد التقرير...' : 'تحميل PDF'}</span>
            </button>
            <button onClick={() => handleExport('print')} disabled={exporting || !imagesReady} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold disabled:opacity-50">
              <Printer className="w-4 h-4" /><span>طباعة</span>
            </button>
            <button onClick={onClose} disabled={exporting} aria-label="إغلاق التقرير" className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"><X className="w-5 h-5" /></button>
          </div>
        </div>
        {!imagesReady && (
          <div className="no-print px-6 py-3 text-sm text-slate-700 dark:text-slate-200" role="status">
            {committee._preserveExistingImages ? (
              <button onClick={() => onRetryImages(committee)} className="flex items-center gap-2 text-rose-600"><RefreshCw className="w-4 h-4" />تعذر تحميل الصور. اضغط لإعادة المحاولة.</button>
            ) : 'جاري تحميل جميع الصور قبل الطباعة أو التحميل...'}
          </div>
        )}
        {error && <p className="no-print px-6 py-3 text-sm text-rose-600" role="alert">{error}</p>}
        <div className="committee-report-scroll max-h-[75vh] overflow-y-auto">
          <CommitteeReport committee={committee} reportRef={reportRef} onOpenLightbox={onOpenLightbox} />
        </div>
      </div>
    </div>,
    document.body
  );
}
