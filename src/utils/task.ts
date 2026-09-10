import type { Task } from '../data';
import { PRIORITY_ORDER } from '../data';
import { addDays, fmtDate, todayStr } from './date';

/** 未完成任务排序：优先级 → 创建时间 */
export function compareUndone(a: Task, b: Task): number {
  return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.createdAt - b.createdAt;
}

/** 搜索过滤：匹配标题 / 备注 / 子任务标题（大小写不敏感，空串放行全部） */
export function matchesQuery(t: Task, q: string): boolean {
  const k = q.trim().toLowerCase();
  if (!k) return true;
  return (
    t.title.toLowerCase().includes(k) ||
    t.note.toLowerCase().includes(k) ||
    (t.subtasks?.some((s) => s.title.toLowerCase().includes(k)) ?? false)
  );
}

/** 本周一到周日的日期范围（YYYY-MM-DD） */
export function currentWeekRange(): { start: string; end: string } {
  const now = new Date();
  const monday = addDays(fmtDate(now), -((now.getDay() + 6) % 7));
  return { start: monday, end: addDays(monday, 6) };
}

/** 本周已完成任务数（按完成时间计） */
export function weekCompletedCount(tasks: Task[]): number {
  const { start, end } = currentWeekRange();
  return tasks.filter((t) => {
    if (!t.done || !t.doneAt) return false;
    const d = fmtDate(new Date(t.doneAt));
    return d >= start && d <= end;
  }).length;
}

/** 连续打卡天数：从今天（或昨天，若今天还没完成过）往前数，每天都有完成任务的最长连续天数 */
export function computeStreak(tasks: Task[]): number {
  const doneDays = new Set(
    tasks.filter((t) => t.done && t.doneAt !== undefined).map((t) => fmtDate(new Date(t.doneAt as number))),
  );
  let cursor = todayStr();
  if (!doneDays.has(cursor)) cursor = addDays(cursor, -1);
  let streak = 0;
  while (doneDays.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
