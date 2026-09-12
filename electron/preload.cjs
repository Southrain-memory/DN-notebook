// 预加载脚本：以安全方式（contextIsolation）向渲染进程暴露最小 API
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  /** 读取任务数据（用户数据目录 tasks.json） */
  loadTasks: () => ipcRenderer.invoke('tasks:load'),
  /** 保存全部任务 */
  saveTasks: (tasks) => ipcRenderer.invoke('tasks:save', tasks),
  /** 应用版本号 */
  appVersion: () => ipcRenderer.invoke('app:version'),
  /** 数据文件所在路径（用于展示） */
  dataPath: () => ipcRenderer.invoke('data:path'),
  /** 读取用户数据目录下 {key}.json（记事/分类等附属数据） */
  storeLoad: (key) => ipcRenderer.invoke('store:load', key),
  /** 写入用户数据目录下 {key}.json */
  storeSave: (key, data) => ipcRenderer.invoke('store:save', key, data),
  /** 弹出系统通知（点击后聚焦主窗口） */
  showNotification: (payload) => ipcRenderer.invoke('notify:show', payload),
  /** 读取窗口偏好（点 X 的行为等） */
  prefsLoad: () => ipcRenderer.invoke('prefs:load'),
  /** 写入窗口偏好 */
  prefsSave: (patch) => ipcRenderer.invoke('prefs:save', patch),
});
