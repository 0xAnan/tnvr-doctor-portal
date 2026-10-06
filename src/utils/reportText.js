// Isolate English phrases, measurements, and dates inside Arabic notes while
// keeping the saved text (including whitespace and line breaks) untouched.
export function splitReportText(value) {
  const text = String(value);
  const parts = [];
  let cursor = 0;
  for (const match of text.matchAll(/[A-Za-z0-9٠-٩۰-۹]+(?:[ \t.,:/%+_()-]+[A-Za-z0-9٠-٩۰-۹]+)*%?/gu)) {
    if (match.index > cursor) parts.push({ text: text.slice(cursor, match.index), ltr: false });
    parts.push({ text: match[0], ltr: true });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), ltr: false });
  return parts;
}
