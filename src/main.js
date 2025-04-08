const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const { NFC } = require('nfc-pcsc');
const path = require('path');

let mainWindow = null;
let nfc = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  
  // Uncomment เล่อ้ DevTools
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();
  
  try {
    nfc = new NFC();
    
    nfc.on('reader', reader => {
      console.log(`${reader.reader.name} device attached`);
      
      reader.on('card', async card => {
        console.log(`Card detected`, card);
        
        if (card.type === 'TAG_ISO_14443_3') {
          try {
            let uriParts = [];
            // อ่านข้อมูลจาก blocks 3่เก็บ URI (blocks 6-11 จากข้อมูล3่เห็น)
            for(let block = 6; block <= 11; block++) {
              const data = await reader.read(block, 4);
              uriParts.push(data.toString('ascii'));
            }
            
            // รวม URI
            const fullUri = uriParts.join('').replace(/[^\x20-\x7E]/g, '');
            console.log('Found URI:', fullUri);

            if (mainWindow) {
              mainWindow.webContents.send('card-uri', {
                uid: card.uid,
                uri: fullUri
              });
            }
            
          } catch (err) {
            console.error('Error reading URI from card:', err);
            if (mainWindow) {
              mainWindow.webContents.send('reader-error', err.message);
            }
          }
        }
      });

      reader.on('error', err => {
        console.log(`Reader error`, err);
        if (mainWindow) {
          mainWindow.webContents.send('reader-error', err.message);
        }
      });

      reader.on('end', () => {
        console.log(`Reader removed`);
        if (mainWindow) {
          mainWindow.webContents.send('reader-removed');
        }
      });
    });

    nfc.on('error', err => {
      console.log(`NFC error`, err);
      if (mainWindow) {
        mainWindow.webContents.send('nfc-error', err.message);
      }
    });

  } catch (err) {
    console.error('Failed to initialize NFC:', err);
    if (mainWindow) {
      mainWindow.webContents.send('nfc-init-error', err.message);
    }
  }
});

app.on('window-all-closed', () => {
  if (nfc) {
    nfc.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle IPC messages from renderer
ipcMain.on('read-card', () => {
  console.log('Read card requested');
  // Add read card logic here
});

ipcMain.on('write-card', (event, data) => {
  console.log('Write card requested with data:', data);
  // Add write card logic here
});

ipcMain.on('format-card', () => {
  console.log('Format card requested');
  // Add format card logic here
});
