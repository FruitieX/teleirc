var argv = require('./arguments').argv;
var git = require('git-rev-sync');
var pjson = require('../package.json');

if (argv.version) {
    process.chdir(__dirname);
    var shorthash = git.short();

    var version = 'teleirc ';
    if (shorthash) {
        version += 'git-' + shorthash + ' (on branch: ' + git.branch() + '), ';
    }

    version += 'npm-' + pjson.version;

    console.log(version);
} else {
    var config = require('./config')();

    var msgCallback = function(message) {
        switch (message.protocol) {
            case 'irc':
                tg.send(message);
                break;
            case 'tg':
                irc.send(message);
                break;
            default:
                console.error('unknown protocol: ' + message.protocol);
        }
    };

    var irc = require('./irc')(msgCallback);
    var tg = require('./tg')(msgCallback);
}
