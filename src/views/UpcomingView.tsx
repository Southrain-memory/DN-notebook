import { useMemo } from 'react';
import { CalendarClock } from 'lucide-react';
import type { Task, TaskInput } from '../data';
import { addDays, humanDate, todayStr } from '../utils/date';
import { compareUndone } from '../utils/task';
import { QuickAdd } from '../components/QuickAdd';
import { TaskItem } from '../components/TaskItem';
import { TaskSection } from '../components/TaskSection';
import { EmptyState } from '../components/EmptyState';

interface Props {
  tasks: Task[];
  onAdd: (input: TaskInput) => void;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onDefer: (task: Task) => void;
  onSubtaskToggle: (task: Task, subtaskId: string) => void;
}

interface DayGroup {
  date: string;
  label: string;
  overdue: boolean;
  items: Task[];
}

/** 即将到来：逾期 + 未来 7 天 + 之后，跨天总览近期负担 */
export function UpcomingView({ tasks, onAdd, onToggle, onEdit, onDelete, onDefer, onSubtaskToggle }: Props) {
  const today = todayStr();

  const groups = useMemo<DayGroup[]>(() => {
    const undone = tasks.filter((t) => !t.done).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : compareUndone(a, b)));
    const result: DayGroup[] = [];

    const overdue = undone.filter((t) => t.date < today);
    if (overdue.length > 0) {
      result.push({ date: 'overdue', label: '已逾期', overdue: true, items: overdue });
    }

    for (let i = 0; i < 7; i++) {
      const d = addDays(today, i);
      const items = undone.filter((t) => t.date === d);
      if (items.length > 0) {
        result.push({ date: d, label: humanDate(d), overdue: false, items });
      }
    }

    const later = undone.filter((t) => t.date >= addDays(today, 7));
    if (later.length > 0) {
      result.push({ date: 'later', label: '之后', overdue: false, items: later });
    }
    return result;
  }, [tasks, today]);

  const total = groups.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div className="flex flex-col gap-4">
      <QuickAdd defaultDate={today} onAdd={onAdd} />

      <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-stone-800 text-white shadow-sm dark:bg-zinc-700">
          <CalendarClock className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-800 dark:text-zinc-100">即将到来</p>
          <p className="text-xs text-stone-500 dark:text-zinc-400">逾期与未来 7 天的全部安排，共 {total} 件</p>
        </div>
      </div>

      {total === 0 ? (
        <EmptyState
          icon={<CalendarClock className="h-10 w-10" />}
          title="近期没有到期任务"
          hint="一切尽在掌握，享受当下吧 🍃"
        />
      ) : (
        groups.map((g) => (
          <div key={g.date} className="flex flex-col gap-2">
            <div className="px-1">
              <span
                className={`text-xs font-semibold ${g.overdue ? 'text-rose-500' : 'text-stone-400 dark:text-zinc-500'}`}
              >
                {g.label}
              </span>
            </div>
            <TaskSection>
              {g.items.map((t) => (
                <TaskItem
                  key={t.id}
                  task={t}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onDefer={onDefer}
                  onSubtaskToggle={onSubtaskToggle}
                  showDate={g.date === 'later' || g.date === 'overdue'}
                />
              ))}
            </TaskSection>
          </div>
        ))
      )}
    </div>
  );
}
