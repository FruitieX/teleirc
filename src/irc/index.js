var NodeIrc = require('irc-framework');
var config = require('../config');
var ircUtil = require('./util');
var logger = require('winston');
var _ = require('lodash');

var shouldRelayEvent = function(event) {
    if (_.isArray(config.relayIRCEvents)) {
        // Using the new array format
        if (config.relayIRCEvents.indexOf(event) !== -1) {
            return true;
        }

        return false;
    } else {
        // Using the old boolean format and warn

        logger.warn('config.sendTopic and config.sendNonMsg were merged into ' +
            'config.relayIRCEvents. You are either using one of them, or passing a boolean ' +
            '(true/false) to config.relayIRCEvents. Please migrate to config.relayIRCEvents, ' +
            'and pass an array of the desired IRC events to relay. See the default config for an ' +
            'example: ' +
            'https://github.com/FruitieX/teleirc/blob/develop/src/config.defaults.js '
        );

        return true;
    }
};

var init = function(msgCallback) {
    var servers = {};
    var channelLookup = {};
    var ircClients = {};

    config.channels.forEach((channel) => {
      var server = config.ircServer;
      if (channel.hasOwnProperty("ircServer"))
        server = channel.ircServer;

      if (!servers.hasOwnProperty(server))
        servers[server] = [];
      servers[server].push(channel);
      channelLookup[channel.ircChan] = server;
    });

    for (var server in servers) {
      ircClients[server] = newClient(msgCallback, servers[server], {
        ircServer: server
      });
    };

    return {
        send: function(message, multi) {
          ircClients[channelLookup[message.channel.ircChan]].send(message, multi);
        },
        getNames: function(channel) {
          ircClients[channelLookup[channel.ircChan]].getNames(channel);
        },
        getTopic: function(channel) {
          ircClients[channelLookup[channel.ircChan]].getTopic(channel);
        }
    };
}

var newClient = function(msgCallback, channels, conf) {
    var nodeIrc = new NodeIrc.Client();
    nodeIrc.connect({
        host: conf.ircServer,
        nick: config.ircNick,
        port: config.ircOptions.port,
        tls: config.ircOptions.secure,
        password: config.ircOptions.password,
        username: config.ircOptions.userName,
        gecos: config.ircOptions.realName,
    });

    nodeIrc.on('error', function(error) {
        logger.error('unhandled IRC error:', error);
    });

    nodeIrc.on('registered', function() {
        // IRC perform on connect
        config.ircPerformCmds.forEach(function(cmd) {
            nodeIrc.raw.apply(nodeIrc, cmd.split(' '));
        });
        channels.forEach(function(channel) {
            nodeIrc.join(channel.ircChan, channel.chanPwd);
        });
    });

    nodeIrc.on('privmsg', function(event) {
        if (!shouldRelayEvent('message')) {
            return;
        }

        var user = event.nick;
        var chanName = event.target;
        var text = event.message;
        if (ircUtil.checkIgnore(user, text)) {
            return;
        }

        var userName = '';
        if (chanName.toLowerCase() === nodeIrc.user.nick.toLowerCase()) {
            chanName = config.ircNick;
            userName = user;
        }

        var message = ircUtil.parseMsg2(chanName, userName, text, channels);

        if (message) {
            var channel = ircUtil.lookupChannel2(chanName, userName, channels);
            var ircChanReadOnly = channel.ircChanReadOnly;
            var isOverrideReadOnly = channel.ircChanOverrideReadOnly;
            var isBotHighlighted = config.hlRegexp.exec(message.text);
            var match = isBotHighlighted;

            if (match && config.hlOnlyShowMatch) {
                message.text = match[1];
            }

            if (ircChanReadOnly) {
                if (!(isOverrideReadOnly && isBotHighlighted)) {
                    return;
                }
            }

            logger.debug('got irc msg:', message);
            msgCallback({
                protocol: 'irc',
                channel: message.channel,
                user: user,
                text: message.text
            });
        }
    });

    nodeIrc.on('notice', function(event) {
        if (!shouldRelayEvent('notice')) {
            return;
        }

        var user = event.nick;
        var chanName = event.target;
        var text = event.message;
        if (ircUtil.checkIgnore(user, text)) {
            return;
        }

        var userName = '';
        if (chanName.toLowerCase() === nodeIrc.user.nick.toLowerCase()) {
            chanName = config.ircNick;
            userName = user;
        }

        var notice = ircUtil.parseMsg2(chanName, userName, text, channels);

        if (notice) {
            var channel = ircUtil.lookupChannel2(chanName, userName, channels);
            var ircChanReadOnly = channel.ircChanReadOnly;
            var isOverrideReadOnly = channel.ircChanOverrideReadOnly;
            var isBotHighlighted = config.hlRegexp.exec(notice.text);
            var match = isBotHighlighted;

            if (match && config.hlOnlyShowMatch) {
                notice.text = match[1];
            }

            if (ircChanReadOnly) {
                if (!(isOverrideReadOnly && isBotHighlighted)) {
                    return;
                }
            }

            logger.debug('got irc msg:', notice);
            msgCallback({
                protocol: 'irc',
                channel: notice.channel,
                user: user,
                text: notice.text
            });
        }
    });

    nodeIrc.on('action', function(event) {
        if (!shouldRelayEvent('action')) {
            return;
        }

        var user = event.nick;
        var chanName = event.target;
        var text = event.message;

        var userName = '';
        if (chanName.toLowerCase() === nodeIrc.user.nick.toLowerCase()) {
            chanName = config.ircNick;
            userName = user;
        }

        var message = ircUtil.parseMsg2(chanName, userName, text, channels);

        if (message) {
            var messageText = user + ': ' + message.text;
            if (config.emphasizeAction) {
                messageText = '* ' + messageText + ' *';
            }

            msgCallback({
                protocol: 'irc',
                type: 'action',
                channel: message.channel,
                user: null,
                text: messageText
            });
        }
    });

    nodeIrc.on('topic', function(event) {
        if (!shouldRelayEvent('topic')) {
            return;
        }

        var chanName = event.channel;
        var topic = event.topic;
        var user = event.nick || '';

        var message = ircUtil.parseTopic(chanName, topic, user, channels);

        if (message) {
            msgCallback({
                protocol: 'irc',
                type: 'topic',
                channel: message.channel,
                user: null,
                text: message.text
            });
        }
    });

    nodeIrc.on('join', function(event) {
        if (!shouldRelayEvent('join')) {
            return;
        }

        var chanName = event.channel;
        var user = event.nick;
        var text = '';

        var channel = ircUtil.lookupChannel(chanName, channels);
        msgCallback({
            protocol: 'irc',
            type: 'join',
            channel: channel,
            user: null,
            text: user + ' has joined'
        });
    });

    nodeIrc.on('part', function(event) {
        if (!shouldRelayEvent('part')) {
            return;
        }

        var chanName = event.channel;
        var user = event.nick;
        var text = '';

        var channel = ircUtil.lookupChannel(chanName, channels);
        msgCallback({
            protocol: 'irc',
            type: 'part',
            channel: channel,
            user: null,
            text: user + ' has left'
        });
    });

    nodeIrc.on('kick', function(event) {
        if (!shouldRelayEvent('kick')) {
            return;
        }

        var chanName = event.channel;
        var user = event.kicked;
        var by = event.nick;
        var reason = event.message;

        var channel = ircUtil.lookupChannel(chanName, channels);
        msgCallback({
            protocol: 'irc',
            type: 'part',
            channel: channel,
            user: null,
            text: user + ' was kicked by ' + by + ' (' + reason + ')',
        });
    });

    // new framework doesn't provide the channels....
    nodeIrc.on('quit', function(user, text, channels, message) {
        return;
    });

    nodeIrc.on('nick', function(event) {
        if (nodeIrc.user.nick === event.nick) {
            logger.debug('new nick:', event.new_nick);
            nodeIrc.user.nick = event.new_nick;
        }
    });

    // added since framework does not have async
    // method to return nicklist
    nodeIrc.on('wholist', function(event) {
        var channel = ircUtil.lookupChannel(event.target, channels);
        var users = event.users.reduce(function(usersStr, user) {
            if (usersStr === '') {
                return user.nick;
            }
            return usersStr + ', ' + user.nick;
        }, '');
        msgCallback({
            protocol: 'irc',
            channel: channel,
            user: '',
            text: 'Users in ' + event.target + ':\n\n' + users
        });
    });

    return {
        send: function(message, multi) {

            if (multi) {
                logger.verbose('<< relaying to IRC w/ multiple lines:', message.text);
                message.text.split('\n').forEach(function(msg) {
                    nodeIrc.say(message.channel.ircChan, msg);
                });
                return;
            }

            // strip empty lines
            message.text = message.text.replace(/^\s*\n/gm, '');

            // replace newlines
            message.text = message.text.replace(/\n/g, config.replaceNewlines);

            logger.verbose('<< relaying to IRC:', message.text);
            if (config.replaceNewlines.indexOf('\n') < 0) {
                logger.verbose('<< relaying to IRC:', message.text);
                nodeIrc.say(message.channel.ircChan, message.text);
            } else {
                var username = message.text.slice(0, message.text.indexOf('>') + 2);
                var rest = message.text.slice(message.text.indexOf('>') + 2);
                rest.split('\n').forEach(function(msg) {
                    nodeIrc.say(message.channel.ircChan, username + msg);
                });
            }
        },
        getNames: function(channel) {
            nodeIrc.who(channel.ircChan);
            return null;
        },
        getTopic: function(channel) {
            nodeIrc.raw('TOPIC ' + channel.ircChan);
            return null;
            //var topic = ircUtil.getTopic(nodeIrc.chans[channel.ircChan.toLowerCase()]);
            //return ircUtil.topicFormat(channel, topic.text, topic.topicBy);
        }
    };
};

module.exports = init;
