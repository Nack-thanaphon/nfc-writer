const { ipcRenderer } = require('electron');

// DOM Elements
const readTab = document.getElementById('readTab');
const writeTab = document.getElementById('writeTab');
const formatTab = document.getElementById('formatTab');

const readPanel = document.getElementById('readPanel');
const writePanel = document.getElementById('writePanel');
const formatPanel = document.getElementById('formatPanel');

const readButton = document.getElementById('readButton');
const writeButton = document.getElementById('writeButton');
const formatButton = document.getElementById('formatButton');
const clearButton = document.getElementById('clearButton');

const dataInput = document.getElementById('dataInput');
const isUrlCheckbox = document.getElementById('isUrl');
const logArea = document.getElementById('logArea');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const cardUid = document.getElementById('cardUid');
const cardContent = document.getElementById('cardContent');

// Variables
let activeReader = false;
let currentUid = null;
let waiting = false;

// Utility functions
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    document.body.removeChild(toast);
  }, 3500);
}

function updateCardContent(uid, data = []) {
  currentUid = uid;
  cardUid.textContent = `UID: ${uid}`;

  cardContent.innerHTML = '';

  const uidElement = document.createElement('div');
  uidElement.className = 'card-uid';
  uidElement.textContent = uid;
  cardContent.appendChild(uidElement);

  if (data.length > 0) {
    const dataContainer = document.createElement('div');
    dataContainer.className = 'card-data';

    data.forEach((item) => {
      const [key, value] = item.split(':', 2);

      const dataItem = document.createElement('div');
      dataItem.className = 'data-item';

      const label = document.createElement('div');
      label.className = 'data-label';
      label.textContent = key.trim();

      const dataValue = document.createElement('div');
      dataValue.className = 'data-value';
      dataValue.textContent = value ? value.trim() : '';

      dataItem.appendChild(label);
      dataItem.appendChild(dataValue);
      dataContainer.appendChild(dataItem);
    });

    cardContent.appendChild(dataContainer);
  } else {
    const emptyData = document.createElement('div');
    emptyData.textContent = 'ไม่พบข้อมูลในการ์ด';
    emptyData.style.color = 'var(--text-secondary)';
    emptyData.style.marginTop = '10px';
    cardContent.appendChild(emptyData);
  }
}

function resetCardContent() {
  currentUid = null;
  cardUid.textContent = '';

  cardContent.innerHTML = `
    <div class="card-placeholder">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6zm0 4h8v2H6zm10 0h2v2h-2zm-6-4h8v2h-8z"/>
      </svg>
      <p>วางการ์ด NFC บนเครื่องอ่านเพื่อดูข้อมูล</p>
    </div>
  `;
}

function switchTab(tab) {
  readTab.classList.remove('active');
  writeTab.classList.remove('active');
  formatTab.classList.remove('active');

  readPanel.style.display = 'none';
  writePanel.style.display = 'none';
  formatPanel.style.display = 'none';

  switch (tab) {
    case 'read':
      readTab.classList.add('active');
      readPanel.style.display = 'block';
      break;
    case 'write':
      writeTab.classList.add('active');
      writePanel.style.display = 'block';
      break;
    case 'format':
      formatTab.classList.add('active');
      formatPanel.style.display = 'block';
      break;
  }
}

function logMessage(message) {
  const timestamp = new Date().toLocaleTimeString();
  logArea.value += `[${timestamp}] ${message}\n`;
  logArea.scrollTop = logArea.scrollHeight;
}

function updateReaderStatus(connected, name) {
  activeReader = connected;

  if (connected) {
    statusIndicator.classList.remove('status-offline');
    statusIndicator.classList.add('status-online');
    statusText.textContent = `เชื่อมต่อแล้ว: ${name || 'เครื่องอ่าน NFC'}`;
  } else {
    statusIndicator.classList.remove('status-online');
    statusIndicator.classList.add('status-offline');
    statusText.textContent = 'ไม่พบเครื่องอ่าน';
    resetCardContent();
  }
}

// Event Listeners
readTab.addEventListener('click', () => switchTab('read'));
writeTab.addEventListener('click', () => switchTab('write'));
formatTab.addEventListener('click', () => switchTab('format'));

readButton.addEventListener('click', () => {
  logMessage('รอการอ่านการ์ด...');
  waiting = true;
});

writeButton.addEventListener('click', async () => {
  const dataToWrite = dataInput.value.trim();
  if (!dataToWrite) {
    showToast('ใส่ข้อมูลต้องการ', 'error');
    return;
  }

  logMessage(`ข้อมูล: "${dataToWrite}"`);
  waiting = true;

  try {
    await nfcManager.writeCard(dataToWrite);
    showToast('ข้อมูลสำเร็จ', 'success');
  } catch (err) {
    logMessage(`ข้อมูลไม่สำเร็จ: ${err.message}`);
    showToast(`ข้อมูลไม่สำเร็จ: ${err.message}`, 'error');
  } finally {
    waiting = false;
  }
});

formatButton.addEventListener('click', () => {
  if (confirm('แน่ใจไม่ว่าต้องการฟอร์แมตการ์ด? ข้อมูลจะถูกลบ')) {
    logMessage('รอการฟอร์แมตการ์ด...');
    waiting = true;
  }
});

clearButton.addEventListener('click', () => {
  logArea.value = '';
});

// Listen for NFC events
ipcRenderer.on('reader-attached', (event, readerName) => {
  updateReaderStatus(true, readerName);
});

ipcRenderer.on('reader-removed', () => {
  updateReaderStatus(false);
});

ipcRenderer.on('card-detected', (event, card) => {
  updateCardContent(card.uid);
});

ipcRenderer.on('reader-error', (event, error) => {
  logMessage(`Reader error: ${error}`);
});

ipcRenderer.on('nfc-error', (event, error) => {
  logMessage(`NFC error: ${error}`);
});

ipcRenderer.on('nfc-init-error', (event, error) => {
  logMessage(`NFC initialization error: ${error}`);
});

ipcRenderer.on('card-data', (event, cardInfo) => {
  logMessage(`Card UID: ${cardInfo.uid}`);
  logMessage(`Card Data: ${cardInfo.data}`);
});

// Initial setup
resetCardContent();
switchTab('read');
logMessage('เริ่มต้นแอปพเค NFC Card Manager');
