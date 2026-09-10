import type { Task, TaskInput } from './types';
import { TIME_RE } from './types';
import type { TaskRepository } from './taskRepository';
import { applyUpdate } from './domain';
import { sanitizePriority, sanitizeRepeat, sanitizeSubtasks, sanitizeTask, sanitizeTaskList } from './sanitize';

const STORAGE_KEY = 'daily-notebook.tasks.v1';

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function load(): Task[] {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    if (!text) return [];
    return sanitizeTaskList(JSON.parse(text));
  } catch {
    return [];
  }
}

function save(tasks: Task[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    // 存储不可用（如隐私模式）时抛给上层提示用户
    throw new Error('浏览器本地存储不可用，数据未能保存', { cause: err });
  }
}

/** 基于浏览器 localStorage 的实现（网页版 / 单文件版使用） */
export class LocalStorageTaskRepository implements TaskRepository {
  async getAll(): Promise<Task[]> {
    return load();
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
    const tasks = load();
    tasks.push(task);
    save(tasks);
    return task;
  }

  async update(id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task> {
    const { tasks, next } = applyUpdate(load(), id, patch);
    save(tasks);
    return next;
  }

  async delete(id: string): Promise<void> {
    save(load().filter((t) => t.id !== id));
  }

  async importAll(tasks: Task[]): Promise<void> {
    save(tasks.map(sanitizeTask).filter((t): t is Task => t !== null));
  }
}
