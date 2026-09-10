import type { ReactNode } from 'react';

export function EmptyState({ icon, title, hint }: { icon: ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="text-stone-300 dark:text-zinc-700">{icon}</div>
      <p className="font-medium text-stone-500 dark:text-zinc-400">{title}</p>
      {hint && <p className="text-sm text-stone-400 dark:text-zinc-500">{hint}</p>}
    </div>
  );
}
