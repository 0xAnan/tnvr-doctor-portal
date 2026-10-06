import test from 'node:test';
import assert from 'node:assert/strict';
import { canSharePdf, sharePdf } from './pdfShare.js';

const file = new File(['%PDF-1.7\n'], 'تقرير.pdf', { type: 'application/pdf' });

test('Sharing sends the PDF attachment synchronously from the button action', async () => {
  let received;
  const shareNavigator = {
    canShare: data => data.files[0] === file,
    share: data => { received = data; return Promise.resolve(); }
  };
  const promise = sharePdf(file, 'تقرير اللجنة', shareNavigator);
  assert.deepEqual(received, { files: [file], title: 'تقرير اللجنة' });
  assert.equal(received.files[0].type, 'application/pdf');
  assert.equal(received.url, undefined);
  await promise;
});

test('Text-only sharing and blocked file sharing use download fallback', () => {
  for (const shareNavigator of [
    {}, { share() {} },
    { share() {}, canShare: () => false },
    { share() {}, canShare: () => { throw new Error('Blocked'); } }
  ]) {
    assert.equal(canSharePdf(file, shareNavigator), false);
    assert.throws(() => sharePdf(file, 'تقرير', shareNavigator), /حمّل الملف/);
  }
});

test('Cancellation stays distinguishable from a failed share', async () => {
  const cancelled = Object.assign(new Error('Cancelled'), { name: 'AbortError' });
  const shareNavigator = { canShare: () => true, share: () => Promise.reject(cancelled) };
  await assert.rejects(sharePdf(file, 'تقرير', shareNavigator), error => error === cancelled);
});
