import { useRef } from 'react';
import { Check, Download, Moon, Sun, Upload } from 'lucide-react';
import type { Appearance } from '../hooks/useAppearance';
import { DEFAULT_FONT_SIZE, FONT_OPTIONS, MAX_FONT_SIZE, MIN_FONT_SIZE } from '../hooks/useAppearance';

interface Props {
  theme: 'light' | 'dark';
  onSetTheme: (t: 'light' | 'dark') => void;
  appearance: Appearance;
  onAppearanceChange: (patch: Partial<Appearance>) => void;
  onExport: () => void;
  onImportFile: (file: File) => void;
}

const card =
  'rounded-2xl border border-stone-200 bg-white px-5 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900';

/** 设置页：外观（深浅模式 / 字体 / 字号）与备份恢复 */
export function SettingsView({ theme, onSetTheme, appearance, onAppearanceChange, onExport, onImportFile }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const themeOptions: { id: 'light' | 'dark'; label: string; icon: typeof Sun }[] = [
    { id: 'light', label: '浅色模式', icon: Sun },
    { id: 'dark', label: '深色模式', icon: Moon },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* ── 外观 ── */}
      <section className={card}>
        <h3 className="text-sm font-semibold text-stone-700 dark:text-zinc-200">外观</h3>
        <p className="mt-0.5 text-xs text-stone-400 dark:text-zinc-500">调整界面配色与文字显示</p>

        <div className="mt-3 grid grid-cols-2 gap-2.5">
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
                {/* 配色预览小块 */}
                <span
                  className={`h-10 w-full overflow-hidden rounded-lg border text-[10px] leading-10 text-center ${
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

        {/* 字号 */}
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

        {/* 字体 */}
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

        {/* 鼠标指针 */}
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
              appearance.pointerCursor
                ? 'bg-rose-500'
                : 'bg-stone-300 dark:bg-zinc-600'
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

      {/* ── 备份与恢复 ── */}
      <section className={card}>
        <h3 className="text-sm font-semibold text-stone-700 dark:text-zinc-200">备份与恢复</h3>
        <p className="mt-0.5 text-xs text-stone-400 dark:text-zinc-500">
          数据保存在本设备浏览器中，建议定期导出 JSON 备份；导入会覆盖当前全部数据。
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
