// 《每日记事本》Electron 主进程
const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

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

function storeFileOf(key) {
  return path.join(app.getPath('userData'), `${key}.json`);
}

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
            if (!app.isPackaged) return;
            const { autoUpdater } = require('electron-updater');
            autoUpdater.checkForUpdatesAndNotify().catch((err) => {
              console.error('检查更新失败：', err);
            });
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

app.whenReady().then(() => {
  app.setName('每日记事本');
  buildMenu();
  createWindow();

  // 打包后启动时自动检查更新（静默，发现新版本会弹系统通知）
  if (app.isPackaged) {
    try {
      const { autoUpdater } = require('electron-updater');
      autoUpdater.checkForUpdatesAndNotify().catch((err) => {
        console.error('自动更新检查失败：', err?.message ?? err);
      });
    } catch (err) {
      console.error('更新组件不可用：', err);
    }
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
