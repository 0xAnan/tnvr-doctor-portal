const arabicCollator = new Intl.Collator('ar-EG', {
  sensitivity: 'base',
  numeric: true,
  ignorePunctuation: true
});

const GENERIC_PREFIX = /^(?:لجنة|لجنه|حملة|حمله|مدينة|مدينه|حي|منطقة|منطقه)\s+/i;
const TITLE_SEPARATOR = /\s*(?:[-–—|:]|،)\s*/;
const LOCATION_SEPARATOR = /\s*(?:[-–—|:]|،|\()\s*/;

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

export function groupCommitteesByCity(committees) {
  const groups = new Map();

  sortCommitteesByName(committees).forEach(committee => {
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
