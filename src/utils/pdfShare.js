export function canSharePdf(file, shareNavigator = navigator) {
  try {
    return typeof shareNavigator.share === 'function'
      && typeof shareNavigator.canShare === 'function'
      && shareNavigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

// Call directly from the share button's click. PDF preparation happens earlier
// so browser user activation cannot expire while generating the report.
export function sharePdf(file, title, shareNavigator = navigator) {
  if (!canSharePdf(file, shareNavigator)) {
    throw new Error('جهازك لا يدعم مشاركة PDF مباشرة. حمّل الملف ثم أرفقه في واتساب.');
  }
  return shareNavigator.share({ files: [file], title });
}

export function downloadPdfFile(file) {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
