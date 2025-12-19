import chalk from 'chalk';
import { TurnipAgent } from './agent';
import { TokenBalance } from './solana/helius';

interface DashboardOptions {
  refreshInterval?: number;
}

interface TokenWithPrice extends TokenBalance {
  price?: number;
  change24h?: number;
  pumpUrl?: string;
}

export class Dashboard {
  private agent: TurnipAgent;
  private refreshInterval: number;
  private isRunning: boolean = false;
  private intervalId?: NodeJS.Timeout;

  constructor(agent: TurnipAgent, options?: DashboardOptions) {
    this.agent = agent;
    this.refreshInterval = options?.refreshInterval || 30000;
  }

  /**
   * Clear the console
   */
  private clear(): void {
    console.clear();
  }

  /**
   * Print the dashboard header
   */
  private printHeader(): void {
    console.log(chalk.bold('\n  🥕 TURNIP DASHBOARD'));
    console.log(chalk.gray('  ─'.repeat(30)));
  }

  /**
   * Print wallet info
   */
  private printWalletInfo(address: string, balance: number): void {
    console.log(chalk.bold('\n  WALLET'));
    console.log(chalk.gray(`  Address: ${chalk.white(address)}`));
    console.log(chalk.gray(`  Balance: ${chalk.green(`${balance.toFixed(4)} SOL`)}`));
  }

  /**
   * Print token holdings
   */
  private printTokens(tokens: TokenWithPrice[]): void {
    console.log(chalk.bold('\n  TOKEN HOLDINGS'));
    
    if (tokens.length === 0) {
      console.log(chalk.gray('  No tokens found'));
      return;
    }

    console.log(chalk.gray('  ─'.repeat(30)));
    
    for (const token of tokens) {
      const symbol = chalk.cyan(token.symbol.padEnd(10));
      const balance = chalk.white(token.uiBalance.toLocaleString().padEnd(15));
      const value = token.value 
        ? chalk.green(`$${token.value.toFixed(2)}`)
        : chalk.gray('--');
      
      console.log(`  ${symbol} ${balance} ${value}`);
      
      if (token.pumpUrl) {
        console.log(chalk.gray(`           ${token.pumpUrl}`));
      }
    }
  }

  /**
   * Print recent activity
   */
  private printActivity(): void {
    console.log(chalk.bold('\n  RECENT ACTIVITY'));
    console.log(chalk.gray('  ─'.repeat(30)));
    console.log(chalk.gray('  Use "turnip history" to view transaction history'));
  }

  /**
   * Print footer
   */
  private printFooter(): void {
    const time = new Date().toLocaleTimeString();
    console.log(chalk.gray(`\n  Last updated: ${time}`));
    console.log(chalk.gray(`  Refreshing every ${this.refreshInterval / 1000}s`));
    console.log(chalk.gray('  Press Ctrl+C to exit\n'));
  }

  /**
   * Render the dashboard
   */
  private async render(): Promise<void> {
    try {
      this.clear();
      this.printHeader();

      // Get wallet info
      const address = this.agent.getWalletAddress();
      const balance = await this.agent.getBalance();
      this.printWalletInfo(address, balance);

      // Get token balances
      const tokens = await this.agent.getTokenBalances();
      
      // Enrich with prices
      const tokensWithPrices: TokenWithPrice[] = await Promise.all(
        tokens.map(async (token) => {
          const price = await this.agent.getTokenPrice(token.mint);
          return {
            ...token,
            price: price ?? undefined,
            value: price ? token.uiBalance * price : undefined,
            pumpUrl: `https://pump.fun/${token.mint}`,
          };
        })
      );

      this.printTokens(tokensWithPrices);
      this.printActivity();
      this.printFooter();
    } catch (error) {
      console.error(chalk.red('\n  Error updating dashboard:'), error);
    }
  }

  /**
   * Start the dashboard
   */
  async start(): Promise<void> {
    this.isRunning = true;

    // Initial render
    await this.render();

    // Set up refresh interval
    this.intervalId = setInterval(async () => {
      if (this.isRunning) {
        await this.render();
      }
    }, this.refreshInterval);

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      this.stop();
      process.exit(0);
    });
  }

  /**
   * Stop the dashboard
   */
  stop(): void {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    console.log(chalk.gray('\n  Dashboard stopped.\n'));
  }

  /**
   * Run a single snapshot (no refresh)
   */
  async snapshot(): Promise<void> {
    await this.render();
  }
}

/**
 * Print a simple summary without the full dashboard
 */
export async function printSummary(agent: TurnipAgent): Promise<void> {
  const address = agent.getWalletAddress();
  const balance = await agent.getBalance();
  const tokens = await agent.getTokenBalances();

  console.log(chalk.bold('\n🥕 Turnip Summary\n'));
  console.log(`Wallet:  ${address}`);
  console.log(`Balance: ${chalk.green(`${balance.toFixed(4)} SOL`)}`);
  console.log(`Tokens:  ${tokens.length}`);

  if (tokens.length > 0) {
    console.log('\nTop holdings:');
    for (const token of tokens.slice(0, 5)) {
      console.log(`  • ${token.symbol}: ${token.uiBalance.toLocaleString()}`);
    }
  }

  console.log('');
}
