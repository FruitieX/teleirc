var logger = require('./log');
var argv = require('./arguments').argv;
var git = require('git-rev-sync');
var pjson = require('../package.json');
import _ from 'lodash';

import irc from './irc';
import telegram from './telegram';

const loadedModules = {
  irc,
  telegram
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

  /**
   * Broadcast message to all groups where source room is present
   *
   * msg is an object containing: {
   *   nick: Sender,
   *   text: Text contents,
   *   room: Source room,
   *   (date): Timestamp
   * }
   */
  const broadcast = (msg) => {
    console.log('Got message', msg);

    // Find all target groups which contain the source room
    const targetGroups = config.groups.filter((group) => {
      return group.rooms.includes(msg.room);
    });

    // Concatenate all target rooms
    let targetRooms = _.flattenDeep(targetGroups.map((group) => group.rooms));

    // Remove duplicates
    targetRooms = _.uniq(targetRooms);

    // Remove the source room (don't forward message back to it!)
    targetRooms = _.without(targetRooms, msg.room);

    // Broadcast message to target rooms
    console.log('forwarding to', targetRooms);
    targetRooms.forEach((room) => {
      const moduleAlias = room.substr(0, room.indexOf(':'));

      if (!modules[moduleAlias]) {
        return console.error(`Unknown module alias '${moduleAlias}', not forwarding message`);
      }

      modules[moduleAlias].sendMsg(msg, room.substr(moduleAlias.length + 1));
    });
  };

  /**
   * Initialize modules
   */
  let modules = {};
  config.modules.forEach((moduleConfig) => {
    const module = loadedModules[moduleConfig.module];

    if (!module) {
      console.error(`Module '${moduleConfig.module}' not found!`);
      return;
    }

    // Find rooms that module should join
    // (Needed for eg. IRC which has to join channels on connect)
    let rooms = _.flattenDeep(
      config.groups.map((group) => (
        group.rooms.filter((room) => room.startsWith(`${moduleConfig.alias}:`))
      ))
    );

    // Remove duplicates
    rooms = _.uniq(rooms);

    // Remove module alias prefix
    rooms = rooms.map((room) => (
      room.substr(moduleConfig.alias.length + 1)
    ));

    const instance = new module(moduleConfig.config, rooms, (msg) => {
      msg.module = moduleConfig.alias;
      msg.room = `${moduleConfig.alias}:${msg.room}`;

      broadcast(msg);
    });

    modules[moduleConfig.alias] = instance;
  });
}
