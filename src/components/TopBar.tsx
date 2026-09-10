import { useEffect, useRef, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Moon,
  NotebookPen,
  Search,
  Settings,
  Sun,
  Upload,
  X,
} from 'lucide-react';
import type { Tab } from '../nav';
import { TAB_TITLES } from '../nav';
import type { Task } from '../data';
import { addDays, headerDate } from '../utils/date';
import { useDismiss } from '../hooks/useDismiss';
import { CalendarPopover } from './CalendarPopover';

interface Props {
  tab: Tab;
  viewDate: string;
  onViewDateChange: (date: string) => void;
  tasks: Task[];
  query: string;
  onQueryChange: (q: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onExport: () => void;
  onImportFile: (file: File) => void;
}

const iconBtn =
  'grid h-9 w-9 place-items-center rounded-lg text-stone-500 transition hover:bg-stone-200/70 dark:text-zinc-400 dark:hover:bg-zinc-800';
const menuItem =
  'flex w-full items-center gap-2 px-3 py-2 text-sm text-stone-600 transition hover:bg-stone-100 dark:text-zinc-300 dark:hover:bg-zinc-800';

/** 内容区顶栏：手机端 logo + 主题/备份；日期导航 + 搜索框 */
export function TopBar({
  tab,
  viewDate,
  onViewDateChange,
  tasks,
  query,
  onQueryChange,
  theme,
  onToggleTheme,
  onExport,
  onImportFile,
}: Props) {
  const [calOpen, setCalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const calRef = useDismiss<HTMLDivElement>(() => setCalOpen(false), calOpen);
  const menuRef = useDismiss<HTMLDivElement>(() => setMenuOpen(false), menuOpen);
  const fileRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // 支持快捷键 / 聚焦搜索
  useEffect(() => {
    const onFocusRequest = () => searchRef.current?.focus();
    window.addEventListener('search:focus', onFocusRequest);
    return () => window.removeEventListener('search:focus', onFocusRequest);
  }, []);

  const showDateNav = tab === 'day' || tab === 'gantt';

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-stone-100/85 backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/85">
      <div className="mx-auto w-full max-w-2xl px-4">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-2.5 md:hidden">
            <div className="grid h-8 w-8 place-items-center rounded-[10px] bg-rose-500 text-white shadow-sm shadow-rose-500/30">
              <NotebookPen className="h-[18px] w-[18px]" />
            </div>
            <h1 className="text-[17px] font-bold tracking-wide text-stone-800 dark:text-zinc-100">每日记事本</h1>
          </div>
          <h2 className="hidden text-base font-semibold text-stone-700 md:block dark:text-zinc-200">
            {TAB_TITLES[tab]}
          </h2>

          {/* 手机端：主题与备份（桌面端在侧边栏） */}
          <div className="flex items-center gap-1 md:hidden">
            <button type="button" onClick={onToggleTheme} className={iconBtn} aria-label="切换深浅模式">
              {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>
            <div className="relative" ref={menuRef}>
              <button type="button" onClick={() => setMenuOpen((o) => !o)} className={iconBtn} aria-label="备份与恢复">
                <Settings className="h-[18px] w-[18px]" />
              </button>
              {menuOpen && (
                <div className="animate-menu-in absolute right-0 top-11 z-50 w-44 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onExport();
                    }}
                    className={menuItem}
                  >
                    <Download className="h-4 w-4" />
                    导出备份
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      fileRef.current?.click();
                    }}
                    className={menuItem}
                  >
                    <Upload className="h-4 w-4" />
                    导入备份
                  </button>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onImportFile(f);
                  e.target.value = '';
                }}
              />
            </div>
          </div>
        </div>

        {showDateNav && (
          <div className="flex flex-wrap items-center gap-2 pb-3">
            <div className="relative flex items-center" ref={calRef}>
              <button
                type="button"
                onClick={() => onViewDateChange(addDays(viewDate, -1))}
                className={iconBtn}
                aria-label="前一天"
              >
                <ChevronLeft className="h-[18px] w-[18px]" />
              </button>
              <button
                type="button"
                onClick={() => setCalOpen((o) => !o)}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-200/70 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <CalendarDays className="h-4 w-4 text-rose-500" />
                {headerDate(viewDate)}
              </button>
              <button
                type="button"
                onClick={() => onViewDateChange(addDays(viewDate, 1))}
                className={iconBtn}
                aria-label="后一天"
              >
                <ChevronRight className="h-[18px] w-[18px]" />
              </button>
              {calOpen && (
                <CalendarPopover
                  value={viewDate}
                  tasks={tasks}
                  onSelect={(d) => {
                    setCalOpen(false);
                    onViewDateChange(d);
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* 搜索框（所有页签可用） */}
        <div className={`flex pb-3 ${showDateNav ? '' : 'justify-end'}`}>
          <div className="relative ml-auto">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400 dark:text-zinc-500" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  onQueryChange('');
                  e.currentTarget.blur();
                }
              }}
              placeholder="搜索任务…"
              aria-label="搜索任务"
              className="w-36 rounded-lg border border-transparent bg-stone-200/60 py-1.5 pl-8 pr-7 text-xs text-stone-700 outline-none transition placeholder:text-stone-400 focus:w-44 focus:border-rose-300 focus:bg-white dark:bg-zinc-800/70 dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-rose-500/50 md:w-52 md:focus:w-64"
            />
            {query && (
              <button
                type="button"
                onClick={() => onQueryChange('')}
                aria-label="清空搜索"
                className="absolute right-1.5 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded text-stone-400 transition hover:bg-stone-200/70 dark:hover:bg-zinc-700"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
