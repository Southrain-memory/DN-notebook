import type { Priority, RepeatKind } from '../data/types';
import { fmtDate } from './date';

/**
 * 中文 Quick Add 解析：从一句话里识别日期、时间段、优先级和重复规则，
 * 剩余部分作为标题。识别不了就原样当标题，不会强行猜测。
 *
 * 支持：今天/明天/后天/大后天、周X（本周/下周X/下下周X）、M月d号、
 *       每天/每周X/每月X号（生成重复规则）、
 *       上午/中午/下午/晚上 N点[半|N分]（含"A到B"时间段）、15:30、#高/#中/#低
 */

const WD_NUM: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 0, 天: 0 };

const PRIORITY_MAP: Record<string, Priority> = { 高: 'high', 中: 'medium', 低: 'low' };

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

/** 按上午/中午/下午/晚上 修正小时数（24 小时制） */
function meridiemHour(mer: string | undefined, h: number): number {
  if (h > 23) return h;
  if (mer === '下午' || mer === '晚上') return h < 12 ? h + 12 : h;
  if (mer === '中午') return h < 11 ? h + 12 : h; // 中午12点=12:00，中午11点半按 11:30
  return h;
}

function validTime(h: number, m: number): boolean {
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

/** 本周的周X（diff=0 表示就是今天） */
function thisWeekday(target: number): Date {
  const today = new Date();
  const diff = (target - today.getDay() + 7) % 7;
  const d = new Date(today);
  d.setDate(d.getDate() + diff);
  return d;
}

function shift(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export function parseQuickInput(raw: string): QuickParseResult {
  let s = ` ${raw} `;
  const res: QuickParseResult = { title: '' };

  // ── 优先级：#高 / !高 ──
  const pm = s.match(/[#！!]\s*([高中低])/);
  if (pm) {
    res.priority = PRIORITY_MAP[pm[1]];
    s = s.replace(pm[0], ' ');
  }

  // ── 时间段：X点(半|N分)?到Y点(半|N分)? ──
  const rangeRe =
    /(上午|早上|中午|下午|晚上)?\s*(\d{1,2})\s*[点时:：]\s*(?:([1-5]?\d)\s*分?|半)?\s*到\s*(上午|早上|中午|下午|晚上)?\s*(\d{1,2})\s*[点时:：]\s*(?:([1-5]?\d)\s*分?|半)?/;
  const rm = s.match(rangeRe);
  if (rm) {
    const h1 = meridiemHour(rm[1], Number(rm[2]));
    const m1 = rm[3] === '半' ? 30 : Number(rm[3] ?? 0);
    const h2raw = Number(rm[5]);
    let h2: number;
    if (rm[4]) h2 = meridiemHour(rm[4], h2raw);
    else if ((rm[1] === '下午' || rm[1] === '晚上' || rm[1] === '中午') && h2raw < 12) h2 = h2raw + 12;
    else h2 = h2raw;
    const m2 = rm[6] === '半' ? 30 : Number(rm[6] ?? 0);
    if (validTime(h1, m1) && validTime(h2, m2) && h1 * 60 + m1 < h2 * 60 + m2) {
      res.startTime = hm(h1, m1);
      res.endTime = hm(h2, m2);
      s = s.replace(rm[0], ' ');
    }
  }

  // ── 单个时间 ──
  if (!res.startTime) {
    const colon = s.match(/([01]?\d|2[0-3]):([0-5]\d)/);
    if (colon) {
      res.startTime = hm(Number(colon[1]), Number(colon[2]));
      s = s.replace(colon[0], ' ');
    } else {
      const tm = s.match(/(上午|早上|中午|下午|晚上)?\s*(\d{1,2})\s*[点时]\s*(?:半|([1-5]?\d)\s*分?)?/);
      if (tm) {
        const h = meridiemHour(tm[1], Number(tm[2]));
        const m = tm[3] === '半' ? 30 : Number(tm[3] ?? 0);
        if (validTime(h, m)) {
          res.startTime = hm(h, m);
          s = s.replace(tm[0], ' ');
        }
      }
    }
  }

  // ── 日期 + 重复 ──
  const today = new Date();
  const setD = (d: Date) => {
    res.date = fmtDate(d);
  };
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const everyDay = s.match(/(每天|每日)/);
  const everyWeek = s.match(/每\s*(?:周|星期|礼拜)\s*([一二三四五六日天])/);
  const everyMonth = s.match(/每月\s*(\d{1,2})\s*[号日]/);
  if (everyDay) {
    res.repeat = 'daily' satisfies RepeatKind;
    setD(today);
    s = s.replace(everyDay[0], ' ');
  } else if (everyWeek) {
    res.repeat = 'weekly';
    setD(thisWeekday(WD_NUM[everyWeek[1]]));
    s = s.replace(everyWeek[0], ' ');
  } else if (everyMonth) {
    const day = Number(everyMonth[1]);
    if (day >= 1 && day <= 31) {
      res.repeat = 'monthly';
      const cand = new Date(today.getFullYear(), today.getMonth(), day);
      if (cand < startOfToday) cand.setMonth(cand.getMonth() + 1);
      setD(cand);
      s = s.replace(everyMonth[0], ' ');
    }
  } else {
    const absDate = s.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*[号日]/);
    const d3 = s.match(/大后天/);
    const d2 = s.match(/后天/);
    const d1 = s.match(/明天|明日/);
    const d0 = s.match(/今天|今日/);
    const nnw = s.match(/下{1,2}\s*(?:周|星期|礼拜)\s*([一二三四五六日天])/);
    const nw = s.match(/下\s*(?:周|星期|礼拜)\s*([一二三四五六日天])/);
    const wk = s.match(/(?:周|星期|礼拜)\s*([一二三四五六日天])/);
    if (absDate) {
      const m = Number(absDate[1]);
      const d = Number(absDate[2]);
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        const cand = new Date(today.getFullYear(), m - 1, d);
        if (cand < startOfToday) cand.setFullYear(cand.getFullYear() + 1);
        setD(cand);
        s = s.replace(absDate[0], ' ');
      }
    } else if (d3) {
      setD(shift(today, 3));
      s = s.replace(d3[0], ' ');
    } else if (d2) {
      setD(shift(today, 2));
      s = s.replace(d2[0], ' ');
    } else if (d1) {
      setD(shift(today, 1));
      s = s.replace(d1[0], ' ');
    } else if (d0) {
      setD(today);
      s = s.replace(d0[0], ' ');
    } else if (nnw) {
      const base = thisWeekday(WD_NUM[nnw[1]]);
      base.setDate(base.getDate() + 14); // 下下周
      setD(base);
      s = s.replace(nnw[0], ' ');
    } else if (nw) {
      const base = thisWeekday(WD_NUM[nw[1]]);
      base.setDate(base.getDate() + 7); // 下周
      setD(base);
      s = s.replace(nw[0], ' ');
    } else if (wk) {
      setD(thisWeekday(WD_NUM[wk[1]]));
      s = s.replace(wk[0], ' ');
    }
  }

  res.title = s.replace(/\s+/g, ' ').trim();
  return res;
}
