#!/usr/bin/env bash
# 《每日记事本》一键启动：用默认浏览器打开单文件版
# 数据保存在浏览器本地（localStorage），无需任何服务器。
cd "$(dirname "$0")"

if [ ! -f "每日记事本.html" ]; then
  echo "未找到 每日记事本.html，正在构建…"
  npm install
  npm run build:single
fi

if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "每日记事本.html" >/dev/null 2>&1 &
elif command -v open >/dev/null 2>&1; then
  open "每日记事本.html"
else
  echo "请用浏览器打开：$(pwd)/每日记事本.html"
fi
