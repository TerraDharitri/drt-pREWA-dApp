import 'dotenv/config';

export const config = {
  rpcUrlWs: process.env.MONITOR_RPC_URL_WS!,
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN!,
    chatId: process.env.TELEGRAM_CHAT_ID!,
  },
  // Use the mainnet or testnet addresses you are monitoring
  // This assumes you have a way to get addresses, like from a shared package or manually copying
  contracts: {
      SecurityModule: '0x...',
      EmergencyController: '0x...',
      ProxyAdmin: '0x...',
  }
};

if (!config.rpcUrlWs || !config.telegram.botToken || !config.telegram.chatId) {
  throw new Error("Missing required environment variables for monitoring service.");
}