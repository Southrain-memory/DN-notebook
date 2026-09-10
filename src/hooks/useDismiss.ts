import { useEffect, useRef } from 'react';

/**
 * 点击元素外部或按 Esc 时触发 onDismiss（用于弹层 / 下拉菜单）。
 */
export function useDismiss<T extends HTMLElement>(onDismiss: () => void, active = true) {
  const ref = useRef<T>(null);
  const cbRef = useRef(onDismiss);
  cbRef.current = onDismiss;

  useEffect(() => {
    if (!active) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cbRef.current();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cbRef.current();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [active]);

  return ref;
}
