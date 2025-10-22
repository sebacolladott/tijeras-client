const DEFAULT_LOCALE = "es-AR";
const DEFAULT_OPTIONS = { dateStyle: "medium" };

const dateFormatters = new Map();

const getFormatter = (options = DEFAULT_OPTIONS) => {
  const key = JSON.stringify(options);
  if (!dateFormatters.has(key)) {
    dateFormatters.set(key, new Intl.DateTimeFormat(DEFAULT_LOCALE, options));
  }
  return dateFormatters.get(key);
};

export const normalizeDateValue = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDate = (value, options = DEFAULT_OPTIONS) => {
  const date = normalizeDateValue(value);
  if (!date) return null;
  return getFormatter(options).format(date);
};

export const extractCutDate = (cut) =>
  cut?.performedAt ??
  cut?.date ??
  cut?.createdAt ??
  cut?.updatedAt ??
  null;

export const formatCutDate = (cut, options = DEFAULT_OPTIONS) =>
  formatDate(extractCutDate(cut), options);
