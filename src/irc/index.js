import IRC from 'irc-framework';
import _ from 'lodash';

export default class Irc {
  constructor(moduleConfig, rooms, broadcastToGroup) {
    this.moduleConfig = moduleConfig;
    this.rooms = rooms;
    this.broadcastToGroup = broadcastToGroup;
    this.channels = [];

    const bot = new IRC.Client();
    this.bot = bot;
    bot.connect(moduleConfig);

    bot.on('message', (e) => {
      this.handleMessage(e);
    });

    bot.on('registered', () => {
      console.log('registered');
      this.channels = rooms.map((name) => {
        console.log('joining', name);
        const channel = bot.channel(name);

        channel.join();
        return channel;
      });
    });
  }

  // Sends message to IRC
  sendMsg(msg, target) {
    const channel = this.channels.find((channel) => channel.name === target);
    if (!channel) {
      console.error(`I haven't joined the IRC channel ${target} yet!`);
      console.error(`Check your config and network connection to the IRC server.`);
      return;
    }

    // Make copy of message
    msg = _.cloneDeep(msg);

    // strip empty lines
    msg.text = msg.text.replace(/^\s*\n/gm, '');

    // replace newlines
    msg.text = msg.text.replace(/\n/g, this.moduleConfig.replaceNewlines);

    channel.say(`<${msg.nick}> ${msg.text}`);
  }

  // Handle message from IRC
  handleMessage(e) {
    // only accept privmsgs TODO: what about notices?
    if (!['privmsg'].includes(e.type)) {
      return console.log('ignoring message of type', e.type);
    }

    const msg = {
      nick: e.nick,
      room: e.target,
      text: e.message

    };
    console.log('got e', e);
    console.log('translated into msg', msg);

    if (!this.rooms.includes(msg.room)) {
      return console.error(`Ignoring message from unknown target/channel ${msg.room}`);
    }

    this.broadcastToGroup(msg);
  }
}
