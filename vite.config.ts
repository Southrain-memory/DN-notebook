import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // 相对路径：Electron 以 file:// 加载 dist/index.html 时资源才能正确解析
  base: './',
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
});
