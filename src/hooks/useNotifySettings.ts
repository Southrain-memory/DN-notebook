import { useCallback, useEffect, useState } from 'react';
import type { NotifyPrefs } from '../utils/notify';

export type NotifySettings = NotifyPrefs;

export const LEAD_OPTIONS = [3, 5, 10, 15] as const;
export const DEFAULT_LEAD_MINUTES = 5;

const KEY = 'daily-notebook.notify';
const DEFAULTS: NotifySettings = { enabled: true, leadMinutes: DEFAULT_LEAD_MINUTES };

function isLead(n: number): n is (typeof LEAD_OPTIONS)[number] {
  return (LEAD_OPTIONS as readonly number[]).includes(n);
}

function sanitize(raw: Partial<NotifySettings>): NotifySettings {
  return {
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : true,
    leadMinutes: typeof raw.leadMinutes === 'number' && isLead(raw.leadMinutes) ? raw.leadMinutes : DEFAULT_LEAD_MINUTES,
  };
}

function load(): NotifySettings {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return sanitize(JSON.parse(saved) as Partial<NotifySettings>);
  } catch {
    /* 忽略 */
  }
  return DEFAULTS;
}

/** 通知开关与即将结束提前量，持久化到 localStorage */
export function useNotifySettings(): [NotifySettings, (patch: Partial<NotifySettings>) => void] {
  const [settings, setSettings] = useState<NotifySettings>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      /* 忽略 */
    }
  }, [settings]);

  const patch = useCallback((p: Partial<NotifySettings>) => {
    setSettings((prev) => sanitize({ ...prev, ...p }));
  }, []);

  return [settings, patch];
}
