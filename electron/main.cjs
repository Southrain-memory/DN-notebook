// 《每日记事本》Electron 主进程
const { app, BrowserWindow, ipcMain, Menu, shell, Notification, Tray, dialog, nativeImage } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

// app.name 会成为 Linux 窗口类名（WM_CLASS），必须保持 ASCII 才能被任务栏/启动器
// 通过 .desktop 的 StartupWMClass 匹配（中文类名会匹配失败：图标退化、名称乱码）。
// 数据目录钉回原中文名，沿用已发布版本的数据位置，老用户数据不受影响。
// 测试/多开场景可用 DAILY_NOTEBOOK_USER_DATA 隔离数据目录（含单实例锁）。
app.setName('daily-notebook');
app.setPath('userData', process.env.DAILY_NOTEBOOK_USER_DATA ?? path.join(app.getPath('appData'), '每日记事本'));
// Windows 系统通知需要与安装包 appId 一致的 Application User Model ID
app.setAppUserModelId('com.dailynotebook.app');

// ── 数据持久化：用户数据目录下的 tasks.json ──
function dataFile() {
  return path.join(app.getPath('userData'), 'tasks.json');
}

function loadTasks() {
  try {
    return JSON.parse(fs.readFileSync(dataFile(), 'utf8'));
  } catch {
    return [];
  }
}

function saveTasks(tasks) {
  const file = dataFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(tasks, null, 2), 'utf8');
  return true;
}

ipcMain.handle('tasks:load', () => loadTasks());
ipcMain.handle('tasks:save', (_event, tasks) => saveTasks(tasks));
ipcMain.handle('app:version', () => app.getVersion());
ipcMain.handle('data:path', () => dataFile());

// ── 通用键值存储：记事 / 分类等附属数据，各自存为 {key}.json ──
ipcMain.handle('store:load', (_event, key) => {
  if (typeof key !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(key)) return null;
  try {
    return JSON.parse(fs.readFileSync(storeFileOf(key), 'utf8'));
  } catch {
    return null;
  }
});

ipcMain.handle('store:save', (_event, key, data) => {
  if (typeof key !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(key)) return false;
  const file = storeFileOf(key);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  return true;
});

// ── 窗口偏好（点 X 的行为）：主进程持久化，渲染层经 IPC 读写 ──
// closeAction: 'ask'（每次询问，默认）/ 'minimize'（直接最小化到托盘）/ 'quit'（直接退出）
function prefsFile() {
  return path.join(app.getPath('userData'), 'window-prefs.json');
}

function loadPrefs() {
  try {
    const prefs = JSON.parse(fs.readFileSync(prefsFile(), 'utf8'));
    return prefs && typeof prefs === 'object' ? prefs : {};
  } catch {
    return {};
  }
}

function savePrefs(patch) {
  const next = { ...loadPrefs(), ...patch };
  fs.mkdirSync(path.dirname(prefsFile()), { recursive: true });
  fs.writeFileSync(prefsFile(), JSON.stringify(next, null, 2), 'utf8');
  return next;
}

ipcMain.handle('prefs:load', () => loadPrefs());
ipcMain.handle('prefs:save', (_event, patch) => (patch && typeof patch === 'object' ? savePrefs(patch) : loadPrefs()));

// ── 更新检查：查 GitHub 最新 Release，有更新时通知渲染层在左下角显示徽标 ──
// 与 electron-updater 不同：同版本号重新发布（发布时间更晚）也会提示，配合用户「重发同版本」的习惯；
// 点击徽标跳转 Release 页并记录时间，之后同版本不再重复提示，直到又发布新的 Release。
const RELEASE_API = 'https://api.github.com/repos/Southrain-memory/DN-notebook/releases/latest';

function semverBigger(a, b) {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return true;
    if ((pa[i] || 0) < (pb[i] || 0)) return false;
  }
  return false;
}

function sendUpdateAvailable(win, info) {
  if (win && !win.isDestroyed()) win.webContents.send('updater:available', info);
}

async function checkForUpdate() {
  try {
    const res = await fetch(RELEASE_API, { headers: { 'User-Agent': 'daily-notebook' } });
    if (!res.ok) return;
    const rel = await res.json();
    if (!rel || rel.draft) return;
    const version = String(rel.tag_name || '').replace(/^v/i, '');
    if (!/^\d+\.\d+\.\d+$/.test(version)) return;
    const current = app.getVersion();
    const publishedAt = Date.parse(rel.published_at || '') || 0;
    const lastAck = Number(loadPrefs().lastAckReleaseAt) || 0;
    const isNewer = semverBigger(version, current);
    const republished = version === current && publishedAt > lastAck;
    if (isNewer || republished) {
      sendUpdateAvailable(BrowserWindow.getAllWindows()[0], {
        version,
        url: rel.html_url,
        publishedAt,
      });
    }
  } catch (err) {
    console.error('检查更新失败：', err?.message ?? err);
  }
}

ipcMain.handle('updater:check', () => {
  checkForUpdate();
  return true;
});
ipcMain.handle('updater:ack', (_event, publishedAt) => {
  savePrefs({ lastAckReleaseAt: Number(publishedAt) || Date.now() });
  return true;
});

function storeFileOf(key) {
  return path.join(app.getPath('userData'), `${key}.json`);
}

function iconPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'icon.png')
    : path.join(__dirname, '..', 'build', 'icon.png');
}

// ── 托盘：最小化到托盘时窗口不占任务栏，只保留状态栏图标 ──
let tray = null;
// 「彻底退出」放行 close 事件；点 X 一律拦截询问
let quitting = false;

function showMainWindow() {
  const win = BrowserWindow.getAllWindows()[0];
  if (!win) {
    createWindow();
    return;
  }
  if (win.isMinimized()) win.restore();
  win.setSkipTaskbar(false);
  win.show();
  win.focus();
  // macOS：从托盘恢复时 Dock 图标一并恢复
  if (process.platform === 'darwin' && app.dock) app.dock.show();
}

function hideToTray() {
  const win = BrowserWindow.getAllWindows()[0];
  if (!win) return;
  // macOS：隐藏到托盘时从 Dock 移除，只留菜单栏图标（对应 Linux/Windows 的任务栏隐藏）
  if (process.platform === 'darwin' && app.dock) app.dock.hide();
  win.setSkipTaskbar(true);
  win.hide();
}

function createTray() {
  const img = nativeImage.createFromPath(iconPath()).resize({ width: 24, height: 24 });
  tray = new Tray(img);
  tray.setToolTip('每日记事本');
  // Linux(AppIndicator) 不触发 click 事件，左键即弹此菜单，恢复入口在菜单里
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: '显示主界面', click: showMainWindow },
      { type: 'separator' },
      {
        label: '彻底退出',
        click: () => {
          quitting = true;
          app.quit();
        },
      },
    ]),
  );
  // Windows 左键单击托盘图标直接恢复窗口
  if (process.platform === 'win32') tray.on('click', showMainWindow);
}

ipcMain.handle('notify:show', (_event, payload) => {
  if (!payload || typeof payload.title !== 'string' || typeof payload.body !== 'string') return false;
  if (!Notification.isSupported()) return false;
  const n = new Notification({
    title: payload.title.slice(0, 80),
    body: payload.body.slice(0, 200),
    icon: iconPath(),
    silent: false,
  });
  n.on('click', showMainWindow);
  n.show();
  return true;
});

// ── 窗口 ──
function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 420,
    minHeight: 560,
    title: '每日记事本',
    backgroundColor: '#f5f5f4',
    autoHideMenuBar: true,
    // Linux 下任务栏/启动器依赖窗口自带图标，缺失会退化为系统兜底图标；
    // 打包后从 asar 外的 resources 读，避免 asar 内路径解析失败
    icon: app.isPackaged
      ? path.join(process.resourcesPath, 'icon.png')
      : path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 外部链接交给系统浏览器
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // 点 X：按记住的偏好直接执行，否则询问（可勾选"以后不再显示"记住选择）
  win.on('close', (event) => {
    if (quitting) return;
    const action = loadPrefs().closeAction;
    if (action === 'minimize') {
      event.preventDefault();
      hideToTray();
      return;
    }
    if (action === 'quit') {
      quitting = true;
      app.quit();
      return;
    }
    event.preventDefault();
    dialog
      .showMessageBox(win, {
        type: 'question',
        title: '关闭窗口',
        message: '要最小化到托盘还是彻底退出？',
        detail: '最小化后会隐藏到系统托盘（任务栏不显示图标），任务提醒照常工作。',
        buttons: ['最小化到托盘', '彻底退出', '取消'],
        defaultId: 0,
        cancelId: 2,
        noLink: true,
        checkboxLabel: '以后不再显示此询问',
      })
      .then(({ response, checkboxChecked }) => {
        if (response === 0) {
          if (checkboxChecked) savePrefs({ closeAction: 'minimize' });
          hideToTray();
        } else if (response === 1) {
          if (checkboxChecked) savePrefs({ closeAction: 'quit' });
          quitting = true;
          app.quit();
        }
      });
  });

  if (DEV_SERVER_URL) {
    win.loadURL(DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
  return win;
}

// ── 菜单：检查更新 / 数据文件位置 ──
function buildMenu() {
  const template = [
    {
      label: '应用',
      submenu: [
        {
          label: '检查更新…',
          click: () => {
            checkForUpdate();
          },
        },
        {
          label: '打开数据文件夹',
          click: () => shell.openPath(app.getPath('userData')),
        },
        { type: 'separator' },
        { role: 'quit', label: '退出' },
      ],
    },
    { role: 'editMenu', label: '编辑' },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '实际大小' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { role: 'togglefullscreen', label: '全屏' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// 单实例：已运行时（含最小化到托盘）再点启动器，唤起现有窗口而不是开新进程
const gotSingleLock = app.requestSingleInstanceLock();
if (!gotSingleLock) {
  app.quit();
} else {
  app.on('second-instance', showMainWindow);

  app.whenReady().then(() => {
    buildMenu();
    createWindow();
    createTray();

    // 启动与每 30 分钟检查一次 GitHub 新版本（有更新时渲染层左下角显示徽标）
    checkForUpdate();
    setInterval(checkForUpdate, 30 * 60 * 1000);

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('window-all-closed', () => {
  // 托盘模式下窗口只是隐藏不销毁；走到这里说明是彻底退出
  app.quit();
});
