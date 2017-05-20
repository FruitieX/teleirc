var logger = require('./log');
var argv = require('./arguments').argv;
var git = require('git-rev-sync');
var pjson = require('../package.json');

require('string.prototype.startswith');

var getVersionStr = function() {
    process.chdir(__dirname);

    var shorthash;
    try {
        shorthash = git.short();
    } catch (e) {
        shorthash = null;
    }

    var version = 'teleirc ';
    if (shorthash) {
        version += 'git-' + shorthash + ' (on branch: ' + git.branch() + '), ';
    }

    version += 'npm-' + pjson.version;

    return version;
};

if (argv.version) {
    console.log(getVersionStr());
} else {
    var config = require('./config');

    logger.level = config.logLevel;

    var msgCallback = function(message) {
        switch (message.protocol) {
            case 'irc':
                tg.send(message);
                break;
            case 'tg':
                var channel = message.channel;

                if (message.cmd === 'getNames') {
                    return irc.getNames(channel);
                } else if (message.cmd === 'getTopic') {
                    return irc.getTopic(channel);
                } else if (message.cmd === 'getVersion') {
                    message.text = 'Version: ' +
                        getVersionStr();

                    return tg.send(message);
                } else if (message.cmd === 'sendCommand') {
                    if (!config.allowCommands) {
                        message.text = 'Commands are disabled.';
                        return tg.send(message);
                    }

                    if (!message.text) {
                        message.text = 'Usage example: /command !foobar';
                        return tg.send(message);
                    } else {
                        var command = message.text;

                        // prepend with line containing original message
                        message.text = message.origText + '\n' + message.text;
                        irc.send(message, true);

                        message.text = 'Command "' + command + '" executed.';
                        return tg.send(message);
                    }
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
