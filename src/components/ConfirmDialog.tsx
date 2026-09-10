import { useEffect, useRef } from 'react';

interface Props {
  title: string;
  message: string;
  confirmText?: string;
  onConfirm: () => void;
  onClose: () => void;
}

/** 删除 / 导入等危险操作的确认对话框 */
export function ConfirmDialog({ title, message, confirmText = '删除', onConfirm, onClose }: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  return (
    <div
      className="animate-overlay-in fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4 backdrop-blur-[2px] dark:bg-black/60"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
        className="animate-modal-in w-full max-w-[340px] rounded-2xl bg-white p-5 shadow-2xl dark:bg-zinc-900"
      >
        <h2 className="text-base font-semibold text-stone-800 dark:text-zinc-100">{title}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-stone-500 dark:text-zinc-400">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-stone-500 transition hover:bg-stone-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            取消
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-rose-500/30 transition hover:bg-rose-600"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
