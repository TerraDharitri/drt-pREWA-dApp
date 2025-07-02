import { ethers } from 'ethers';
import { config } from './config';
import { TelegramNotifier } from './notifiers/telegram';
import { SecurityModuleListener } from './listeners/securityModuleListener';
// Import other listeners as you create them
// import { EmergencyControllerListener } from './listeners/emergencyControllerListener';
// import { ProxyAdminListener } from './listeners/proxyAdminListener';

async function main() {
  console.log('Starting drt-pREWA Monitoring Service...');

  const provider = new ethers.WebSocketProvider(config.rpcUrlWs);
  const notifier = new TelegramNotifier();

  provider.on('open', () => {
    console.log('WebSocket connection established.');
    notifier.send('Monitoring Service *ONLINE*.');
  });

  provider.on('close', (code: number, reason: string) => {
    console.log(`WebSocket connection closed. Code: ${code}, Reason: ${reason}`);
    // Implement reconnection logic here if necessary
  });

  const securityModuleListener = new SecurityModuleListener(config.contracts.SecurityModule, provider, notifier);
  securityModuleListener.listen();
  
  // const emergencyControllerListener = new EmergencyControllerListener(config.contracts.EmergencyController, provider, notifier);
  // emergencyControllerListener.listen();
  
  // const proxyAdminListener = new ProxyAdminListener(config.contracts.ProxyAdmin, provider, notifier);
  // proxyAdminListener.listen();

  console.log('All listeners are active.');
}

main().catch((error) => {
  console.error('Fatal error in monitoring service:', error);
  process.exit(1);
});