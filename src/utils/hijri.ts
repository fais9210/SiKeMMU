import hc from 'hijri-converter';
import { HijriDateObj } from '../types';

export const HIJRI_MONTHS_ID = [
  'Muharram',
  'Safar',
  "Rabi'ul Awal",
  "Rabi'ul Akhir",
  'Jumadil Awal',
  'Jumadil Akhir',
  'Rajab',
  "Sya'ban",
  'Ramadhan',
  'Syawwal',
  'Dzulqa\'dah',
  'Dzulhijjah',
];

export const DAYS_ID = [
  'Ahad',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  "Jum'at",
  'Sabtu',
];

/**
 * Converts a Gregorian Date object to Hijri Date object using hijri-converter
 * with customizable offset in days (for Hilal observation alignment).
 */
export function getHijriDate(dateInput?: Date | string, offsetDays: number = 0): HijriDateObj {
  const date = dateInput ? new Date(dateInput) : new Date();
  
  // Apply offset in days if specified
  const targetDate = new Date(date.getTime() + offsetDays * 86400000);
  
  const dayOfWeek = targetDate.getDay();
  const hDate = hc.toHijri(targetDate.getFullYear(), targetDate.getMonth() + 1, targetDate.getDate());
  
  const hDay = hDate.hd;
  const hMonth = hDate.hm;
  const hYear = hDate.hy;

  // Bound checks
  const monthIdx = Math.max(0, Math.min(11, hMonth - 1));
  const monthName = HIJRI_MONTHS_ID[monthIdx] || 'Ramadhan';
  const dayName = DAYS_ID[dayOfWeek] || 'Senin';

  return {
    day: hDay,
    monthName,
    monthIndex: monthIdx,
    year: hYear,
    dayName,
    formatted: `${hDay} ${monthName} ${hYear} H`,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Returns the active Hijri academic year based on current Gregorian / Hijri date.
 * E.g., for Safar 1448 H, returns "1448 - 1449 H."
 */
export function getCurrentHijriAcademicYear(offsetDays: number = 0): string {
  const hDate = getHijriDate(new Date(), offsetDays);
  return `${hDate.year} - ${hDate.year + 1} H.`;
}

/**
 * Converts a numeric amount into Indonesian words ("terbilang").
 * E.g., 1500000 -> "Satu Juta Lima Ratus Ribu Rupiah"
 */
export function terbilang(nominal: number): string {
  const bilangan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ];

  function convert(n: number): string {
    if (n < 12) return bilangan[n];
    if (n < 20) return convert(n - 10) + ' Belas';
    if (n < 100) return convert(Math.floor(n / 10)) + ' Puluh ' + convert(n % 10);
    if (n < 200) return 'Seratus ' + convert(n - 100);
    if (n < 1000) return convert(Math.floor(n / 100)) + ' Ratus ' + convert(n % 100);
    if (n < 2000) return 'Seribu ' + convert(n - 1000);
    if (n < 1000000) return convert(Math.floor(n / 1000)) + ' Ribu ' + convert(n % 1000);
    if (n < 1000000000) return convert(Math.floor(n / 1000000)) + ' Juta ' + convert(n % 1000000);
    if (n < 1000000000000) return convert(Math.floor(n / 1000000000)) + ' Milyar ' + convert(n % 1000000000);
    return String(n);
  }

  if (!nominal || nominal <= 0) return 'Nol Rupiah';
  const result = convert(Math.floor(nominal)).trim().replace(/\s+/g, ' ');
  return `${result} Rupiah`;
}

