import { useCallback, useEffect, useRef } from 'react';
import type { Task } from '../data';
import type { DueNotice, NotifyPrefs } from '../utils/notify';
import {
  collectDueNotifications,
  collectUpcomingTriggerTimes,
  deliverNotification,
  loadFired,
  persistFired,
} from '../utils/notify';

const POLL_MS = 20_000;

/**
 * 根据任务时间发送开始 / 即将结束通知。
 * 用 setTimeout 对准触发点，并用短轮询 + 回到前台补漏（后台标签页定时器会被节流）。
 */
export function useTaskNotifications(
  tasks: Task[],
  prefs: NotifyPrefs,
  onNotice?: (n: DueNotice) => void,
): void {
  const firedRef = useRef<Map<string, number>>(loadFired());
  const tasksRef = useRef(tasks);
  const prefsRef = useRef(prefs);
  const onNoticeRef = useRef(onNotice);
  tasksRef.current = tasks;
  prefsRef.current = prefs;
  onNoticeRef.current = onNotice;

  const tick = useCallback(() => {
    const due = collectDueNotifications(
      tasksRef.current,
      new Date(),
      prefsRef.current,
      new Set(firedRef.current.keys()),
    );
    if (due.length === 0) return;
    const now = Date.now();
    for (const n of due) {
      firedRef.current.set(n.key, now);
      onNoticeRef.current?.(n);
      void deliverNotification(n.title, n.body);
    }
    persistFired(firedRef.current);
  }, []);

  useEffect(() => {
    tick();
    const timers: number[] = [];
    for (const at of collectUpcomingTriggerTimes(tasks, Date.now(), prefs)) {
      const delay = Math.max(50, at - Date.now() + 80);
      if (delay > 2_147_000_000) continue;
      timers.push(window.setTimeout(tick, delay));
    }
    const poll = window.setInterval(tick, POLL_MS);
    const onVis = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      for (const id of timers) window.clearTimeout(id);
      window.clearInterval(poll);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [tasks, prefs, tick]);
}
