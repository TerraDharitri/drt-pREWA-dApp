import { ethers, Contract } from 'ethers';
import { pREWAAbis } from '../../../constants'; // Adjust path based on your setup if needed
import { TelegramNotifier } from '../notifiers/telegram';

const EMERGENCY_LEVEL_MAP: { [key: number]: string } = {
    0: "0 (NORMAL)",
    1: "1 (CAUTION)",
    2: "2 (ALERT)",
    3: "3 (CRITICAL)",
};

export class EmergencyControllerListener {
  private contract: Contract;
  private notifier: TelegramNotifier;

  constructor(address: string, provider: ethers.WebSocketProvider, notifier: TelegramNotifier) {
    this.contract = new ethers.Contract(address, pREWAAbis.EmergencyController, provider);
    this.notifier = notifier;
    console.log(`Listening to EmergencyController at ${address}`);
  }

  public listen(): void {
    this.contract.on('EmergencyLevelSet', (level, activator, event) => {
      const levelName = EMERGENCY_LEVEL_MAP[Number(level)] || `Unknown (${level})`;
      const message = `☢️ *EMERGENCY LEVEL SET* ☢️
      - *New Level*: **${levelName}**
      - *Set By*: \`${activator}\`
      - *Tx*: \`${event.log.transactionHash}\``;
      this.notifier.send(message);
    });

    this.contract.on('SystemPaused', (pauser, event) => {
        const message = `⏸️ *SYSTEM GLOBALLY PAUSED* ⏸️
        - *Paused By*: \`${pauser}\`
        - *Tx*: \`${event.log.transactionHash}\``;
        this.notifier.send(message);
    });

    this.contract.on('SystemUnpaused', (unpauser, event) => {
        const message = `▶️ *SYSTEM GLOBALLY UNPAUSED* ▶️
        - *Unpaused By*: \`${unpauser}\`
        - *Tx*: \`${event.log.transactionHash}\``;
        this.notifier.send(message);
    });

    this.contract.on('Level3TimelockStarted', (unlockTime, starter, event) => {
        const unlockDate = new Date(Number(unlockTime) * 1000).toUTCString();
        const message = `⏳ *CRITICAL L3 TIMELOCK STARTED* ⏳
        - *Unlock Time*: ${unlockDate}
        - *Final Approver*: \`${starter}\`
        - *Tx*: \`${event.log.transactionHash}\``;
        this.notifier.send(message);
    });
    
    this.contract.on('Level3TimelockCancelled', (canceller, event) => {
        const message = `🚫 *CRITICAL L3 TIMELOCK CANCELLED* 🚫
        - *Cancelled By*: \`${canceller}\`
        - *Tx*: \`${event.log.transactionHash}\``;
        this.notifier.send(message);
    });

    this.contract.on('NotificationFailure', (contractAddress, reason, event) => {
        const message = `🔥 *AWARE CONTRACT NOTIFICATION FAILURE* 🔥
        - *Contract*: \`${contractAddress}\`
        - *Reason*: ${reason}
        - *Tx*: \`${event.log.transactionHash}\``;
        this.notifier.send(message);
    });

    console.log('EmergencyController listeners attached.');
  }
}