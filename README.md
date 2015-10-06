teleirc
=======

Telegram <-> IRC gateway

* Telegram communication via
  [node-telegram-bot](https://github.com/orzFly/node-telegram-bot) library
* IRC communication via martynsmith's
  [node-irc](https://github.com/martynsmith/node-irc) module
* All Telegram messages are sent to IRC channel
* IRC messages sent to Telegram only when bot is hilighted or if message is
  prefixed with "! " (configurable)

Setup
-----

    npm install -g teleirc
    teleirc --genconfig
    $EDITOR ~/.teleirc/config.js

Before running `teleirc`, set up your bot via the
[BotFather](https://telegram.me/botfather) Telegram user. Save your bot token
in `~/.teleirc/config.js`. **Remember to allow the bot to see all messages via
the `/setprivacy` command to `BotFather`, otherwise only messages starting with
a slash are visible to teleirc.**

Now run `teleirc` simply with the following command:

    teleirc

Optional:

- For your convenience, there is an included systemd unit file in
  `teleirc.service`.
- You can change your Telegram Bot's profile picture with the `/setuserpic`
  BotFather command.

Running from git
----------------

    git clone https://github.com/FruitieX/teleirc
    cd teleirc
    npm install

Then follow the rest of the instructions under `Setup`. Instead of using
the `teleirc` command, use `node teleirc.js` inside the repo.
