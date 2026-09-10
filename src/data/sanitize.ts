import type { Priority, RepeatKind, Subtask, Task, EventRecord, RecordCategory } from './types';
import { FALLBACK_CATEGORY_ID, TIME_RE } from './types';

/** 清洗优先级，非法值回退 medium */
export function sanitizePriority(raw: unknown): Priority {
  return raw === 'high' || raw === 'low' ? raw : 'medium';
}

/** 清洗重复规则，非法值视为不重复 */
export function sanitizeRepeat(raw: unknown): RepeatKind | undefined {
  return raw === 'daily' || raw === 'weekly' || raw === 'monthly' ? raw : undefined;
}

/** 清洗子任务清单，非法项丢弃；空清单返回 undefined */
export function sanitizeSubtasks(raw: unknown): Subtask[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const list: Subtask[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const r = item as Record<string, unknown>;
    if (typeof r.id !== 'string' || typeof r.title !== 'string' || !r.title.trim()) continue;
    list.push({ id: r.id, title: r.title, done: r.done === true });
  }
  return list.length > 0 ? list : undefined;
}

/** 把未知数据清洗成合法的 Task，避免脏数据 / 旧版本数据破坏界面 */
export function sanitizeTask(raw: unknown): Task | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || typeof r.title !== 'string' || typeof r.date !== 'string') return null;
  const now = Date.now();
  return {
    id: r.id,
    title: r.title,
    note: typeof r.note === 'string' ? r.note : '',
    date: r.date,
    startTime: typeof r.startTime === 'string' && TIME_RE.test(r.startTime) ? r.startTime : undefined,
    endTime: typeof r.endTime === 'string' && TIME_RE.test(r.endTime) ? r.endTime : undefined,
    repeat: sanitizeRepeat(r.repeat),
    subtasks: sanitizeSubtasks(r.subtasks),
    priority: sanitizePriority(r.priority),
    done: r.done === true,
    doneAt: typeof r.doneAt === 'number' ? r.doneAt : undefined,
    createdAt: typeof r.createdAt === 'number' ? r.createdAt : now,
    updatedAt: typeof r.updatedAt === 'number' ? r.updatedAt : now,
  };
}

export function sanitizeTaskList(raw: unknown): Task[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(sanitizeTask).filter((t): t is Task => t !== null);
}

/** 清洗单条记事，分类非法时归入兜底分类 */
export function sanitizeEvent(raw: unknown): EventRecord | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || typeof r.title !== 'string' || typeof r.date !== 'string') return null;
  const now = Date.now();
  return {
    id: r.id,
    title: r.title,
    note: typeof r.note === 'string' ? r.note : '',
    date: r.date,
    categoryId: typeof r.categoryId === 'string' && r.categoryId ? r.categoryId : FALLBACK_CATEGORY_ID,
    createdAt: typeof r.createdAt === 'number' ? r.createdAt : now,
    updatedAt: typeof r.updatedAt === 'number' ? r.updatedAt : now,
  };
}

export function sanitizeEventList(raw: unknown): EventRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(sanitizeEvent).filter((e): e is EventRecord => e !== null);
}

/** 清洗分类，非法项丢弃 */
export function sanitizeCategory(raw: unknown): RecordCategory | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || typeof r.name !== 'string' || !r.name.trim()) return null;
  return { id: r.id, name: r.name, color: typeof r.color === 'string' ? r.color : '#64748b' };
}

export function sanitizeCategoryList(raw: unknown): RecordCategory[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(sanitizeCategory).filter((c): c is RecordCategory => c !== null);
}
