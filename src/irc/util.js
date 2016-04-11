var config = require('../config')();

exports.lookupChannel = function(chanName, channels) {
    return channels.filter(function(channel) {
        return channel.ircChan === chanName;
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
        return;
    }

    var match = config.hlRegexp.exec(text);
    if (match || config.ircRelayAll) {
        if (match) {
            text = match[1].trim();
        }

        return {
            channel: channel,
            text: text
        };
    }
};

exports.parseTopic = function(chanName, topic, user) {
    var channel = ircUtil.lookupChannel(chanName, config.channels);
    if (!channel) {
        return;
    }

    // ignore first topic event when joining channel
    // (doesn't handle rejoins yet)
    if (!config.sendTopic || !channel.firstTopicRcvd) {
        channel.firstTopicRcvd = true;
        return;
    }

    var text = '* Topic for channel ' + (channel.chanAlias || channel.ircChan) +
           ':\n' + topic +
           '\n* set by ' + user.split('!')[0];

    return {
        channel: channel,
        text: text
    };
};

// returns list of names from given channel
// NOTE: parameter must be the channel object from nodeIrc internal
// channel list
exports.getNames = function(channel) {
    if (!channel) {
        return;
    }

    var names = Object.keys(channel.users);

    names.forEach(function(name, i) {
        names[i] = channel.users[name] + names[i];
    });

    return names;
};
