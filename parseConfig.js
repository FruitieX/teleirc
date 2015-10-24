var _ = require('lodash');

var warnDeprecated = function(old, new) {
    console.warn('WARNING: detected usage of deprecated config option "' + old + '", ' +
                 'support for it will be dropped in a future version! Consider ' +
                 'migrating to the new "' + new + '" option instead.');
};

// support old config options for a few versions, but warn about their usage
var parseDeprecatedOptions = function(config) {

    // check the contents of the channels array for old options
    _.forEach(config.channels, function(channel) {
        _.forEach(channel, function(value, key) {
            if (key === 'irc_channel') {
                config.channels[channel].chanAlias = value;
                warnDeprecated(key, 'chanAlias');
                return;
            }
            if (key === 'irc_channel_id') {
                config.channels[channel].ircChan = value;
                warnDeprecated(key, 'ircChan');
                return;
            }
            if (key === 'irc_channel_pwd') {
                config.channels[channel].chanPwd = value;
                warnDeprecated(key, 'chanPwd');
                return;
            }
            if (key === 'tg_chat') {
                config.channels[channel].tgGroup = value;
                warnDeprecated(key, 'tgGroup');
                return;
            }
        });
    });

    // search for old config options
    _.forEach(config, function(value, option) {
        if (option === 'tg_bot_token') {
            config.tgToken = value;
            warnDeprecated(option, 'tgToken');
            return;
        }
        if (option === 'irc_nick') {
            config.ircNick = value;
            warnDeprecated(option, 'ircNick');
            return;
        }
        if (option === 'irc_server') {
            config.ircServer = value;
            warnDeprecated(option, 'ircServer');
            return;
        }
        if (option === 'irc_options') {
            config.ircOptions = value;
            warnDeprecated(option, 'ircOptions');
            return;
        }
        if (option === 'irc_relay_all') {
            config.ircRelayAll = value;
            warnDeprecated(option, 'ircRelayAll');
            return;
        }
        if (option === 'irc_hilight_re') {
            config.hlRegexp = value;
            warnDeprecated(option, 'hlRegexp');
            return;
        }
    });

    return config;
};

module.exports = function() {
    var config = require(process.env.HOME + '/.teleirc/config.js');

    config = parseDeprecatedOptions(config);

    return config;
};
