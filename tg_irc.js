#!/usr/bin/env node


//////////////
//  Config  //
//////////////

var config = require(process.env.HOME + '/.tg_irc_config.js');



//////////////////
//  IRC client  //
//////////////////

var irc = require('irc');
var client = new irc.Client(config.irc_server, config.irc_nick, config.irc_options);

client.on('error', function(error) {
    console.log('error: ', error);
});



//////////////////
//  TG >>> IRC  //
//////////////////

var irc_send_msg = function(msg) {
    console.log('  >> relaying to IRC: ' + msg);
    client.say(config.irc_channel_id, msg);
};

var tg_handle_line = function(line) {
    if(line.match(new RegExp('\\[\\d\\d:\\d\\d\\]  ' + config.tg_chat + ' .* >>> .*'))) {
        console.log('TG: ' + line);
        line = line.split(' ');
        line.shift(); line.shift(); line.shift();
        // [Firstname, Lastname, ..., >>>, msgword1, msgword2, ...]

        var name = '';
        temp = line.shift();
        while(temp !== '>>>') {
            name += temp;
            temp = line.shift();
        }

        line = line.join(' ');

        if(name === config.tg_nick)
        //if(line.indexOf('irc: ') === 0)
            return;

        irc_send_msg('<' + name + '>: ' + line);
    }
};



///////////////////
//  TG listener  //
///////////////////

var spawn = require('child_process').spawn;
var telegram = spawn(config.tg_cli_path, ['-R', '-C', '-W', '-k', config.tg_pubkey_path]);
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
                tg_handle_line(recvdLines[i]);
            }
        }
    }
});



//////////////////
//  IRC >>> TG  //
//////////////////

client.on('message', function(user, channel, message) {
    console.log('IRC: ' + user + ': ' + message);
    var match = config.irc_hilight_re.exec(message);
    if (match || config.irc_relay_all) {
        if (match)
            message = match[1].trim();
        var tg_msg = 'msg ' + config.tg_chat + ' <' + user + '>: ' + message;
        console.log('  >> relaying to TG: ' + tg_msg);
        telegram.stdin.write(tg_msg + '\n');
    }
});
