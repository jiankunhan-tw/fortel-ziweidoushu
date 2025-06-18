// src/util/lunarToSolar.ts

export function lunarToSolar(lunarDate: { year: number; month: number; day: number }) {
  const { year, month, day } = lunarDate;

  // ⚠️這是模擬轉換！請換成你自己的轉換邏輯或串其他服務
  return {
    year,
    month,
    day,
    note: "這是模擬轉陽曆，請替換為正式轉換邏輯"
  };
}
