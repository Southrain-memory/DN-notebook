import type { Task } from './types';
import { addDays, addMonths } from '../utils/date';

/** 计算重复任务的下一次日期 */
export function nextRepeatDate(date: string, repeat: NonNullable<Task['repeat']>): string {
  if (repeat === 'daily') return addDays(date, 1);
  if (repeat === 'weekly') return addDays(date, 7);
  return addMonths(date, 1);
}

/**
 * 领域规则（纯函数）：对任务列表应用一次更新。
 * 循环任务被标记完成时，自动生成下一次实例（子任务进度重置）。
 * 供各仓库实现共用，保证网页版 / 桌面版行为一致。
 */
export function applyUpdate(
  tasks: Task[],
  id: string,
  patch: Partial<Omit<Task, 'id' | 'createdAt'>>,
  now: number = Date.now(),
): { tasks: Task[]; next: Task } {
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error(`任务不存在: ${id}`);
  const prev = tasks[idx];
  const next: Task = {
    ...prev,
    ...patch,
    title: patch.title !== undefined ? patch.title.trim() : prev.title,
    updatedAt: now,
  };
  const list = [...tasks];
  list[idx] = next;

  if (patch.done === true && !prev.done && next.repeat) {
    const nextDate = nextRepeatDate(next.date, next.repeat);
    const exists = list.some((t) => t.repeat === next.repeat && t.title === next.title && t.date === nextDate);
    if (!exists) {
      list.push({
        id: `${now.toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
        title: next.title,
        note: next.note,
        date: nextDate,
        startTime: next.startTime,
        endTime: next.endTime,
        repeat: next.repeat,
        subtasks: next.subtasks?.map((s) => ({ ...s, done: false })),
        priority: next.priority,
        done: false,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  return { tasks: list, next };
}
