import type { EventRecord, RecordCategory, Task } from '../data';
import { sanitizeCategoryList, sanitizeEventList } from '../data/sanitize';
import { todayStr } from './date';

/** 备份文件 v2：任务 + 记事 + 分类（v1 仅任务，导入时自动兼容） */
export interface BackupFile {
  app: 'daily-notebook';
  version: 1 | 2;
  exportedAt: string;
  tasks: Task[];
  events?: EventRecord[];
  categories?: RecordCategory[];
}

export function exportBackup(tasks: Task[], events: EventRecord[], categories: RecordCategory[]): void {
  const payload: BackupFile = {
    app: 'daily-notebook',
    version: 2,
    exportedAt: new Date().toISOString(),
    tasks,
    events,
    categories,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `每日记事本-备份-${todayStr()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export interface ParsedBackup {
  tasks: Task[];
  events: EventRecord[];
  categories: RecordCategory[];
}

/** 解析备份文件内容（v1 仅任务、v2 全量），格式非法时抛错；字段清洗由各仓库的导入负责 */
export function parseBackup(text: string): ParsedBackup {
  const data: unknown = JSON.parse(text);
  if (!data || typeof data !== 'object') throw new Error('invalid');
  const obj = data as Record<string, unknown>;
  const tasks = Array.isArray(obj.tasks) ? (obj.tasks as Task[]) : Array.isArray(data) ? (data as Task[]) : null;
  if (!tasks) throw new Error('invalid');
  return {
    tasks,
    events: sanitizeEventList(obj.events),
    categories: sanitizeCategoryList(obj.categories),
  };
}
