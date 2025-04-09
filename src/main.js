const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const NFCManager = require('./nfc');

let mainWindow = null;
let nfc = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(async () => {
  createWindow();

  try {
    nfc = new NFCManager();
  } catch (err) {
    console.error('Failed to initialize NFC:', err);
    if (mainWindow) {
      mainWindow.webContents.send('nfc-init-error', err.message);
    }
  }

  nfc.setLogCallback((message) => {
    if (mainWindow) {
      mainWindow.webContents.send('log-message', message);
    }
  });

  nfc.cardCallback = (data) => {
    if (mainWindow) {
      if (data.type === 'reader-attached') {
        mainWindow.webContents.send('reader-attached', data.readerName);
      } else {
        mainWindow.webContents.send('card-data', data);
      }
    }
  };
});

app.on('window-all-closed', () => {
  // if (nfc) {
  //   nfc.close();
  // }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

module.exports = { nfc };