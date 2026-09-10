import { useState } from 'react';
import { Check, Settings2, X } from 'lucide-react';
import type { RecordCategory } from '../data';
import { FALLBACK_CATEGORY_ID } from '../data';
import { useDismiss } from '../hooks/useDismiss';

interface PickerProps {
  categories: RecordCategory[];
  value: string;
  onChange: (id: string) => void;
  onManage: () => void;
}

/** 分类选择芯片：点击弹出分类列表 + 管理入口 */
export function CategoryPicker({ categories, value, onChange, onManage }: PickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss<HTMLDivElement>(() => setOpen(false), open);
  const current = categories.find((c) => c.id === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-500 transition hover:bg-stone-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: current?.color ?? '#64748b' }} />
        {current?.name ?? '分类'}
      </button>

      {open && (
        <div className="animate-menu-in absolute left-0 top-full z-50 mt-1 w-40 rounded-xl border border-stone-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onChange(c.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-stone-600 transition hover:bg-stone-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
              <span className="flex-1 text-left">{c.name}</span>
              {c.id === value && <Check className="h-3.5 w-3.5 text-rose-500" />}
            </button>
          ))}
          <div className="mt-1 border-t border-stone-100 pt-1 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onManage();
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-stone-400 transition hover:bg-stone-100 dark:text-zinc-500 dark:hover:bg-zinc-800"
            >
              <Settings2 className="h-3.5 w-3.5" />
              管理分类…
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface ManagerProps {
  categories: RecordCategory[];
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

/** 分类管理弹窗：新增 / 删除（「其他」为兜底分类不可删除） */
export function CategoryManager({ categories, onAdd, onDelete, onClose }: ManagerProps) {
  const [draft, setDraft] = useState('');

  const add = () => {
    if (draft.trim()) {
      onAdd(draft.trim());
      setDraft('');
    }
  };

  return (
    <div
      className="animate-overlay-in fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4 backdrop-blur-[2px] dark:bg-black/60"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="管理分类"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
        className="animate-modal-in w-full max-w-[360px] rounded-2xl bg-white p-5 shadow-2xl dark:bg-zinc-900"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-stone-800 dark:text-zinc-100">管理分类</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="grid h-8 w-8 place-items-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="mb-3 flex flex-col gap-1">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
              <span className="flex-1 text-sm text-stone-600 dark:text-zinc-300">{c.name}</span>
              {c.id === FALLBACK_CATEGORY_ID ? (
                <span className="text-[11px] text-stone-300 dark:text-zinc-600">默认分类</span>
              ) : (
                <button
                  type="button"
                  onClick={() => onDelete(c.id)}
                  aria-label={`删除分类 ${c.name}`}
                  className="grid h-6 w-6 place-items-center rounded-lg text-stone-300 transition hover:bg-rose-50 hover:text-rose-500 dark:text-zinc-600 dark:hover:bg-rose-500/10"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>

        <p className="mb-3 text-[11px] leading-relaxed text-stone-400 dark:text-zinc-500">
          删除分类时，该分类下的记事会自动归入「其他」。
        </p>

        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) add();
            }}
            placeholder="新分类名称"
            className="min-w-0 flex-1 rounded-lg border border-dashed border-stone-200 bg-transparent px-2.5 py-1.5 text-sm outline-none transition placeholder:text-stone-300 focus:border-rose-300 dark:border-zinc-700 dark:placeholder:text-zinc-600"
          />
          <button
            type="button"
            onClick={add}
            className="shrink-0 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-rose-500/30 transition hover:bg-rose-600"
          >
            添加
          </button>
        </div>
      </div>
    </div>
  );
}
