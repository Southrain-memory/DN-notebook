import { useRef, useState } from 'react';
import { ArrowLeft, Bell, Check, Download, Moon, Palette, Sun, Upload } from 'lucide-react';
import type { Appearance } from '../hooks/useAppearance';
import { DEFAULT_FONT_SIZE, FONT_OPTIONS, MAX_FONT_SIZE, MIN_FONT_SIZE } from '../hooks/useAppearance';
import type { NotifySettings } from '../hooks/useNotifySettings';
import { LEAD_OPTIONS } from '../hooks/useNotifySettings';
import {
  getNotifyPermission,
  requestNotifyPermission,
  sendTestNotification,
  type NotifyPermission,
} from '../utils/notify';

type SettingsSection = 'appearance' | 'notify';

interface Props {
  theme: 'light' | 'dark';
  onSetTheme: (t: 'light' | 'dark') => void;
  appearance: Appearance;
  onAppearanceChange: (patch: Partial<Appearance>) => void;
  notify: NotifySettings;
  onNotifyChange: (patch: Partial<NotifySettings>) => void;
  onExport: () => void;
  onImportFile: (file: File) => void;
  onBack: () => void;
}

const card =
  'rounded-2xl border border-stone-200 bg-white px-5 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900';

/** 独立设置页：左侧外观 / 通知，右侧对应内容，左上角返回记事本 */
export function SettingsView({
  theme,
  onSetTheme,
  appearance,
  onAppearanceChange,
  notify,
  onNotifyChange,
  onExport,
  onImportFile,
  onBack,
}: Props) {
  const [section, setSection] = useState<SettingsSection>('appearance');

  const itemCls = (active: boolean) =>
    `flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
      active
        ? 'bg-rose-500/10 font-semibold text-rose-600 dark:bg-rose-500/15 dark:text-rose-400'
        : 'text-stone-600 hover:bg-stone-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
    }`;

  return (
    <div className="flex min-h-screen bg-stone-100 text-stone-800 dark:bg-zinc-950 dark:text-zinc-200">
      <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-stone-200/80 bg-stone-50/60 dark:border-zinc-800/80 dark:bg-zinc-900/30">
        <div className="flex h-14 items-center px-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="回到记事本"
            title="回到记事本"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-stone-600 transition hover:bg-stone-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
            返回
          </button>
        </div>

        <nav className="flex flex-col gap-1 px-3 pt-1">
          <button
            type="button"
            onClick={() => setSection('appearance')}
            className={itemCls(section === 'appearance')}
          >
            <Palette className="h-[18px] w-[18px]" />
            外观
          </button>
          <button type="button" onClick={() => setSection('notify')} className={itemCls(section === 'notify')}>
            <Bell className="h-[18px] w-[18px]" />
            通知
          </button>
        </nav>
      </aside>

      <div className="min-w-0 flex-1 overflow-y-auto">
        <main className="mx-auto w-full max-w-2xl px-4 py-6 pb-12">
          {section === 'appearance' && (
            <AppearancePane
              theme={theme}
              onSetTheme={onSetTheme}
              appearance={appearance}
              onAppearanceChange={onAppearanceChange}
              onExport={onExport}
              onImportFile={onImportFile}
            />
          )}
          {section === 'notify' && <NotifyPane notify={notify} onNotifyChange={onNotifyChange} />}
        </main>
      </div>
    </div>
  );
}

function AppearancePane({
  theme,
  onSetTheme,
  appearance,
  onAppearanceChange,
  onExport,
  onImportFile,
}: {
  theme: 'light' | 'dark';
  onSetTheme: (t: 'light' | 'dark') => void;
  appearance: Appearance;
  onAppearanceChange: (patch: Partial<Appearance>) => void;
  onExport: () => void;
  onImportFile: (file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const themeOptions: { id: 'light' | 'dark'; label: string; icon: typeof Sun }[] = [
    { id: 'light', label: '浅色模式', icon: Sun },
    { id: 'dark', label: '深色模式', icon: Moon },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-stone-800 dark:text-zinc-100">外观</h2>
        <p className="mt-0.5 text-xs text-stone-400 dark:text-zinc-500">调整界面配色与文字显示</p>
      </div>

      <section className={card}>
        <div className="grid grid-cols-2 gap-2.5">
          {themeOptions.map((opt) => {
            const active = theme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onSetTheme(opt.id)}
                aria-pressed={active}
                className={`relative flex flex-col items-center gap-2 rounded-xl border px-3 py-3.5 text-sm transition ${
                  active
                    ? 'border-rose-400 bg-rose-50 font-medium text-rose-600 dark:border-rose-500/60 dark:bg-rose-500/10 dark:text-rose-400'
                    : 'border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-stone-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/50'
                }`}
              >
                {active && <Check className="absolute right-2 top-2 h-3.5 w-3.5" />}
                <span
                  className={`h-10 w-full overflow-hidden rounded-lg border text-center text-[10px] leading-10 ${
                    opt.id === 'light'
                      ? 'border-stone-200 bg-stone-100 text-stone-500'
                      : 'border-zinc-700 bg-zinc-900 text-zinc-400'
                  }`}
                >
                  Aa 记事本
                </span>
                <span className="flex items-center gap-1.5">
                  <opt.icon className="h-4 w-4" />
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium text-stone-600 dark:text-zinc-300">字号大小</span>
            <span className="text-xs text-stone-400 dark:text-zinc-500">
              {appearance.fontSize}px
              {appearance.fontSize !== DEFAULT_FONT_SIZE && (
                <button
                  type="button"
                  onClick={() => onAppearanceChange({ fontSize: DEFAULT_FONT_SIZE })}
                  className="ml-2 text-rose-500 transition hover:text-rose-600 dark:hover:text-rose-400"
                >
                  恢复默认
                </button>
              )}
            </span>
          </div>
          <input
            type="range"
            min={MIN_FONT_SIZE}
            max={MAX_FONT_SIZE}
            step={1}
            value={appearance.fontSize}
            onChange={(e) => onAppearanceChange({ fontSize: Number(e.target.value) })}
            aria-label="字号大小"
            className="mt-2.5 w-full accent-rose-500"
          />
          <div className="flex justify-between text-[10px] text-stone-400 dark:text-zinc-600">
            <span>小</span>
            <span>标准</span>
            <span>大</span>
          </div>
          <p className="mt-2.5 rounded-lg bg-stone-100 px-3 py-2.5 text-stone-600 dark:bg-zinc-800/60 dark:text-zinc-300">
            预览：今天也要认真过 The quick brown fox 0123456789
          </p>
        </div>

        <div className="mt-5">
          <span className="text-sm font-medium text-stone-600 dark:text-zinc-300">字体</span>
          <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {FONT_OPTIONS.map((opt) => {
              const active = appearance.fontId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onAppearanceChange({ fontId: opt.id })}
                  aria-pressed={active}
                  style={opt.stack ? { fontFamily: opt.stack } : undefined}
                  className={`relative rounded-lg border px-3 py-2 text-sm transition ${
                    active
                      ? 'border-rose-400 bg-rose-50 text-rose-600 dark:border-rose-500/60 dark:bg-rose-500/10 dark:text-rose-400'
                      : 'border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-stone-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  {active && <Check className="absolute right-1.5 top-1.5 h-3 w-3" />}
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <div>
            <span className="text-sm font-medium text-stone-600 dark:text-zinc-300">手形光标</span>
            <p className="mt-0.5 text-xs text-stone-400 dark:text-zinc-500">
              鼠标悬停在按钮等可点击元素上时，指针由箭头变为手形
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={appearance.pointerCursor}
            aria-label="手形光标"
            onClick={() => onAppearanceChange({ pointerCursor: !appearance.pointerCursor })}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              appearance.pointerCursor ? 'bg-rose-500' : 'bg-stone-300 dark:bg-zinc-600'
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                appearance.pointerCursor ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
      </section>

      <section className={card}>
        <h3 className="text-sm font-semibold text-stone-700 dark:text-zinc-200">备份与恢复</h3>
        <p className="mt-0.5 text-xs text-stone-400 dark:text-zinc-500">
          数据保存在本设备中，建议定期导出 JSON 备份；导入会覆盖当前全部数据。
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onExport}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-600 transition hover:border-stone-300 hover:bg-stone-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/50"
          >
            <Download className="h-4 w-4" />
            导出备份
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-600 transition hover:border-stone-300 hover:bg-stone-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/50"
          >
            <Upload className="h-4 w-4" />
            导入备份
          </button>
        </div>
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
      </section>
    </div>
  );
}

function NotifyPane({
  notify,
  onNotifyChange,
}: {
  notify: NotifySettings;
  onNotifyChange: (patch: Partial<NotifySettings>) => void;
}) {
  const [perm, setPerm] = useState<NotifyPermission>(getNotifyPermission);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-stone-800 dark:text-zinc-100">通知</h2>
        <p className="mt-0.5 text-xs text-stone-400 dark:text-zinc-500">
          到任务开始时间，以及即将结束时，发送系统提醒。仅对设置了时间且未完成的任务生效，需要应用保持运行。
        </p>
      </div>

      <section className={card}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-sm font-medium text-stone-600 dark:text-zinc-300">任务提醒</span>
            <p className="mt-0.5 text-xs text-stone-400 dark:text-zinc-500">开始时提醒一次，结束前再提醒一次</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={notify.enabled}
            aria-label="任务提醒"
            onClick={() => {
              const next = !notify.enabled;
              onNotifyChange({ enabled: next });
              if (next) void requestNotifyPermission().then(setPerm);
            }}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              notify.enabled ? 'bg-rose-500' : 'bg-stone-300 dark:bg-zinc-600'
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                notify.enabled ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        <div className={`mt-5 ${notify.enabled ? '' : 'pointer-events-none opacity-45'}`}>
          <span className="text-sm font-medium text-stone-600 dark:text-zinc-300">即将结束提前量</span>
          <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {LEAD_OPTIONS.map((mins) => {
              const active = notify.leadMinutes === mins;
              return (
                <button
                  key={mins}
                  type="button"
                  disabled={!notify.enabled}
                  onClick={() => onNotifyChange({ leadMinutes: mins })}
                  aria-pressed={active}
                  className={`relative rounded-lg border px-2 py-2 text-sm transition ${
                    active
                      ? 'border-rose-400 bg-rose-50 font-medium text-rose-600 dark:border-rose-500/60 dark:bg-rose-500/10 dark:text-rose-400'
                      : 'border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-stone-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  {mins} 分钟
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <NotifyPermissionHint perm={perm} onRequest={() => void requestNotifyPermission().then(setPerm)} />
          <button
            type="button"
            onClick={() => void sendTestNotification().then(() => setPerm(getNotifyPermission()))}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-600 transition hover:border-stone-300 hover:bg-stone-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/50"
          >
            <Bell className="h-4 w-4" />
            发送测试通知
          </button>
        </div>
      </section>
    </div>
  );
}

function NotifyPermissionHint({
  perm,
  onRequest,
}: {
  perm: NotifyPermission;
  onRequest: () => void;
}) {
  if (perm === 'electron') {
    return <p className="text-xs text-stone-400 dark:text-zinc-500">桌面版使用系统通知，保持应用运行即可提醒。</p>;
  }
  if (perm === 'unsupported') {
    return <p className="text-xs text-stone-400 dark:text-zinc-500">当前环境不支持系统通知。</p>;
  }
  if (perm === 'granted') {
    return <p className="text-xs text-stone-400 dark:text-zinc-500">浏览器已允许通知。请保持本页面开启。</p>;
  }
  if (perm === 'denied') {
    return (
      <p className="text-xs text-amber-600 dark:text-amber-400">通知权限被拒绝，请在浏览器设置中允许本站点通知。</p>
    );
  }
  return (
    <button
      type="button"
      onClick={onRequest}
      className="text-left text-xs text-rose-500 transition hover:text-rose-600 dark:hover:text-rose-400"
    >
      网页版需要浏览器授权，点击允许通知
    </button>
  );
}
