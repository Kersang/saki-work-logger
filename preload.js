const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 窗口控制
  moveWindow: (deltaX, deltaY) => ipcRenderer.send('window-move', deltaX, deltaY),
  closeWindow: () => ipcRenderer.send('window-close'),
  fullscreenWindow: () => ipcRenderer.send('window-fullscreen'),

  // 数据操作
  getRecords: (date) => ipcRenderer.invoke('read-data', date),
  addRecord: (type) => ipcRenderer.invoke('add-record', type),
});