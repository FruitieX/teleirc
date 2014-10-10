#!/usr/bin/env node

var config = require(process.env.HOME + "/.teleircConfig.js");
var net = require("net");
var spawn = require("child_process").spawn;

var handleTgLine = function(line) {
    if(line.match(new RegExp('\\[\\d\\d:\\d\\d\\]  ' + config.tgchat + ' .* >>> .*'))) {
        line = line.split(' ');
        line.shift(); line.shift(); line.shift();

        // line now contains [Firstname, Lastname, ..., >>>, msgword1, msgword2, ...]
        var name = "";
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

        sendIrcMsg(name + ': ' + line);
    }
};

var telegram = spawn(config.tgcli_path, ['-R', '-C', '-W', '-k', config.tgpubkey_path]);
var stdoutBuf = "";
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
telegram.stdin.write('chat_with_peer ' + config.tgchat + '\n');

var ircServer;

var recvdIrcMsg = function(serverName, cmd, chan, nick, msgString, noBroadcast) {
    // check if first word contains config.nick, ie. is a hilight
    var firstWord = msgString.substr(0, msgString.indexOf(' '));
    if(firstWord.indexOf(config.nick) !== -1) {
        // remove first word
        msgString = msgString.substr(msgString.indexOf(' ') + 1);
        telegram.stdin.write('irc: ' + nick + ': ' + msgString + '\n');
    }
};

var sendIrcMsg = function(msg) {
    ircServer.send('PRIVMSG ' + config.chan + ' :' + msg);
};

var handleIrcLine = function(line, server, ircServer) {
    var tokens = line.split(' ');

    //console.log(server.name + ': ' + line);
    if(tokens[0] === "PING") {
        //console.log('got PING, sending PONG to ' + tokens[1].substr(1));
        ircServer.send("PONG " + tokens[1].substr(1));
    } else if (tokens[0][0] === ":") {
        var prefix = tokens[0].substr(1);
        var nick = prefix.substr(0, prefix.indexOf('!'));
        var cmd = tokens[1];
        var chan = tokens[2];
        chan = chan.replace(':', '');

        var chanLongName = server.name + ':' + chan;
        chanLongName = chanLongName.toLowerCase();

        if(cmd === "PRIVMSG") {
            tokens.shift(); tokens.shift(); tokens.shift();
            var msg = tokens.join(' ').substr(1);

            if(chan.toLowerCase() === config.chan.toLowerCase()) {
                recvdIrcMsg(server.name, "message", chan, nick, msg);
            }
        }
    } else {
        console.log("got unknown msg on " + server.name + ": " + line);
    }
};

var ircConnect = function(serverConfig) {
    var buffer = "";

    ircServer = net.connect({
        "port": serverConfig.port,
        "host": serverConfig.address
    }, function() {
        // logging
        console.log('connected to irc server');

        var passString = "";
        if(serverConfig.password)
            passString = "PASS " + serverConfig.password + "\r\n";

        ircServer.write(passString +
                     "NICK " + (serverConfig.nick || config.nick) + "\r\n" +
                     "USER " + (serverConfig.nick || config.nick) + " " +
                     "localhost " + serverConfig.address + " :" +
                     (serverConfig.nick || config.nick) + "\r\n" +
                     "JOIN " + config.chan + "\r\n");

        ircServer.resetPingTimer();
    });

    ircServer.send = function(data) {
        //console.log("sending data to IRC: " + data);
        ircServer.write(data + '\r\n');
    };

    ircServer.on('data', function(data) {
        ircServer.resetPingTimer();

        buffer += data.toString('utf8');
        var lastNL = buffer.lastIndexOf('\n');

        // have we received at least one whole line? else wait for more data
        if(lastNL !== -1) {
            var recvdLines = buffer.substr(0, lastNL + 1).split('\r\n');
            buffer = buffer.substr(lastNL + 1);

            for(var i = 0; i < recvdLines.length; i++) {
                if(recvdLines[i] !== '') {
                    //console.log('irc server sent ' + recvdLines[i]);
                    handleIrcLine(recvdLines[i], serverConfig, ircServer);
                }
            }
        }
    });

    ircServer.reconnect = function(message) {
        // cleanup
        clearTimeout(ircServer.pingTimer);
        ircServer.removeAllListeners('end');
        ircServer.removeAllListeners('close');
        ircServer.removeAllListeners('error');

        ircServer.destroy();

        // delay reconnect by config.reconnectDelay ms
        ircServer.reconnectTimer = setTimeout(function() {
            console.log(serverConfig.name + ': reconnecting...');
            ircConnect(serverConfig);
        }, config.reconnectDelay);
    };

    ircServer.on('end', function() {
        ircServer.reconnect(serverConfig.name + ': connection to irc ended.');
    });
    ircServer.on('close', function() {
        ircServer.reconnect(serverConfig.name + ': connection to irc closed.');
    });
    ircServer.on('error', function(err) {
        ircServer.reconnect(serverConfig.name + ': irc socket error: ' + err.code);
    });

    // call whenever irc server sends data to postpone timeout timers
    ircServer.resetPingTimer = function() {
        // ping the server after config.pingDelay of inactivity
        clearTimeout(ircServer.pingTimer);
        ircServer.pingTimer = setTimeout(function() {
            ircServer.send('PING ' + ircServer.config.address);
        }, config.pingDelay);
    };

    ircServer.setTimeout(config.timeoutDelay, function() {
        ircServer.reconnect(serverConfig.name + ': connection to irc timed out.');
    });

    ircServer.config = serverConfig;
};

ircConnect(config.server);
