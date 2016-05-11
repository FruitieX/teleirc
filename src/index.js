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
                var channel = message.channel;

                if (message.cmd === 'getNames') {
                    var names = irc.getNames(channel);

                    if (!names) {
                        logger.error('No nicklist received!');
                    }

                    names.sort();
                    names = names.join(', ');

                    message.text = 'Users on ' + (channel.chanAlias || channel.ircChan) +
                        ':\n\n' + names;

                    return tg.send(message);
                } else if (message.cmd === 'getTopic') {
                    var topic = irc.getTopic(channel);

                    if (topic) {
                        message.text = 'Topic for channel ' +
                            (channel.chanAlias || channel.ircChan) +
                            ': "' + topic.text + '" set by ' + topic.topicBy;
                    } else {
                        message.text = 'No topic for channel ' +
                            (channel.chanAlias || channel.ircChan);
                    }

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
