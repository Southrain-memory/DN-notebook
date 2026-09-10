import { useMemo, useRef, useState } from 'react';
import { BookOpenText, CalendarDays, Pencil, Plus, Trash2 } from 'lucide-react';
import type { EventInput, EventRecord, RecordCategory } from '../data';
import { humanDate, todayStr } from '../utils/date';
import { CategoryPicker } from '../components/CategoryPicker';

interface Props {
  events: EventRecord[];
  categories: RecordCategory[];
  query: string;
  onAdd: (input: EventInput) => void;
  onEdit: (record: EventRecord) => void;
  onDelete: (record: EventRecord) => void;
  onManageCategories: () => void;
}

/** 快速记录一条：标题回车即记，展开后可选日期、分类、备注 */
function EventQuickAdd({
  categories,
  onAdd,
  onManageCategories,
}: {
  categories: RecordCategory[];
  onAdd: (input: EventInput) => void;
  onManageCategories: () => void;
}) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayStr());
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? 'other');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const expanded = focused || title.trim() !== '' || note.trim() !== '' || date !== todayStr();

  const submit = () => {
    const t = title.trim();
    if (!t) return;
    onAdd({ title: t, note: note.trim(), date, categoryId });
    setTitle('');
    setNote('');
    inputRef.current?.focus();
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

  return (
    <div
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
      className="relative rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm transition dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex items-center gap-3">
        <Plus className={`h-5 w-5 shrink-0 transition-colors ${expanded ? 'text-rose-500' : 'text-stone-300 dark:text-zinc-600'}`} />
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) submit();
          }}
          placeholder="记一笔：今天发生了什么？回车即记录"
          className="w-full bg-transparent text-[15px] text-stone-800 outline-none placeholder:text-stone-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
      </div>

      {expanded && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3 dark:border-zinc-800/80">
          <button
            type="button"
            onClick={openDatePicker}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              date === todayStr()
                ? 'text-stone-500 hover:bg-stone-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                : 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400'
            }`}
          >
            <CalendarDays className="h-3.5 w-3.5" />
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
          <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} onManage={onManageCategories} />
          <div className="flex min-w-[140px] flex-1 items-center gap-1.5 rounded-lg bg-stone-100/80 px-2.5 py-1.5 dark:bg-zinc-800/60">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) submit();
              }}
              placeholder="补充描述（可选）"
              className="w-full bg-transparent text-xs text-stone-600 outline-none placeholder:text-stone-400 dark:text-zinc-300 dark:placeholder:text-zinc-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/** 记事页：按时间线回顾每一天发生的事，可按分类筛选 */
export function RecordsView({ events, categories, query, onAdd, onEdit, onDelete, onManageCategories }: Props) {
  const [catFilter, setCatFilter] = useState<string>('all');
  const today = todayStr();

  const filtered = useMemo(() => {
    const k = query.trim().toLowerCase();
    return events
      .filter((e) => catFilter === 'all' || e.categoryId === catFilter)
      .filter(
        (e) =>
          !k ||
          e.title.toLowerCase().includes(k) ||
          e.note.toLowerCase().includes(k),
      )
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt));
  }, [events, catFilter, query]);

  const groups = useMemo(() => {
    const map = new Map<string, EventRecord[]>();
    for (const e of filtered) {
      const list = map.get(e.date);
      if (list) list.push(e);
      else map.set(e.date, [e]);
    }
    return [...map.entries()];
  }, [filtered]);

  const countOf = (id: string) => events.filter((e) => e.categoryId === id).length;

  return (
    <div className="flex flex-col gap-4">
      {/* 汇总头部 */}
      <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-stone-800 text-white shadow-sm dark:bg-zinc-700">
          <BookOpenText className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-800 dark:text-zinc-100">记事</p>
          <p className="text-xs text-stone-500 dark:text-zinc-400">记录每一天发生的事，共 {events.length} 条</p>
        </div>
      </div>

      <EventQuickAdd categories={categories} onAdd={onAdd} onManageCategories={onManageCategories} />

      {/* 分类筛选 */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setCatFilter('all')}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            catFilter === 'all'
              ? 'bg-stone-800 text-white dark:bg-zinc-200 dark:text-zinc-900'
              : 'bg-white text-stone-500 shadow-sm hover:bg-stone-50 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'
          }`}
        >
          全部 {events.length}
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCatFilter(c.id)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
              catFilter === c.id
                ? 'text-white shadow-sm'
                : 'bg-white text-stone-500 shadow-sm hover:bg-stone-50 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
            style={catFilter === c.id ? { backgroundColor: c.color } : undefined}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: catFilter === c.id ? 'rgba(255,255,255,.85)' : c.color }}
            />
            {c.name} {countOf(c.id)}
          </button>
        ))}
        <button
          type="button"
          onClick={onManageCategories}
          className="ml-auto rounded-full bg-white px-3 py-1 text-xs font-medium text-stone-400 shadow-sm transition hover:text-stone-600 dark:bg-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          管理分类
        </button>
      </div>

      {/* 时间线 */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
          <BookOpenText className="h-10 w-10 text-stone-300 dark:text-zinc-700" />
          <p className="font-medium text-stone-500 dark:text-zinc-400">
            {events.length === 0 ? '还没有记录' : '没有匹配的记事'}
          </p>
          <p className="text-sm text-stone-400 dark:text-zinc-500">
            {events.length === 0 ? '在上方写下今天发生的事，回车即记录' : '换个分类或关键词试试'}
          </p>
        </div>
      ) : (
        groups.map(([date, list]) => (
          <div key={date} className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 px-1">
              <span
                className={`text-xs font-semibold ${
                  date === today ? 'text-rose-500' : 'text-stone-400 dark:text-zinc-500'
                }`}
              >
                {humanDate(date)}
              </span>
              <span className="text-[11px] text-stone-300 dark:text-zinc-600">{list.length} 条</span>
            </div>
            <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <ol className="divide-y divide-stone-100 dark:divide-zinc-800/70">
                {list.map((e) => {
                  const cat = categories.find((c) => c.id === e.categoryId);
                  return (
                    <li
                      key={e.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onEdit(e)}
                      onKeyDown={(ev) => {
                        if (ev.key === 'Enter') onEdit(e);
                      }}
                      className="group flex animate-task-in cursor-pointer items-start gap-3 px-4 py-3"
                    >
                      <span
                        className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: cat?.color ?? '#64748b' }}
                        title={cat?.name ?? '未分类'}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] leading-snug text-stone-700 dark:text-zinc-200">{e.title}</p>
                        {e.note && (
                          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-stone-400 dark:text-zinc-500">
                            {e.note}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5 pt-0.5">
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            onEdit(e);
                          }}
                          aria-label="编辑记事"
                          className="grid h-7 w-7 place-items-center rounded-lg text-stone-300 transition hover:bg-stone-100 hover:text-stone-500 dark:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 md:opacity-0 md:group-hover:opacity-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            onDelete(e);
                          }}
                          aria-label="删除记事"
                          className="grid h-7 w-7 place-items-center rounded-lg text-stone-300 transition hover:bg-rose-50 hover:text-rose-500 dark:text-zinc-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 md:opacity-0 md:group-hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          </div>
        ))
      )}
    </div>
  );
}
