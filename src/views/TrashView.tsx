import { useMemo, useState } from 'react';
import { RotateCcw, Search, Trash2, X } from 'lucide-react';
import type { Task } from '../data';
import { humanDate } from '../utils/date';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';

interface Props {
  /** 回收站里的任务（已按删除时间倒序） */
  tasks: Task[];
  onRestore: (ids: string[]) => void;
  onPurge: (ids: string[]) => void;
}

type Pending = { kind: 'restore' | 'purge'; ids: string[] } | null;

const PRIORITY_LABEL: Record<Task['priority'], string> = { high: '高优先级', medium: '中优先级', low: '低优先级' };
const PRIORITY_CLS: Record<Task['priority'], string> = {
  high: 'text-rose-500',
  medium: 'text-amber-500',
  low: 'text-stone-400 dark:text-zinc-500',
};

/** 回收站：存放删除的任务，支持搜索、批量/全部恢复与彻底清除 */
export function TrashView({ tasks, onRestore, onPurge }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Pending>(null);

  const filtered = useMemo(() => {
    const k = query.trim().toLowerCase();
    if (!k) return tasks;
    return tasks.filter(
      (t) => t.title.toLowerCase().includes(k) || t.note.toLowerCase().includes(k),
    );
  }, [tasks, query]);

  const filteredIds = filtered.map((t) => t.id);
  const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selected.has(id));
  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const askRestore = (ids: string[]) => setPending({ kind: 'restore', ids });
  const askPurge = (ids: string[]) => setPending({ kind: 'purge', ids });

  const confirm = () => {
    if (!pending) return;
    if (pending.kind === 'restore') onRestore(pending.ids);
    else onPurge(pending.ids);
    setSelected(new Set());
    setPending(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 搜索（置顶） */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 dark:text-zinc-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setQuery('');
          }}
          placeholder="搜索回收站里的任务…"
          aria-label="搜索回收站"
          className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-9 text-sm text-stone-700 outline-none transition placeholder:text-stone-400 focus:border-rose-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-rose-500/50"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="清空搜索"
            className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-stone-400 transition hover:bg-stone-100 dark:hover:bg-zinc-800"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* 汇总头部 + 全部操作 */}
      <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-stone-800 text-white shadow-sm dark:bg-zinc-700">
            <Trash2 className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-stone-800 dark:text-zinc-100">回收站</p>
            <p className="text-xs text-stone-500 dark:text-zinc-400">删除的任务会先存放在这里，共 {tasks.length} 项</p>
          </div>
          {tasks.length > 0 && (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => askRestore(tasks.map((t) => t.id))}
                className="rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs font-medium text-stone-600 transition hover:bg-stone-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
              >
                全部恢复
              </button>
              <button
                type="button"
                onClick={() => askPurge(tasks.map((t) => t.id))}
                className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-500 transition hover:bg-rose-50 dark:border-rose-500/30 dark:hover:bg-rose-500/10"
              >
                清空回收站
              </button>
            </div>
          )}
        </div>

        {/* 批量操作条 */}
        {filtered.length > 0 && (
          <label className="mt-3 flex cursor-pointer items-center gap-2 border-t border-stone-100 pt-3 text-xs text-stone-500 dark:border-zinc-800/80 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() =>
                setSelected(allSelected ? new Set() : new Set(filteredIds))
              }
              className="h-4 w-4 accent-rose-500"
              aria-label="全选"
            />
            全选
            {selected.size > 0 && (
              <span className="ml-auto flex items-center gap-2">
                <span className="text-stone-400 dark:text-zinc-500">已选 {selected.size} 项</span>
                <button
                  type="button"
                  onClick={() => askRestore([...selected])}
                  className="rounded-lg border border-stone-200 px-2.5 py-1 font-medium text-stone-600 transition hover:bg-stone-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
                >
                  恢复所选
                </button>
                <button
                  type="button"
                  onClick={() => askPurge([...selected])}
                  className="rounded-lg border border-rose-200 px-2.5 py-1 font-medium text-rose-500 transition hover:bg-rose-50 dark:border-rose-500/30 dark:hover:bg-rose-500/10"
                >
                  彻底删除所选
                </button>
              </span>
            )}
          </label>
        )}
      </div>

      {/* 列表 */}
      {tasks.length === 0 ? (
        <EmptyState
          icon={<Trash2 className="h-10 w-10" />}
          title="回收站是空的"
          hint="删除的任务会先到这里，随时可以恢复"
        />
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-10 text-center text-sm text-stone-400 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-500">
          没有匹配的任务，换个关键词试试
        </p>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <ol className="divide-y divide-stone-100 dark:divide-zinc-800/70">
            {filtered.map((t) => {
              const checked = selected.has(t.id);
              return (
                <li
                  key={t.id}
                  className={`group flex items-center gap-3 px-4 py-3 transition ${checked ? 'bg-rose-50/60 dark:bg-rose-500/5' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSelect(t.id)}
                    aria-label={`选择「${t.title}」`}
                    className="h-4 w-4 shrink-0 accent-rose-500"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] text-stone-700 dark:text-zinc-200">{t.title}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-stone-400 dark:text-zinc-500">
                      <span className={PRIORITY_CLS[t.priority]}>{PRIORITY_LABEL[t.priority]}</span>
                      <span>原日期 {humanDate(t.date)}</span>
                      {t.note && <span className="hidden truncate sm:inline">备注：{t.note}</span>}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => askRestore([t.id])}
                      aria-label={`恢复「${t.title}」`}
                      title="恢复"
                      className="grid h-8 w-8 place-items-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-emerald-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-emerald-400"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => askPurge([t.id])}
                      aria-label={`彻底删除「${t.title}」`}
                      title="彻底删除"
                      className="grid h-8 w-8 place-items-center rounded-lg text-stone-400 transition hover:bg-rose-50 hover:text-rose-500 dark:text-zinc-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* 恢复 / 彻底删除的趣味确认弹窗 */}
      {pending && pending.kind === 'restore' && (
        <ConfirmDialog
          title="恢复任务"
          message="哼哼，现在知道挽留我了 😤"
          confirmText="是"
          cancelText="否"
          onConfirm={confirm}
          onClose={() => setPending(null)}
        />
      )}
      {pending && pending.kind === 'purge' && (
        <ConfirmDialog
          title="彻底删除"
          message="你真的一点都不挽留我了吗？ 😭"
          confirmText="是"
          cancelText="否"
          onConfirm={confirm}
          onClose={() => setPending(null)}
        />
      )}
    </div>
  );
}
