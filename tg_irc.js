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
    tg.sendMessage({
        text: msg,
        chat_id: config.tg_chat_id
    });
};



//////////////////
//  IRC >>> TG  //
//////////////////

client.on('message', function(user, channel, message) {
    //console.log('IRC: ' + user + ': ' + message);
    var match = config.irc_hilight_re.exec(message);
    if (match || config.irc_relay_all) {
        if (match)
            message = match[1].trim();
        var tg_msg = '<' + user + '>: ' + message;
        console.log('  >> relaying to TG: ' + tg_msg);
        tg_send_msg(tg_msg);
    }
});



//////////////////
//  TG >>> IRC  //
//////////////////

tg.on('message', function(msg) {
    if (!msg.text) return;
    var text = '<' + msg.from.first_name + msg.from.last_name + '>: ' + msg.text;
    irc_send_msg(text);
});
