const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MIN_DATE_INPUT = "2000-01-01";
const MAX_DATE_INPUT = "2100-12-31";
const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

const isYearInRange = (year) => year >= MIN_YEAR && year <= MAX_YEAR;

const isValidDateValue = (value) => {
  if (!value) return true;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && isYearInRange(date.getUTCFullYear());
};

const isValidDateInput = (value) => {
  if (!value) return true;
  if (!DATE_ONLY_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (!isYearInRange(year)) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

const isDateRangeValid = (start, end) => {
  if (!isValidDateInput(start) || !isValidDateInput(end)) return false;
  if (!start || !end) return true;
  return new Date(start).getTime() <= new Date(end).getTime();
};

const toDateInputValue = (value) => {
  if (!isValidDateValue(value)) return "";
  const date = new Date(value);
  return date.toISOString().slice(0, 10);
};

export {
  MAX_DATE_INPUT,
  MIN_DATE_INPUT,
  isDateRangeValid,
  isValidDateInput,
  isValidDateValue,
  toDateInputValue
};
