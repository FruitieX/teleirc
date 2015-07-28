#!/usr/bin/env node

var assert = require('assert');
var config = require(process.env.HOME + '/.teleircConfig.js');

// check that required config options are set
var checkConfigMsg = ', check teleircConfig.js.example for an example';
assert(config.server, 'config.server block missing' + checkConfigMsg);
assert(config.server.address, 'config.server.address not set' + checkConfigMsg);
assert(config.server.port, 'config.server.port not set' + checkConfigMsg);
assert(config.server.nick, 'config.server.nick not set' + checkConfigMsg);
assert(config.server.chan, 'config.server.chan not set' + checkConfigMsg);
assert(config.hilight_re, 'config.hilight_re not set' + checkConfigMsg);
assert(config.tgcli_path, 'config.tgcli_path not set' + checkConfigMsg);
assert(config.tgpubkey_path, 'config.tgpubkey_path not set' + checkConfigMsg);
assert(config.tgchat, 'config.tgchat not set' + checkConfigMsg);
assert(config.tgnick, 'config.tgnick not set' + checkConfigMsg);

var spawn = require('child_process').spawn;
var irc = require('irc');

config.tgchat_nick = config.tgchat.replace(/\s+/, '_')

var irc_client = new irc.Client(config.server.address, config.server.nick, {
    debug: config.server.debug,
    secure: config.server.secure,
    passsword: config.server.password,
    selfSigned: config.server.selfSigned,
    certExpired: config.server.certExpired,
    port: config.server.port,
    userName: config.server.nick,
    realName: 'Telegram IRC Bot (teleirc)',
    channels: [config.server.chan]
});

irc_client.on('registered', function(message) {
    console.info('Connected to IRC server.');

    // Store the nickname assigned by the server
    config.realNick = message.args[0];
    console.info('Using nickname: ' + config.realNick);
});

irc_client.on('error', function(error) {
    // Error 421 comes up a lot on Mozilla servers, but isn't a problem.
    if (error.rawCommand !== '421') {
        return;
    }

    console.error(error);
    if (error.hasOwnProperty('stack')) {
        console.error(error.stack);
    }
});

// React to users quitting the IRC server
irc_client.on('quit', function(user) {
    if (user == config.server.nick) {
        irc_client.send('NICK', config.server.nick);
        config.realNick = config.server.nick
    }
});

var sendIrcMsg = function(msg) {
    console.log('Relaying to IRC: ' + msg)
    irc_client.say(config.server.chan, msg)
};

var handleTgLine = function(line) {
    if(line.match(new RegExp('\\[\\d\\d:\\d\\d\\]  ' + config.tgchat + ' .* >>> .*'))) {
        console.log('TG message: ' + line);
        line = line.split(' ');
        line.shift(); line.shift(); line.shift();

        // line now contains [Firstname, Lastname, ..., >>>, msgword1, msgword2, ...]
        var name = '';
        temp = line.shift();
        while(temp !== '>>>') {
            name += temp;
            temp = line.shift();
        }

        line = line.join(' ');

        // check if msg was sent by bot telegram account && starts with 'irc: '
        // then don't send the msg back to irc
        if(name === config.tgnick.replace(' ', ''))
            if(line.indexOf('irc: ') === 0)
                return;

        sendIrcMsg('<' + name + '>: ' + line);
    }
};

var telegram = spawn(config.tgcli_path, ['-R', '-C', '-W', '-k', config.tgpubkey_path]);
var stdoutBuf = '';
telegram.stdout.on('data', function(data) {
    stdoutBuf += data.toString('utf8');
    var lastNL = stdoutBuf.lastIndexOf('\n');

    // have we received at least one whole line? else wait for more data
    if(lastNL !== -1) {
        var recvdLines = stdoutBuf.substr(0, lastNL + 1).split('\n');
        stdoutBuf = stdoutBuf.substr(lastNL + 1);

        for(var i = 0; i < recvdLines.length; i++) {
            if(recvdLines[i] !== '') {
                //console.log('irc server sent ' + recvdLines[i]);
                handleTgLine(recvdLines[i]);
            }
        }
    }
});

/* Receive, parse, and handle messages from IRC.
 * - `user`: The nick of the user that send the message.
 * - `channel`: The channel the message was received in. Note, this might not be
 * a real channel, because it could be a PM. But this function ignores
 * those messages anyways.
 * - `message`: The text of the message sent.
 */
irc_client.on('message', function(user, channel, message) {
    var match = config.hilight_re.exec(message);
    console.log('IRC message: ' + user + ': ' + message);
    if (match) {
        message = match[1].trim();
    }
    if (match || config.relayAll) {
        var tgMsg = 'msg ' + config.tgchat_nick + ' irc: <' + user + '>: ' + message;
        console.log('Relaying to TG: ' + tgMsg);
        telegram.stdin.write(tgMsg + '\n');
    }
});
