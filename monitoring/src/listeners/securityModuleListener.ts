import { ethers, Contract } from 'ethers';
import { securityModuleABI } from '@/contracts/abis/SecurityModule'; // Assuming you make ABIs available here
import { TelegramNotifier } from '../notifiers/telegram';
import { formatUnits } from 'ethers';

export class SecurityModuleListener {
  private contract: Contract;
  private notifier: TelegramNotifier;

  constructor(address: string, provider: ethers.WebSocketProvider, notifier: TelegramNotifier) {
    this.contract = new ethers.Contract(address, securityModuleABI, provider);
    this.notifier = notifier;
    console.log(`Listening to SecurityModule at ${address}`);
  }

  public listen(): void {
    this.contract.on('FlashLoanDetected', (user, token, amount, detectedAtBlock) => {
      const message = `🚨 *FLASH LOAN DETECTED* 🚨
      - *User*: \`${user}\`
      - *Token*: \`${token}\`
      - *Amount*: ${formatUnits(amount, 18)}
      - *Block*: ${detectedAtBlock}`;
      this.notifier.send(message);
    });

    this.contract.on('PriceAnomalyDetected', (token, expectedPrice, actualPrice, detectedAtTime) => {
        const message = `⚠️ *PRICE ANOMALY DETECTED* ⚠️
        - *Token*: \`${token}\`
        - *Oracle Price*: ${formatUnits(expectedPrice, 18)}
        - *Actual Price*: ${formatUnits(actualPrice, 18)}
        - *Time*: ${new Date(Number(detectedAtTime) * 1000).toUTCString()}`;
        this.notifier.send(message);
      });

      this.contract.on('VolumeAnomalyDetected', (expectedVolume, actualVolume) => {
        const message = `📈 *VOLUME ANOMALY DETECTED* 📈
        - *Expected Volume*: ${formatUnits(expectedVolume, 18)}
        - *Actual Volume*: ${formatUnits(actualVolume, 18)}`;
        this.notifier.send(message);
      });

      this.contract.on('OracleFailure', (token, reason) => {
        const message = `❌ *ORACLE FAILURE* ❌
        - *Token*: \`${token}\`
        - *Reason*: ${reason}`;
        this.notifier.send(message);
      });

    console.log('SecurityModule listeners attached.');
  }
}