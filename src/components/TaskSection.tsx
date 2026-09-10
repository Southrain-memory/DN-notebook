import type { ReactNode } from 'react';

/** 卡片式任务分组容器 */
export function TaskSection({ title, badge, children }: { title?: ReactNode; badge?: ReactNode; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {title && (
        <div className="flex items-center justify-between border-b border-stone-100 px-4 py-2.5 dark:border-zinc-800/80">
          <h2 className="text-xs font-semibold tracking-wide text-stone-400 dark:text-zinc-500">{title}</h2>
          {badge && <span className="text-xs text-stone-400 dark:text-zinc-500">{badge}</span>}
        </div>
      )}
      <ol className="divide-y divide-stone-100 dark:divide-zinc-800/70">{children}</ol>
    </section>
  );
}
