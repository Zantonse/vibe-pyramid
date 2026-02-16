const command = process.argv[2];

if (command === 'setup') {
  await import('./setup.js');
} else if (command === 'uninstall') {
  await import('./uninstall.js');
} else {
  // Default: start the server
  await import('../server/index.js');
}
