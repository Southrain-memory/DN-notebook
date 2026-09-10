import type { EventInput, EventRecord, RecordCategory } from './types';
import { FALLBACK_CATEGORY_ID } from './types';
import { sanitizeCategoryList, sanitizeEventList } from './sanitize';
import { isElectron } from './electronRepository';

/**
 * 记事数据仓库接口：事件（发生了什么）与分类的读写。
 * 与 TaskRepository 平行，同样有 localStorage（网页版）与
 * Electron 文件（桌面版，用户数据目录 events.json / categories.json）两个实现。
 */
export interface EventRepository {
  getAllEvents(): Promise<EventRecord[]>;
  createEvent(input: EventInput): Promise<EventRecord>;
  updateEvent(id: string, patch: Partial<Omit<EventRecord, 'id' | 'createdAt'>>): Promise<EventRecord>;
  deleteEvent(id: string): Promise<void>;
  importAllEvents(events: EventRecord[]): Promise<void>;
  getCategories(): Promise<RecordCategory[]>;
  saveCategories(categories: RecordCategory[]): Promise<void>;
}

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const EVENTS_KEY = 'daily-notebook.events.v1';
const CATEGORIES_KEY = 'daily-notebook.categories.v1';

function lsRead(key: string): unknown {
  try {
    const text = localStorage.getItem(key);
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function lsWrite(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    throw new Error('浏览器本地存储不可用，数据未能保存', { cause: err });
  }
}

function newEvent(input: EventInput): EventRecord {
  const now = Date.now();
  return {
    id: genId(),
    title: input.title.trim(),
    note: (input.note ?? '').trim(),
    date: input.date,
    categoryId: input.categoryId || FALLBACK_CATEGORY_ID,
    createdAt: now,
    updatedAt: now,
  };
}

/** 网页版：localStorage 实现 */
export class LocalStorageEventRepository implements EventRepository {
  async getAllEvents(): Promise<EventRecord[]> {
    return sanitizeEventList(lsRead(EVENTS_KEY));
  }

  async createEvent(input: EventInput): Promise<EventRecord> {
    const event = newEvent(input);
    const list = sanitizeEventList(lsRead(EVENTS_KEY));
    list.push(event);
    lsWrite(EVENTS_KEY, list);
    return event;
  }

  async updateEvent(id: string, patch: Partial<Omit<EventRecord, 'id' | 'createdAt'>>): Promise<EventRecord> {
    const list = sanitizeEventList(lsRead(EVENTS_KEY));
    const idx = list.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error(`记事不存在: ${id}`);
    const next: EventRecord = { ...list[idx], ...patch, title: patch.title !== undefined ? patch.title.trim() : list[idx].title, updatedAt: Date.now() };
    list[idx] = next;
    lsWrite(EVENTS_KEY, list);
    return next;
  }

  async deleteEvent(id: string): Promise<void> {
    lsWrite(EVENTS_KEY, sanitizeEventList(lsRead(EVENTS_KEY)).filter((e) => e.id !== id));
  }

  async importAllEvents(events: EventRecord[]): Promise<void> {
    lsWrite(EVENTS_KEY, sanitizeEventList(events));
  }

  async getCategories(): Promise<RecordCategory[]> {
    return sanitizeCategoryList(lsRead(CATEGORIES_KEY));
  }

  async saveCategories(categories: RecordCategory[]): Promise<void> {
    lsWrite(CATEGORIES_KEY, categories);
  }
}

const STORE_EVENTS_KEY = 'events';
const STORE_CATEGORIES_KEY = 'categories';

/** 桌面版：Electron IPC 文件实现（用户数据目录 events.json / categories.json） */
export class ElectronEventRepository implements EventRepository {
  private async readStore(key: string): Promise<unknown> {
    return window.electronAPI!.storeLoad(key);
  }

  private async writeStore(key: string, data: unknown): Promise<void> {
    await window.electronAPI!.storeSave(key, data);
  }

  async getAllEvents(): Promise<EventRecord[]> {
    return sanitizeEventList(await this.readStore(STORE_EVENTS_KEY));
  }

  async createEvent(input: EventInput): Promise<EventRecord> {
    const event = newEvent(input);
    const list = sanitizeEventList(await this.readStore(STORE_EVENTS_KEY));
    list.push(event);
    await this.writeStore(STORE_EVENTS_KEY, list);
    return event;
  }

  async updateEvent(id: string, patch: Partial<Omit<EventRecord, 'id' | 'createdAt'>>): Promise<EventRecord> {
    const list = sanitizeEventList(await this.readStore(STORE_EVENTS_KEY));
    const idx = list.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error(`记事不存在: ${id}`);
    const next: EventRecord = { ...list[idx], ...patch, title: patch.title !== undefined ? patch.title.trim() : list[idx].title, updatedAt: Date.now() };
    list[idx] = next;
    await this.writeStore(STORE_EVENTS_KEY, list);
    return next;
  }

  async deleteEvent(id: string): Promise<void> {
    const list = sanitizeEventList(await this.readStore(STORE_EVENTS_KEY));
    await this.writeStore(STORE_EVENTS_KEY, list.filter((e) => e.id !== id));
  }

  async importAllEvents(events: EventRecord[]): Promise<void> {
    await this.writeStore(STORE_EVENTS_KEY, sanitizeEventList(events));
  }

  async getCategories(): Promise<RecordCategory[]> {
    return sanitizeCategoryList(await this.readStore(STORE_CATEGORIES_KEY));
  }

  async saveCategories(categories: RecordCategory[]): Promise<void> {
    await this.writeStore(STORE_CATEGORIES_KEY, categories);
  }
}

let eventRepository: EventRepository = isElectron()
  ? new ElectronEventRepository()
  : new LocalStorageEventRepository();

export function getEventRepository(): EventRepository {
  return eventRepository;
}

export function setEventRepository(repo: EventRepository): void {
  eventRepository = repo;
}
