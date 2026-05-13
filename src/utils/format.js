// Currency symbol map for common ISO codes.
const SYMBOLS = {
  INR: '₹',
  USD: '$',
  GBP: '£',
  EUR: '€',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  AED: 'د.إ',
  SGD: 'S$',
};

export function currencySymbol(code = 'INR') {
  return SYMBOLS[code?.toUpperCase()] || code || '';
}

export function formatMoney(amount, code = 'INR') {
  const num = Number(amount || 0);
  const sym = currencySymbol(code);
  // Use Intl with no fractional digits for whole values, else 2.
  const fractionDigits = Number.isInteger(num) ? 0 : 2;
  try {
    const formatted = new Intl.NumberFormat(code === 'INR' ? 'en-IN' : 'en-US', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: 2,
    }).format(num);
    return `${sym}${formatted}`;
  } catch {
    return `${sym}${num.toFixed(2)}`;
  }
}

export function formatDate(d) {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(d) {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function relativeTime(d) {
  if (!d) return '';
  const date = new Date(d);
  const diffMs = Date.now() - date.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return formatDate(d);
}
