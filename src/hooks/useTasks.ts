import { useCallback, useEffect, useMemo, useState } from 'react';
import { getTaskRepository } from '../data';
import type { Task, TaskInput } from '../data';

/**
 * 任务列表状态：启动时从数据仓库加载，之后所有增删改都先写仓库、再同步内存状态。
 */
export function useTasks() {
  const repo = useMemo(() => getTaskRepository(), []);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    repo
      .getAll()
      .then((list) => {
        if (!alive) return;
        setTasks(list);
        setReady(true);
      })
      .catch(() => setReady(true));
    return () => {
      alive = false;
    };
  }, [repo]);

  const add = useCallback(
    async (input: TaskInput) => {
      const task = await repo.create(input);
      setTasks((prev) => [...prev, task]);
      return task;
    },
    [repo],
  );

  const update = useCallback(
    async (id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
      const next = await repo.update(id, patch);
      // 数据层可能在更新时派生新数据（如循环任务生成下一次），统一重新拉取
      setTasks(await repo.getAll());
      return next;
    },
    [repo],
  );

  const remove = useCallback(
    async (id: string) => {
      await repo.delete(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    },
    [repo],
  );

  const toggle = useCallback(
    async (id: string) => {
      const cur = tasks.find((t) => t.id === id);
      if (!cur) return;
      return update(id, { done: !cur.done, doneAt: !cur.done ? Date.now() : undefined });
    },
    [tasks, update],
  );

  const importAll = useCallback(
    async (list: Task[]) => {
      await repo.importAll(list);
      setTasks(await repo.getAll());
    },
    [repo],
  );

  return { tasks, ready, add, update, remove, toggle, importAll };
}
