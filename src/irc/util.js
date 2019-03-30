var config = require('../config');
var logger = require('winston');

exports.lookupChannel = function(chanName, channels) {
    return channels.filter(function(channel) {
        return channel.ircChan.toLowerCase() === chanName.toLowerCase();
    })[0];
};

exports.lookupChannel2 = function(chanName, user, channels) {
    if (user) {
        var channel = channels.filter(function(channel) {
            return channel.ircChan.toLowerCase() === user.toLowerCase();
        })[0];
        if (channel) {
            return channel;
        }
    }
    return channels.filter(function(channel) {
        return channel.ircChan.toLowerCase() === chanName.toLowerCase();
    })[0];
};

exports.parseMsg = function(chanName, text, channels) {
    var channel = exports.lookupChannel(chanName, channels);
    if (!channel) {
        logger.error('channel ' + chanName + ' not found in config!');
        return;
    }

    text = text.trim();

    return {
        channel: channel,
        text: text
    };
};

exports.parseMsg2 = function(chanName, user, text, channels) {
    var channel = exports.lookupChannel2(chanName, user, channels);
    if (!channel) {
        logger.error('channel ' + chanName + ' not found in config!');
        return;
    }

    text = text.trim();

    return {
        channel: channel,
        text: text
    };
};

exports.topicFormat = function(channel, topic, user) {
    if (!topic) {
        return 'No topic for channel ' +
            (channel.chanAlias || channel.ircChan);
    }

    return 'Topic for channel ' + (channel.chanAlias || channel.ircChan) +
           ':\n | ' + topic.split(' | ').join('\n | ') +
           '\n * set by ' + user.split('!')[0];

};

exports.parseTopic = function(chanName, topic, user, channels) {
    var channel = exports.lookupChannel(chanName, channels);
    if (!channel) {
        return;
    }

    // ignore first topic event when joining channel and unchanged topics
    // (should handle rejoins)
    if (!channel.previousTopic || channel.previousTopic === topic) {
        channel.previousTopic = topic;
        return;
    }

    return {
        channel: channel,
        text: exports.topicFormat(channel, topic, user)
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

exports.checkIgnore = function(user, text) {
    if (config.ircIgnoreList) {
        if (config.ircIgnoreList.indexOf(user) > -1) {
            return true;
        }
    }

    if (config.ircRegexFilters) {
        return config.ircRegexFilters.reduce(function(acc, regex) {
            return acc || regex.test(text);
        }, false);
    }

    return false;
};
