import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// 单文件构建：把 JS / CSS 全部内联进一个 HTML，
// 产出 release/index.html，随后由脚本复制为「每日记事本.html」，
// 双击即可离线运行，无需任何服务器。
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: { outDir: 'release', emptyOutDir: true },
});
