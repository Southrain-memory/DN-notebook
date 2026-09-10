import type { Priority } from '../data';

export const PRIORITY_META: Record<
  Priority,
  { label: string; dot: string; chipOn: string; block: string }
> = {
  high: {
    label: '高',
    dot: 'bg-rose-500',
    chipOn: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
    block: 'border-rose-500 bg-rose-50/90 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  },
  medium: {
    label: '中',
    dot: 'bg-amber-500',
    chipOn: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    block: 'border-amber-500 bg-amber-50/90 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  },
  low: {
    label: '低',
    dot: 'bg-sky-500',
    chipOn: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400',
    block: 'border-sky-500 bg-sky-50/90 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  },
};

/** 高 / 中 / 低 优先级分段选择器 */
export function PriorityPicker({ value, onChange }: { value: Priority; onChange: (p: Priority) => void }) {
  const items: Priority[] = ['high', 'medium', 'low'];
  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-stone-100/80 p-1 dark:bg-zinc-800/60">
      {items.map((p) => {
        const meta = PRIORITY_META[p];
        const active = value === p;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
              active ? meta.chipOn : 'text-stone-500 hover:text-stone-700 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot} ${active ? '' : 'opacity-40'}`} />
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}
