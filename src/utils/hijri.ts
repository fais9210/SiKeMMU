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
 * Converts a Gregorian Date object to Hijri Date object using Kuwaity Algorithm / Astronomical Tabular Approximation
 * with customizable offset in days (for Hilal observation alignment).
 */
export function getHijriDate(dateInput?: Date | string, offsetDays: number = 0): HijriDateObj {
  const date = dateInput ? new Date(dateInput) : new Date();
  
  // Apply offset in days if specified
  const targetDate = new Date(date.getTime() + offsetDays * 86400000);
  
  let day = targetDate.getDate();
  let month = targetDate.getMonth();
  let year = targetDate.getFullYear();

  let m = month + 1;
  let y = year;
  if (m < 3) {
    y -= 1;
    m += 12;
  }

  let a = Math.floor(y / 100);
  let b = 2 - a + Math.floor(a / 4);
  if (y < 1583) b = 0;
  if (y === 1582) {
    if (m > 10) b = -10;
    if (m === 10) {
      b = 0;
      if (day > 4) b = -10;
    }
  }

  let jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;

  let b2 = 0;
  if (jd > 2299160) {
    let a2 = Math.floor((jd - 1867216.25) / 36524.25);
    b2 = 1 + a2 - Math.floor(a2 / 4);
  }
  let bb = jd + b2 + 1524;
  let cc = Math.floor((bb - 122.1) / 365.25);
  let dd = Math.floor(365.25 * cc);
  let ee = Math.floor((bb - dd) / 30.6001);

  let dayOfWeek = (Math.floor(jd + 1.5)) % 7;

  let l = jd - 1948440 + 10632;
  let n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  let j = (Math.floor((10985 - l) / 5316)) * (Math.floor((50 * l) / 17719)) + (Math.floor(l / 5670)) * (Math.floor((43 * l) / 15238));
  l = l - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
  
  let hMonth = Math.floor((24 * l) / 709);
  let hDay = l - Math.floor((709 * hMonth) / 24);
  let hYear = 30 * n + j - 30;

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
