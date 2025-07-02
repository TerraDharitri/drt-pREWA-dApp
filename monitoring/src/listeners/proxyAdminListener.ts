import { ethers, Contract } from 'ethers';
import { proxyAdminABI } from '@/contracts/abis/ProxyAdmin'; // Assume ABI is available
import { TelegramNotifier } from '../notifiers/telegram';

export class ProxyAdminListener {
  private contract: Contract;
  private notifier: TelegramNotifier;

  constructor(address: string, provider: ethers.WebSocketProvider, notifier: TelegramNotifier) {
    this.contract = new ethers.Contract(address, proxyAdminABI, provider);
    this.notifier = notifier;
    console.log(`Listening to ProxyAdmin at ${address}`);
  }

  public listen(): void {
    this.contract.on('UpgradeProposed', (proxy, newImplementation, executeAfter, proposer) => {
      const executeDate = new Date(Number(executeAfter) * 1000).toUTCString();
      const message = `⬆️ *CONTRACT UPGRADE PROPOSED* ⬆️
      - *Proxy*: \`${proxy}\`
      - *New Implementation*: \`${newImplementation}\`
      - *Proposer*: \`${proposer}\`
      - *Executable After*: ${executeDate}`;
      this.notifier.send(message);
    });

    this.contract.on('UpgradeExecuted', (proxy, newImplementation, executor) => {
        const message = `✅ *CONTRACT UPGRADE EXECUTED* ✅
        - *Proxy*: \`${proxy}\`
        - *New Implementation*: \`${newImplementation}\`
        - *Executor*: \`${executor}\``;
        this.notifier.send(message);
    });

    this.contract.on('UpgradeCancelled', (proxy, implementation, canceller) => {
        const message = `❌ *CONTRACT UPGRADE CANCELLED* ❌
        - *Proxy*: \`${proxy}\`
        - *Was To Be*: \`${implementation}\`
        - *Cancelled By*: \`${canceller}\``;
        this.notifier.send(message);
    });

    console.log('ProxyAdmin listeners attached.');
  }
}