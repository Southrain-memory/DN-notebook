# 每日记事本

一个极简、美观的**个人每日任务与重要事项记录本**（中文界面），支持**网页版**与**桌面版（Windows / macOS / Linux）**。
参考 [go-vikunja/vikunja](https://github.com/go-vikunja/vikunja) 的任务模型并做了极简化，专注个人每日使用。

![技术栈](https://img.shields.io/badge/React%20%2B%20Tailwind%20%2B%20Electron-每日记事本-rose) ![license](https://img.shields.io/badge/license-MIT-green)

## 📥 下载安装（桌面版）

到本仓库的 **[Releases](../../releases)** 页面下载对应平台的安装包：

| 平台 | 文件 | 说明 |
|---|---|---|
| Windows | `DailyNotebook-x.y.z-win-x64.exe` | 安装向导，可选安装目录、创建桌面快捷方式 |
| macOS | `DailyNotebook-x.y.x-mac.dmg` | 未签名应用，首次打开需**右键 → 打开** |
| Linux | `DailyNotebook-x.y.z-linux-x86_64.AppImage` / `.deb` | AppImage 双击即用（需 FUSE）；deb 用包管理器安装 |

> **Ubuntu 24.04+ 用户**：优先用 deb 安装（安装脚本已正确配置沙箱）。AppImage 版因系统新加的 AppArmor 用户名字空间限制可能启动即崩溃，若遇到请改用 deb，或运行时加 `--no-sandbox` 参数。

**自动更新**：应用启动时会自动检查 GitHub Releases，有新版本会弹通知，一键升级；也可通过菜单「应用 → 检查更新…」手动触发。

**数据位置**：桌面版数据保存在用户数据目录（`~/.config/每日记事本/` 下的 `tasks.json`、`events.json`、`categories.json`，Windows 在 `%APPDATA%/每日记事本/`），可通过菜单「应用 → 打开数据文件夹」直达；网页版数据在浏览器 localStorage，两者可用「导出/导入备份」互通。

> 也可以零安装使用：仓库根目录的 `每日记事本.html` 单文件版，双击即可在浏览器中运行。

## ✨ 功能

**任务管理**
- **快速添加（中文魔法输入）**：一句话自动识别要素，如「明天下午3点 开会 #高」「每周五 交周报」「后天 14点到16点 团建」「下下周四 从13：00到19：00 开会」——支持 今天/明天/后天/大后天/N天后、周X（本周/这周/下周/下下周，可带「个」）、M月d号、YYYY年M月d日、每天/每周/每月、上午/中午/下午/晚上/凌晨 N点[半]、中文数字点钟、从A到B / A-B / 13：00-19：00 时间段、#高/#中/#低；不识别就原样当标题
- **重复任务**：每天 / 每周 / 每月，完成后由数据层自动生成下一次（子任务进度重置），吃药、周报类例事不再手动重建
- **一键顺延**：今天不想做？悬停任务点「→」顺延一天
- **子任务清单**：任务内可勾选的 checklist，列表显示 2/5 进度，可展开直接勾选
- **完成打卡**：点击左侧圆圈标记完成，完成后变灰 + 删除线，移入底部“已完成”分组；编辑弹窗里也可标记
- **编辑 / 删除**：点击任务（或甘特图色块）打开编辑弹窗（标题、备注、日期、时间段、重复、优先级、子任务），删除需二次确认
- **优先级**：高/中/低；高优先级（重要事项）🔴 红旗标记、红色底色置顶

**视图**
- **记事**：记录每一天发生的事——一句话快速记录（可选日期、分类、补充描述），按时间线倒序回顾；内置工作/生活/学习/健康/其他分类，支持自定义分类（颜色自动分配，删除分类时其下记事自动归入「其他」）；分类筛选 + 关键词搜索
- **今天首页**：当天任务按优先级排序；进度卡显示「已完成 3/8」+ 进度条 + 🔥 连续打卡天数 + 本周完成数
- **时间甘特图**：日/周两种模式——日视图按小时时间轴（时间重叠自动并排分列、红色“现在时刻”线）；周视图 7 天概览（今天高亮、周末底色）
- **重要事项专区**：汇总所有「高」优先级且未完成的任务，按日期分组，逾期标红
- **即将到来**：逾期 + 未来 7 天 + 之后的跨天总览，一屏看清近期负担
- **日历切换**：顶栏左右翻天、日历选任意日期；日历上有任务圆点提示（有高优先级显示红点）

**通用**
- **搜索**：顶栏即时过滤标题 / 备注 / 子任务 / 记事
- **键盘快捷键**：`1/2/3/4/5` 切视图、`←/→` 翻天、`T` 回今天、`N` 聚焦输入、`/` 搜索、`?` 查看面板（输入时自动失效）
- **深浅色模式**：一键切换，跟随系统偏好，自动记忆
- **响应式**：桌面端左侧边栏，手机端底部导航栏
- **任务提醒**：到开始时间、以及即将结束时提醒（可在设置中开关，并选择提前 3/5/10/15 分钟）。桌面版走系统通知；网页版需浏览器授权且保持页面开启，同时会在应用内弹出提醒条。无时间段的任务不会提醒。
- **备份**：导出 / 导入 JSON 备份（v2 格式，含任务 + 记事 + 分类，兼容旧版备份）

## 📦 开发与构建

```bash
npm install            # 安装依赖
npm run dev            # 网页版开发模式（热更新）
npm run dev:electron   # 桌面版开发模式（Electron + 热更新）
npm run typecheck      # TypeScript 类型检查
npm run build          # 构建前端（dist/）
npm run build:single   # 构建网页单文件版 → 每日记事本.html
npm run electron:start # 构建前端并以桌面应用启动
npm run electron:build # 构建当前平台的桌面安装包（release-electron/）
```

## 🗂️ 目录结构

```
├── 每日记事本.html        # ⭐ 网页单文件版（双击即用）
├── electron/             # ⭐ Electron 桌面端（主进程 + IPC 数据桥）
├── build/icon.png        # 应用图标
├── .github/workflows/    # CI：打 tag 自动构建三平台安装包并发布
├── electron-builder.yml  # 打包配置（Windows NSIS / macOS dmg / Linux AppImage+deb）
├── 启动记事本.sh / .bat   # 网页版一键启动脚本
├── index.html
└── src/
    ├── data/              # ⭐ 数据层（与界面完全解耦）
    │   ├── types.ts               # Task / EventRecord / RecordCategory 等类型
    │   ├── taskRepository.ts      # 任务仓库接口（视图层只依赖它）
    │   ├── eventRepository.ts     # 记事仓库（接口 + localStorage/Electron 双实现）
    │   ├── localStorageRepository.ts  # 网页版任务：localStorage 实现
    │   ├── electronRepository.ts  # 桌面版桥接（用户目录 JSON，经 IPC）
    │   ├── domain.ts              # 领域规则（重复任务自动生成下一次）
    │   ├── sanitize.ts            # 数据清洗（防脏数据/旧版本数据）
    │   └── index.ts               # 工厂入口：自动按运行环境选择仓库
    ├── hooks/             # useTasks / useRecords / useTheme / useDismiss
    ├── utils/             # 日期时间 / quickParse（中文魔法输入）/ 统计 / 备份 / 任务通知
    ├── components/        # Sidebar / TopBar / MobileNav / QuickAdd / TaskItem
    │   │                  #  TimeRangePicker / CategoryPicker / RecordEditModal
    │   │                  #  ShortcutHelp / 日历 / 弹窗等
    └── views/             # DayView（今天）/ ImportantView（重要事项）
                           #  GanttView（时间甘特图·日/周）/ UpcomingView（即将到来）
                           #  RecordsView（记事）
```

## ☁️ 未来切换云数据库

数据层已抽象为 `TaskRepository` 接口（`getAll / create / update / delete / importAll`），
界面层不接触任何存储细节，目前有 localStorage（网页）与 Electron 文件（桌面）两个实现。接入云端时：

1. 新增 `src/data/cloudRepository.ts`，实现 `TaskRepository` 接口（内部调用 HTTP API）；
2. 在 `src/data/index.ts` 的选择逻辑里加一个分支即可，界面代码**零改动**。

网页版与桌面版的数据可以用「导出备份 / 导入备份」互通迁移。
