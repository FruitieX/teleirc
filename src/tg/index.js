var Telegram = require('node-telegram-bot-api');
var config = require('../config');
var tgUtil = require('./util');
var logger = require('winston');

var myUser = {};
var seenNames = [];

var init = function(msgCallback) {
    // start HTTP server for media files if configured to do so
    if (config.showMedia) {
        tgUtil.initHttpServer();
    }

    var tg = new Telegram(config.tgToken, {polling: true});

    // read stored group chat ID numbers
    tgUtil.readChatIds(config.channels);

    // get our own Telegram user
    tg.getMe().then(function(me) {
        myUser = me;

        tg.on('message', function(msg) {
            logger.debug('got tg msg:', msg);

            // track usernames for creating mentions
            if (seenNames.indexOf(msg.from.username) == -1) {
                seenNames.push(msg.from.username);
            }

            tgUtil.parseMsg(msg, myUser, tg, function(message) {
                if (message) {
                    message.protocol = 'tg';
                    msgCallback(message);
                }
            });
        });
    });

    return {
        send: function(message) {
            if (!message.channel.tgChatId) {
                var err = 'No chat_id set! Add me to a Telegram group ' +
                          'and say hi so I can find your group\'s chat_id!';

                msgCallback({
                    protocol: 'tg',
                    channel: message.channel,
                    text: err
                });

                logger.error(err);
                return;
            }

            seenNames.forEach(function(name) {
                var rx = new RegExp('\\b' + name + '\\b', 'i');
                message.text = message.text.replace(rx, '@' + name);
            });

            if (message.user) {
                message.text = '<' + message.user + '> ' + message.text;
            }

            logger.verbose('>> relaying to TG:', message.text);
            tg.sendMessage(message.channel.tgChatId, message.text);
        }
    };
};

module.exports = init;
