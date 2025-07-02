import TelegramBot from 'node-telegram-bot-api';
import { config } from '../config';

export class TelegramNotifier {
  private bot: TelegramBot;
  private chatId: string;

  constructor() {
    this.bot = new TelegramBot(config.telegram.botToken);
    this.chatId = config.telegram.chatId;
  }

  public async send(message: string): Promise<void> {
    try {
      await this.bot.sendMessage(this.chatId, message, { parse_mode: 'Markdown' });
      console.log('Telegram alert sent.');
    } catch (error) {
      console.error('Failed to send Telegram alert:', error);
    }
  }
}