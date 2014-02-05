var spawn = require('child_process').spawn,
    ls    = spawn('VisualSFM', ['sfm+pmvs',  'data/lion', 'data/res.nvm']);

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


