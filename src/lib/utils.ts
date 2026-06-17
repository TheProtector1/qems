import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatCurrency(amount: number | string, currency = "PKR"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(num);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function generateStudentId(index: number): string {
  const year = new Date().getFullYear();
  return `STU-${year}-${String(index).padStart(4, "0")}`;
}

export function generateInvoiceNo(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${year}-${random}`;
}

export function generateCaseNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `CASE-${year}-${random}`;
}

export function getSurahName(surahNumber: number): string {
  const surahs: Record<number, string> = {
    1: "Al-Fatiha", 2: "Al-Baqarah", 3: "Ali Imran", 4: "An-Nisa",
    5: "Al-Ma'ida", 6: "Al-An'am", 7: "Al-A'raf", 8: "Al-Anfal",
    9: "At-Tawbah", 10: "Yunus", 11: "Hud", 12: "Yusuf",
    13: "Ar-Ra'd", 14: "Ibrahim", 15: "Al-Hijr", 16: "An-Nahl",
    17: "Al-Isra", 18: "Al-Kahf", 19: "Maryam", 20: "Ta-Ha",
    21: "Al-Anbiya", 22: "Al-Hajj", 23: "Al-Mu'minun", 24: "An-Nur",
    25: "Al-Furqan", 26: "Ash-Shu'ara", 27: "An-Naml", 28: "Al-Qasas",
    29: "Al-Ankabut", 30: "Ar-Rum", 31: "Luqman", 32: "As-Sajdah",
    33: "Al-Ahzab", 34: "Saba", 35: "Fatir", 36: "Ya-Sin",
    37: "As-Saffat", 38: "Sad", 39: "Az-Zumar", 40: "Ghafir",
    41: "Fussilat", 42: "Ash-Shura", 43: "Az-Zukhruf", 44: "Ad-Dukhan",
    45: "Al-Jathiyah", 46: "Al-Ahqaf", 47: "Muhammad", 48: "Al-Fath",
    49: "Al-Hujurat", 50: "Qaf", 51: "Adh-Dhariyat", 52: "At-Tur",
    53: "An-Najm", 54: "Al-Qamar", 55: "Ar-Rahman", 56: "Al-Waqi'a",
    57: "Al-Hadid", 58: "Al-Mujadila", 59: "Al-Hashr", 60: "Al-Mumtahanah",
    61: "As-Saf", 62: "Al-Jumu'ah", 63: "Al-Munafiqun", 64: "At-Taghabun",
    65: "At-Talaq", 66: "At-Tahrim", 67: "Al-Mulk", 68: "Al-Qalam",
    69: "Al-Haqqah", 70: "Al-Ma'arij", 71: "Nuh", 72: "Al-Jinn",
    73: "Al-Muzzammil", 74: "Al-Muddaththir", 75: "Al-Qiyamah", 76: "Al-Insan",
    77: "Al-Mursalat", 78: "An-Naba", 79: "An-Nazi'at", 80: "Abasa",
    81: "At-Takwir", 82: "Al-Infitar", 83: "Al-Mutaffifin", 84: "Al-Inshiqaq",
    85: "Al-Buruj", 86: "At-Tariq", 87: "Al-A'la", 88: "Al-Ghashiyah",
    89: "Al-Fajr", 90: "Al-Balad", 91: "Ash-Shams", 92: "Al-Layl",
    93: "Ad-Duha", 94: "Ash-Sharh", 95: "At-Tin", 96: "Al-Alaq",
    97: "Al-Qadr", 98: "Al-Bayyinah", 99: "Az-Zalzalah", 100: "Al-Adiyat",
    101: "Al-Qari'ah", 102: "At-Takathur", 103: "Al-Asr", 104: "Al-Humazah",
    105: "Al-Fil", 106: "Quraysh", 107: "Al-Ma'un", 108: "Al-Kawthar",
    109: "Al-Kafirun", 110: "An-Nasr", 111: "Al-Masad", 112: "Al-Ikhlas",
    113: "Al-Falaq", 114: "An-Nas",
  };
  return surahs[surahNumber] || `Surah ${surahNumber}`;
}

export function getJuzForSurah(surahNumber: number): number {
  const juzMapping: [number, number][] = [
    [1, 1], [2, 1], [3, 2], [4, 3], [5, 4], [6, 5], [7, 6], [8, 7],
    [9, 8], [10, 9], [11, 9], [12, 10], [13, 11], [14, 11], [15, 12],
    [16, 13], [17, 14], [18, 15], [19, 15], [20, 16], [21, 17], [22, 17],
    [23, 18], [24, 18], [25, 18], [26, 19], [27, 20], [28, 20], [29, 20],
    [30, 21], [31, 21], [32, 21], [33, 22], [34, 22], [35, 22], [36, 23],
    [37, 23], [38, 23], [39, 24], [40, 24], [41, 24], [42, 25], [43, 25],
    [44, 25], [45, 25], [46, 26], [47, 26], [48, 26], [49, 26], [50, 26],
    [51, 27], [52, 27], [53, 27], [54, 27], [55, 27], [56, 27], [57, 27],
    [58, 28], [59, 28], [60, 28], [61, 28], [62, 28], [63, 28], [64, 28],
    [65, 28], [66, 28], [67, 29], [68, 29], [69, 29], [70, 29], [71, 29],
    [72, 29], [73, 29], [74, 29], [75, 29], [76, 29], [77, 29], [78, 30],
    [79, 30], [80, 30], [81, 30], [82, 30], [83, 30], [84, 30], [85, 30],
    [86, 30], [87, 30], [88, 30], [89, 30], [90, 30], [91, 30], [92, 30],
    [93, 30], [94, 30], [95, 30], [96, 30], [97, 30], [98, 30], [99, 30],
    [100, 30], [101, 30], [102, 30], [103, 30], [104, 30], [105, 30],
    [106, 30], [107, 30], [108, 30], [109, 30], [110, 30], [111, 30],
    [112, 30], [113, 30], [114, 30],
  ];
  const entry = juzMapping.find(([s]) => s === surahNumber);
  return entry ? entry[1] : 1;
}

export function getAttendanceColor(status: string): string {
  const colors: Record<string, string> = {
    PRESENT: "bg-green-100 text-green-700",
    ABSENT: "bg-red-100 text-red-700",
    LATE: "bg-amber-100 text-amber-700",
    LEAVE: "bg-blue-100 text-blue-700",
    HOLIDAY: "bg-gray-100 text-gray-600",
  };
  return colors[status] || "bg-gray-100 text-gray-600";
}

export function getGradeFromScore(score: number, max = 100): string {
  const pct = (score / max) * 100;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "F";
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.substring(0, length) + "..." : str;
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
<<<<<<< HEAD

export function downloadCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const escape = (value: string | number | null | undefined) => {
    const str = value == null ? "" : String(value);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const csv = [headers.map(escape).join(","), ...rows.map((row) => row.map(escape).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
=======
>>>>>>> 69c1b278484f624f04044e45de8438706888ccac
