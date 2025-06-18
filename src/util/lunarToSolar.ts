import solarlunar from 'solarlunar'

export function lunarToSolar(
  year: number,
  month: number,
  day: number,
  isLeap: boolean = false
): { year: number; month: number; day: number } {
  const result = solarlunar.lunar2solar(year, month, day, isLeap)
  return {
    year: result.cYear,
    month: result.cMonth,
    day: result.cDay
  }
}
