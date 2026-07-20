import { isValidDateValue } from "./dateValidation";

const formatDate = (value, locale = "en") => {
  if (!value) return "N/A";
  if (!isValidDateValue(value)) return "N/A";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value));
};
const formatDateTime = (value, locale = "en") => {
  if (!value) return "N/A";
  if (!isValidDateValue(value)) return "N/A";
  const date = new Date(value);
  const dateText = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
  const timeText = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(date);
  return `${dateText} - ${timeText}`;
};
const getProductStatus = (product) => {
  const quantity = Number(product?.quantity ?? 0);
  const settings = product?.alert_settings || {};
  const lowThreshold = Number(settings.low_stock_threshold ?? product?.min_quantity ?? 0);
  const criticalThreshold = Number(settings.critical_stock_threshold ?? 0);
  const warningDays = Number(settings.expiration_warning_days ?? 30);
  const criticalDays = Number(settings.critical_expiration_days ?? 7);

  if (quantity <= 0) return "out-of-stock";
  if (criticalThreshold > 0 && quantity <= criticalThreshold) return "critical";
  if (lowThreshold > 0 && quantity <= lowThreshold) return "low-stock";
  const expirationDate = product.expiration_date || product.expiry_date;
  if (expirationDate && isValidDateValue(expirationDate)) {
    const days = (new Date(expirationDate).getTime() - Date.now()) / (1e3 * 60 * 60 * 24);
    if (days >= 0 && days <= Math.max(warningDays, criticalDays)) return "expiring-soon";
  }
  return "in-stock";
};
const uniqueOptions = (values, allLabel) => [
  { value: "all", label: allLabel },
  ...Array.from(new Set(values.filter(Boolean))).map((value) => ({ value, label: value }))
];
export {
  formatDate,
  formatDateTime,
  getProductStatus,
  uniqueOptions
};
