import { useState } from 'react';
import type { MouseEvent } from 'react';
import { Clock, X } from 'lucide-react';
import { isValidTimeRange } from '../utils/date';
import { useDismiss } from '../hooks/useDismiss';

interface Props {
  start?: string;
  end?: string;
  onChange: (start?: string, end?: string) => void;
}

const timeInputCls =
  'flex-1 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1.5 text-sm text-stone-700 outline-none transition focus:border-rose-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-rose-500/60';

/** 时间段选择：按钮芯片 + 内嵌两个原生时间输入的小弹层 */
export function TimeRangePicker({ start, end, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss<HTMLDivElement>(() => setOpen(false), open);

  const set = (s?: string, e?: string) => onChange(s || undefined, e || undefined);
  const dirty = !!(start || end);
  const invalid = !!start && !!end && !isValidTimeRange(start, end);
  const label = start && end ? `${start} – ${end}` : start ? `开始 ${start}` : end ? `结束 ${end}` : '时间段';

  const openPicker = (e: MouseEvent<HTMLInputElement>) => {
    try {
      e.currentTarget.showPicker();
    } catch {
      /* 老浏览器忽略，直接手动输入 */
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
          dirty
            ? 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400'
            : 'text-stone-500 hover:bg-stone-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
        }`}
      >
        <Clock className="h-3.5 w-3.5" />
        {label}
      </button>

      {open && (
        <div className="animate-menu-in absolute left-0 top-full z-50 mt-1 w-[250px] rounded-2xl border border-stone-200 bg-white p-3 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <label className="w-8 shrink-0 text-xs text-stone-500 dark:text-zinc-400">开始</label>
            <input type="time" value={start ?? ''} onChange={(e) => set(e.target.value, end)} onClick={openPicker} className={timeInputCls} />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <label className="w-8 shrink-0 text-xs text-stone-500 dark:text-zinc-400">结束</label>
            <input type="time" value={end ?? ''} onChange={(e) => set(start, e.target.value)} onClick={openPicker} className={timeInputCls} />
          </div>
          {invalid && <p className="mt-2 text-xs text-rose-500">结束时间需晚于开始时间</p>}
          <div className="mt-3 flex items-center justify-end gap-2">
            {dirty && (
              <button
                type="button"
                onClick={() => set(undefined, undefined)}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-stone-400 transition hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-zinc-800"
              >
                <X className="h-3 w-3" />
                清除
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm shadow-rose-500/30 transition hover:bg-rose-600"
            >
              完成
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
