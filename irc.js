var Irc = require('irc');
var tg = require('./tg');

// channel option lookup
var lookup = function(type, channel, arr) {
    return arr.filter(function(obj) {
        return obj[type] === channel;
    })[0];
};

// generates channel list for ircOptions
var getChannels = function(arr) {
    var result = [];

    for (var i = 0; i < arr.length; i++) {
        var channel = arr[i].chanPwd ?
                      arr[i].ircChan + ' ' + arr[i].chanPwd :
                      arr[i].ircChan;
        result.push(channel);
    }

    return result;
};

module.exports = function(config, sendTo) {
    config.ircOptions.channels = getChannels(config.channels);

    var irc = new Irc.Client(config.ircServer, config.ircNick, config.ircOptions);

    irc.on('error', function(error) {
        console.error('IRC ERROR: ' + error);
    });
    irc.on('message', function(user, channel, message) {
        var conf = lookup('ircChan', channel, config.channels);
        if (!conf) {
            return;
        }

        var match = config.hlRegexp.exec(message);
        if (match || config.ircRelayAll) {
            if (match) {
                message = match[1].trim();
            }
            var text = '<' + user + '>: ' + message;
            sendTo.tg(conf, text);
        }
    });

    irc.on('action', function(user, channel, message) {
        var conf = lookup('ircChan', channel, config.channels);
        if (!conf) {
            return;
        }

        var match = config.hlRegexp.exec(message);
        if (match || config.ircRelayAll) {
            if (match) {
                message = match[1].trim();
            }
            var text = '*' + user + ': ' + message + '*';
            sendTo.tg(conf, text);
        }
    });

    irc.on('topic', function(channel, topic, nick) {
        var conf = lookup('ircChan', channel, config.channels);
        if (!conf) {
            return;
        }

        // ignore first topic event when joining channel
        // (doesn't handle rejoins yet)
        if (!conf.sendTopic) {
            conf.sendTopic = true;
            return;
        }

        var text = '* Topic for channel ' + conf.chanAlias || conf.ircChan +
                   ':\n' + topic.split(' | ').join('\n') +
                   '\n* set by ' + nick.split('!')[0];
        sendTo.tg(conf, text);
    });

    sendTo.irc = function(ircChan, msg) {
        console.log('  >> relaying to IRC: ' + msg);
        irc.say(ircChan, msg);
    };
};
