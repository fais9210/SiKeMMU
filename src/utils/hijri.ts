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
