teleirc
=======

Telegram <-> IRC gateway

* Telegram communication via [node-telegram-bot](https://github.com/orzFly/node-telegram-bot) library
* IRC communication via martynsmith's [node-irc](https://github.com/martynsmith/node-irc) module
* All Telegram messages are sent to IRC channel
* IRC messages sent to Telegram only when bot is hilighted or if message is prefixed with "! " (configurable)

Setup
-----

    git clone https://github.com/warbaque/teleirc && cd teleirc
    npm install
    mkdir ~/.teleirc && cp teleirc_config.js.example ~/.teleirc/config.js
    $EDITOR ~/.teleirc/config.js

Before running `teleirc`, set up your bot via the [BotFather](https://telegram.me/botfather) Telegram user. Save your bot token in `~/.teleirc/config.js`. Remember to allow the bot to see all messages via the `/setprivacy` command to `BotFather`, otherwise only messages starting with a slash are visible to teleirc.

    npm start

Optional:

- For your convenience, there is an included systemd unit file in `teleirc.service`.
- You can change your Telegram Bot's profile picture with the `/setuserpic` BotFather command.
