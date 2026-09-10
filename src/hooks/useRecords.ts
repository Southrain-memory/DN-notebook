import { useCallback, useEffect, useMemo, useState } from 'react';
import type { EventInput, EventRecord, RecordCategory } from '../data';
import { CATEGORY_PALETTE, DEFAULT_CATEGORIES, FALLBACK_CATEGORY_ID } from '../data';
import { getEventRepository } from '../data/eventRepository';

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * 记事与分类的状态管理：加载时补齐内置分类，
 * 删除分类时其下的记事自动归入「其他」。
 */
export function useRecords() {
  const repo = useMemo(() => getEventRepository(), []);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [categories, setCategories] = useState<RecordCategory[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [events, categories] = await Promise.all([repo.getAllEvents(), repo.getCategories()]);
        if (!alive) return;
        let cats = categories;
        if (cats.length === 0) {
          cats = DEFAULT_CATEGORIES; // 首次使用：写入内置分类
          await repo.saveCategories(cats);
        }
        setEvents(events);
        setCategories(cats);
      } catch {
        /* 忽略加载失败，保持空列表 */
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [repo]);

  const addEvent = useCallback(
    async (input: EventInput) => {
      const event = await repo.createEvent(input);
      setEvents((prev) => [...prev, event]);
      return event;
    },
    [repo],
  );

  const updateEvent = useCallback(
    async (id: string, patch: Partial<Omit<EventRecord, 'id' | 'createdAt'>>) => {
      const next = await repo.updateEvent(id, patch);
      setEvents((prev) => prev.map((e) => (e.id === id ? next : e)));
      return next;
    },
    [repo],
  );

  const removeEvent = useCallback(
    async (id: string) => {
      await repo.deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    },
    [repo],
  );

  const addCategory = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const next = [...categories, { id: genId(), name: trimmed, color: CATEGORY_PALETTE[categories.length % CATEGORY_PALETTE.length] }];
      await repo.saveCategories(next);
      setCategories(next);
    },
    [categories, repo],
  );

  /** 删除分类：其下的记事自动归入「其他」 */
  const deleteCategory = useCallback(
    async (id: string) => {
      if (id === FALLBACK_CATEGORY_ID) return;
      const next = categories.filter((c) => c.id !== id);
      await repo.saveCategories(next);
      setCategories(next);
      for (const e of events.filter((e) => e.categoryId === id)) {
        const upd = await repo.updateEvent(e.id, { categoryId: FALLBACK_CATEGORY_ID });
        setEvents((prev) => prev.map((x) => (x.id === upd.id ? upd : x)));
      }
    },
    [categories, events, repo],
  );

  const importAllEvents = useCallback(
    async (list: EventRecord[]) => {
      await repo.importAllEvents(list);
      setEvents(await repo.getAllEvents());
    },
    [repo],
  );

  const saveCategories = useCallback(
    async (cats: RecordCategory[]) => {
      await repo.saveCategories(cats);
      setCategories(cats);
    },
    [repo],
  );

  return { events, categories, ready, addEvent, updateEvent, removeEvent, addCategory, deleteCategory, saveCategories, importAllEvents };
}
