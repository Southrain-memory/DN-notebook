import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Check, Trash2, X } from 'lucide-react';
import type { Priority, RepeatKind, Subtask, Task } from '../data';
import { addDays, humanDate, todayStr } from '../utils/date';
import { PriorityPicker } from './PriorityPicker';
import { TimeRangePicker } from './TimeRangePicker';

interface Props {
  task: Task;
  onSave: (
    id: string,
    patch: {
      title: string;
      note: string;
      date: string;
      priority: Priority;
      startTime?: string;
      endTime?: string;
      repeat?: RepeatKind;
      subtasks?: Subtask[];
    },
  ) => void;
  onToggle: (id: string) => void;
  onDelete: (task: Task) => void;
  onClose: () => void;
}

const iconBtn =
  'grid h-8 w-8 place-items-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300';

function newSubtaskId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const REPEATS: { id: RepeatKind | 'none'; label: string }[] = [
  { id: 'none', label: '不重复' },
  { id: 'daily', label: '每天' },
  { id: 'weekly', label: '每周' },
  { id: 'monthly', label: '每月' },
];

/** 编辑任务弹窗：标题、备注、日期、时间段、重复规则、优先级、子任务清单 */
export function TaskEditModal({ task, onSave, onToggle, onDelete, onClose }: Props) {
  const [title, setTitle] = useState(task.title);
  const [note, setNote] = useState(task.note);
  const [date, setDate] = useState(task.date);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [startTime, setStartTime] = useState<string | undefined>(task.startTime);
  const [endTime, setEndTime] = useState<string | undefined>(task.endTime);
  const [repeat, setRepeat] = useState<RepeatKind | undefined>(task.repeat);
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks ?? []);
  const [subDraft, setSubDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const subInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const canSave = title.trim() !== '';
  const save = () => {
    if (!canSave) return;
    onSave(task.id, {
      title: title.trim(),
      note: note.trim(),
      date,
      priority,
      startTime,
      endTime,
      repeat,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
    });
  };

  const openDatePicker = () => {
    const el = dateInputRef.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      el.focus();
    }
  };

  const addSubtask = () => {
    const t = subDraft.trim();
    if (!t) return;
    setSubtasks((arr) => [...arr, { id: newSubtaskId(), title: t, done: false }]);
    setSubDraft('');
    subInputRef.current?.focus();
  };

  return (
    <div
      className="animate-overlay-in fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-[2px] dark:bg-black/60"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="编辑任务"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
        className="animate-modal-in mt-[8vh] w-full max-w-[460px] rounded-2xl bg-white p-5 shadow-2xl dark:bg-zinc-900"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-stone-800 dark:text-zinc-100">编辑任务</h2>
          <button type="button" onClick={onClose} className={iconBtn} aria-label="关闭">
            <X className="h-4 w-4" />
          </button>
        </div>

        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) save();
            if (e.key === 'Escape') onClose();
          }}
          placeholder="任务标题"
          className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-[15px] text-stone-800 outline-none transition focus:border-rose-400 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-rose-500/60"
        />

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="备注（可选）"
          className="mt-2.5 w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-700 outline-none transition placeholder:text-stone-400 focus:border-rose-400 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:placeholder:text-zinc-500"
        />

        {/* 日期 */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openDatePicker}
            className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs font-medium text-stone-600 transition hover:bg-stone-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <CalendarDays className="h-3.5 w-3.5 text-rose-500" />
            {date === todayStr() ? '今天' : humanDate(date)}
          </button>
          <input
            ref={dateInputRef}
            type="date"
            value={date}
            tabIndex={-1}
            aria-hidden
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="pointer-events-none absolute h-px w-px opacity-0"
          />
          {[0, 1, 2].map((n) => {
            const d = addDays(todayStr(), n);
            return (
              <button
                key={n}
                type="button"
                onClick={() => setDate(d)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  date === d
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-stone-500 hover:bg-stone-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                }`}
              >
                {n === 0 ? '今天' : n === 1 ? '明天' : '后天'}
              </button>
            );
          })}
        </div>

        {/* 时间段 */}
        <div className="mt-3">
          <TimeRangePicker
            start={startTime}
            end={endTime}
            onChange={(s, e) => {
              setStartTime(s);
              setEndTime(e);
            }}
          />
        </div>

        {/* 重复规则 */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-stone-400 dark:text-zinc-500">重复</span>
          <div className="flex items-center gap-0.5 rounded-lg bg-stone-100/80 p-1 dark:bg-zinc-800/60">
            {REPEATS.map((r) => {
              const active = r.id === 'none' ? !repeat : repeat === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRepeat(r.id === 'none' ? undefined : r.id)}
                  className={`rounded-md px-2 py-1 text-xs font-medium transition ${
                    active
                      ? 'bg-white text-stone-700 shadow-sm dark:bg-zinc-950 dark:text-zinc-200'
                      : 'text-stone-500 hover:text-stone-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 优先级 */}
        <div className="mt-3">
          <PriorityPicker value={priority} onChange={setPriority} />
        </div>

        {/* 子任务清单 */}
        <div className="mt-3">
          <p className="mb-1 text-xs text-stone-400 dark:text-zinc-500">子任务清单</p>
          {subtasks.length > 0 && (
            <ul className="mb-1.5 flex flex-col gap-1">
              {subtasks.map((st) => (
                <li key={st.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSubtasks((arr) => arr.map((x) => (x.id === st.id ? { ...x, done: !x.done } : x)))}
                    aria-label={st.done ? '取消子任务完成' : '完成子任务'}
                    className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border transition ${
                      st.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-stone-300 dark:border-zinc-600'
                    }`}
                  >
                    {st.done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                  </button>
                  <input
                    value={st.title}
                    onChange={(e) => setSubtasks((arr) => arr.map((x) => (x.id === st.id ? { ...x, title: e.target.value } : x)))}
                    className={`min-w-0 flex-1 rounded bg-transparent px-1 py-0.5 text-sm outline-none transition focus:bg-stone-100 dark:focus:bg-zinc-800 ${
                      st.done ? 'text-stone-400 line-through dark:text-zinc-500' : 'text-stone-600 dark:text-zinc-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setSubtasks((arr) => arr.filter((x) => x.id !== st.id))}
                    aria-label="删除子任务"
                    className="grid h-5 w-5 shrink-0 place-items-center rounded text-stone-300 transition hover:bg-rose-50 hover:text-rose-500 dark:text-zinc-600 dark:hover:bg-rose-500/10"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center gap-1.5">
            <input
              ref={subInputRef}
              value={subDraft}
              onChange={(e) => setSubDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) addSubtask();
              }}
              placeholder="添加子任务，回车确认"
              className="min-w-0 flex-1 rounded-lg border border-dashed border-stone-200 bg-transparent px-2.5 py-1.5 text-sm outline-none transition placeholder:text-stone-300 focus:border-rose-300 dark:border-zinc-700 dark:placeholder:text-zinc-600"
            />
            <button
              type="button"
              onClick={addSubtask}
              className="shrink-0 rounded-lg bg-stone-100 px-2.5 py-1.5 text-xs font-medium text-stone-500 transition hover:bg-stone-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            >
              添加
            </button>
          </div>
        </div>

        {/* 底部操作 */}
        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onDelete(task)}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-500/10"
            >
              <Trash2 className="h-4 w-4" />
              删除
            </button>
            <button
              type="button"
              onClick={() => onToggle(task.id)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition ${
                task.done
                  ? 'text-stone-500 hover:bg-stone-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                  : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10'
              }`}
            >
              <Check className="h-4 w-4" />
              {task.done ? '标记为未完成' : '标记为完成'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-stone-500 transition hover:bg-stone-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              取消
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!canSave}
              className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-rose-500/30 transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
