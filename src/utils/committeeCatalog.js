const arabicCollator = new Intl.Collator('ar-EG', {
  sensitivity: 'base',
  numeric: true,
  ignorePunctuation: true
});

const GENERIC_PREFIX = /^(?:لجنة|لجنه|حملة|حمله|مدينة|مدينه|حي|منطقة|منطقه)\s+/i;
const TITLE_SEPARATOR = /\s*(?:[-–—|:]|،)\s*/;
const LOCATION_SEPARATOR = /\s*(?:[-–—|:]|،|\()\s*/;
const CAMPAIGN_MARKER = 'الحمله';
const EASTERN_ARABIC_DIGITS = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
};

const CAMPAIGN_ORDINALS = new Map([
  ['الاولي', 1], ['الاول', 1],
  ['الثانيه', 2], ['التانيه', 2], ['الثاني', 2], ['التاني', 2],
  ['الثالثه', 3], ['التالته', 3], ['الثالث', 3], ['التالت', 3],
  ['الرابعه', 4], ['الرابع', 4],
  ['الخامسه', 5], ['الخامس', 5],
  ['السادسه', 6], ['السادس', 6],
  ['السابعه', 7], ['السابع', 7],
  ['الثامنه', 8], ['التامنه', 8], ['الثامن', 8], ['التامن', 8],
  ['التاسعه', 9], ['التاسع', 9],
  ['العاشره', 10], ['العاشر', 10]
]);

function cleanText(value) {
  return String(value || '')
    .replace(/[ـًٌٍَُِّْ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function removeGenericPrefixes(value) {
  let result = cleanText(value);
  let previous;

  do {
    previous = result;
    result = result.replace(GENERIC_PREFIX, '').trim();
  } while (result !== previous);

  return result;
}

export function normalizeArabic(value) {
  return cleanText(value)
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .toLocaleLowerCase('ar-EG');
}

export function inferCommitteeCity(committee) {
  const titlePrefix = cleanText(committee?.title).split(TITLE_SEPARATOR)[0];
  const cityFromTitle = removeGenericPrefixes(titlePrefix);

  if (cityFromTitle && normalizeArabic(cityFromTitle) !== 'غير محدد') {
    return cityFromTitle;
  }

  const locationPrefix = cleanText(committee?.location).split(LOCATION_SEPARATOR)[0];
  return removeGenericPrefixes(locationPrefix) || 'غير مصنف';
}

export function compareCommitteeNames(first, second) {
  const titleComparison = arabicCollator.compare(
    cleanText(first?.title),
    cleanText(second?.title)
  );

  if (titleComparison !== 0) return titleComparison;
  return arabicCollator.compare(String(first?.id || ''), String(second?.id || ''));
}

export function sortCommitteesByName(committees) {
  return [...committees].sort(compareCommitteeNames);
}

export function getCampaignOrder(committee) {
  const normalizedTitle = normalizeArabic(committee?.title);
  const markerIndex = normalizedTitle.indexOf(CAMPAIGN_MARKER);

  if (markerIndex === -1) return Number.POSITIVE_INFINITY;

  const campaignText = normalizedTitle
    .slice(markerIndex + CAMPAIGN_MARKER.length)
    .trim();
  const normalizedDigits = campaignText.replace(
    /[٠-٩۰-۹]/g,
    digit => EASTERN_ARABIC_DIGITS[digit]
  );
  const numberMatch = normalizedDigits.match(/^(?:رقم\s*)?(\d{1,3})(?:\D|$)/);

  if (numberMatch) return Number(numberMatch[1]);

  const ordinal = campaignText.split(/[^\p{L}\p{N}]+/u)
    .map(word => CAMPAIGN_ORDINALS.get(word))
    .find(order => order !== undefined);

  return ordinal ?? Number.POSITIVE_INFINITY;
}

export function compareCommitteesByCampaign(first, second) {
  const firstOrder = getCampaignOrder(first);
  const secondOrder = getCampaignOrder(second);

  if (firstOrder !== secondOrder) {
    if (!Number.isFinite(firstOrder)) return 1;
    if (!Number.isFinite(secondOrder)) return -1;
    return firstOrder - secondOrder;
  }

  return compareCommitteeNames(first, second);
}

export function sortCommitteesByCampaign(committees) {
  return [...committees].sort(compareCommitteesByCampaign);
}

/**
 * Compare committees by Date (Newest date first).
 * If dates are equal or missing, falls back to campaign/name comparison.
 */
export function compareCommitteesByDate(first, second, order = 'desc') {
  const firstDate = first?.date ? new Date(first.date).getTime() : 0;
  const secondDate = second?.date ? new Date(second.date).getTime() : 0;

  if (firstDate !== secondDate) {
    return order === 'desc' ? secondDate - firstDate : firstDate - secondDate;
  }

  return compareCommitteesByCampaign(first, second);
}

export function sortCommitteesByDate(committees, order = 'desc') {
  return [...committees].sort((a, b) => compareCommitteesByDate(a, b, order));
}

export function groupCommitteesByCity(committees, sortOrder = 'desc') {
  const groups = new Map();

  sortCommitteesByDate(committees, sortOrder).forEach(committee => {
    const city = inferCommitteeCity(committee);
    const key = normalizeArabic(city);
    const current = groups.get(key) || { city, committees: [] };
    current.committees.push(committee);
    groups.set(key, current);
  });

  return Array.from(groups.values()).sort((first, second) => (
    arabicCollator.compare(first.city, second.city)
  ));
}

export function getCommitteeCities(committees) {
  const cities = new Map();

  committees.forEach(committee => {
    const city = inferCommitteeCity(committee);
    const key = normalizeArabic(city);
    if (!cities.has(key)) cities.set(key, city);
  });

  return Array.from(cities, ([key, city]) => ({ key, city })).sort(
    (first, second) => arabicCollator.compare(first.city, second.city)
  );
}
