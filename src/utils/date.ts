import { TIME_RE } from '../data/types';

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/** 格式化为本地时区 YYYY-MM-DD（不用 toISOString，避免 UTC 偏移） */
export function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function todayStr(): string {
  return fmtDate(new Date());
}

export function addDays(s: string, n: number): string {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return fmtDate(d);
}

/** 加 n 个月，超出目标月天数时收敛到月末（1月31日 + 1月 → 2月28/29日） */
export function addMonths(s: string, n: number): string {
  const d = parseDate(s);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, daysInMonth));
  return fmtDate(d);
}

export function isToday(s: string): boolean {
  return s === todayStr();
}

/** 人类可读日期：今天 / 明天 / 昨天 / 9月10日 周三 / 2027年3月5日 */
export function humanDate(s: string): string {
  const d = parseDate(s);
  const today = new Date();
  const delta = Math.round((d.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86400000);
  if (delta === 0) return '今天';
  if (delta === 1) return '明天';
  if (delta === -1) return '昨天';
  const wd = WEEKDAYS[d.getDay()];
  if (d.getFullYear() === today.getFullYear()) return `${d.getMonth() + 1}月${d.getDate()}日 ${wd}`;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 顶栏日期：9月8日 周一（跨年时带年份） */
export function headerDate(s: string): string {
  const d = parseDate(s);
  const base = `${d.getMonth() + 1}月${d.getDate()}日 ${WEEKDAYS[d.getDay()]}`;
  return d.getFullYear() === new Date().getFullYear() ? base : `${d.getFullYear()}年${base}`;
}

/** 生成某月的日历矩阵（周一开头），单元格为日期字符串或 null 补位 */
export function monthMatrix(year: number, month: number): (string | null)[][] {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7; // 周一 = 0
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array<string | null>(lead).fill(null);
  for (let i = 1; i <= days; i++) cells.push(fmtDate(new Date(year, month, i)));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** HH:MM → 当天分钟数 */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** 当前时刻的分钟数 */
export function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

/** 时间段是否有效（两个时间都存在、格式合法且结束晚于开始） */
export function isValidTimeRange(s?: string, e?: string): boolean {
  return !!s && !!e && TIME_RE.test(s) && TIME_RE.test(e) && timeToMinutes(e) > timeToMinutes(s);
}
