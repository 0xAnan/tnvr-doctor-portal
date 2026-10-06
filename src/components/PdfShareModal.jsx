import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, MessageCircle, Download, Loader2, RefreshCw } from 'lucide-react';
import { canSharePdf, sharePdf, downloadPdfFile } from '../utils/pdfShare';

export default function PdfShareModal({ committee, onPreparePdf, onClose }) {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState('جاري إعداد PDF...');
  const [error, setError] = useState('');
  const [sharing, setSharing] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const preparation = useRef(null);
  const shareBusy = useRef(false);
  const preparePdf = useRef(onPreparePdf);
  const progressListener = useRef(null);
  preparePdf.current = onPreparePdf;

  useEffect(() => {
    let active = true;
    setFile(null);
    setError('');
    setProgress('جاري إعداد PDF...');
    progressListener.current = message => { if (active) setProgress(message); };
    // Reuse the same preparation during StrictMode's effect replay.
    if (!preparation.current || preparation.current.committee !== committee || preparation.current.attempt !== attempt) {
      preparation.current = {
        committee, attempt,
        promise: Promise.resolve().then(() => preparePdf.current(committee, message => progressListener.current?.(message)))
      };
    }
    preparation.current.promise.then(
      prepared => { if (active) setFile(prepared); },
      failure => { if (active) setError(failure.message || 'تعذر إعداد PDF. حاول مرة أخرى.'); }
    );
    return () => { active = false; progressListener.current = null; };
  }, [committee, attempt]);

  const supported = file && canSharePdf(file);
  const handleShare = async () => {
    if (!file || shareBusy.current) return;
    shareBusy.current = true;
    setSharing(true);
    setError('');
    try {
      await sharePdf(file, `تقرير اللجنة: ${committee.title}`);
      onClose();
    } catch (failure) {
      if (failure.name !== 'AbortError') {
        setError('تعذر فتح المشاركة. أعد المحاولة أو حمّل PDF وأرفقه في واتساب.');
      }
    } finally {
      shareBusy.current = false;
      setSharing(false);
    }
  };

  return createPortal(
    <div className="no-print fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="pdf-share-title" className="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 shadow-xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 id="pdf-share-title" className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><MessageCircle className="w-5 h-5 text-emerald-600" />إرسال التقرير عبر واتساب</h2>
          <button onClick={onClose} disabled={sharing} aria-label="إغلاق مشاركة PDF" className="min-w-11 min-h-11 shrink-0 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 break-words">{committee.title}</p>
        {!file && !error && <p role="status" className="flex items-center gap-2 text-sm text-emerald-600"><Loader2 className="w-4 h-4 animate-spin" />{progress}</p>}
        {file && <p className="text-sm text-slate-600 dark:text-slate-300">
          {supported ? 'PDF جاهز. اضغط إرسال، ثم اختر واتساب وجهة الاتصال من قائمة المشاركة.' : 'جهازك لا يدعم مشاركة PDF مباشرة. حمّل الملف ثم أرفقه في محادثة واتساب.'}
        </p>}
        {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
        {file && <div className="space-y-2">
          {supported && <button onClick={handleShare} disabled={sharing} className="w-full min-h-12 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold disabled:opacity-60">
            {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}إرسال عبر واتساب
          </button>}
          <button onClick={() => downloadPdfFile(file)} disabled={sharing} className="w-full min-h-11 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold disabled:opacity-60"><Download className="w-4 h-4" />تحميل PDF</button>
        </div>}
        {!file && error && <button onClick={() => setAttempt(previous => previous + 1)} className="flex items-center gap-2 text-sm font-bold text-emerald-600"><RefreshCw className="w-4 h-4" />إعادة المحاولة</button>}
      </div>
    </div>, document.body
  );
}
