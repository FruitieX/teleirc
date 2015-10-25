![Logo](/logo.png)

[Telegram](https://telegram.org/) ↔ IRC gateway

#### Features:

* Supports multiple IRC channel ↔ Telegram group pairs
* Telegram messages are always relayed to the respective IRC channel
* IRC messages can be configured either to be relayed every time, or only
  when the bot is hilighted via a configurable regexp
* Telegram communication via
  [node-telegram-bot](https://github.com/orzFly/node-telegram-bot) library
* IRC communication via martynsmith's
  [node-irc](https://github.com/martynsmith/node-irc) module

Quick start
-----------

Make sure you've installed Node.js.

1. Install the teleirc npm module with `npm install -g teleirc` (might need sudo)
2. Generate a default config using `teleirc --genconfig`
3. Set up your bot with [BotFather](https://telegram.me/botfather)
4. Use the `/setprivacy` command with `BotFather` to allow the bot to
   see all Telegram messages
5. Edit the default config `$EDITOR ~/.teleirc/config.js`
6. Run `teleirc`
7. Invite your bot to any Telegram groups you've configured it for
8. Greet your bot once on each of your Telegram groups :tada:! This is needed
   to fetch (and store!) an internally used group ID, making communication
   from IRC to the correct Telegram group possible.

Optional:

- For your convenience, there is an included systemd unit file in
  `teleirc.service`.
- You can change your Telegram Bot's profile picture with the `/setuserpic`
  BotFather command. [Here's](/icon.png) an example icon for you.

Developer install (from git)
----------------------------

    git clone https://github.com/FruitieX/teleirc
    cd teleirc
    npm install

Then follow the instructions under `Setup`, with the exception of step 1.
Also, instead of using the `teleirc` command, use `node teleirc.js` inside the repo.
