var NodeIrc = require('irc');
var config = require('../config');
var ircUtil = require('./util');
var logger = require('winston');

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
        var message = ircUtil.parseMsg(chanName, text);
        logger.debug('got irc msg:', message);

        if (message) {
            msgCallback({
                protocol: 'irc',
                channel: message.channel,
                user: user,
                text: message.text
            });
        }
    });

    nodeIrc.on('action', function(user, chanName, text) {
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
        var message = ircUtil.parseTopic(chanName, topic, user);

        msgCallback({
            protocol: 'irc',
            type: 'topic',
            channel: message.channel,
            user: null,
            text: message.text
        });
    });

    return {
        send: function(message) {
            logger.verbose('<< relaying to IRC:', message.text);
            nodeIrc.say(message.channel.ircChan, message.text);
        },
        names: function(channel) {
            return ircUtil.getNames(nodeIrc.chans[channel.ircChan]);
        }
    };
};

module.exports = init;
