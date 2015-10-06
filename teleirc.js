#!/usr/bin/env node

var fs = require('fs');
var nodeirc = require('irc');
var Telegram = require('telegram-bot');

/////////////////////////
//  Config and helpers //
/////////////////////////

var config = require(process.env.HOME + '/.teleirc/config.js');

// channel option lookup
var lookup = function(type, channel, arr) {
    return arr.filter(function(obj) {
        return obj[type] === channel;
    })[0];
};

// generates channel list for irc_options
var getChannels = function(arr) {
    var result = [];
    for (var i = 0; i < arr.length; i++) {
        var channel = arr[i].irc_channel_pwd ?
            arr[i].irc_channel + ' ' + arr[i].irc_channel_pwd :
            arr[i].irc_channel;
        result.push(channel);
    }
    return result;
};

// tries to read chat ids from a file
var readChatIds = function(arr) {
    console.log('\n');
    console.log('NOTE!');
    console.log('=====');

    var id_missing = false;
    try {
        var json = JSON.parse(fs.readFileSync(process.env.HOME + '/.teleirc/chat_ids'));
        for (var i = 0; i < arr.length; i++) {
            var key = arr[i].tg_chat;
            if (key in json) {
                arr[i].tg_chat_id = json[key];
                console.log('id found for:', key, ':', json[key]);
            } else {
                console.log('id not found:', key);
                id_missing = true;
            }
        }
    } catch (e) {
        console.log('~/.teleirc/chat_ids file not found!');
        id_missing = true;
    }

    if (id_missing) {
        console.log(
            '\nPlease add your Telegram bot to a Telegram group and have' +
            '\nsomeone send a message to that group.' +
            '\nteleirc will then automatically store your group chat_id.');
    }

    console.log('\n');
};

var writeChatIds = function() {
    var json = {};
    for (var i = 0; i < config.channels.length; i++) {
        if (config.channels[i].tg_chat_id) {
            json[config.channels[i].tg_chat] = config.channels[i].tg_chat_id;
        }
    }
    json = JSON.stringify(json);
    fs.writeFile(process.env.HOME + '/.teleirc/chat_ids', json, function(err) {
        if (err) {
            console.log('error while storing chat ID:');
            console.log(err);
        } else {
            console.log('successfully stored chat ID in ~/.teleirc/chat_ids');
        }
    });
};

config.irc_options.channels = getChannels(config.channels);
readChatIds(config.channels);

//////////////////
//  IRC Client  //
//////////////////

var irc = new nodeirc.Client(config.irc_server, config.irc_nick, config.irc_options);

irc.on('error', function(error) {
    console.log('error: ', error);
});

var irc_send_msg = function(irc_channel_id, msg) {
    console.log('  >> relaying to IRC: ' + msg);
    irc.say(irc_channel_id, msg);
};

//////////////////
//  TG bot API  //
//////////////////

var tg = new Telegram(config.tg_bot_token);
tg.start();

var tg_send_msg = function(conf, msg) {
    console.log('  >> relaying to TG: ' + msg);

    if (!conf.tg_chat_id) {
        var err = 'Error: No chat_id set! Add me to a Telegram group ' +
                  'and say hi so I can find your chat_id!';
        irc_send_msg(conf.irc_channel_id, err);
        console.log(err);
        return;
    }

    tg.sendMessage({
        text: msg,
        chat_id: conf.tg_chat_id
    });
};

//////////////////
//  IRC >>> TG  //
//////////////////

irc.on('message', function(user, channel, message) {
    var conf = lookup('irc_channel_id', channel, config.channels);
    if (!conf) {
        return;
    }

    var match = config.irc_hilight_re.exec(message);
    if (match || config.irc_relay_all) {
        if (match) {
            message = match[1].trim();
        }
        var text = '<' + user + '>: ' + message;
        tg_send_msg(conf, text);
    }
});

irc.on('topic', function(channel, topic, nick) {
    var conf = lookup('irc_channel_id', channel, config.channels);
    if (!conf) {
        return;
    }

    // ignore first topic event when joining channel
    // (doesn't handle rejoins yet)
    if (!conf.send_topic) {
        conf.send_topic = true;
        return;
    }

    var text = '* Topic for channel ' + conf.irc_channel +
               ':\n' + topic.split(' | ').join('\n') +
               '\n* set by ' + nick.split('!')[0];
    tg_send_msg(conf, text);
});

//////////////////
//  TG >>> IRC  //
//////////////////

tg.on('message', function(msg) {
    var conf = lookup('tg_chat', msg.chat.title, config.channels);
    if (!conf) {
        return;
    }

    if (!conf.tg_chat_id) {
        console.log('storing chat ID: ' + msg.chat.id);
        conf.tg_chat_id = msg.chat.id;
        writeChatIds();
    }

    var user = msg.from.first_name ? msg.from.first_name : '' +
               msg.from.last_name ? msg.from.last_name : '';

    var text;

    if (msg.reply_to_message && msg.text) {
        text = '@' + msg.reply_to_message.from.username + ', ' + msg.text;
    } else if (msg.audio) {
        text = '(Audio)';
    } else if (msg.document) {
        text = '(Document)';
    } else if (msg.photo) {
        text = '(Image, ' + msg.photo.slice(-1)[0].width + 'x' +
                            msg.photo.slice(-1)[0].height + ')';
    } else if (msg.sticker) {
        text = '(Sticker)';
    } else if (msg.video) {
        text = '(Video, ' + msg.video.duration + 's)';
    } else if (msg.voice) {
        text = '(Voice, ' + msg.audio.duration + 's)';
    } else if (msg.contact) {
        text = '(Contact, ' + '"' + msg.contact.first_name + ' ' +
                                    msg.contact.last_name + '", ' +
                                    msg.contact.phone_number + ')';
    } else if (msg.location) {
        text = '(Location, lon: ' + msg.location.longitude +
                        ', lat: ' + msg.location.latitude + ')';
    } else {
        text = msg.text;
    }

    irc_send_msg(conf.irc_channel_id, '<' + user + '>: ' + text);
});
