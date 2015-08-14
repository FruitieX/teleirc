teleirc
=======

Telegram <-> IRC gateway.

* Uses the `node-telegram-bot` library for Telegram communication
* IRC communication via martynsmith's `node-irc` module
* All Telegram messages sent to IRC channel
* IRC messages sent to Telegram only when bot is hilighted (configurable)

Setup
-----

    git clone https://github.com/FruitieX/teleirc
    cd teleirc
    npm install
    cp teleirc_config.js.example ~/.teleirc_config.js
    $EDITOR ~/.teleircConfig.js # note that you have to change most config variables!
    node teleirc.js

Special thanks
--------------

Thanks to @warbaque for implementation with TG Bot API!
