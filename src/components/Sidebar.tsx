import {
  CalendarCheck,
  CalendarDays,
  ChartGantt,
  Flag,
  Moon,
  NotebookPen,
  Settings,
  Sun,
  Trash2,
} from 'lucide-react';
import type { Tab } from '../nav';

interface Props {
  tab: Tab;
  onNavigate: (tab: Tab) => void;
  importantCount: number;
  trashCount: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

/** 桌面端左侧边栏：主导航 + 底部主题切换与设置入口 */
export function Sidebar({ tab, onNavigate, importantCount, trashCount, theme, onToggleTheme }: Props) {
  const items: { id: Tab; label: string; icon: typeof Flag; badge?: number; neutralBadge?: boolean }[] = [
    { id: 'day', label: '今天', icon: CalendarCheck },
    { id: 'important', label: '重要事项', icon: Flag, badge: importantCount },
    { id: 'gantt', label: '时间甘特图', icon: ChartGantt },
    { id: 'upcoming', label: '即将到来', icon: CalendarDays },
    { id: 'records', label: '记事', icon: NotebookPen },
    { id: 'trash', label: '回收站', icon: Trash2, badge: trashCount, neutralBadge: true },
  ];

  const itemCls = (active: boolean) =>
    `flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
      active
        ? 'bg-rose-500/10 font-semibold text-rose-600 dark:bg-rose-500/15 dark:text-rose-400'
        : 'text-stone-600 hover:bg-stone-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
    }`;
  const iconBtn =
    'grid h-9 w-9 place-items-center rounded-lg text-stone-500 transition hover:bg-stone-200/70 dark:text-zinc-400 dark:hover:bg-zinc-800';

  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-stone-200/80 bg-stone-50/60 md:flex dark:border-zinc-800/80 dark:bg-zinc-900/30">
      <div className="flex h-14 items-center gap-2.5 px-5">
        <div className="grid h-8 w-8 place-items-center rounded-[10px] bg-rose-500 text-white shadow-sm shadow-rose-500/30">
          <NotebookPen className="h-[18px] w-[18px]" />
        </div>
        <h1 className="text-[17px] font-bold tracking-wide text-stone-800 dark:text-zinc-100">每日记事本</h1>
      </div>

      <nav className="flex flex-col gap-1 px-3 pt-2">
        {items.map((item) => (
          <button key={item.id} type="button" onClick={() => onNavigate(item.id)} className={itemCls(tab === item.id)}>
            <item.icon className="h-[18px] w-[18px]" />
            <span className="flex-1 text-left">{item.label}</span>
            {!!item.badge && (
              <span
                className={`min-w-[18px] rounded-full px-1 text-center text-[10px] font-semibold leading-[18px] text-white ${
                  item.neutralBadge ? 'bg-stone-400 dark:bg-zinc-600' : 'bg-rose-500'
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-1 border-t border-stone-200/70 px-3 py-3 dark:border-zinc-800/70">
        <button type="button" onClick={onToggleTheme} className={iconBtn} aria-label="切换深浅模式" title="切换深浅模式">
          {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>
        <button
          type="button"
          onClick={() => onNavigate('settings')}
          className={`${itemCls(tab === 'settings')} flex-1 text-stone-500 dark:text-zinc-400`}
        >
          <Settings className="h-[18px] w-[18px]" />
          设置
        </button>
      </div>
    </aside>
  );
}
