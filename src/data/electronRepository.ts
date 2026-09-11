import type { Task, TaskInput } from './types';
import { TIME_RE } from './types';
import type { TaskRepository } from './taskRepository';
import { applyUpdate } from './domain';
import { sanitizePriority, sanitizeRepeat, sanitizeSubtasks, sanitizeTaskList } from './sanitize';

/**
 * Electron 桌面版仓库：通过 preload 暴露的 IPC 桥，
 * 把数据持久化到用户数据目录下的 tasks.json 文件。
 * 与网页版 LocalStorageTaskRepository 实现同一接口，行为一致（含重复任务规则）。
 */

interface ElectronBridge {
  loadTasks(): Promise<unknown>;
  saveTasks(tasks: unknown): Promise<unknown>;
  /** 读取用户数据目录下 {key}.json（记事/分类等附属数据） */
  storeLoad(key: string): Promise<unknown>;
  /** 写入用户数据目录下 {key}.json */
  storeSave(key: string, data: unknown): Promise<unknown>;
  /** 弹出系统通知 */
  showNotification?(payload: { title: string; body: string }): Promise<boolean>;
}

declare global {
  interface Window {
    electronAPI?: ElectronBridge;
  }
}

export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI;
}

function bridge(): ElectronBridge {
  const api = window.electronAPI;
  if (!api) throw new Error('桌面版数据桥不可用');
  return api;
}

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export class ElectronFileRepository implements TaskRepository {
  async getAll(): Promise<Task[]> {
    return sanitizeTaskList(await bridge().loadTasks());
  }

  async create(input: TaskInput): Promise<Task> {
    const now = Date.now();
    const task: Task = {
      id: genId(),
      title: input.title.trim(),
      note: (input.note ?? '').trim(),
      date: input.date,
      startTime: input.startTime && TIME_RE.test(input.startTime) ? input.startTime : undefined,
      endTime: input.endTime && TIME_RE.test(input.endTime) ? input.endTime : undefined,
      repeat: sanitizeRepeat(input.repeat),
      subtasks: sanitizeSubtasks(input.subtasks),
      priority: sanitizePriority(input.priority),
      done: false,
      createdAt: now,
      updatedAt: now,
    };
    const tasks = sanitizeTaskList(await bridge().loadTasks());
    tasks.push(task);
    await bridge().saveTasks(tasks);
    return task;
  }

  async update(id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task> {
    const tasks = sanitizeTaskList(await bridge().loadTasks());
    const { tasks: next, next: updated } = applyUpdate(tasks, id, patch);
    await bridge().saveTasks(next);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const tasks = sanitizeTaskList(await bridge().loadTasks());
    await bridge().saveTasks(tasks.filter((t) => t.id !== id));
  }

  async importAll(tasks: Task[]): Promise<void> {
    await bridge().saveTasks(tasks); // 渲染进程传入前已是 Task 结构，加载时仍会整体清洗
  }
}
