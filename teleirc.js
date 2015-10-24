#!/usr/bin/env node

var parseConfig = require('./parseConfig');
var config = parseConfig();

// the modules share their respective send functions via the sendTo object
var sendTo = {};

var irc = require('./irc')(config, sendTo);
var tg = require('./tg')(config, sendTo);
