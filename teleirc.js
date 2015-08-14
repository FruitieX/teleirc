#!/usr/bin/env node

var fs = require('fs');
var nodeirc = require('irc');
var telegram = require('telegram-bot');

// configs
var config = require(process.env.HOME + '/.teleirc_config.js');

var tg_chat_id = null;
if (!tg_chat_id) {
    // try to read tg_chat_id from disk, otherwise get it from first conversation
    try {
        tg_chat_id = fs.readFileSync(process.env.HOME + '/.teleirc_chat_id');
        console.log('Using chat_id: ' + tg_chat_id);
    } catch(e) {
        console.log('\n');
        console.log('NOTE!');
        console.log('=====');
        console.log('~/.teleirc_chat_id file not found!');
        console.log('Please add your Telegram bot to a Telegram group and have');
        console.log('someone send a message to that group.');
        console.log('teleirc will then automatically store your group chat_id.\n\n');
    }
}

//////////////////
//  IRC Client  //
//////////////////

var irc = new nodeirc.Client(config.irc_server, config.irc_nick, config.irc_options);

irc.on('error', function(error) {
    console.log('error: ', error);
});

var irc_send_msg = function(msg) {
    console.log('  >> relaying to IRC: ' + msg);
    irc.say(config.irc_channel, msg);
};

irc.on('message', function(user, channel, message) {
    // is this from the correct channel?
    if (config.irc_channel.toLowerCase() !== channel.toLowerCase()) {
        return;
    }

    var match = config.irc_hilight_re.exec(message);
    if (match || config.irc_relay_all) {
        if (match) {
            message = match[1].trim();
        }
        var text = '<' + user + '>: ' + message;
        tg_send_msg(text);
    }
});

// ignore first topic event when joining channel
var first_topic_event = true;
irc.on('topic', function(channel, topic, nick) {
    // is this from the correct channel?
    if (config.irc_channel.toLowerCase() !== channel.toLowerCase()) {
        return;
    }

    if (first_topic_event) {
        first_topic_event = false;
        return;
    }

    var text  = '* Topic for channel ' + config.irc_channel.split(' ')[0]
                + ':\n' + topic.split(' | ').join('\n')
                + '\n* set by ' + nick.split('!')[0];
    tg_send_msg(text);
});

//////////////////
//  TG bot API  //
//////////////////

var tg = new telegram(config.tg_bot_token);
tg.start();

var tg_send_msg = function(msg) {
    console.log('  >> relaying to TG: ' + msg);

    if (!tg_chat_id) {
        var err = 'Error: No chat_id set! Add me to a Telegram group ' +
                  'and say hi so I can find your chat_id!';
        irc_send_msg(err);
        console.log(err);
        return;
    }

    tg.sendMessage({
        text: msg,
        chat_id: parseInt(tg_chat_id)
    });
};

tg.on('message', function(msg) {
    if (config.tg_chat !== msg.chat.title) {
        return;
    }

    if (!tg_chat_id) {
        tg_chat_id = msg.chat.id;

        console.log('storing chat ID: ' + msg.chat.id);
        fs.writeFile(process.env.HOME + '/.teleirc_chat_id', msg.chat.id, function(err) {
            if (err) {
                console.log('error while storing chat ID:');
                console.log(err);
            } else {
                console.log('successfully stored chat ID in ~/.teleirc_chat_id');
            }
        });
    }

    if (!msg.text) {
        return;
    }

    var user = msg.from.first_name ? msg.from.first_name : ''
             + msg.from.last_name ? msg.from.last_name : '';
    var text = '<' + user + '>: ' + msg.text;
    irc_send_msg(text);
});
