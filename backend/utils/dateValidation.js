const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

const isYearInRange = (year) => year >= MIN_YEAR && year <= MAX_YEAR;

const isValidDateValue = (value) => {
  if (value === undefined || value === null || value === '') return true;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && isYearInRange(date.getUTCFullYear());
};

const isValidDateInput = (value) => {
  if (value === undefined || value === null || value === '') return true;
  if (typeof value === 'string' && DATE_ONLY_PATTERN.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    if (!isYearInRange(year)) return false;
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  }
  return isValidDateValue(value);
};

const assertValidDate = (value, message) => {
  if (!isValidDateInput(value)) {
    throw new Error(message || 'Invalid date');
  }
  return true;
};

const assertDateRange = (start, end, message) => {
  assertValidDate(start, message);
  assertValidDate(end, message);
  if (!start || !end) return true;
  if (new Date(start).getTime() > new Date(end).getTime()) {
    throw new Error(message || 'Start date cannot be after end date');
  }
  return true;
};

module.exports = {
  MAX_YEAR,
  MIN_YEAR,
  assertDateRange,
  assertValidDate,
  isValidDateInput,
  isValidDateValue,
};
