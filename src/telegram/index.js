import tgApi from 'node-telegram-bot-api';
import _ from 'lodash';

export default class Telegram {
  constructor(moduleConfig, rooms, broadcastToGroup) {
    this.rooms = rooms;
    this.broadcastToGroup = broadcastToGroup;

    // Maps room name -> chat ID
    this.chatIds = {};

    this.client = new tgApi(moduleConfig.token, _.omit(moduleConfig, 'token'));
    this.client.on('message', ::this.handleMessage);
  }

  // Sends message to Telegram
  sendMsg(msg, target) {
    if (!this.chatIds[target]) {
      console.error(`I haven't learned the chat ID of '${target}' yet!`);
      console.error(`Invite me to '${target}' and greet me in the room so I can learn the chat ID!`);
      return;
    }

    const text = (msg.nick ? `<${msg.nick}> ` : '') + msg.text;

    this.client.sendMessage(this.chatIds[target], text);
  }

  // Handle message from Telegram
  handleMessage(e) {
    const msg = {
      nick: e.from.username || `${e.from.first_name} ${e.from.last_name}`,
      room: e.chat.title,
      text: e.text,
      date: e.date
    };

    if (!this.rooms.includes(msg.room)) {
      return console.error(`Ignoring message to unknown target/channel ${msg.room}`);
    }

    this.chatIds[e.chat.title] = e.chat.id;

    this.broadcastToGroup(msg);
  }
}
