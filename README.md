teleirc
=======

Telegram <-> IRC gateway.

* Uses the [node-telegram-bot](https://github.com/orzFly/node-telegram-bot) library for Telegram communication
* IRC communication via martynsmith's [node-irc](https://github.com/martynsmith/node-irc) module
* All Telegram messages are sent to IRC channel
* IRC messages sent to Telegram only when bot is hilighted (configurable)

Setup
-----

    git clone https://github.com/FruitieX/teleirc
    cd teleirc
    npm install
    cp teleirc_config.js.example ~/.teleirc_config.js

Next, set up your bot via the [BotFather](https://telegram.me/botfather) Telegram user.
Save your bot token in `~/.teleirc_config.js`. Remember to allow the bot to see all messages via the
`/setprivacy` command to `BotFather`, otherwise only messages starting with a
slash are visible to teleirc.

Now read through the rest of `~/.teleirc_config.js` and change the configuration as appropriate.

When you're done, launch teleirc with:

    npm start
    
Optional:

- For your convenience, there is an included systemd unit file in `teleirc.service`.
- You can change your Telegram Bot's profile picture with the `/setuserpic` BotFather command.

Special thanks
--------------

Thanks to [warbaque](https://github.com/warbaque) for an implementation using Telegram Bot API!
