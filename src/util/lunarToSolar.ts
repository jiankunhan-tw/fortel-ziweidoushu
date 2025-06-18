// src/util/lunarToSolar.ts
import solarlunar from 'solarlunar';

export function lunarToSolar(lunarDate: { year: number; month: number; day: number }) {
  const { year, month, day } = lunarDate;
  const result = solarlunar.lunar2solar(year, month, day, false); // false 表示非閏月
  return {
    year: result.cYear,
    month: result.cMonth,
    day: result.cDay
  };
}
