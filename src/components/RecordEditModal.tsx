import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Trash2, X } from 'lucide-react';
import type { EventRecord, RecordCategory } from '../data';
import { addDays, humanDate, todayStr } from '../utils/date';
import { CategoryPicker } from './CategoryPicker';

interface Props {
  record: EventRecord;
  categories: RecordCategory[];
  onSave: (id: string, patch: { title: string; note: string; date: string; categoryId: string }) => void;
  onDelete: (record: EventRecord) => void;
  onClose: () => void;
}

const iconBtn =
  'grid h-8 w-8 place-items-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300';

/** 编辑记事弹窗：标题、备注、日期、分类 */
export function RecordEditModal({ record, categories, onSave, onDelete, onClose }: Props) {
  const [title, setTitle] = useState(record.title);
  const [note, setNote] = useState(record.note);
  const [date, setDate] = useState(record.date);
  const [categoryId, setCategoryId] = useState(record.categoryId);
  const inputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const canSave = title.trim() !== '';
  const save = () => {
    if (canSave) onSave(record.id, { title: title.trim(), note: note.trim(), date, categoryId });
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
      className="animate-overlay-in fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-[2px] dark:bg-black/60"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="编辑记事"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
        className="animate-modal-in mt-[8vh] w-full max-w-[460px] rounded-2xl bg-white p-5 shadow-2xl dark:bg-zinc-900"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-stone-800 dark:text-zinc-100">编辑记事</h2>
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
          placeholder="记事标题"
          className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-[15px] text-stone-800 outline-none transition focus:border-rose-400 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-rose-500/60"
        />

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="详细描述（可选）"
          className="mt-2.5 w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-700 outline-none transition placeholder:text-stone-400 focus:border-rose-400 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:placeholder:text-zinc-500"
        />

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
            const d = addDays(todayStr(), -n); // 记事常补记过去几天
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
                {n === 0 ? '今天' : n === 1 ? '昨天' : '前天'}
              </button>
            );
          })}
          <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} onManage={onClose} />
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onDelete(record)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-500/10"
          >
            <Trash2 className="h-4 w-4" />
            删除
          </button>
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
