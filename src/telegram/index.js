var tgApi = require('node-telegram-bot-api');
var config = require('../config');
var tgUtil = require('./util');
var logger = require('winston');

import _ from 'lodash';

export default class Telegram {
  constructor(moduleConfig, rooms, broadcastToGroup) {
    this.rooms = rooms;
    this.broadcastToGroup = broadcastToGroup;

    // Maps room name -> chat ID
    this.chatIds = {};

    this.client = new tgApi(moduleConfig.token, _.omit(moduleConfig, 'token'));
    this.client.on('message', ::this.handleMessage);
  }

  // Sends message to Telegram
  sendMsg(msg, target) {
    if (!this.chatIds[target]) {
      console.error(`I haven't learned the chat ID of '${target}' yet!`);
      console.error(`Invite me to '${target}' and greet me in the room so I can learn the chat ID!`);
      return;
    }

    const text = (msg.nick ? `<${msg.nick}> ` : '') + msg.text;

    this.client.sendMessage(this.chatIds[target], text);
  }

  // Handle message from Telegram
  handleMessage(e) {
    const msg = {
      nick: e.from.username || `${e.from.first_name} ${e.from.last_name}`,
      room: e.chat.title,
      text: e.text,
      date: e.date
    };

    if (!this.rooms.includes(msg.room)) {
      return console.error(`Ignoring message to unknown target/channel ${msg.room}`);
    }

    this.chatIds[e.chat.title] = e.chat.id;

    this.broadcastToGroup(msg);
  }
}
/*
var myUser = {};

var init = function(msgCallback) {
    // start HTTP server for media files if configured to do so
    if (config.showMedia) {
        tgUtil.initHttpServer();
    }

    var tg = new Telegram(config.tgToken, {polling: true});

    // get our own Telegram user
    tg.getMe().then(function(me) {
        myUser = me;

        tg.on('message', function(msg) {
            logger.debug('got tg msg:', msg);

            tgUtil.parseMsg(msg, myUser, tg, function(message) {
                if (message) {
                    var tgGroupReadOnly = message.channel.tgGroupReadOnly;
                    var isOverrideReadonly = message.channel.tgGroupOverrideReadOnly;
                    var isBotHighlighted = false;

                    isBotHighlighted = msg.text && msg.text.startsWith('@' + myUser.username);

                    if (tgGroupReadOnly) {
                        if (!(isOverrideReadonly && isBotHighlighted)) {
                            return;
                        }
                    }

                    message.protocol = 'tg';
                    msgCallback(message);
                }
            });
        });
    });

    return {
        send: function(message) {
            // if no chatId has been read for the chat yet, try reading it from disk
            if (!message.channel.tgChatId) {
                message.channel.tgChatId = tgUtil.readChatId(message.channel);
            }

            // if still no chatId, return with error message
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

            if (message.user) {
                message.text = '<' + message.user + '> ' + message.text;
            }

            logger.verbose('>> relaying to TG:', message.text);
            tg.sendMessage(message.channel.tgChatId, message.text);
        }
    };
};

module.exports = init;
*/
