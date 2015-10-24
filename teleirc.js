#!/usr/bin/env node

var fs = require('fs');
var nodeirc = require('irc');
var Telegram = require('telegram-bot');
var parseConfig = require('./parseConfig');

/////////////////////////
//  Config and helpers //
/////////////////////////

var config = parseConfig();

// channel option lookup
var lookup = function(type, channel, arr) {
    return arr.filter(function(obj) {
        return obj[type] === channel;
    })[0];
};

// generates channel list for ircOptions
var getChannels = function(arr) {
    var result = [];

    for (var i = 0; i < arr.length; i++) {
        var channel = arr[i].chanPwd ?
                      arr[i].ircChan + ' ' + arr[i].chanPwd :
                      arr[i].ircChan;
        result.push(channel);
    }

    return result;
};

// tries to read chat ids from a file
var readChatIds = function(arr) {
    console.log('\n');
    console.log('NOTE!');
    console.log('=====');

    var idMissing = false;
    try {
        var json = JSON.parse(fs.readFileSync(process.env.HOME + '/.teleirc/chat_ids'));
        for (var i = 0; i < arr.length; i++) {
            var key = arr[i].tgGroup;
            if (key in json) {
                arr[i].tgChatId = json[key];
                console.log('id found for:', key, ':', json[key]);
            } else {
                console.log('id not found:', key);
                idMissing = true;
            }
        }
    } catch (e) {
        console.log('~/.teleirc/chat_ids file not found!');
        idMissing = true;
    }

    if (idMissing) {
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
        if (config.channels[i].tgChatId) {
            json[config.channels[i].tgGroup] = config.channels[i].tgChatId;
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

config.ircOptions.channels = getChannels(config.channels);
readChatIds(config.channels);

//////////////////
//  IRC Client  //
//////////////////

var irc = new nodeirc.Client(config.ircServer, config.ircNick, config.ircOptions);

irc.on('error', function(error) {
    console.log('error: ', error);
});

var ircSendMsg = function(ircChan, msg) {
    console.log('  >> relaying to IRC: ' + msg);
    irc.say(ircChan, msg);
};

//////////////////
//  TG bot API  //
//////////////////

var tg = new Telegram(config.tgToken);
tg.start();

var tgSendMsg = function(conf, msg) {
    console.log('  >> relaying to TG: ' + msg);

    if (!conf.tgChatId) {
        var err = 'Error: No chat_id set! Add me to a Telegram group ' +
                  'and say hi so I can find your chat_id!';
        ircSendMsg(conf.ircChan, err);
        console.log(err);
        return;
    }

    tg.sendMessage({
        text: msg,
        chat_id: conf.tgChatId
    });
};

//////////////////
//  IRC >>> TG  //
//////////////////
irc.on('message', function(user, channel, message) {
    var conf = lookup('ircChan', channel, config.channels);
    if (!conf) {
        return;
    }

    var match = config.hlRegexp.exec(message);
    if (match || config.ircRelayAll) {
        if (match) {
            message = match[1].trim();
        }
        var text = '<' + user + '>: ' + message;
        tgSendMsg(conf, text);
    }
});

irc.on('action', function(user, channel, message) {
    var conf = lookup('ircChan', channel, config.channels);
    if (!conf) {
        return;
    }

    var match = config.hlRegexp.exec(message);
    if (match || config.ircRelayAll) {
        if (match) {
            message = match[1].trim();
        }
        var text = '*' + user + ': ' + message + '*';
        tgSendMsg(conf, text);
    }
});

irc.on('topic', function(channel, topic, nick) {
    var conf = lookup('ircChan', channel, config.channels);
    if (!conf) {
        return;
    }

    // ignore first topic event when joining channel
    // (doesn't handle rejoins yet)
    if (!conf.sendTopic) {
        conf.sendTopic = true;
        return;
    }

    var text = '* Topic for channel ' + conf.chanAlias || conf.ircChan +
               ':\n' + topic.split(' | ').join('\n') +
               '\n* set by ' + nick.split('!')[0];
    tgSendMsg(conf, text);
});

//////////////////
//  TG >>> IRC  //
//////////////////

tg.on('message', function(msg) {
    var conf = lookup('tgGroup', msg.chat.title, config.channels);
    if (!conf) {
        return;
    }

    if (!conf.tgChatId) {
        console.log('storing chat ID: ' + msg.chat.id);
        conf.tgChatId = msg.chat.id;
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

    ircSendMsg(conf.ircChan, '<' + user + '>: ' + text);
});
