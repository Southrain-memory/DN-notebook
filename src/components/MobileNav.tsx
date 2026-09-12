import { BookOpenText, CalendarCheck, CalendarDays, ChartGantt, Flag, Trash2 } from 'lucide-react';
import type { Tab } from '../nav';

interface Props {
  tab: Tab;
  onNavigate: (tab: Tab) => void;
  importantCount: number;
  trashCount: number;
}

/** 手机端底部导航栏 */
export function MobileNav({ tab, onNavigate, importantCount, trashCount }: Props) {
  const items: { id: Tab; label: string; icon: typeof Flag; badge?: number; neutralBadge?: boolean }[] = [
    { id: 'day', label: '今天', icon: CalendarCheck },
    { id: 'important', label: '重要', icon: Flag, badge: importantCount },
    { id: 'gantt', label: '甘特图', icon: ChartGantt },
    { id: 'upcoming', label: '即将', icon: CalendarDays },
    { id: 'records', label: '记事', icon: BookOpenText },
    { id: 'trash', label: '回收站', icon: Trash2, badge: trashCount, neutralBadge: true },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden dark:border-zinc-800 dark:bg-zinc-900/95">
      <div className="mx-auto flex max-w-md items-stretch">
        {items.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition ${
                active ? 'text-rose-500' : 'text-stone-400 dark:text-zinc-500'
              }`}
            >
              <span className="relative">
                <item.icon className="h-5 w-5" />
                {!!item.badge && (
                  <span
                    className={`absolute -right-2 -top-1 min-w-[14px] rounded-full px-0.5 text-center text-[9px] font-semibold leading-[14px] text-white ${
                      item.neutralBadge ? 'bg-stone-400 dark:bg-zinc-600' : 'bg-rose-500'
                    }`}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </span>
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
