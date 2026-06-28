/** Fixed-date Pakistan public holidays (Islamic dates vary and must be added manually). */
export type PublicHolidayPreset = {
  name: string;
  month: number;
  day: number;
};

export const PAKISTAN_FIXED_PUBLIC_HOLIDAYS: PublicHolidayPreset[] = [
  { name: "Kashmir Solidarity Day", month: 2, day: 5 },
  { name: "Pakistan Day", month: 3, day: 23 },
  { name: "Labour Day", month: 5, day: 1 },
  { name: "Independence Day", month: 8, day: 14 },
  { name: "Defence Day", month: 9, day: 6 },
  { name: "Iqbal Day", month: 11, day: 9 },
  { name: "Quaid-e-Azam Day / Christmas", month: 12, day: 25 },
];

export function buildPakistanPublicHolidayDates(year: number) {
  return PAKISTAN_FIXED_PUBLIC_HOLIDAYS.map((h) => ({
    name: h.name,
    startDate: `${year}-${String(h.month).padStart(2, "0")}-${String(h.day).padStart(2, "0")}`,
    endDate: `${year}-${String(h.month).padStart(2, "0")}-${String(h.day).padStart(2, "0")}`,
  }));
}
