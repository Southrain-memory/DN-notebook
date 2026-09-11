import { useEffect, useState } from 'react';

export interface Appearance {
  fontId: string;
  fontSize: number;
  pointerCursor: boolean;
}

export const FONT_OPTIONS: { id: string; label: string; stack: string }[] = [
  { id: 'default', label: '系统默认', stack: '' },
  { id: 'serif', label: '宋体', stack: 'Georgia, "Songti SC", SimSun, "Noto Serif CJK SC", serif' },
  { id: 'kai', label: '楷体', stack: '"Kaiti SC", STKaiti, KaiTi, "Noto Serif CJK SC", serif' },
  { id: 'round', label: '圆体', stack: 'Yuanti SC, "PingFang SC", "Microsoft YaHei", sans-serif' },
  { id: 'mono', label: '等宽', stack: 'ui-monospace, "Cascadia Mono", Consolas, "Noto Sans Mono CJK SC", monospace' },
];

export const MIN_FONT_SIZE = 14;
export const MAX_FONT_SIZE = 20;
export const DEFAULT_FONT_SIZE = 16;

const KEY = 'daily-notebook.appearance';
const DEFAULTS: Appearance = { fontId: 'default', fontSize: DEFAULT_FONT_SIZE, pointerCursor: true };

function loadAppearance(): Appearance {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<Appearance>;
      return {
        fontId: FONT_OPTIONS.some((o) => o.id === parsed.fontId) ? (parsed.fontId as string) : 'default',
        fontSize:
          typeof parsed.fontSize === 'number' && parsed.fontSize >= MIN_FONT_SIZE && parsed.fontSize <= MAX_FONT_SIZE
            ? parsed.fontSize
            : DEFAULT_FONT_SIZE,
        pointerCursor: typeof parsed.pointerCursor === 'boolean' ? parsed.pointerCursor : true,
      };
    }
  } catch {
    /* 忽略 */
  }
  return DEFAULTS;
}

/** 外观设置（字体、字号、手形光标）：写入 <html> 并持久化到 localStorage */
export function useAppearance(): [Appearance, (a: Appearance) => void] {
  const [appearance, setAppearance] = useState<Appearance>(loadAppearance);

  useEffect(() => {
    const root = document.documentElement;
    const stack = FONT_OPTIONS.find((o) => o.id === appearance.fontId)?.stack ?? '';
    // Tailwind 的 body 字体取自 --font-sans；字号作用于根元素，rem 尺寸随之整体缩放
    if (stack) root.style.setProperty('--font-sans', stack);
    else root.style.removeProperty('--font-sans');
    root.style.fontSize = `${appearance.fontSize}px`;
    // 手形光标开关：CSS 规则见 index.css 的 html.cursor-gesture
    root.classList.toggle('cursor-gesture', appearance.pointerCursor);

    try {
      localStorage.setItem(KEY, JSON.stringify(appearance));
    } catch {
      /* 忽略 */
    }
  }, [appearance]);

  return [appearance, setAppearance];
}
