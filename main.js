const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// 禁用 GPU 硬件加速（如遇崩溃问题可保留）
app.disableHardwareAcceleration();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  mainWindow.loadFile('index.html');
  
  // 开发时打开 DevTools（调试用，完成后可注释掉）
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ---------- IPC 处理：窗口控制 ----------
ipcMain.on('window-move', (event, deltaX, deltaY) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    const [x, y] = win.getPosition();
    win.setPosition(x + deltaX, y + deltaY);
  }
});

ipcMain.on('window-close', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.close();
});

ipcMain.on('window-fullscreen', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    win.setFullScreen(!win.isFullScreen());
  }
});

// ---------- IPC 处理：数据读写 ----------
const dataFileName = 'attendance_data.json';

function getDataPath() {
  // 使用用户数据目录存储数据文件
  return path.join(app.getPath('userData'), dataFileName);
}

// 读取数据（可带日期过滤）
ipcMain.handle('read-data', async (event, date) => {
  const filePath = getDataPath();
  try {
    const data = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      : { records: [] };

    if (date) {
      // 如果传入了日期，只返回该日期的记录
      return data.records.filter(r => r.date === date);
    }
    return data.records;
  } catch (err) {
    console.error('读取数据失败', err);
    return [];
  }
});

// 添加记录（使用本地日期时间）
ipcMain.handle('add-record', async (event, recordType) => {
  const filePath = getDataPath();
  try {
    const now = new Date();
    // 本地日期 YYYY-MM-DD
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    // 本地时间 HH:MM:SS
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const record = {
      id: now.getTime() / 1000,          // 秒级时间戳
      type: recordType,
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}:${seconds}`,
      timestamp: now.getTime() / 1000,
    };

    let data = { records: [] };
    if (fs.existsSync(filePath)) {
      data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    data.records.push(record);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return record;
  } catch (err) {
    console.error('添加记录失败', err);
    throw err;
  }
});