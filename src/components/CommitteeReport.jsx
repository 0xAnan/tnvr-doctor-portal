import React from 'react';

export function getReportCounts(committee) {
  const males = Number(committee.malesCount) || 0;
  const females = Number(committee.femalesCount) || 0;
  const total = Number(committee.count ?? committee.totalDogs ?? (males + females)) || 0;
  return { males, females, total };
}

export default function CommitteeReport({ committee, reportRef, onOpenLightbox }) {
  const { males, females, total } = getReportCounts(committee);
  const doctors = committee.doctors?.filter(Boolean).length
    ? committee.doctors.filter(Boolean)
    : committee.doctorInCharge ? [committee.doctorInCharge] : [];
  const imagesLoaded = Array.isArray(committee.images);
  const images = imagesLoaded ? committee.images : [];

  return (
    <article ref={reportRef} className="committee-report" dir="rtl" lang="ar" aria-label="تقرير اللجنة الميدانية">
      <header className="report-heading" data-report-block>
        <p className="report-eyebrow">منظومة متابعة اللجان الميدانية</p>
        <h1 data-report-flow>{committee.title || 'تقرير اللجنة الميدانية'}</h1>
        <p>تقرير أعمال التعقيم والتحصين البيطري</p>
      </header>

      <div className="report-counts" data-report-block>
        <div><span>إجمالي الكلاب المعقمة والمحصنة</span><strong>{total}</strong></div>
        <div><span>الذكور</span><strong>{males}</strong></div>
        <div><span>الإناث</span><strong>{females}</strong></div>
      </div>

      <section className="report-section">
        <h2 data-report-block>بيانات اللجنة</h2>
        <dl className="report-details">
          <div data-report-block><dt>اسم اللجنة</dt><dd data-report-flow>{committee.title || 'غير مسجل'}</dd></div>
          <div data-report-block><dt>الموقع</dt><dd data-report-flow>{committee.location || 'غير مسجل'}</dd></div>
          <div data-report-block><dt>تاريخ اللجنة</dt><dd><bdi data-report-flow>{committee.date || 'غير مسجل'}</bdi></dd></div>
        </dl>
      </section>

      <section className="report-section">
        <h2 data-report-block>الأطباء المسؤولون ({doctors.length})</h2>
        {doctors.length > 0 ? (
          <ol className="report-doctors">
            {doctors.map((doctor, index) => (
              <li key={index} data-report-block><span>{index + 1}.</span><span data-report-flow>{doctor}</span></li>
            ))}
          </ol>
        ) : <p data-report-block>لم تُسجل أسماء الأطباء.</p>}
      </section>

      <section className="report-section">
        <h2 data-report-block>الملاحظات والتقرير الطبي الميداني</h2>
        <p className="report-notes" data-report-block data-report-flow>
          {committee.notes || 'لا توجد ملاحظات إضافية.'}
        </p>
      </section>

      <section className="report-section">
        <h2 data-report-block>الصور المرفقة ({imagesLoaded ? images.length : Number(committee.imageCount) || 0})</h2>
        {!imagesLoaded ? (
          <p data-report-block>{committee._preserveExistingImages ? 'تعذر تحميل الصور. أعد المحاولة قبل تصدير التقرير.' : 'جاري تحميل جميع الصور...'}</p>
        ) : images.length === 0 ? <p data-report-block>لا توجد صور مرفقة بهذه اللجنة.</p> : (
          <div className="report-photos">
            {images.map((image, index) => (
              <figure key={index} className="report-photo" data-report-block>
                <div className="report-photo-frame">
                  <img
                    src={image.url}
                    crossOrigin="anonymous"
                    alt={image.caption || `صورة اللجنة ${index + 1}`}
                    onClick={onOpenLightbox ? () => onOpenLightbox(committee, index) : undefined}
                  />
                </div>
                <figcaption>
                  <strong data-report-flow>صورة {index + 1}: {image.caption || 'توثيق أعمال اللجنة الميدانية'}</strong>
                  {image.date && <span>تاريخ الصورة: <bdi data-report-flow>{image.date}</bdi></span>}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>
      <footer className="report-footer" data-report-block>منظومة متابعة اللجان الميدانية وتعقيم الكلاب الضالة</footer>
    </article>
  );
}
