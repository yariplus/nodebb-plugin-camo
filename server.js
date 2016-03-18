var options = {silent: true, env: {
  'CAMO_KEY': process.env.CAMO_KEY || 'banana',
  'PORT': process.env.PORT || '8082'
}};

var camo = require("child_process").spawn('node', [__dirname + '/node_modules/camo/server'], options);

camo.stdout.on('data', process.stdout.write);
camo.stderr.on('data', function(){});

process.on('SIGHUP', killWorker);
process.on('disconnect', killWorker);

function killWorker() {
  camo.kill('SIGHUP');
}
