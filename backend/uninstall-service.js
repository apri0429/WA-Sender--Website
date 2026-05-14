const Service = require('node-windows').Service;
const path = require('path');

const svc = new Service({
  name: 'WA-Sender Backend',
  script: path.join(__dirname, 'server.js')
});

svc.on('uninstall', () => {
  console.log('Service berhasil dihapus!');
});

svc.on('error', (err) => {
  console.error('Error:', err);
});

svc.uninstall();
