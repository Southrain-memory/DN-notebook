import type { Priority, RepeatKind } from '../data/types';
import { fmtDate } from './date';

/**
 * 中文 Quick Add 解析：从一句话里识别日期、时间段、优先级和重复规则，
 * 剩余部分作为标题。识别不了就原样当标题，不会强行猜测。
 *
 * 支持：今天/明天/后天/大后天、N天后、周X（本周/这周/下周/下下周，可带「个」）、
 *       M月d号、YYYY年M月d日、下个月N号、每天/每周X/每月X号、
 *       上午/中午/下午/晚上/凌晨 N点[半|一刻|N分]、中文数字点钟、
 *       A到B / A-B / 从A至B（含 13:00、13：00、13点），#高/#中/#低
 */

const WD_NUM: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 0, 天: 0 };

const PRIORITY_MAP: Record<string, Priority> = { 高: 'high', 中: 'medium', 低: 'low' };

const CN_HOUR: Record<string, number> = {
  零: 0,
  〇: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
  十一: 11,
  十二: 12,
};

const CN_INT: Record<string, number> = {
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
};

const MER = String.raw`(上午|早上|早晨|凌晨|中午|下午|晚上|傍晚)`;
const HOUR = String.raw`(\d{1,2}|十[一二]|[零〇一二两三四五六七八九十])`;
const MINUTE_TAIL = String.raw`(?:\s*:\s*([0-5]\d)|[点时](?:整|钟)?(?:\s*(半|一刻|三刻)|\s*(\d{1,2})\s*分?)?)?`;

export interface QuickParseResult {
  title: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  priority?: Priority;
  repeat?: RepeatKind;
}

function hm(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function validTime(h: number, m: number): boolean {
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function shiftDays(base: Date, days: number): Date {
  const d = startOfDay(base);
  d.setDate(d.getDate() + days);
  return d;
}

/** 全角数字/冒号/横线等到半角，方便后续正则 */
function normalize(raw: string): string {
  return raw.replace(/[\uFF10-\uFF19\uFF01-\uFF5E]/g, (ch) => {
    const code = ch.charCodeAt(0);
    if (code >= 0xff10 && code <= 0xff19) return String.fromCharCode(code - 0xff10 + 0x30);
    if (code >= 0xff01 && code <= 0xff5e) return String.fromCharCode(code - 0xfee0);
    return ch;
  }).replace(/[—–－]/g, '-').replace(/[～〜]/g, '~').replace(/\u3000/g, ' ');
}

function parseHourToken(tok: string): number | null {
  if (/^\d{1,2}$/.test(tok)) {
    const n = Number(tok);
    return n >= 0 && n <= 23 ? n : null;
  }
  return CN_HOUR[tok] ?? null;
}

function parseMinute(colon: string | undefined, named: string | undefined, nfen: string | undefined): number {
  if (colon) {
    const n = Number(colon);
    return Number.isFinite(n) ? n : 0;
  }
  if (named === '半') return 30;
  if (named === '一刻') return 15;
  if (named === '三刻') return 45;
  if (nfen) {
    const n = Number(nfen);
    return Number.isFinite(n) && n >= 0 && n <= 59 ? n : 0;
  }
  return 0;
}

function applyMeridiem(mer: string | undefined, h: number): number {
  if (h > 12) return h;
  if (mer === '下午' || mer === '晚上' || mer === '傍晚') {
    if (h === 12 && mer === '晚上') return 0;
    return h === 12 ? 12 : h + 12;
  }
  if (mer === '中午') return h < 11 ? h + 12 : h;
  if (mer === '凌晨') return h === 12 ? 0 : h;
  if (mer === '上午' || mer === '早上' || mer === '早晨') return h === 12 ? 0 : h;
  return h;
}

/**
 * 本周/下周/下下周的周X。按周一起算的日历周：weeks=0 本周，1 下周，2 下下周。
 * 本周目标日已过则顺延一周，避免任务排到过去。
 */
export function weekdayInWeeks(targetDow: number, weeks: number, now: Date): Date {
  const start = startOfDay(now);
  const todayM = (start.getDay() + 6) % 7;
  const targetM = (targetDow + 6) % 7;
  const result = new Date(start);
  result.setDate(start.getDate() - todayM + targetM + weeks * 7);
  if (result < start) result.setDate(result.getDate() + 7);
  return result;
}

function take(s: string, matched: string): string {
  return s.replace(matched, ' ');
}

function extractRange(s: string): { start?: string; end?: string; next: string } | null {
  const re = new RegExp(
    String.raw`(?:从|自)?\s*${MER}?\s*${HOUR}${MINUTE_TAIL}\s*(?:到|至|-|~)\s*${MER}?\s*${HOUR}${MINUTE_TAIL}`,
  );
  const m = s.match(re);
  if (!m) return null;
  if (!/[:点时]/.test(m[0])) return null;

  const h1raw = parseHourToken(m[2]);
  const h2raw = parseHourToken(m[7]);
  const next = take(s, m[0]);
  if (h1raw === null || h2raw === null) return { next };

  const mer1 = m[1];
  const mer2 = m[6];
  const m1 = parseMinute(m[3], m[4], m[5]);
  const m2 = parseMinute(m[8], m[9], m[10]);
  const h1 = applyMeridiem(mer1, h1raw);
  let h2 = mer2 ? applyMeridiem(mer2, h2raw) : h2raw;
  if (!mer2 && h2 * 60 + m2 <= h1 * 60 + m1 && h2 < 12) h2 += 12;

  if (!validTime(h1, m1) || !validTime(h2, m2) || h1 * 60 + m1 >= h2 * 60 + m2) return { next };
  return { start: hm(h1, m1), end: hm(h2, m2), next };
}

function extractSingleTime(s: string): { start: string; next: string } | null {
  const re = new RegExp(String.raw`${MER}?\s*${HOUR}${MINUTE_TAIL}`);
  const m = s.match(re);
  if (!m) return null;
  if (!/[:点时]/.test(m[0])) return null;
  const hRaw = parseHourToken(m[2]);
  if (hRaw === null) return null;
  const h = applyMeridiem(m[1], hRaw);
  const min = parseMinute(m[3], m[4], m[5]);
  if (!validTime(h, min)) return null;
  return { start: hm(h, min), next: take(s, m[0]) };
}

export function parseQuickInput(raw: string, now: Date = new Date()): QuickParseResult {
  let s = ` ${normalize(raw)} `;
  const res: QuickParseResult = { title: '' };
  const today = startOfDay(now);
  const setD = (d: Date) => {
    res.date = fmtDate(d);
  };

  // ── 优先级：#高 / !高 ──
  const pm = s.match(/[#！!]\s*([高中低])/);
  if (pm) {
    res.priority = PRIORITY_MAP[pm[1]];
    s = take(s, pm[0]);
  }

  // ── 日期 + 重复（先于时间，避免 9月10日 被当成 9 点） ──
  const everyDay = s.match(/(每天|每日)/);
  const everyWeek = s.match(/每\s*(?:周|星期|礼拜)\s*([一二三四五六日天])/);
  const everyMonth = s.match(/每月\s*(\d{1,2})\s*[号日]/);

  const iso = s.match(/(\d{4})\s*[年/-]\s*(\d{1,2})\s*[月/-]\s*(\d{1,2})\s*[号日]?/);
  const nextMonth = s.match(/下个?月\s*(\d{1,2})\s*[号日]/);
  const absDate = s.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*[号日]/);
  const nDays = s.match(/(\d{1,2}|[一两二三四五六七八九十])\s*天\s*(?:以后|之后|后)/);
  const dBig = s.match(/(大+)后天/);
  const d2 = s.match(/后天/);
  const d1 = s.match(/明天|明日/);
  const d0 = s.match(/今天|今日/);
  const nextW = s.match(/((?:下\s*)+)个?\s*(?:周|星期|礼拜)\s*([一二三四五六日天])/);
  const thisW = s.match(/(?:本|这)个?\s*(?:周|星期|礼拜)\s*([一二三四五六日天])/);
  const wk = s.match(/(?:周|星期|礼拜)\s*([一二三四五六日天])/);

  if (everyDay) {
    res.repeat = 'daily' satisfies RepeatKind;
    setD(today);
    s = take(s, everyDay[0]);
  } else if (everyWeek) {
    res.repeat = 'weekly';
    setD(weekdayInWeeks(WD_NUM[everyWeek[1]], 0, now));
    s = take(s, everyWeek[0]);
  } else if (everyMonth) {
    const day = Number(everyMonth[1]);
    if (day >= 1 && day <= 31) {
      res.repeat = 'monthly';
      const cand = new Date(today.getFullYear(), today.getMonth(), day);
      if (cand < today) cand.setMonth(cand.getMonth() + 1);
      setD(cand);
      s = take(s, everyMonth[0]);
    }
  } else if (iso) {
    const y = Number(iso[1]);
    const mo = Number(iso[2]);
    const d = Number(iso[3]);
    if (y >= 2000 && mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
      setD(new Date(y, mo - 1, d));
      s = take(s, iso[0]);
    }
  } else if (nextMonth) {
    const day = Number(nextMonth[1]);
    if (day >= 1 && day <= 31) {
      setD(new Date(today.getFullYear(), today.getMonth() + 1, day));
      s = take(s, nextMonth[0]);
    }
  } else if (absDate) {
    const mo = Number(absDate[1]);
    const d = Number(absDate[2]);
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
      const cand = new Date(today.getFullYear(), mo - 1, d);
      if (cand < today) cand.setFullYear(cand.getFullYear() + 1);
      setD(cand);
      s = take(s, absDate[0]);
    }
  } else if (nDays) {
    const n = /^\d+$/.test(nDays[1]) ? Number(nDays[1]) : (CN_INT[nDays[1]] ?? -1);
    if (n >= 1 && n <= 31) {
      setD(shiftDays(today, n));
      s = take(s, nDays[0]);
    }
  } else if (dBig) {
    setD(shiftDays(today, 2 + dBig[1].length));
    s = take(s, dBig[0]);
  } else if (d2) {
    setD(shiftDays(today, 2));
    s = take(s, d2[0]);
  } else if (d1) {
    setD(shiftDays(today, 1));
    s = take(s, d1[0]);
  } else if (d0) {
    setD(today);
    s = take(s, d0[0]);
  } else if (nextW) {
    const weeks = nextW[1].replace(/\s/g, '').length;
    setD(weekdayInWeeks(WD_NUM[nextW[2]], weeks, now));
    s = take(s, nextW[0]);
  } else if (thisW) {
    setD(weekdayInWeeks(WD_NUM[thisW[1]], 0, now));
    s = take(s, thisW[0]);
  } else if (wk) {
    setD(weekdayInWeeks(WD_NUM[wk[1]], 0, now));
    s = take(s, wk[0]);
  }

  // ── 时间段，再单个时间 ──
  const range = extractRange(s);
  if (range) {
    if (range.start && range.end) {
      res.startTime = range.start;
      res.endTime = range.end;
    }
    s = range.next;
  } else {
    const one = extractSingleTime(s);
    if (one) {
      res.startTime = one.start;
      s = one.next;
    }
  }

  res.title = s.replace(/\s+/g, ' ').trim();
  return res;
}
