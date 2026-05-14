const Service = require('node-windows').Service;
const path = require('path');

const svc = new Service({
  name: 'WA-Sender Backend',
  description: 'WhatsApp Sender Backend Service (Node.js)',
  script: path.join(__dirname, 'server.js'),
  nodeOptions: [],
  env: [
    { name: 'NODE_ENV', value: 'production' },
    { name: 'PORT', value: '8098' }
  ],
  // Restart otomatis jika crash
  wait: 2,
  grow: 0.5,
  maxRestarts: 5,
  abortOnError: false
});

svc.on('install', () => {
  console.log('Service berhasil diinstall!');
  svc.start();
  console.log('Service dimulai. Cek di services.msc -> "WA-Sender Backend"');
});

svc.on('alreadyinstalled', () => {
  console.log('Service sudah terinstall sebelumnya.');
});

svc.on('error', (err) => {
  console.error('Error:', err);
});

svc.install();
