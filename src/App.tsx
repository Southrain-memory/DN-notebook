import { useCallback, useEffect, useMemo, useState } from 'react';
import type { EventRecord, RecordCategory, Task, TaskInput } from './data';
import { useTasks } from './hooks/useTasks';
import { useRecords } from './hooks/useRecords';
import { useTheme } from './hooks/useTheme';
import { useAppearance } from './hooks/useAppearance';
import { useNotifySettings } from './hooks/useNotifySettings';
import { useTaskNotifications } from './hooks/useTaskNotifications';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { TopBar } from './components/TopBar';
import { DayView } from './views/DayView';
import { ImportantView } from './views/ImportantView';
import { GanttView } from './views/GanttView';
import { UpcomingView } from './views/UpcomingView';
import { RecordsView } from './views/RecordsView';
import { SettingsView } from './views/SettingsView';
import { TrashView } from './views/TrashView';
import { TaskEditModal } from './components/TaskEditModal';
import { RecordEditModal } from './components/RecordEditModal';
import { CategoryManager } from './components/CategoryPicker';
import { ConfirmDialog } from './components/ConfirmDialog';
import { ShortcutHelp } from './components/ShortcutHelp';
import { NotifyToasts } from './components/NotifyToasts';
import type { DueNotice } from './utils/notify';
import { exportBackup, parseBackup } from './utils/backup';
import { addDays, todayStr } from './utils/date';
import { matchesQuery } from './utils/task';
import type { Tab } from './nav';

export default function App() {
  const { tasks, ready, add, update, remove, toggle, restore, purge, importAll } = useTasks();
  const records = useRecords();
  const [theme, setTheme] = useTheme();
  const [appearance, setAppearance] = useAppearance();
  const [notify, setNotify] = useNotifySettings();
  const [tab, setTab] = useState<Tab>('day');
  const [settingsReturn, setSettingsReturn] = useState<Tab>('day');
  const [viewDate, setViewDate] = useState(todayStr());
  const [query, setQuery] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [importing, setImporting] = useState<{ tasks: Task[]; events: EventRecord[]; categories: RecordCategory[] } | null>(null);
  const [editingRecord, setEditingRecord] = useState<EventRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<EventRecord | null>(null);
  const [catManagerOpen, setCatManagerOpen] = useState(false);
  const [notices, setNotices] = useState<DueNotice[]>([]);

  const pushNotice = useCallback((n: DueNotice) => {
    setNotices((prev) => (prev.some((x) => x.key === n.key) ? prev : [...prev, n]));
  }, []);
  const dismissNotice = useCallback((key: string) => {
    setNotices((prev) => prev.filter((n) => n.key !== key));
  }, []);
  useTaskNotifications(tasks, notify, pushNotice);

  const editing = useMemo(() => tasks.find((t) => t.id === editingId) ?? null, [tasks, editingId]);
  // 回收站之外的活动任务
  const activeTasks = useMemo(() => tasks.filter((t) => !t.deletedAt), [tasks]);
  const deletedTasks = useMemo(
    () => tasks.filter((t) => t.deletedAt).sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0)),
    [tasks],
  );
  const trashCount = deletedTasks.length;
  const importantCount = useMemo(() => activeTasks.filter((t) => t.priority === 'high' && !t.done).length, [activeTasks]);
  const visibleTasks = useMemo(
    () => (query.trim() ? activeTasks.filter((t) => matchesQuery(t, query)) : activeTasks),
    [activeTasks, query],
  );

  const failAlert = () => alert('保存失败：浏览器本地存储可能不可用（请检查浏览器隐私设置）');
  const handleAdd = useCallback((input: TaskInput) => add(input).catch(failAlert), [add]);
  const handleToggle = useCallback((id: string) => toggle(id).catch(failAlert), [toggle]);
  const handleRemove = useCallback((id: string) => remove(id).catch(failAlert), [remove]);
  const handleRestore = useCallback((ids: string[]) => restore(ids).catch(failAlert), [restore]);
  const handlePurge = useCallback((ids: string[]) => purge(ids).catch(failAlert), [purge]);
  const handleDefer = useCallback(
    (t: Task) => update(t.id, { date: addDays(t.date, 1) }).catch(failAlert),
    [update],
  );
  const handleSubtaskToggle = useCallback(
    (task: Task, subId: string) => {
      const subs = (task.subtasks ?? []).map((s) => (s.id === subId ? { ...s, done: !s.done } : s));
      update(task.id, { subtasks: subs }).catch(failAlert);
    },
    [update],
  );

  const handleEventAdd = useCallback((input: { title: string; note?: string; date: string; categoryId: string }) => {
    records.addEvent(input).catch(failAlert);
  }, [records]);
  const handleEventDelete = useCallback((id: string) => records.removeEvent(id).catch(failAlert), [records]);

  const handleImportFile = useCallback(async (file: File) => {
    try {
      setImporting(parseBackup(await file.text()));
    } catch {
      alert('导入失败：文件格式不正确，请选择通过「导出备份」生成的 JSON 文件');
    }
  }, []);

  // ── 键盘快捷键（输入框内自动失效；弹窗打开时忽略） ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector("[role='dialog'],[role='alertdialog']")) return;

      if (e.key === '?') {
        setHelpOpen(true);
        return;
      }
      if (tab === 'settings') {
        if (e.key === 'Escape') setTab(settingsReturn === 'settings' ? 'day' : settingsReturn);
        return;
      }
      if (e.key === '1') setTab('day');
      else if (e.key === '2') setTab('important');
      else if (e.key === '3') setTab('gantt');
      else if (e.key === '4') setTab('upcoming');
      else if (e.key === '5') setTab('records');
      else if (e.key === '6') setTab('trash');
      else if (e.key === 'ArrowLeft' && (tab === 'day' || tab === 'gantt')) setViewDate((d) => addDays(d, -1));
      else if (e.key === 'ArrowRight' && (tab === 'day' || tab === 'gantt')) setViewDate((d) => addDays(d, 1));
      else if (e.key === 't' || e.key === 'T') {
        setViewDate(todayStr());
        if (tab === 'important') setTab('day');
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('quickadd:focus'));
      } else if (e.key === '/') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('search:focus'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tab, settingsReturn]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const handleNavigate = useCallback(
    (next: Tab) => {
      if (next === 'settings' && tab !== 'settings') setSettingsReturn(tab);
      setTab(next);
    },
    [tab],
  );

  const leaveSettings = useCallback(() => {
    setTab(settingsReturn === 'settings' ? 'day' : settingsReturn);
  }, [settingsReturn]);

  const navProps = {
    tab,
    onNavigate: handleNavigate,
    importantCount,
    trashCount,
    theme,
    onToggleTheme: toggleTheme,
  };

  const viewProps = {
    onAdd: handleAdd,
    onToggle: handleToggle,
    onEdit: (t: Task) => setEditingId(t.id),
    onDelete: setDeleting,
    onDefer: handleDefer,
    onSubtaskToggle: handleSubtaskToggle,
  };

  if (!ready || !records.ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-stone-100 text-sm text-stone-400 dark:bg-zinc-950 dark:text-zinc-600">
        加载中…
      </div>
    );
  }

  const settingsScreen = tab === 'settings' && (
    <SettingsView
      theme={theme}
      onSetTheme={setTheme}
      appearance={appearance}
      onAppearanceChange={(patch) => setAppearance({ ...appearance, ...patch })}
      notify={notify}
      onNotifyChange={setNotify}
      onExport={() => exportBackup(activeTasks, records.events, records.categories)}
      onImportFile={handleImportFile}
      onBack={leaveSettings}
    />
  );

  const notebookScreen = tab !== 'settings' && (
    <div className="min-h-screen bg-stone-100 text-stone-800 md:flex dark:bg-zinc-950 dark:text-zinc-200">
      <Sidebar {...navProps} />

      <div className="min-w-0 flex-1">
        <TopBar
          tab={tab}
          viewDate={viewDate}
          onViewDateChange={setViewDate}
          tasks={tasks}
          query={query}
          onQueryChange={setQuery}
          onNavigate={handleNavigate}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main className="mx-auto w-full max-w-2xl px-4 pb-28 pt-4 md:pb-12">
          {tab === 'day' && <DayView tasks={visibleTasks} viewDate={viewDate} {...viewProps} />}
          {tab === 'important' && <ImportantView tasks={visibleTasks} {...viewProps} />}
          {tab === 'gantt' && <GanttView tasks={visibleTasks} viewDate={viewDate} {...viewProps} />}
          {tab === 'upcoming' && <UpcomingView tasks={visibleTasks} {...viewProps} />}
          {tab === 'records' && (
            <RecordsView
              events={records.events}
              categories={records.categories}
              query={query}
              onAdd={handleEventAdd}
              onEdit={setEditingRecord}
              onDelete={setDeletingRecord}
              onManageCategories={() => setCatManagerOpen(true)}
            />
          )}
          {tab === 'trash' && <TrashView tasks={deletedTasks} onRestore={handleRestore} onPurge={handlePurge} />}
        </main>
      </div>

      <MobileNav tab={tab} onNavigate={handleNavigate} importantCount={importantCount} trashCount={trashCount} />
    </div>
  );

  return (
    <>
      {settingsScreen}
      {notebookScreen}

      {editing && (
        <TaskEditModal
          task={editing}
          onSave={(id, patch) => {
            update(id, patch).catch(failAlert);
            setEditingId(null);
          }}
          onToggle={handleToggle}
          onDelete={(t) => {
            setEditingId(null);
            setDeleting(t);
          }}
          onClose={() => setEditingId(null)}
        />
      )}

      {editingRecord && (
        <RecordEditModal
          record={editingRecord}
          categories={records.categories}
          onSave={(id, patch) => {
            records.updateEvent(id, patch).catch(failAlert);
            setEditingRecord(null);
          }}
          onDelete={(r) => {
            setEditingRecord(null);
            setDeletingRecord(r);
          }}
          onClose={() => setEditingRecord(null)}
        />
      )}

      {catManagerOpen && (
        <CategoryManager
          categories={records.categories}
          onAdd={(name) => records.addCategory(name).catch(failAlert)}
          onDelete={(id) => records.deleteCategory(id).catch(failAlert)}
          onClose={() => setCatManagerOpen(false)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="删除任务"
          message={`确定删除「${deleting.title.length > 24 ? `${deleting.title.slice(0, 24)}…` : deleting.title}」吗？删除后会存入回收站，可随时恢复。`}
          onConfirm={() => {
            handleRemove(deleting.id);
            setDeleting(null);
          }}
          onClose={() => setDeleting(null)}
        />
      )}

      {deletingRecord && (
        <ConfirmDialog
          title="删除记事"
          message={`确定删除「${deletingRecord.title.length > 24 ? `${deletingRecord.title.slice(0, 24)}…` : deletingRecord.title}」吗？删除后无法恢复。`}
          onConfirm={() => {
            handleEventDelete(deletingRecord.id);
            setDeletingRecord(null);
          }}
          onClose={() => setDeletingRecord(null)}
        />
      )}

      {importing && (
        <ConfirmDialog
          title="导入备份"
          message={`将导入 ${importing.tasks.length} 条任务和 ${importing.events.length} 条记事，并覆盖当前数据。确定继续吗？`}
          confirmText="导入"
          onConfirm={() => {
            importAll(importing.tasks).catch(failAlert);
            records.importAllEvents(importing.events).catch(failAlert);
            if (importing.categories.length > 0) records.saveCategories(importing.categories).catch(failAlert);
            setImporting(null);
          }}
          onClose={() => setImporting(null)}
        />
      )}

      {helpOpen && <ShortcutHelp onClose={() => setHelpOpen(false)} />}

      <NotifyToasts notices={notices} onDismiss={dismissNotice} />
    </>
  );
}
