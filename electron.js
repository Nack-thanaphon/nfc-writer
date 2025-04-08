const { spawn } = require('child_process');
const electron = require('electron');

const proc = spawn(electron, ['.'], {
  stdio: 'inherit'
});

proc.on('close', (code) => {
  process.exit(code);
});
