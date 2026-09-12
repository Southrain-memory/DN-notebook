import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface UpdateInfo {
  version: string;
  url: string;
  publishedAt: number;
}

/** 左下角「有更新可下载」徽标：点击打开 GitHub Release 页并记录已知晓 */
export function UpdateBadge() {
  const [update, setUpdate] = useState<UpdateInfo | null>(null);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.onUpdateAvailable) return;
    api.onUpdateAvailable((info) => setUpdate(info));
    void api.checkUpdate?.();
  }, []);

  if (!update) return null;

  const handleClick = () => {
    window.open(update.url, '_blank');
    void window.electronAPI?.ackUpdate?.(update.publishedAt);
    setUpdate(null);
  };

  return (
    <div className="fixed bottom-20 left-4 z-50 md:bottom-4 md:left-60">
      <div className="animate-modal-in flex items-center gap-2 rounded-full bg-rose-500 py-2 pl-4 pr-2 text-white shadow-lg shadow-rose-500/40">
        <button
          type="button"
          onClick={handleClick}
          className="flex items-center gap-2 text-sm font-semibold transition hover:opacity-85"
          title="打开 GitHub Release 页面"
        >
          <Download className="h-4 w-4" />
          发现新版本 v{update.version}，点击下载
        </button>
        <button
          type="button"
          onClick={() => {
            void window.electronAPI?.ackUpdate?.(update.publishedAt);
            setUpdate(null);
          }}
          aria-label="关闭更新提示"
          className="grid h-6 w-6 place-items-center rounded-full transition hover:bg-white/20"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
