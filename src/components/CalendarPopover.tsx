import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Task } from '../data';
import { humanDate, isToday, monthMatrix, parseDate, todayStr } from '../utils/date';

interface Props {
  value: string;
  tasks: Task[];
  onSelect: (date: string) => void;
}

/** 月份日历弹层：周一开头，可点选任意日期，有未完成任务的日期显示圆点（有高优先级为红色） */
export function CalendarPopover({ value, tasks, onSelect }: Props) {
  const init = useMemo(() => parseDate(value), []); // 每次打开重新挂载，取当前值初始化
  const [year, setYear] = useState(init.getFullYear());
  const [month, setMonth] = useState(init.getMonth());

  const weeks = monthMatrix(year, month);
  const today = todayStr();

  const dots = useMemo(() => {
    const map = new Map<string, { any: boolean; high: boolean }>();
    for (const t of tasks) {
      if (t.done) continue;
      const cur = map.get(t.date) ?? { any: false, high: false };
      cur.any = true;
      if (t.priority === 'high') cur.high = true;
      map.set(t.date, cur);
    }
    return map;
  }, [tasks]);

  const move = (delta: number) => {
    const m = month + delta;
    setYear(year + Math.floor(m / 12));
    setMonth(((m % 12) + 12) % 12);
  };

  const navBtn =
    'grid h-7 w-7 place-items-center rounded-lg text-stone-500 transition hover:bg-stone-100 dark:text-zinc-400 dark:hover:bg-zinc-800';

  return (
    <div className="animate-menu-in absolute top-full z-50 mt-1 w-[280px] max-md:left-0 md:right-0 rounded-2xl border border-stone-200 bg-white p-3 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-1.5 flex items-center justify-between">
        <button type="button" onClick={() => move(-1)} className={navBtn} aria-label="上个月">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-stone-700 dark:text-zinc-200">
          {year}年{month + 1}月
        </span>
        <button type="button" onClick={() => move(1)} className={navBtn} aria-label="下个月">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-[11px] text-stone-400 dark:text-zinc-500">
        {['一', '二', '三', '四', '五', '六', '日'].map((w) => (
          <span key={w} className="py-1">
            {w}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {weeks.flat().map((date, i) => {
          if (!date) return <span key={i} />;
          const selected = date === value;
          const dot = dots.get(date);
          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelect(date)}
              className={`justify-self-center flex h-9 w-9 flex-col items-center justify-center rounded-full transition ${
                selected
                  ? 'bg-rose-500 text-white'
                  : isToday(date)
                    ? 'font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10'
                    : 'text-stone-600 hover:bg-stone-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
              <span className="text-[13px] leading-none">{parseDate(date).getDate()}</span>
              <span
                className={`mt-[3px] h-1 w-1 rounded-full ${
                  dot ? (selected ? 'bg-white/80' : dot.high ? 'bg-rose-500' : 'bg-stone-400 dark:bg-zinc-500') : 'bg-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-stone-100 pt-2 dark:border-zinc-800">
        <span className="text-xs text-stone-400 dark:text-zinc-500">{humanDate(value)}</span>
        <button
          type="button"
          onClick={() => onSelect(today)}
          className="rounded-lg px-2 py-1 text-xs font-medium text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-500/10"
        >
          回到今天
        </button>
      </div>
    </div>
  );
}
