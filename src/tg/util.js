var config = require('../config');
var nickcolor = require('./nickcolor');
var nodeStatic = require('node-static');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var crypto = require('crypto');
var logger = require('winston');

exports.readChatIds = function(arr) {
    logger.verbose('NOTE!');
    logger.verbose('=====');

    var idMissing = false;
    try {
        var json = JSON.parse(fs.readFileSync(process.env.HOME + '/.teleirc/chat_ids'));
        for (var i = 0; i < arr.length; i++) {
            var key = arr[i].tgGroup;
            if (key in json) {
                arr[i].tgChatId = json[key];
                logger.info('id found for:', key, ':', json[key]);
            } else {
                logger.warn('id not found:', key);
                idMissing = true;
            }
        }
    } catch (e) {
        logger.warn('~/.teleirc/chat_ids file not found!');
        idMissing = true;
    }

    if (idMissing) {
        logger.warn('Please add your Telegram bot to a Telegram group and have');
        logger.warn('someone send a message to that group.');
        logger.warn('teleirc will then automatically store your group chat_id.');
    }
};

exports.writeChatIds = function(config) {
    var json = {};
    for (var i = 0; i < config.channels.length; i++) {
        if (config.channels[i].tgChatId) {
            json[config.channels[i].tgGroup] = config.channels[i].tgChatId;
        }
    }
    json = JSON.stringify(json);
    logger.debug('writing to chat_ids file...');
    try {
        fs.writeFileSync(process.env.HOME + '/.teleirc/chat_ids', json);
        logger.info('successfully stored chat ID in ~/.teleirc/chat_ids');
    } catch (e) {
        logger.error('error while storing chat ID:', e);
    }
};

exports.getName = function(user, config) {
    var name = config.nameFormat;

    if (user.username) {
        name = name.replace('%username%', user.username, 'g');
    } else {
        // if user lacks username, use fallback format string instead
        name = name.replace('%username%', config.usernameFallbackFormat, 'g');
    }

    name = name.replace('%firstName%', user.first_name || '', 'g');
    name = name.replace('%lastName%', user.last_name || '', 'g');

    // get rid of leading and trailing whitespace
    name = name.replace(/(^\s*)|(\s*$)/g, '');

    if (config.nickcolor) {
        return nickcolor(name);
    }

    return name;
};

exports.getIRCName = function(msg, config) {
    var ircNickMatchRE = /^<(.*)>/;
    var results = ircNickMatchRE.exec(msg.text);
    var name;
    if (!results) {
        // Fall back to telegram name (i.e. for the topic change message)
        name = exports.getName(msg.from, config);
    } else {
        name = results[1];
    }

    return name;
};

exports.randomValueBase64 = function(len) {
    return crypto.randomBytes(Math.ceil(len * 3 / 4))
        .toString('base64')
        .slice(0, len)
        .replace(/\+/g, '0')
        .replace(/\//g, '0');
};

exports.serveFile = function(fileId, config, tg, callback) {
    var randomString = exports.randomValueBase64(config.mediaRandomLength);
    mkdirp(process.env.HOME + '/.teleirc/files/' + randomString);
    tg.downloadFile(fileId, process.env.HOME + '/.teleirc/files/' + randomString)
    .then(function(filePath) {
        callback(config.httpLocation + '/' + randomString + '/' + path.basename(filePath));
    });
};

exports.initHttpServer = function() {
    var fileServer = new nodeStatic.Server(process.env.HOME + '/.teleirc/files');
    mkdirp(process.env.HOME + '/.teleirc/files');

    require('http').createServer(function(req, res) {
        req.addListener('end', function() {
            fileServer.serve(req, res);
        }).resume();
    }).listen(config.httpPort);
};

exports.parseMsg = function(msg, myUser, tg, callback) {
    // TODO: Telegram code should not have to deal with IRC channels at all

    var channel = config.channels.filter(function(channel) {
        return channel.tgGroup === msg.chat.title;
    })[0];

    if (!channel) {
        logger.verbose('Telegram group not found in config: "' +
                    msg.chat.title + '", dropping message...');
        return callback();
    }

    // check if message contains a migrate command
    if (msg.migrate_to_chat_id) {
        logger.info('chat migrated to supergroup.');
        channel.tgChatId = msg.migrate_to_chat_id;
        exports.writeChatIds(config);
        logger.info('stored new chatId');
        return callback();
    } else if (!channel.tgChatId) {
        logger.info('storing chat ID: ' + msg.chat.id);
        channel.tgChatId = msg.chat.id;
        exports.writeChatIds(config);
    }

    var age = Math.floor(Date.now() / 1000) - msg.date;
    if (config.maxMsgAge && age > config.maxMsgAge) {
        logger.warn('skipping ' + age + ' seconds old message! ' +
            'NOTE: change this behaviour with config.maxMsgAge, also check your system clock');
        return callback();
    }

    // TODO: fix /names command
    /*
    if (msg.text && !msg.text.indexOf('/names')) {
        var names = sendTo.ircNames(channel);
        names.sort();
        names = 'Users on ' + (channel.chanAlias || channel.ircChan) + ':\n\n' +
            names.join(', ');

        return tg.sendMessage(channel.tgChatId, names);
    }
    */

    // skip posts containing media if it's configured off
    if ((msg.audio || msg.document || msg.photo || msg.sticker || msg.video ||
                msg.voice || msg.contact || msg.location) && !config.showMedia) {
        return callback();
    }

    var text;
    var prefix = '';
    if (!config.soloUse) {
        prefix = '<' + exports.getName(msg.from, config) + '> ';
    }
    if (msg.reply_to_message && msg.text) {
        var replyName;
        if (msg.reply_to_message.from.username == myUser.username) {
            replyName = exports.getIRCName(msg.reply_to_message, config);
        } else {
            replyName = exports.getName(msg.reply_to_message.from, config);
        }

        text = msg.text.replace(/\n/g , prefix);
        callback({
            channel: channel,
            text: prefix + '@' + replyName + ', ' + text
        });
    } else if (msg.audio) {
        exports.serveFile(msg.audio.file_id, config, tg, function(url) {
            callback({
                channel: channel,
                text: prefix + '(Audio, ' + msg.audio.duration + 's)' + url
            });
        });
    } else if (msg.document) {
        exports.serveFile(msg.document.file_id, config, tg, function(url) {
            callback({
                channel: channel,
                text: prefix + '(Document) ' + url
            });
        });
    } else if (msg.photo) {
        // pick the highest quality photo
        var photo = msg.photo[msg.photo.length - 1];

        exports.serveFile(photo.file_id, config, tg, function(url) {
            callback({
                channel: channel,
                text: prefix + '(Photo, ' + photo.width + 'x' + photo.height + ') ' +
                    url + (msg.caption ? ' ' + msg.caption : '')
            });
        });
    } else if (msg.new_chat_photo) {
        // pick the highest quality photo
        var chatPhoto = msg.new_chat_photo[msg.new_chat_photo.length - 1];

        exports.serveFile(chatPhoto.file_id, config, tg, function(url) {
            callback({
                channel: channel,
                text: prefix + '(New chat photo, ' +
                        chatPhoto.width + 'x' + chatPhoto.height + ') ' + url
            });
        });
    } else if (msg.sticker) {
        exports.serveFile(msg.sticker.file_id, config, tg, function(url) {
            callback({
                channel: channel,
                text: prefix + '(Sticker, ' +
                        msg.sticker.width + 'x' + msg.sticker.height + ') ' + url
            });
        });
    } else if (msg.video) {
        exports.serveFile(msg.video.file_id, config, tg, function(url) {
            callback({
                channel: channel,
                text: prefix + '(Video, ' + msg.video.duration + 's)' +
                    url + (msg.caption ? ' ' + msg.caption : '')
            });
        });
    } else if (msg.voice) {
        exports.serveFile(msg.voice.file_id, config, tg, function(url) {
            callback({
                channel: channel,
                text: prefix + '(Voice, ' + msg.voice.duration + 's)' + url
            });
        });
    } else if (msg.contact) {
        callback({
            channel: channel,
            text: prefix + '(Contact, ' + '"' + msg.contact.first_name + ' ' +
                    msg.contact.last_name + '", ' +
                    msg.contact.phone_number + ')'
        });
    } else if (msg.location) {
        callback({
            channel: channel,
            text: prefix + '(Location, ' + 'lon: ' + msg.location.longitude +
                    ', lat: ' + msg.location.latitude + ')'
        });
    } else if (msg.new_chat_participant) {
        callback({
            channel: channel,
            text: exports.getName(msg.new_chat_participant, config) +
                ' was added by: ' + exports.getName(msg.from, config)
        });
    } else if (msg.left_chat_participant) {
        callback({
            channel: channel,
            text: exports.getName(msg.left_chat_participant, config) +
                ' was removed by: ' + exports.getName(msg.from, config)
        });
    } else if (msg.text) {
        text = msg.text.replace(/\n/g , '\n' + prefix);

        callback({
            channel: channel,
            text: prefix + text
        });
    } else {
        logger.warn('WARNING: unhandled message:', msg);
        callback();
    }
};
