import { TIME_RE } from '../data/types';
import type { Task } from '../data/types';

/** 开始提醒的宽限：错过不超过此时长仍补发一次（应对后台节流 / 短暂离开） */
export const START_GRACE_MS = 3 * 60 * 1000;

const FIRED_KEY = 'daily-notebook.notify-fired';
const FIRED_TTL_MS = 48 * 60 * 60 * 1000;
const TITLE_CLIP = 24;

export interface NotifyPrefs {
  enabled: boolean;
  /** 即将结束提前多少分钟 */
  leadMinutes: number;
}

export type NotifyKind = 'start' | 'endsoon';

export interface DueNotice {
  key: string;
  kind: NotifyKind;
  taskId: string;
  title: string;
  body: string;
}

export type NotifyPermission = 'electron' | 'unsupported' | NotificationPermission;

/** 本地时区 date + HH:MM → 毫秒时间戳 */
export function localDateTimeMs(date: string, time: string): number {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0, 0).getTime();
}

function clipTitle(s: string): string {
  const t = s.trim() || '未命名任务';
  return t.length > TITLE_CLIP ? `${t.slice(0, TITLE_CLIP)}…` : t;
}

/** 即将结束的触发时刻；任务过短时改为一分钟前，仍会与开始撞车则跳过 */
function endSoonAt(startMs: number | undefined, endMs: number, leadMs: number): number | null {
  let at = endMs - leadMs;
  if (startMs !== undefined && at <= startMs) at = endMs - 60_000;
  if (startMs !== undefined && at <= startMs) return null;
  if (at >= endMs) return null;
  return at;
}

function startKey(taskId: string, date: string, startTime: string): string {
  return `${taskId}|start|${date}|${startTime}`;
}

function endSoonKey(taskId: string, date: string, endTime: string): string {
  return `${taskId}|endsoon|${date}|${endTime}`;
}

/**
 * 收集此刻应发出的提醒。调用方负责把返回的 key 记入 fired，避免重复。
 * 开始：落在 [start, start+宽限) 内补发一次。
 * 即将结束：落在 [end-提前量, end) 内提醒（短任务自动收窄提前量）。
 */
export function collectDueNotifications(
  tasks: Task[],
  now: Date,
  prefs: NotifyPrefs,
  fired: ReadonlySet<string>,
): DueNotice[] {
  if (!prefs.enabled) return [];
  const nowMs = now.getTime();
  const leadMs = Math.max(1, prefs.leadMinutes) * 60_000;
  const out: DueNotice[] = [];

  for (const t of tasks) {
    if (t.done) continue;
    const label = clipTitle(t.title);

    let startNotice: DueNotice | undefined;
    if (t.startTime && TIME_RE.test(t.startTime)) {
      const startMs = localDateTimeMs(t.date, t.startTime);
      const key = startKey(t.id, t.date, t.startTime);
      if (Number.isFinite(startMs) && !fired.has(key) && nowMs >= startMs && nowMs < startMs + START_GRACE_MS) {
        startNotice = {
          key,
          kind: 'start',
          taskId: t.id,
          title: '任务开始',
          body: `「${label}」到点了（${t.startTime}）`,
        };
      }
    }

    let endNotice: DueNotice | undefined;
    if (t.endTime && TIME_RE.test(t.endTime)) {
      const endMs = localDateTimeMs(t.date, t.endTime);
      if (Number.isFinite(endMs)) {
        const startMs =
          t.startTime && TIME_RE.test(t.startTime) ? localDateTimeMs(t.date, t.startTime) : undefined;
        const at = endSoonAt(startMs, endMs, leadMs);
        const key = endSoonKey(t.id, t.date, t.endTime);
        if (at !== null && !fired.has(key) && nowMs >= at && nowMs < endMs) {
          const minsLeft = Math.max(1, Math.round((endMs - nowMs) / 60_000));
          endNotice = {
            key,
            kind: 'endsoon',
            taskId: t.id,
            title: '即将结束',
            body: `「${label}」还有 ${minsLeft} 分钟结束（${t.endTime}）`,
          };
        }
      }
    }

    // 短任务可能同一时刻两条都到点：只发更紧急的「即将结束」，避免连弹
    if (endNotice) out.push(endNotice);
    else if (startNotice) out.push(startNotice);
  }

  return out;
}

/** 未来 36 小时内的触发时刻，用于 setTimeout 准时唤醒 */
export function collectUpcomingTriggerTimes(tasks: Task[], nowMs: number, prefs: NotifyPrefs): number[] {
  if (!prefs.enabled) return [];
  const leadMs = Math.max(1, prefs.leadMinutes) * 60_000;
  const horizon = nowMs + 36 * 60 * 60 * 1000;
  const times: number[] = [];

  for (const t of tasks) {
    if (t.done) continue;
    if (t.startTime && TIME_RE.test(t.startTime)) {
      const startMs = localDateTimeMs(t.date, t.startTime);
      if (Number.isFinite(startMs) && startMs > nowMs && startMs <= horizon) times.push(startMs);
    }
    if (t.endTime && TIME_RE.test(t.endTime)) {
      const endMs = localDateTimeMs(t.date, t.endTime);
      if (!Number.isFinite(endMs)) continue;
      const startMs =
        t.startTime && TIME_RE.test(t.startTime) ? localDateTimeMs(t.date, t.startTime) : undefined;
      const at = endSoonAt(startMs, endMs, leadMs);
      if (at !== null && at > nowMs && at <= horizon) times.push(at);
    }
  }

  return [...new Set(times)].sort((a, b) => a - b);
}

export function loadFired(): Map<string, number> {
  const map = new Map<string, number>();
  try {
    const raw = localStorage.getItem(FIRED_KEY);
    if (!raw) return map;
    const obj = JSON.parse(raw) as Record<string, number>;
    const cutoff = Date.now() - FIRED_TTL_MS;
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'number' && v >= cutoff) map.set(k, v);
    }
  } catch {
    /* 忽略损坏数据 */
  }
  return map;
}

export function persistFired(map: Map<string, number>): void {
  try {
    const cutoff = Date.now() - FIRED_TTL_MS;
    const obj: Record<string, number> = {};
    for (const [k, v] of map) {
      if (v >= cutoff) obj[k] = v;
    }
    localStorage.setItem(FIRED_KEY, JSON.stringify(obj));
  } catch {
    /* 存储不可用时仅保留内存去重 */
  }
}

export function getNotifyPermission(): NotifyPermission {
  if (typeof window !== 'undefined' && window.electronAPI?.showNotification) return 'electron';
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}

export async function requestNotifyPermission(): Promise<NotifyPermission> {
  if (typeof window !== 'undefined' && window.electronAPI?.showNotification) return 'electron';
  if (typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission === 'default') {
    try {
      await Notification.requestPermission();
    } catch {
      /* 忽略 */
    }
  }
  return Notification.permission;
}

/** 发出一条系统通知：桌面版走 Electron 原生通知，网页版走浏览器 Notification */
export async function deliverNotification(title: string, body: string): Promise<boolean> {
  const t = title.slice(0, 80);
  const b = body.slice(0, 200);
  const api = typeof window !== 'undefined' ? window.electronAPI : undefined;
  if (api?.showNotification) {
    try {
      return !!(await api.showNotification({ title: t, body: b }));
    } catch {
      return false;
    }
  }
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'default') {
    const perm = await requestNotifyPermission();
    if (perm !== 'granted') return false;
  }
  if (Notification.permission !== 'granted') return false;
  try {
    const n = new Notification(t, { body: b });
    n.onclick = () => {
      window.focus();
      n.close();
    };
    return true;
  } catch {
    return false;
  }
}

export function sendTestNotification(): Promise<boolean> {
  return deliverNotification('每日记事本', '这是一条测试通知。到任务开始时间和即将结束时，你会收到类似提醒。');
}
