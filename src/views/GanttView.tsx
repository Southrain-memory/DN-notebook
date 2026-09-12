import { useEffect, useMemo, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import type { Task, TaskInput } from '../data';
import { addDays, humanDate, isToday, isValidTimeRange, nowMinutes, parseDate, timeToMinutes, todayStr } from '../utils/date';
import { QuickAdd } from '../components/QuickAdd';
import { TaskItem } from '../components/TaskItem';
import { TaskSection } from '../components/TaskSection';
import { EmptyState } from '../components/EmptyState';
import { PRIORITY_META } from '../components/PriorityPicker';

interface Props {
  tasks: Task[];
  viewDate: string;
  onAdd: (input: TaskInput) => void;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onDefer: (task: Task) => void;
  onSubtaskToggle: (task: Task, subtaskId: string) => void;
}

interface TimedItem {
  task: Task;
  date: string;
  startMin: number;
  endMin: number;
}

interface Block {
  key: string;
  task: Task;
  startMin: number;
  endMin: number;
  /** 横向位置与宽度（百分比，重叠任务分列排布） */
  left: number;
  width: number;
}

/** 时间段重叠的任务分列排布：同一簇内按列均分 */
function clusterColumns<T extends { startMin: number; endMin: number }>(items: T[]): (T & { col: number; cols: number })[] {
  const sorted = [...items].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
  const out: (T & { col: number; cols: number })[] = [];
  let cluster: (T & { col: number })[] = [];
  let colEnds: number[] = [];
  let clusterEnd = -1;
  const close = () => {
    if (cluster.length === 0) return;
    const cols = colEnds.length;
    for (const b of cluster) out.push({ ...b, cols });
    cluster = [];
    colEnds = [];
    clusterEnd = -1;
  };
  for (const it of sorted) {
    if (cluster.length > 0 && it.startMin >= clusterEnd) close();
    let col = colEnds.findIndex((end) => end <= it.startMin);
    if (col === -1) col = colEnds.length;
    colEnds[col] = it.endMin;
    cluster.push({ ...it, col });
    clusterEnd = Math.max(clusterEnd, it.endMin);
  }
  close();
  return out;
}

/** 时间窗：按最早/最晚各扩 1 小时，最少 6 小时（空数据用默认窗） */
function windowOf(items: { startMin: number; endMin: number }[], defaultWin: { startH: number; endH: number }) {
  if (items.length === 0) return defaultWin;
  const min = Math.min(...items.map((b) => b.startMin));
  const max = Math.max(...items.map((b) => b.endMin));
  let s = Math.max(0, Math.floor(min / 60) - 1);
  let e = Math.min(24, Math.ceil(max / 60) + 1);
  if (e - s < 6) e = Math.min(24, s + 6);
  if (e - s < 6) s = Math.max(0, e - 6);
  return { startH: s, endH: e };
}

const WEEKDAYS_SHORT = ['一', '二', '三', '四', '五', '六', '日'];

/** M月d日（不带年份） */
function mdLabel(s: string): string {
  const d = parseDate(s);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 时间甘特图：日视图（当天按小时时间轴）与周视图（7 天概览），由任务时间段自动生成 */
export function GanttView({ tasks, viewDate, onAdd, onToggle, onEdit, onDelete, onDefer, onSubtaskToggle }: Props) {
  const [mode, setMode] = useState<'day' | 'week'>('day');
  const [now, setNow] = useState(() => nowMinutes());
  useEffect(() => {
    const id = setInterval(() => setNow(nowMinutes()), 30_000);
    return () => clearInterval(id);
  }, []);

  const pxPerHour = mode === 'day' ? 48 : 34;

  // ── 日视图数据 ──
  const dayTasks = useMemo(() => tasks.filter((t) => t.date === viewDate), [tasks, viewDate]);
  const dayTimed = useMemo(
    () =>
      dayTasks
        .filter((t) => !t.done && isValidTimeRange(t.startTime, t.endTime))
        .map((t) => ({ task: t, date: t.date, startMin: timeToMinutes(t.startTime!), endMin: timeToMinutes(t.endTime!) })),
    [dayTasks],
  );
  const unscheduled = useMemo(
    () => dayTasks.filter((t) => !t.done && !isValidTimeRange(t.startTime, t.endTime)),
    [dayTasks],
  );

  // ── 周视图数据 ──
  const weekDates = useMemo(() => {
    const d = parseDate(viewDate);
    const monday = addDays(viewDate, -((d.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }, [viewDate]);

  const weekItems = useMemo(() => {
    const set = new Set(weekDates);
    return tasks
      .filter((t) => set.has(t.date) && !t.done && isValidTimeRange(t.startTime, t.endTime))
      .map((t) => ({ task: t, date: t.date, startMin: timeToMinutes(t.startTime!), endMin: timeToMinutes(t.endTime!) }));
  }, [tasks, weekDates]);

  // ── 时间窗与几何 ──
  const { startH, endH } = useMemo(
    () => windowOf(mode === 'day' ? dayTimed : weekItems, mode === 'day' ? { startH: 8, endH: 22 } : { startH: 7, endH: 23 }),
    [mode, dayTimed, weekItems],
  );
  const y = (min: number) => (min / 60) * pxPerHour - startH * pxPerHour;
  const chartHeight = (endH - startH) * pxPerHour;
  const labelEvery = mode === 'day' ? 1 : 2;

  // ── 日视图块 ──
  const dayBlocks = useMemo<Block[]>(() => {
    const win = windowOf(dayTimed, { startH: 8, endH: 22 });
    void win;
    return clusterColumns(dayTimed).map((b) => ({
      key: b.task.id,
      task: b.task,
      startMin: b.startMin,
      endMin: b.endMin,
      left: (b.col * 100) / b.cols,
      width: 100 / b.cols,
    }));
  }, [dayTimed]);

  // ── 周视图块（按天分列再并入 7 列网格） ──
  const weekBlocks = useMemo<Block[]>(() => {
    const out: Block[] = [];
    weekDates.forEach((date, dayIdx) => {
      const list = weekItems.filter((it) => it.date === date);
      for (const b of clusterColumns(list)) {
        out.push({
          key: b.task.id,
          task: b.task,
          startMin: b.startMin,
          endMin: b.endMin,
          left: ((dayIdx + b.col / b.cols) * 100) / 7,
          width: 100 / 7 / b.cols,
        });
      }
    });
    return out;
  }, [weekItems, weekDates]);

  const blocks = mode === 'day' ? dayBlocks : weekBlocks;
  const hours = Array.from({ length: endH - startH + 1 }, (_, i) => startH + i);
  const todayIdx = weekDates.indexOf(todayStr());
  const showNowLine =
    mode === 'day'
      ? isToday(viewDate) && now >= startH * 60 && now <= endH * 60
      : todayIdx !== -1 && now >= startH * 60 && now <= endH * 60;

  const headerDesc =
    mode === 'day' ? `${humanDate(viewDate)} · ${dayTimed.length} 项已排入时间段` : `本周 · ${weekItems.length} 项已排入时间段`;

  const modeBtn = (m: 'day' | 'week') =>
    `rounded-md px-2.5 py-1 text-xs font-medium transition ${
      mode === m
        ? 'bg-white text-stone-700 shadow-sm dark:bg-zinc-950 dark:text-zinc-200'
        : 'text-stone-500 hover:text-stone-700 dark:text-zinc-400 dark:hover:text-zinc-200'
    }`;

  return (
    <div className="flex flex-col gap-4">
      <QuickAdd defaultDate={viewDate} onAdd={onAdd} />

      {/* 汇总头部 */}
      <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-stone-800 text-white shadow-sm dark:bg-zinc-700">
          <CalendarClock className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-800 dark:text-zinc-100">时间甘特图</p>
          <p className="text-xs text-stone-500 dark:text-zinc-400">{headerDesc}</p>
        </div>
      </div>

      {/* 甘特图画布 */}
      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-stone-100 px-4 py-2 dark:border-zinc-800/80">
          <h2 className="text-xs font-semibold tracking-wide text-stone-400 dark:text-zinc-500">
            {mode === 'day'
              ? '时间段安排'
              : `${mdLabel(weekDates[0])} – ${mdLabel(weekDates[6])}`}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400 dark:text-zinc-500">{blocks.length} 项</span>
            <div className="flex items-center gap-0.5 rounded-lg bg-stone-100/80 p-0.5 dark:bg-zinc-800/60">
              <button type="button" onClick={() => setMode('day')} className={modeBtn('day')}>
                日
              </button>
              <button type="button" onClick={() => setMode('week')} className={modeBtn('week')}>
                周
              </button>
            </div>
          </div>
        </div>

        {/* 周视图的日期表头 */}
        {mode === 'week' && (
          <div className="flex border-b border-stone-100 py-1.5 dark:border-zinc-800/60">
            <div className="w-11 shrink-0" />
            <div className="flex flex-1">
              {weekDates.map((d, i) => (
                <div key={d} className="flex-1 text-center">
                  <span
                    className={`text-[10px] tabular-nums ${
                      d === todayStr()
                        ? 'font-semibold text-rose-500'
                        : i >= 5
                          ? 'text-stone-400 dark:text-zinc-500'
                          : 'text-stone-400 dark:text-zinc-500'
                    }`}
                  >
                    周{WEEKDAYS_SHORT[i]} {parseDate(d).getDate()}日
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex px-2 py-3">
          {/* 时间轴刻度 */}
          <div className="relative w-11 shrink-0" style={{ height: chartHeight }}>
            {hours.map((h) => (
              <span
                key={h}
                className={`absolute right-1.5 -translate-y-1/2 text-[10px] tabular-nums text-stone-400 dark:text-zinc-500 ${
                  mode === 'week' && h % 2 !== 0 ? 'opacity-40' : ''
                }`}
                style={{ top: (h - startH) * pxPerHour }}
              >
                {String(h).padStart(2, '0')}:00
              </span>
            ))}
          </div>

          {/* 画布区域 */}
          <div
            className="relative flex-1 border-l border-stone-200 dark:border-zinc-800"
            style={{ height: chartHeight }}
          >
            {/* 周视图：周末底色 + 天分隔线 */}
            {mode === 'week' &&
              weekDates.map((d, i) => (
                <div key={d}>
                  {i >= 5 && (
                    <div
                      className="absolute inset-y-0 bg-stone-50 dark:bg-zinc-800/30"
                      style={{ left: `${(i * 100) / 7}%`, width: `${100 / 7}%` }}
                    />
                  )}
                  {i > 0 && (
                    <div
                      className="absolute inset-y-0 border-l border-stone-100 dark:border-zinc-800/60"
                      style={{ left: `${(i * 100) / 7}%` }}
                    />
                  )}
                </div>
              ))}

            {/* 小时网格线 */}
            {hours.map((h) => (
              <div
                key={h}
                className="absolute inset-x-0 border-t border-stone-100 dark:border-zinc-800/60"
                style={{ top: (h - startH) * pxPerHour }}
              />
            ))}

            {blocks.length === 0 && (
              <div className="absolute inset-0 grid place-items-center px-4 text-center text-xs text-stone-400 dark:text-zinc-500">
                {mode === 'day' ? '还没有排好时间的任务 —— 添加时设置起止时间即可' : '本周还没有时间段任务'}
              </div>
            )}

            {blocks.map((b) => {
              const meta = PRIORITY_META[b.task.priority];
              return (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => onEdit(b.task)}
                  title={`${b.task.title}（${b.task.startTime} – ${b.task.endTime}）`}
                  className={`absolute overflow-hidden rounded-lg border-l-[3px] px-1.5 py-0.5 text-left shadow-sm transition hover:z-10 hover:shadow-md ${meta.block}`}
                  style={{
                    top: y(b.startMin),
                    height: Math.max(y(b.endMin) - y(b.startMin) - 2, 20),
                    left: `calc(${b.left}% + 2px)`,
                    width: `calc(${b.width}% - 4px)`,
                  }}
                >
                  <span className="block truncate text-[11px] font-medium leading-[1.3]">{b.task.title}</span>
                  {mode === 'day' && (
                    <span className="block truncate text-[10px] leading-[1.3] opacity-70 tabular-nums">
                      {b.task.startTime} – {b.task.endTime}
                    </span>
                  )}
                </button>
              );
            })}

            {/* 现在时刻线 */}
            {showNowLine && (
              <div
                className="pointer-events-none absolute z-10"
                style={
                  mode === 'day'
                    ? { left: 0, right: 0, top: y(now) }
                    : { left: `${(todayIdx * 100) / 7}%`, width: `${100 / 7}%`, top: y(now) }
                }
              >
                <div className="flex items-center">
                  <span className="-ml-1 h-2 w-2 shrink-0 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
                  <div className="h-px flex-1 bg-rose-500/70" />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 未安排时间段的任务（仅日视图） */}
      {mode === 'day' && (
        <TaskSection title={`未安排时间段 · ${humanDate(viewDate)}`} badge={`${unscheduled.length} 项`}>
          {unscheduled.map((t) => (
            <TaskItem
              key={t.id}
              task={t}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onDefer={onDefer}
              onSubtaskToggle={onSubtaskToggle}
            />
          ))}
          {unscheduled.length === 0 && dayTimed.length > 0 && (
            <li className="px-4 py-6 text-center text-sm text-stone-400 dark:text-zinc-500">当日任务已全部排入时间段 ✨</li>
          )}
          {unscheduled.length === 0 && dayTimed.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-stone-400 dark:text-zinc-500">今日任务都已勾选完成 🎉</li>
          )}
        </TaskSection>
      )}
    </div>
  );
}
