import { useMemo } from 'react';
import { CalendarDays, Flag, PartyPopper } from 'lucide-react';
import type { Task, TaskInput } from '../data';
import { humanDate, todayStr } from '../utils/date';
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

/** 重要事项专区：汇总所有「高」优先级且未完成的任务，按日期分组 */
export function ImportantView({ tasks, onAdd, onToggle, onEdit, onDelete, onDefer, onSubtaskToggle }: Props) {
  const important = useMemo(
    () =>
      tasks
        .filter((t) => t.priority === 'high' && !t.done)
        .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.createdAt - b.createdAt)),
    [tasks],
  );

  const groups = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of important) {
      const list = map.get(t.date);
      if (list) list.push(t);
      else map.set(t.date, [t]);
    }
    return [...map.entries()];
  }, [important]);

  return (
    <div className="flex flex-col gap-4">
      <QuickAdd defaultDate={todayStr()} onAdd={onAdd} forcedPriority="high" />

      {/* 汇总头部 */}
      <div className="flex items-center gap-3 rounded-2xl border border-rose-200/80 bg-rose-50/80 px-4 py-3.5 dark:border-rose-500/20 dark:bg-rose-500/10">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rose-500 text-white shadow-sm shadow-rose-500/30">
          <Flag className="h-4 w-4" fill="currentColor" strokeWidth={0} />
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-800 dark:text-zinc-100">重要事项</p>
          <p className="text-xs text-stone-500 dark:text-zinc-400">
            所有「高」优先级且未完成的事项，共 {important.length} 件
          </p>
        </div>
      </div>

      {important.length === 0 ? (
        <EmptyState
          icon={<PartyPopper className="h-10 w-10" />}
          title="没有待办的重要事项"
          hint="添加任务时把优先级设为「高」，它就会集中出现在这里"
        />
      ) : (
        groups.map(([date, list]) => (
          <div key={date} className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 px-1">
              <CalendarDays className={`h-3.5 w-3.5 ${date < todayStr() ? 'text-rose-500' : 'text-stone-400'}`} />
              <span
                className={`text-xs font-semibold ${date < todayStr() ? 'text-rose-500' : 'text-stone-400 dark:text-zinc-500'}`}
              >
                {humanDate(date)}
              </span>
            </div>
            <TaskSection>
              {list.map((t) => (
                <TaskItem
                  key={t.id}
                  task={t}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onDefer={onDefer}
                  onSubtaskToggle={onSubtaskToggle}
                  showDate
                />
              ))}
            </TaskSection>
          </div>
        ))
      )}
    </div>
  );
}
