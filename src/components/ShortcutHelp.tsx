import { X } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const ROWS: [string, string][] = [
  ['1-5 6', '切换 今天 / 重要事项 / 甘特图 / 即将到来 / 记事 / 回收站'],
  ['← →', '前一天 / 后一天（今天、甘特图页）'],
  ['T', '回到今天'],
  ['N', '聚焦快速输入框'],
  ['/　', '聚焦搜索框'],
  ['?', '显示快捷键面板'],
];

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-grid min-w-[22px] place-items-center rounded-md border border-stone-200 bg-stone-50 px-1.5 py-0.5 font-mono text-[11px] text-stone-500 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
      {children}
    </kbd>
  );
}

/** 键盘快捷键帮助面板（按 ? 呼出） */
export function ShortcutHelp({ onClose }: Props) {
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
        aria-label="键盘快捷键"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
        className="animate-modal-in w-full max-w-[380px] rounded-2xl bg-white p-5 shadow-2xl dark:bg-zinc-900"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-stone-800 dark:text-zinc-100">键盘快捷键</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="grid h-8 w-8 place-items-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <ul className="flex flex-col gap-2">
          {ROWS.map(([keys, desc]) => (
            <li key={desc} className="flex items-center justify-between gap-4 text-sm">
              <span className="flex gap-1">
                {keys
                  .trim()
                  .split(/\s+/)
                  .map((k, i) => (
                    <Kbd key={i}>{k}</Kbd>
                  ))}
              </span>
              <span className="text-stone-500 dark:text-zinc-400">{desc}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-stone-400 dark:text-zinc-500">输入时（输入框内）快捷键自动失效</p>
      </div>
    </div>
  );
}
