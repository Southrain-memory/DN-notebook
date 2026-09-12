import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import type { Task, TaskInput } from '../data';
import { isToday } from '../utils/date';
import { compareUndone, computeStreak, weekCompletedCount } from '../utils/task';
import { QuickAdd } from '../components/QuickAdd';
import { TaskItem } from '../components/TaskItem';
import { TaskSection } from '../components/TaskSection';
import { EmptyState } from '../components/EmptyState';

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

/** 某一天的任务列表：按优先级排序（重要置顶红标），已完成折叠到底部，顶部显示完成进度与统计 */
export function DayView({ tasks, viewDate, onAdd, onToggle, onEdit, onDelete, onDefer, onSubtaskToggle }: Props) {
  const dayTasks = useMemo(() => tasks.filter((t) => t.date === viewDate), [tasks, viewDate]);
  const undone = useMemo(() => dayTasks.filter((t) => !t.done).sort(compareUndone), [dayTasks]);
  const done = useMemo(
    () => dayTasks.filter((t) => t.done).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0)),
    [dayTasks],
  );

  const total = dayTasks.length;
  const doneCount = done.length;
  const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);
  const allDone = total > 0 && doneCount === total;

  const streak = useMemo(() => computeStreak(tasks), [tasks]);
  const weekCount = useMemo(() => weekCompletedCount(tasks), [tasks]);

  return (
    <div className="flex flex-col gap-4">
      <QuickAdd defaultDate={viewDate} onAdd={onAdd} />

      {/* 完成进度 + 统计 */}
      {total > 0 && (
        <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2.5 flex items-baseline justify-between">
            <span className="text-sm font-semibold text-stone-700 dark:text-zinc-200">
              {isToday(viewDate) ? '今日进度' : '当日进度'}
            </span>
            <span className={`text-sm font-medium ${allDone ? 'text-emerald-500' : 'text-stone-400 dark:text-zinc-500'}`}>
              {allDone ? '全部完成 🎉' : `已完成 ${doneCount}/${total}`}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-stone-200/80 dark:bg-zinc-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${allDone ? 'bg-emerald-500' : 'bg-rose-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {isToday(viewDate) && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-500 dark:bg-zinc-800 dark:text-zinc-400">
                🔥 连续打卡 {streak} 天
              </span>
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-500 dark:bg-zinc-800 dark:text-zinc-400">
                本周完成 {weekCount} 项
              </span>
            </div>
          )}
        </div>
      )}

      {total === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-10 w-10" />}
          title={isToday(viewDate) ? '今天还没有安排' : '这一天还没有任务'}
          hint="在上方输入框记录一件事，回车即可添加"
        />
      ) : (
        <>
          <TaskSection title="待办" badge={`${undone.length} 件`}>
            {undone.map((t) => (
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
            {undone.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-stone-400 dark:text-zinc-500">全部完成，休息一下吧 🎉</li>
            )}
          </TaskSection>
          {done.length > 0 && (
            <TaskSection title="已完成" badge={`${doneCount}/${total}`}>
              {done.map((t) => (
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
            </TaskSection>
          )}
        </>
      )}
    </div>
  );
}
