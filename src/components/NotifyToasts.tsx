import { useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import type { DueNotice } from '../utils/notify';

interface Props {
  notices: DueNotice[];
  onDismiss: (key: string) => void;
}

/** 应用内提醒条：系统通知不可用（如 file:// 单文件版）或窗口正在前台时作为可见反馈 */
export function NotifyToasts({ notices, onDismiss }: Props) {
  if (notices.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-24 right-4 z-50 flex w-[min(100%-2rem,20rem)] flex-col gap-2 md:bottom-6">
      {notices.map((n) => (
        <Toast key={n.key} notice={n} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Toast({ notice, onDismiss }: { notice: DueNotice; onDismiss: (key: string) => void }) {
  useEffect(() => {
    const id = window.setTimeout(() => onDismiss(notice.key), 8000);
    return () => window.clearTimeout(id);
  }, [notice.key, onDismiss]);

  return (
    <div
      role="status"
      className="pointer-events-auto flex items-start gap-2.5 rounded-2xl border border-stone-200 bg-white px-3.5 py-3 shadow-lg shadow-stone-900/10 animate-menu-in dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/40"
    >
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-rose-500/10 text-rose-500 dark:bg-rose-500/15 dark:text-rose-400">
        <Bell className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-stone-800 dark:text-zinc-100">{notice.title}</p>
        <p className="mt-0.5 text-xs leading-5 text-stone-500 dark:text-zinc-400">{notice.body}</p>
      </div>
      <button
        type="button"
        aria-label="关闭提醒"
        onClick={() => onDismiss(notice.key)}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
