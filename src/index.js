var logger = require('./log');
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
    var config = require('./config');

    logger.level = config.logLevel;

    var msgCallback = function(message) {
        switch (message.protocol) {
            case 'irc':
                tg.send(message);
                break;
            case 'tg':
                if (message.cmd === 'getNames') {
                    var names = irc.getNames(message.channel);
                    names.sort();
                    names = names.join(', ');

                    var channel = message.channel;
                    message.text = 'Users on ' + (channel.chanAlias || channel.ircChan) +
                        ':\n\n' + names;

                    return tg.send(message);
                } else {
                    irc.send(message);
                }
                break;
            default:
                logger.warn('unknown protocol: ' + message.protocol);
        }
    };

    var irc = require('./irc')(msgCallback);
    var tg = require('./tg')(msgCallback);
}
