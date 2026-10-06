import reportFontDefinition from '@fontsource-variable/cairo/index.css?raw';
import arabicFontUrl from '@fontsource-variable/cairo/files/cairo-arabic-wght-normal.woff2?url';
import latinFontUrl from '@fontsource-variable/cairo/files/cairo-latin-wght-normal.woff2?url';
import latinExtFontUrl from '@fontsource-variable/cairo/files/cairo-latin-ext-wght-normal.woff2?url';
import { splitReportText } from './reportText';
import { downloadPdfFile } from './pdfShare';

const REPORT_WIDTH = 794;
const PAGE_MARGIN = 12;
const PDF_CONTENT_WIDTH = 210 - PAGE_MARGIN * 2;
const PDF_CONTENT_HEIGHT = 297 - PAGE_MARGIN * 2 - 6;
const PAGE_HEIGHT = Math.floor(PDF_CONTENT_HEIGHT * REPORT_WIDTH / PDF_CONTENT_WIDTH);
let embeddedFonts;

async function getEmbeddedFontCss() {
  if (!embeddedFonts) {
    embeddedFonts = Promise.all([
      ['arabic', arabicFontUrl], ['latin', latinFontUrl], ['latin-ext', latinExtFontUrl]
    ].map(async ([subset, url]) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error('تعذر تحميل خط التقرير. تحقق من الاتصال ثم أعد المحاولة.');
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        response.blob().then(blob => reader.readAsDataURL(blob), reject);
      });
      return [subset, dataUrl];
    })).then(fonts => {
      const sources = Object.fromEntries(fonts);
      return reportFontDefinition.replace(/url\(\.\/files\/cairo-(arabic|latin-ext|latin)-wght-normal\.woff2\)/g,
        (_, subset) => `url("${sources[subset]}")`);
    }).catch(error => {
      embeddedFonts = undefined;
      throw error;
    });
  }
  return embeddedFonts;
}

export async function prepareReportAssets(report) {
  if (!report) throw new Error('تعذر العثور على التقرير. أعد فتحه وحاول مرة أخرى.');
  await Promise.all([400, 700, 800].map(weight => document.fonts.load(`${weight} 14px "Cairo Variable"`, 'تقرير اللجنة Notes')));
  await document.fonts.ready;
  await Promise.all(Array.from(report.querySelectorAll('img')).map(async image => {
    try {
      await image.decode();
      if (!image.naturalWidth) throw new Error('Empty image');
      const figure = image.closest('.report-photo');
      if (figure) figure.dataset.orientation = image.naturalWidth > image.naturalHeight ? 'landscape' : 'portrait';
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

export async function downloadCommitteeReport(committee, options = {}) {
  const file = await createCommitteePdfFile(committee, options);
  downloadPdfFile(file);
}

export async function createCommitteePdfFile(committee, options = {}) {
  const [{ default: React }, { createRoot }, { flushSync }, { default: CommitteeReport }] = await Promise.all([
    import('react'), import('react-dom/client'), import('react-dom'), import('../components/CommitteeReport')
  ]);
  const host = document.createElement('div');
  host.className = 'committee-report-download-host';
  host.style.cssText = `position:absolute;left:-10000px;top:0;width:${REPORT_WIDTH}px;`;
  host.setAttribute('aria-hidden', 'true');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    flushSync(() => root.render(React.createElement(CommitteeReport, { committee })));
    return await createReportPdfFile(host.querySelector('.committee-report'), committee, options);
  } finally {
    root.unmount();
    host.remove();
  }
}

export async function downloadCommitteePdf(report, committee, { onProgress = () => {} } = {}) {
  const file = await createReportPdfFile(report, committee, { onProgress });
  downloadPdfFile(file);
}

async function createReportPdfFile(report, committee, { onProgress = () => {} } = {}) {
  onProgress('جاري تجهيز الصور والخط...');
  await prepareReportAssets(report);
  const [{ toCanvas }, { jsPDF }, fontEmbedCSS] = await Promise.all([
    import('html-to-image'), import('jspdf'), getEmbeddedFontCss()
  ]);
  const clone = document.createElement('article');
  clone.className = 'committee-report committee-report-export';
  clone.dir = 'rtl';
  clone.lang = 'ar';
  clone.style.width = `${REPORT_WIDTH}px`;
  clone.appendChild(report.querySelector('.report-details-document').cloneNode(true));
  const viewport = document.createElement('div');
  viewport.className = 'committee-report-export-viewport';
  viewport.style.cssText = `position:absolute;left:-10000px;top:0;width:${REPORT_WIDTH}px;overflow:hidden;background:white;`;
  viewport.setAttribute('aria-hidden', 'true');
  viewport.appendChild(clone);

  try {
    document.body.appendChild(viewport);
    paginateReportText(clone);
    // Long-note pagination creates new text nodes. Restore direction isolation
    // there so dates and units retain the same order as the report preview.
    const notes = clone.querySelector('.report-notes');
    const walker = document.createTreeWalker(notes, NodeFilter.SHOW_TEXT);
    const noteNodes = [];
    while (walker.nextNode()) {
      if (!walker.currentNode.parentElement.closest('bdi')) noteNodes.push(walker.currentNode);
    }
    noteNodes.forEach(node => {
      const fragment = document.createDocumentFragment();
      splitReportText(node.textContent).forEach(part => {
        if (part.ltr) {
          const isolated = document.createElement('bdi');
          isolated.dir = 'ltr';
          isolated.textContent = part.text;
          fragment.appendChild(isolated);
        } else fragment.appendChild(document.createTextNode(part.text));
      });
      node.replaceWith(fragment);
    });
    const pages = getReportPageBreaks(clone);
    const originals = [...report.querySelectorAll('.report-photo img')];
    const pageCount = pages.length + originals.length;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
    pdf.setProperties({ title: `تقرير اللجنة: ${committee.title || ''}`, subject: 'تقرير أعمال التعقيم والتحصين البيطري' });

    for (let index = 0; index < pages.length; index += 1) {
      const page = pages[index];
      onProgress(`جاري إعداد الصفحة ${index + 1} من ${pageCount}...`);
      viewport.style.height = `${page.height}px`;
      clone.style.transform = `translateY(-${page.start}px)`;
      const canvas = await toCanvas(viewport, {
        backgroundColor: '#ffffff', pixelRatio: 2, fontEmbedCSS,
        width: REPORT_WIDTH, height: page.height,
        style: { position: 'static', left: 'auto', right: 'auto', top: 'auto', bottom: 'auto' }
      });
      if (index > 0) pdf.addPage();
      pdf.addImage(canvas, 'PNG', PAGE_MARGIN, PAGE_MARGIN, PDF_CONTENT_WIDTH,
        page.height * PDF_CONTENT_WIDTH / REPORT_WIDTH, undefined, 'FAST');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`${index + 1} / ${pageCount}`, 105, 289, { align: 'center' });
      canvas.width = 0;
      canvas.height = 0;
    }

    // Each original photo gets its own page with only the image. Choose the
    // orientation that makes it largest, and contain it without cropping.
    for (let index = 0; index < originals.length; index += 1) {
      onProgress(`جاري إعداد الصفحة ${pages.length + index + 1} من ${pageCount}...`);
      const original = originals[index];
      const landscape = original.naturalWidth > original.naturalHeight;
      pdf.addPage('a4', landscape ? 'landscape' : 'portrait');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const scale = Math.min((pageWidth - 12) / original.naturalWidth, (pageHeight - 12) / original.naturalHeight);
      const width = original.naturalWidth * scale;
      const height = original.naturalHeight * scale;
      const canvas = document.createElement('canvas');
      const imageScale = Math.min(1, 2400 / Math.max(original.naturalWidth, original.naturalHeight));
      canvas.width = Math.max(1, Math.round(original.naturalWidth * imageScale));
      canvas.height = Math.max(1, Math.round(original.naturalHeight * imageScale));
      const context = canvas.getContext('2d');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(original, 0, 0, canvas.width, canvas.height);
      let imageData;
      try {
        imageData = canvas.toDataURL('image/jpeg', 0.95);
      } catch {
        throw new Error('تعذر تضمين إحدى الصور في PDF. أعد إرفاق الصورة من جهازك ثم حاول مرة أخرى.');
      }
      pdf.addImage(imageData, 'JPEG', (pageWidth - width) / 2, (pageHeight - height) / 2, width, height);
      canvas.width = 0;
      canvas.height = 0;
    }
    onProgress('PDF جاهز');
    return new File([pdf.output('blob')], getReportFilename(committee), { type: 'application/pdf' });
  } finally {
    viewport.remove();
  }
}
