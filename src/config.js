var _ = require('lodash');
var fs = require('fs');
var mkdirp = require('mkdirp');
var defaultConfig = require('./config.defaults');
var argv = require('./arguments').argv;
var logger = require('winston');

var warnDeprecated = function(oldOpt, newOpt) {
    logger.warn('detected usage of deprecated config option "' + oldOpt + '", ' +
                 'support for it will be dropped in a future version! Consider ' +
                 'migrating to the new "' + newOpt + '" option instead.');
};

// support old config options for a few versions, but warn about their usage
var parseDeprecatedOptions = function(config) {

    // check the contents of the channels array for old options
    _.forEach(config.channels, function(channel, i) {
        _.forEach(channel, function(value, key) {
            if (key === 'irc_channel') {
                config.channels[i].chanAlias = value;
                warnDeprecated(key, 'chanAlias');
                return;
            }
            if (key === 'irc_channel_id') {
                config.channels[i].ircChan = value;
                warnDeprecated(key, 'ircChan');
                return;
            }
            if (key === 'irc_channel_pwd') {
                config.channels[i].chanPwd = value;
                warnDeprecated(key, 'chanPwd');
                return;
            }
            if (key === 'tg_chat') {
                config.channels[i].tgGroup = value;
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
        if (option === 'send_topic') {
            config.sendTopic = value;
            warnDeprecated(option, 'sendTopic');
            return;
        }
        if (option === 'mediaRandomLenght') {
            config.mediaRandomLength = value;
            warnDeprecated(option, 'mediaRandomLength');
            return;
        }
    });

    return config;
};

if (argv.g) {
    mkdirp(process.env.HOME + '/.teleirc');

    // read default config using readFile to include comments
    var config = fs.readFileSync(__dirname + '/config.defaults.js');
    var configPath = argv.c || (process.env.HOME + '/.teleirc/config.js');
    fs.writeFileSync(configPath, config);
    console.log('Wrote default configuration to ' + configPath +
                ', please edit it before re-running');
    process.exit(0);
} else if (argv.j) {
    require('./join-tg');
    process.exit(0);
}

var config;

var configPath = argv.c || (process.env.HOME + '/.teleirc/config.js');
try {
    logger.info('using config file from: ' + configPath);
    config = require(configPath);
} catch (e) {
    logger.error('ERROR while reading config:\n' + e + '\n\nPlease make sure ' +
                  'it exists and is valid. Run "teleirc --genconfig" to ' +
                  'generate a default config.');
    process.exit(1);
}

config = parseDeprecatedOptions(config);
config = _.defaults(config, defaultConfig);

if (argv.v) {
    // TODO: right now this is our only verbose option
    config.ircOptions.debug = true;
}

module.exports = config;
