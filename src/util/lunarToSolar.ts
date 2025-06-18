// src/util/lunarToSolar.ts

export function lunarToSolar(lunarDate: { year: number; month: number; day: number }) {
  const { year, month, day } = lunarDate;

  // ⚠️ 模擬陽曆轉換
  return {
    year,
    month,
    day,
    note: "這是模擬陽曆轉換，請自行串接正確轉換 API 或補上演算法"
  };
}
