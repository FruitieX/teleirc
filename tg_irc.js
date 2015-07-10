#!/usr/bin/env node


//////////////
//  Config  //
//////////////

var config = require(process.env.HOME + '/.tg_irc_config.js');



//////////////////
//  IRC Client  //
//////////////////

var irc = require('irc');
var client = new irc.Client(config.irc_server, config.irc_nick, config.irc_options);

client.on('error', function(error) {
    console.log('error: ', error);
});

var irc_send_msg = function(msg) {
    console.log('  >> relaying to IRC: ' + msg);
    client.say(config.irc_channel_id, msg);
};



//////////////////
//  TG bot API  //
//////////////////

var telegram = require('telegram-bot');
var tg = new telegram(config.tg_bot_token);
tg.start();

var tg_send_msg = function(msg) {
    console.log('  >> relaying to TG: ' + msg);
    tg.sendMessage({
        text: msg,
        chat_id: config.tg_chat_id
    });
};



//////////////////
//  IRC >>> TG  //
//////////////////

client.on('message', function(user, channel, message) {
    if (config.irc_channel_id !== channel)
        return;
    //console.log('IRC: ' + user + ': ' + message);
    var match = config.irc_hilight_re.exec(message);
    if (match || config.irc_relay_all) {
        if (match)
            message = match[1].trim();
        var tg_msg = '<' + user + '>: ' + message;
        tg_send_msg(tg_msg);
    }
});

// ignore first topic event when joining channel
var first_topic_event = true;
client.on('topic', function(channel, topic, nick)
{
    if (first_topic_event) {
        first_topic_event = false;
        return;
    }
    if (config.irc_channel_id !== channel)
        return;
    var tg_msg  = '* Topic for channel ' + config.irc_channel.split(' ')[0]
                + ':\n' + topic.split(' | ').join('\n')
                + '\n* set by ' + nick.split('!')[0];
    tg_send_msg(tg_msg);
});



//////////////////
//  TG >>> IRC  //
//////////////////

tg.on('message', function(msg) {
    if (config.tg_chat !== msg.chat.title)
        return;
    console.log('chat_id: ' + msg.chat.id);
    config.tg_chat_id = msg.chat.id;
    if (!msg.text)
        return;
    var user    = msg.from.first_name ? msg.from.first_name : ''
                + msg.from.last_name ? msg.from.last_name : '';
    var text = '<' + user + '>: ' + msg.text;
    irc_send_msg(text);
});
