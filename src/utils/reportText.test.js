import test from 'node:test';
import assert from 'node:assert/strict';
import { splitReportText } from './reportText.js';

test('Arabic notes preserve dates and measurements as complete LTR groups', () => {
  const text = 'جرعة 0.5 ml، متابعة بتاريخ 2026-07-28، وتم استخدام Ear-tipping.';
  const parts = splitReportText(text);
  assert.deepEqual(parts.filter(part => part.ltr).map(part => part.text), [
    '0.5 ml', '2026-07-28', 'Ear-tipping'
  ]);
  assert.equal(parts.map(part => part.text).join(''), text);
});

test('Multiline, Arabic digits, punctuation, and emoji are never changed or dropped', () => {
  for (const text of [
    'الحالة ممتازة.\nEnglish note: Follow-up (24 hours), 100% completed.',
    'التاريخ ٢٠٢٦-٠٧-٢٨، عدد الحالات ٤٢.',
    '\n\n  ملاحظات طويلة 🐕\n\tجرعة 0.5 ml.  ',
    'نص عربي فقط دون أرقام أو إنجليزية',
    '',
    '<script>text</script>'
  ]) {
    assert.equal(splitReportText(text).map(part => part.text).join(''), text);
  }
});
