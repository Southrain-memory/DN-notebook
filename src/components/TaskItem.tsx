import { useState } from 'react';
import { CalendarDays, Check, ChevronDown, ChevronRight, Clock, Flag, Pencil, Trash2 } from 'lucide-react';
import type { Task } from '../data';
import { humanDate, todayStr } from '../utils/date';
import { PRIORITY_META } from './PriorityPicker';

interface Props {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  /** 顺延一天（仅未完成任务显示） */
  onDefer?: (task: Task) => void;
  /** 勾选/取消某个子任务 */
  onSubtaskToggle?: (task: Task, subtaskId: string) => void;
  /** 是否显示所属日期（用于「重要事项」等跨天视图） */
  showDate?: boolean;
}

const editBtn =
  'grid h-7 w-7 place-items-center rounded-lg text-stone-300 transition hover:bg-stone-100 hover:text-stone-500 dark:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 md:opacity-0 md:group-hover:opacity-100';
const deferBtn =
  'grid h-7 w-7 place-items-center rounded-lg text-stone-300 transition hover:bg-sky-50 hover:text-sky-500 dark:text-zinc-600 dark:hover:bg-sky-500/10 dark:hover:text-sky-400 md:opacity-0 md:group-hover:opacity-100';
const deleteBtn =
  'grid h-7 w-7 place-items-center rounded-lg text-stone-300 transition hover:bg-rose-50 hover:text-rose-500 dark:text-zinc-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 md:opacity-0 md:group-hover:opacity-100';

export function TaskItem({ task, onToggle, onEdit, onDelete, onDefer, onSubtaskToggle, showDate }: Props) {
  const [subOpen, setSubOpen] = useState(false);
  const isImportant = task.priority === 'high' && !task.done;
  const overdue = showDate && task.date < todayStr();
  const meta = PRIORITY_META[task.priority];

  const subtasks = task.subtasks ?? [];
  const subDone = subtasks.filter((s) => s.done).length;

  const circleCls = task.done
    ? 'border-stone-300 bg-stone-400 text-white dark:border-zinc-600 dark:bg-zinc-600'
    : isImportant
      ? 'border-rose-400 hover:bg-rose-100/70 dark:border-rose-500/80 dark:hover:bg-rose-500/15'
      : 'border-stone-300 hover:border-stone-400 dark:border-zinc-600 dark:hover:border-zinc-500';

  const titleCls = task.done
    ? 'text-stone-400 line-through decoration-stone-300 dark:text-zinc-500 dark:decoration-zinc-600'
    : isImportant
      ? 'font-semibold text-stone-800 dark:text-zinc-50'
      : 'text-stone-700 dark:text-zinc-300';

  const deferLabel = task.date === todayStr() ? '顺延到明天' : '顺延一天';

  return (
    <li
      className={`group flex animate-task-in items-start gap-3 px-4 py-3 transition-colors ${
        isImportant ? 'bg-rose-50/60 dark:bg-rose-500/[0.06]' : ''
      }`}
    >
      {/* 左侧完成圆圈 */}
      <button
        type="button"
        onClick={() => onToggle(task.id)}
        aria-label={task.done ? '标记为未完成' : '标记为完成'}
        className={`mt-0.5 grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border-2 transition-all active:scale-90 ${circleCls}`}
      >
        {task.done && <Check className="h-3 w-3 animate-pop-in" strokeWidth={3} />}
      </button>

      {/* 内容区：点击进入编辑 */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onEdit(task)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onEdit(task);
        }}
        className="min-w-0 flex-1 cursor-pointer"
      >
        <div className="flex items-center gap-1.5">
          {isImportant && <Flag className="h-3.5 w-3.5 shrink-0 text-rose-500" fill="currentColor" strokeWidth={0} />}
          <span className={`text-[15px] leading-snug ${titleCls}`}>{task.title}</span>
          {task.repeat && (
            <span className="shrink-0 rounded bg-stone-100 px-1 py-px text-[10px] font-medium text-stone-400 dark:bg-zinc-800 dark:text-zinc-500">
              {task.repeat === 'daily' ? '每天' : task.repeat === 'weekly' ? '每周' : '每月'}
            </span>
          )}
        </div>
        {task.note && (
          <p
            className={`mt-0.5 line-clamp-2 text-xs leading-relaxed ${
              task.done ? 'text-stone-300 dark:text-zinc-600' : 'text-stone-400 dark:text-zinc-500'
            }`}
          >
            {task.note}
          </p>
        )}

        {/* 子任务进度 / 展开清单 */}
        {subtasks.length > 0 && (
          <div className="mt-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSubOpen((v) => !v);
              }}
              className={`inline-flex items-center gap-1 rounded px-1 py-0.5 text-[11px] tabular-nums transition ${
                subDone === subtasks.length
                  ? 'text-emerald-500'
                  : 'text-stone-400 hover:bg-stone-100 dark:text-zinc-500 dark:hover:bg-zinc-800'
              }`}
            >
              {subOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              子任务 {subDone}/{subtasks.length}
            </button>
            {subOpen && (
              <ul className="mt-1 flex flex-col gap-1">
                {subtasks.map((st) => (
                  <li key={st.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSubtaskToggle?.(task, st.id);
                      }}
                      aria-label={st.done ? '取消子任务完成' : '完成子任务'}
                      className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border transition ${
                        st.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-stone-300 dark:border-zinc-600'
                      }`}
                    >
                      {st.done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                    </button>
                    <span className={`text-xs ${st.done ? 'text-stone-300 line-through dark:text-zinc-600' : 'text-stone-500 dark:text-zinc-400'}`}>
                      {st.title}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {(task.startTime || showDate) && (
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            {task.startTime && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] tabular-nums ${
                  task.done ? 'text-stone-300 dark:text-zinc-600' : 'text-stone-400 dark:text-zinc-500'
                }`}
              >
                <Clock className="h-3 w-3" />
                {task.endTime ? `${task.startTime} – ${task.endTime}` : task.startTime}
              </span>
            )}
            {showDate && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] ${
                  overdue ? 'font-medium text-rose-500' : 'text-stone-400 dark:text-zinc-500'
                }`}
              >
                <CalendarDays className="h-3 w-3" />
                {humanDate(task.date)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 右侧操作 */}
      <div className="flex shrink-0 items-center gap-0.5 pt-0.5">
        {!task.done && task.priority !== 'high' && (
          <span className={`mr-1 h-1.5 w-1.5 rounded-full ${meta.dot} opacity-60`} title={`优先级：${meta.label}`} />
        )}
        {!task.done && onDefer && (
          <button type="button" onClick={() => onDefer(task)} aria-label={deferLabel} title={deferLabel} className={deferBtn}>
            <CalendarDays className="h-4 w-4" />
          </button>
        )}
        <button type="button" onClick={() => onEdit(task)} aria-label="编辑任务" className={editBtn}>
          <Pencil className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => onDelete(task)} aria-label="删除任务" className={deleteBtn}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}
