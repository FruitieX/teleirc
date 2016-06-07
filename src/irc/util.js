var config = require('../config');
var logger = require('winston');

exports.lookupChannel = function(chanName, channels) {
    return channels.filter(function(channel) {
        return channel.ircChan.toLowerCase() === chanName.toLowerCase();
    })[0];
};

// generates channel list for ircOptions
exports.getChannels = function(arr) {
    var result = [];

    for (var i = 0; i < arr.length; i++) {
        var chanName = arr[i].chanPwd ?
                       arr[i].ircChan + ' ' + arr[i].chanPwd :
                       arr[i].ircChan;
        result.push(chanName);
    }

    return result;
};

exports.parseMsg = function(chanName, text) {
    var channel = exports.lookupChannel(chanName, config.channels);
    if (!channel) {
        logger.error('channel ' + chanName + ' not found in config!');
        return;
    }

    var match = config.hlRegexp.exec(text);
    if (match || config.ircRelayAll) {
        if (match && config.hlOnlyShowMatch) {
            text = match[1];
        }

        text = text.trim();

        return {
            channel: channel,
            text: text
        };
    }
};

exports.parseTopic = function(chanName, topic, user) {
    var channel = exports.lookupChannel(chanName, config.channels);
    if (!channel) {
        return;
    }

    // ignore first topic event when joining channel
    // (doesn't handle rejoins yet)
    if (!config.sendTopic || !channel.firstTopicRcvd) {
        channel.firstTopicRcvd = true;
        return;
    }

    var text = 'Topic for channel ' + (channel.chanAlias || channel.ircChan) +
           ': "' + topic +
           '" set by ' + user.split('!')[0];

    return {
        channel: channel,
        text: text
    };
};

// returns list of names from given channel
exports.getNames = function(nodeIrcChannel) {
    if (!nodeIrcChannel) {
        return;
    }

    // nodeIrcChannel.users is a node-irc internal object containing
    // {nickname: prefix} key-value pairs
    var names = Object.keys(nodeIrcChannel.users);

    names.forEach(function(name, i) {
        var prefix = nodeIrcChannel.users[name];

        if (prefix) {
            names[i] = '(' + prefix + ')' + names[i];
        }
    });

    return names;
};

// returns topic for given channel
exports.getTopic = function(nodeIrcChannel) {
    if (!nodeIrcChannel || !nodeIrcChannel.topic) {
        return;
    }

    return {
        text: nodeIrcChannel.topic,
        topicBy: nodeIrcChannel.topicBy
    };
};
