var NodeIrc = require('irc');
var config = require('../config');
var ircUtil = require('./util');
var logger = require('winston');
var _ = require('lodash');

var shouldRelayEvent = function(event) {
    if (_.isArray(config.relayIRCEvents)) {
        // Using the new array format
        if (config.relayIRCEvents.includes(event)) {
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
    config.ircOptions.channels = ircUtil.getChannels(config.channels);

    var nodeIrc = new NodeIrc.Client(config.ircServer, config.ircNick, config.ircOptions);
    nodeIrc.on('error', function(error) {
        logger.error('unhandled IRC error:', error);
    });

    nodeIrc.on('registered', function() {
        // IRC perform on connect
        config.ircPerformCmds.forEach(function(cmd) {
            nodeIrc.send.apply(null, cmd.split(' '));
        });
    });

    nodeIrc.on('message', function(user, chanName, text) {
        if (!shouldRelayEvent('message')) {
            return;
        }

        var message = ircUtil.parseMsg(chanName, text);

        if (message) {
            var channel = ircUtil.lookupChannel(chanName, config.channels);
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

    nodeIrc.on('notice', function(user, chanName, text) {
        if (!shouldRelayEvent('notice')) {
            return;
        }

        var notice = ircUtil.parseMsg(chanName, text);

        if (notice) {
            var channel = ircUtil.lookupChannel(chanName, config.channels);
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

    nodeIrc.on('action', function(user, chanName, text) {
        if (!shouldRelayEvent('action')) {
            return;
        }

        var message = ircUtil.parseMsg(chanName, text);

        if (message) {
            msgCallback({
                protocol: 'irc',
                type: 'action',
                channel: message.channel,
                user: null,
                text: '*' + user + ': ' + message.text + '*'
            });
        }
    });

    nodeIrc.on('topic', function(chanName, topic, user) {
        if (!shouldRelayEvent('topic')) {
            return;
        }

        var message = ircUtil.parseTopic(chanName, topic, user);

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

    nodeIrc.on('join', function(chanName, user, text) {
        if (!shouldRelayEvent('join')) {
            return;
        }

        var channel = ircUtil.lookupChannel(chanName, config.channels);
        msgCallback({
            protocol: 'irc',
            type: 'join',
            channel: channel,
            user: null,
            text: user + ' has joined'
        });
    });

    nodeIrc.on('part', function(chanName, user, text) {
        if (!shouldRelayEvent('part')) {
            return;
        }

        var channel = ircUtil.lookupChannel(chanName, config.channels);
        msgCallback({
            protocol: 'irc',
            type: 'part',
            channel: channel,
            user: null,
            text: user + ' has left'
        });
    });

    nodeIrc.on('kick', function(chanName, user, by, reason) {
        if (!shouldRelayEvent('kick')) {
            return;
        }

        var channel = ircUtil.lookupChannel(chanName, config.channels);
        msgCallback({
            protocol: 'irc',
            type: 'part',
            channel: channel,
            user: null,
            text: user + ' was kicked by ' + by + ' (' + reason + ')',
        });
    });

    nodeIrc.on('quit', function(user, text, channels, message) {
        if (!shouldRelayEvent('quit')) {
            return;
        }

        for (var i = 0; i < channels.length; i++) {
            var reason = '';
            if (text) {
                reason = ' (' + text + ')';
            }

            var channel = ircUtil.lookupChannel(channels[i], config.channels);
            msgCallback({
                protocol: 'irc',
                type: 'quit',
                channel: channel,
                user: null,
                text: user + ' has quit' + reason
            });
        }
    });

    return {
        send: function(message, raw) {
            if (!raw) {
                // strip empty lines
                message.text = message.text.replace(/^\s*\n/gm, '');

                // replace newlines
                message.text = message.text.replace(/\n/g, config.replaceNewlines);

                // TODO: replace here any remaining newlines with username
                // (this can happen if user configured replaceNewlines to itself
                // contain newlines)
            }

            logger.verbose('<< relaying to IRC:', message.text);
            nodeIrc.say(message.channel.ircChan, message.text);
        },
        getNames: function(channel) {
            return ircUtil.getNames(nodeIrc.chans[channel.ircChan.toLowerCase()]);
        },
        getTopic: function(channel) {
            var topic = ircUtil.getTopic(nodeIrc.chans[channel.ircChan.toLowerCase()]);
            return ircUtil.topicFormat(channel, topic.text, topic.topicBy);
        }
    };
};

module.exports = init;
