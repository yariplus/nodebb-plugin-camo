
var camo = require("child_process").spawn('node', [__dirname + '/node_modules/camo/server'], { silent: true, env: process.env });

camo.stdout.on('data', process.stdout.write);
camo.stderr.on('data', process.stderr.write);

process.on('SIGHUP', killWorker);
process.on('disconnect', killWorker);

function killWorker() {
  camo.kill('SIGHUP');
}
