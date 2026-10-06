const REPORT_WIDTH = 794;
const PAGE_MARGIN = 12;
const PDF_CONTENT_WIDTH = 210 - PAGE_MARGIN * 2;
const PDF_CONTENT_HEIGHT = 297 - PAGE_MARGIN * 2 - 6;
const PAGE_HEIGHT = Math.floor(PDF_CONTENT_HEIGHT * REPORT_WIDTH / PDF_CONTENT_WIDTH);

export async function prepareReportAssets(report) {
  if (!report) throw new Error('تعذر العثور على التقرير. أعد فتحه وحاول مرة أخرى.');
  await document.fonts.ready;
  await Promise.all(Array.from(report.querySelectorAll('img')).map(async image => {
    try {
      await image.decode();
      if (!image.naturalWidth) throw new Error('Empty image');
    } catch {
      throw new Error('تعذر تحميل إحدى الصور. تحقق من الاتصال بالإنترنت أو رابط الصورة ثم أعد المحاولة.');
    }
  }));
}

// Split oversized text into measured blocks on the export clone only. This keeps
// every character and avoids slicing through glyphs in canvas-rendered Arabic.
export function paginateReportText(report, pageHeight = PAGE_HEIGHT) {
  const chunkHeight = Math.floor(pageHeight / 3);
  report.querySelectorAll('[data-report-flow]').forEach(element => {
    if (element.getBoundingClientRect().height <= pageHeight - 80) return;
    let remaining = element.textContent;
    element.textContent = '';
    while (remaining) {
      const chunk = document.createElement('span');
      chunk.style.cssText = 'display:block;white-space:pre-wrap;margin-bottom:16px;';
      chunk.setAttribute('data-report-block', '');
      element.appendChild(chunk);
      let low = 1;
      let high = remaining.length;
      let length = 0;
      while (low <= high) {
        const middle = Math.floor((low + high) / 2);
        chunk.textContent = remaining.slice(0, middle);
        if (chunk.getBoundingClientRect().height <= chunkHeight) {
          length = middle;
          low = middle + 1;
        } else high = middle - 1;
      }
      if (!length) throw new Error('تعذر توزيع النص على صفحات التقرير.');
      if (length < remaining.length) {
        const space = remaining.slice(0, length).search(/\s+\S*$/u);
        if (space > 0) length = space + 1;
        // Do not split a UTF-16 surrogate pair in unbroken text.
        if (/[\uD800-\uDBFF]/u.test(remaining[length - 1])) length -= 1;
      }
      chunk.textContent = remaining.slice(0, length);
      remaining = remaining.slice(length);
    }
  });
}

// Keep complete text blocks and photos together. Render each page separately
// rather than creating one canvas that exceeds browser height limits.
export function getReportPageBreaks(report, pageHeight = PAGE_HEIGHT) {
  const top = report.getBoundingClientRect().top;
  const height = Math.ceil(report.getBoundingClientRect().height);
  const candidates = new Set([height]);
  report.querySelectorAll('[data-report-block]').forEach(block => {
    const bounds = block.getBoundingClientRect();
    if (block.tagName !== 'H2') candidates.add(Math.min(height, Math.ceil(bounds.bottom - top + 8)));
    if (bounds.height <= pageHeight) return;
    const photoFrame = block.querySelector('.report-photo-frame');
    if (photoFrame) candidates.add(Math.ceil(photoFrame.getBoundingClientRect().bottom - top));
  });

  const sorted = [...candidates].sort((first, second) => first - second);
  const pages = [];
  let start = 0;
  while (start < height) {
    const limit = Math.min(start + pageHeight, height);
    const end = sorted.filter(value => value > start && value <= limit).at(-1);
    if (!end) throw new Error('يوجد جزء أكبر من صفحة التقرير. يرجى تقليل طول النص أو وصف الصورة.');
    pages.push({ start, height: end - start });
    start = end;
  }
  return pages;
}

export function getReportFilename(committee) {
  const title = String(committee.title || 'اللجنة').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').trim().slice(0, 100);
  const date = String(committee.date || '').replace(/[^\d-]/g, '');
  return `تقرير-${title}${date ? `-${date}` : ''}.pdf`;
}

export async function downloadCommitteePdf(report, committee) {
  await prepareReportAssets(report);
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'), import('jspdf')
  ]);
  const clone = report.cloneNode(true);
  clone.classList.add('committee-report-export');
  clone.style.width = `${REPORT_WIDTH}px`;
  clone.style.position = 'absolute';
  clone.style.left = '-10000px';
  clone.style.top = '0';
  clone.setAttribute('aria-hidden', 'true');

  try {
    // Embed loaded originals so CORS failures cannot silently omit PDF photos.
    const originals = report.querySelectorAll('img');
    clone.querySelectorAll('img').forEach((image, index) => {
      const original = originals[index];
      const canvas = document.createElement('canvas');
      canvas.width = original.naturalWidth;
      canvas.height = original.naturalHeight;
      canvas.getContext('2d').drawImage(original, 0, 0);
      try {
        image.src = canvas.toDataURL('image/jpeg', 0.92);
      } catch {
        throw new Error('تعذر تضمين إحدى الصور في PDF. أعد إرفاق الصورة من جهازك ثم حاول مرة أخرى.');
      }
    });
    document.body.appendChild(clone);
    await prepareReportAssets(clone);
    paginateReportText(clone);
    const pages = getReportPageBreaks(clone);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
    pdf.setProperties({ title: `تقرير اللجنة: ${committee.title || ''}`, subject: 'تقرير أعمال التعقيم والتحصين البيطري' });

    for (let index = 0; index < pages.length; index += 1) {
      const page = pages[index];
      const canvas = await html2canvas(clone, {
        backgroundColor: '#ffffff', scale: 2, useCORS: true, logging: false,
        width: REPORT_WIDTH, height: page.height, y: page.start,
        windowWidth: 1200, scrollX: 0, scrollY: 0
      });
      if (index > 0) pdf.addPage();
      pdf.addImage(canvas, 'JPEG', PAGE_MARGIN, PAGE_MARGIN, PDF_CONTENT_WIDTH,
        page.height * PDF_CONTENT_WIDTH / REPORT_WIDTH, undefined, 'FAST');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`${index + 1} / ${pages.length}`, 105, 289, { align: 'center' });
      canvas.width = 0;
      canvas.height = 0;
    }
    pdf.save(getReportFilename(committee));
  } finally {
    clone.remove();
  }
}
