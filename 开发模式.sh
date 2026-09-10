#!/usr/bin/env bash
# 开发模式：启动 Vite 热更新开发服务器（修改 src/ 下代码实时生效）
cd "$(dirname "$0")"
if [ ! -d node_modules ]; then
  echo "首次运行，安装依赖中…"
  npm install
fi
npm run dev -- --open
