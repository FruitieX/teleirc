var IRC = require('irc-framework');
var config = require('../config');
var ircUtil = require('./util');
var logger = require('winston');

export default class IrcModule {
  constructor(moduleConfig, rooms, broadcastToGroup) {
    this.moduleConfig = moduleConfig;
    this.rooms = rooms;
    this.broadcastToGroup = broadcastToGroup;

    const bot = new IRC.Client();
    this.bot = bot;
    bot.connect(moduleConfig.config);

    bot.on('message', (e) => {
      this.handleMessage(e);
    });

    bot.on('registered', () => {
      console.log('registered');
      this.channels = rooms.map((name) => {
        console.log('joining', name);
        const channel = bot.channel(name);

        channel.join();
        return channel;
      });
    });
  }

  // Sends message to IRC
  sendMsg(e) {
    if (!this.rooms.includes(e.room)) {
      return console.error(`Got message from unknown channel ${e.room}`);
    }

    const channel = this.channels.find((channel) => channel.name === e.room);
    if (!channel) {
      return console.error(`Channel ${e.room}`);
    }

    // strip empty lines
    e.message = message.replace(/^\s*\n/gm, '');

    // replace newlines
    e.message = message.replace(/\n/g, this.config.replaceNewlines);

    channel.say(`<${e.nick}> ${e.message}`);
  }

  // Handle message from IRC
  handleMessage(e) {
    if (!this.rooms.includes(e.target)) {
      return console.error(`Got message from unknown channel ${e.target}`);
    }

    e.room = e.target;
    this.broadcastToGroup(e);
  }
}

/*
var init = function(msgCallback) {
    //config.ircOptions.channels = ircUtil.getChannels(config.channels);

    bot.on('message', function(event) {
        if (event.message.indexOf('hello') === 0) {
              event.reply('Hi!');
        }

        if (event.message.match(/^!join /)) {
            var to_join = event.message.split(' ');
            event.reply('Joining ' + to_join + '..');
            bot.join(to_join);
        }
    });


    // Or a quicker to match messages...
    bot.matchMessage(/^hi/, function(event) {
        event.reply('hello there!');
    });

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
        if (config.sendNonMsg) {
            var channel = ircUtil.lookupChannel(chanName, config.channels);
            msgCallback({
                protocol: 'irc',
                type: 'join',
                channel: channel,
                user: null,
                text: user + ' has joined'
            });
        }
    });

    nodeIrc.on('part', function(chanName, user, text) {
        if (config.sendNonMsg) {
            var channel = ircUtil.lookupChannel(chanName, config.channels);
            msgCallback({
                protocol: 'irc',
                type: 'part',
                channel: channel,
                user: null,
                text: user + ' has left'
            });
        }
    });

    nodeIrc.on('quit', function(user, text, channels, message) {
        if (config.sendNonMsg) {
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
            return ircUtil.getNames(nodeIrc.chans[channel.ircChan]);
        },
        getTopic: function(channel) {
            return ircUtil.getTopic(nodeIrc.chans[channel.ircChan]);
        }
    };
};

module.exports = init;
*/
