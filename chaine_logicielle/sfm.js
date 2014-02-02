var spawn = require('child_process').spawn,
    ls    = spawn('cmd', ['/s', '/c', '"C:\\VisualSFM_windows_64bit\\VisualSFM.exe sfm+pmvs C:\\VisualSFM_windows_64bit\\lion res.nvm"'], { 
  windowsVerbatimArguments: true
});

ls.stdout.on('data', function (data) {
  console.log('stdout: ' + data);
});

ls.stderr.on('data', function (data) {
  console.log('stderr:  '+ data);
});

ls.on('error', function (code) {
  console.log('error ' + code);
});

ls.on('close', function (code) {
  console.log('child process exited with code ' + code);
});


