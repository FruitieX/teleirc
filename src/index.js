var logger = require('./log');
var argv = require('./arguments').argv;
var git = require('git-rev-sync');
var pjson = require('../package.json');

import IrcModule from './irc';

const loadedModules = {
  irc: IrcModule
};

require('string.prototype.startswith');

var getVersionStr = function() {
  process.chdir(__dirname);

  var shorthash;
  try {
    shorthash = git.short();
  } catch (e) {
    shorthash = null;
  }

  var version = 'teleirc ';
  if (shorthash) {
    version += 'git-' + shorthash + ' (on branch: ' + git.branch() + '), ';
  }

  version += 'npm-' + pjson.version;

  return version;
};

if (argv.version) {
  console.log(getVersionStr());
} else {
  var config = require('./config');

  logger.level = config.logLevel;

  var msgCallback = function(message) {
    switch (message.protocol) {
      case 'irc':
        //tg.send(message);
        break;
      case 'tg':
        var channel = message.channel;

        if (message.cmd === 'getNames') {
          var names = irc.getNames(channel);

          if (!names) {
            logger.error('No nicklist received!');
          }

          names.sort();
          names = names.join(', ');

          message.text = 'Users on ' + (channel.chanAlias || channel.ircChan) +
            ':\n\n' + names;

          //return tg.send(message);
        } else if (message.cmd === 'getTopic') {
          var topic = irc.getTopic(channel);

          if (topic) {
            message.text = 'Topic for channel ' +
              (channel.chanAlias || channel.ircChan) +
              ': "' + topic.text + '" set by ' + topic.topicBy;
          } else {
            message.text = 'No topic for channel ' +
              (channel.chanAlias || channel.ircChan);
          }

          //return tg.send(message);
        } else if (message.cmd === 'getVersion') {
          message.text = 'Version: ' +
            getVersionStr();

          //return tg.send(message);
        } else if (message.cmd === 'sendCommand') {
          if (!config.allowCommands) {
            message.text = 'Commands are disabled.';
            //return tg.send(message);
          }

          if (!message.text) {
            message.text = 'Usage example: /command !foobar';
            //return tg.send(message);
          } else {
            var command = message.text;

            // prepend with line containing original message
            message.text = message.origText + '\n' + message.text;
            irc.send(message, true);

            message.text = 'Command "' + command + '" executed.';
            //return tg.send(message);
          }
        } else {
          irc.send(message);
        }
        break;
      default:
        logger.warn('unknown protocol: ' + message.protocol);
    }
  };

  const modules = config.modules.map((moduleConfig) => {
    const module = loadedModules[moduleConfig.module];

    if (!module) {
      console.error(`Module '${moduleConfig.module}' not found!`);
      return;
    }

    // Find rooms that module should join
    // (Needed for eg. IRC which has to join channels)
    let rooms = [];
    config.groups.forEach((group) => {
      group.rooms.forEach((room) => {
        if (room.startsWith(`${moduleConfig.name}:`)) {
          rooms.push(room.substr(moduleConfig.name.length + 1));
        }
      });
    });

    const initialized = new module(moduleConfig, rooms, (e) => {
      e.module = moduleConfig.name;
      e.room = `${moduleConfig.name}:${e.room}`;

      /*
       * e must contain:
       * nick, message, room
      */

      console.log('Got message', e);
      msgCallback(e);
    });
  });
}
