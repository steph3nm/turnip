"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dashboard = void 0;
exports.printSummary = printSummary;
const chalk_1 = __importDefault(require("chalk"));
class Dashboard {
    constructor(agent, options) {
        this.isRunning = false;
        this.agent = agent;
        this.refreshInterval = options?.refreshInterval || 30000;
    }
    /**
     * Clear the console
     */
    clear() {
        console.clear();
    }
    /**
     * Print the dashboard header
     */
    printHeader() {
        console.log(chalk_1.default.bold('\n  🥕 TURNIP DASHBOARD'));
        console.log(chalk_1.default.gray('  ─'.repeat(30)));
    }
    /**
     * Print wallet info
     */
    printWalletInfo(address, balance) {
        console.log(chalk_1.default.bold('\n  WALLET'));
        console.log(chalk_1.default.gray(`  Address: ${chalk_1.default.white(address)}`));
        console.log(chalk_1.default.gray(`  Balance: ${chalk_1.default.green(`${balance.toFixed(4)} SOL`)}`));
    }
    /**
     * Print token holdings
     */
    printTokens(tokens) {
        console.log(chalk_1.default.bold('\n  TOKEN HOLDINGS'));
        if (tokens.length === 0) {
            console.log(chalk_1.default.gray('  No tokens found'));
            return;
        }
        console.log(chalk_1.default.gray('  ─'.repeat(30)));
        for (const token of tokens) {
            const symbol = chalk_1.default.cyan(token.symbol.padEnd(10));
            const balance = chalk_1.default.white(token.uiBalance.toLocaleString().padEnd(15));
            const value = token.value
                ? chalk_1.default.green(`$${token.value.toFixed(2)}`)
                : chalk_1.default.gray('--');
            console.log(`  ${symbol} ${balance} ${value}`);
            if (token.pumpUrl) {
                console.log(chalk_1.default.gray(`           ${token.pumpUrl}`));
            }
        }
    }
    /**
     * Print recent activity
     */
    printActivity() {
        console.log(chalk_1.default.bold('\n  RECENT ACTIVITY'));
        console.log(chalk_1.default.gray('  ─'.repeat(30)));
        console.log(chalk_1.default.gray('  Use "turnip history" to view transaction history'));
    }
    /**
     * Print footer
     */
    printFooter() {
        const time = new Date().toLocaleTimeString();
        console.log(chalk_1.default.gray(`\n  Last updated: ${time}`));
        console.log(chalk_1.default.gray(`  Refreshing every ${this.refreshInterval / 1000}s`));
        console.log(chalk_1.default.gray('  Press Ctrl+C to exit\n'));
    }
    /**
     * Render the dashboard
     */
    async render() {
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
            const tokensWithPrices = await Promise.all(tokens.map(async (token) => {
                const price = await this.agent.getTokenPrice(token.mint);
                return {
                    ...token,
                    price: price ?? undefined,
                    value: price ? token.uiBalance * price : undefined,
                    pumpUrl: `https://pump.fun/${token.mint}`,
                };
            }));
            this.printTokens(tokensWithPrices);
            this.printActivity();
            this.printFooter();
        }
        catch (error) {
            console.error(chalk_1.default.red('\n  Error updating dashboard:'), error);
        }
    }
    /**
     * Start the dashboard
     */
    async start() {
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
    stop() {
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        console.log(chalk_1.default.gray('\n  Dashboard stopped.\n'));
    }
    /**
     * Run a single snapshot (no refresh)
     */
    async snapshot() {
        await this.render();
    }
}
exports.Dashboard = Dashboard;
/**
 * Print a simple summary without the full dashboard
 */
async function printSummary(agent) {
    const address = agent.getWalletAddress();
    const balance = await agent.getBalance();
    const tokens = await agent.getTokenBalances();
    console.log(chalk_1.default.bold('\n🥕 Turnip Summary\n'));
    console.log(`Wallet:  ${address}`);
    console.log(`Balance: ${chalk_1.default.green(`${balance.toFixed(4)} SOL`)}`);
    console.log(`Tokens:  ${tokens.length}`);
    if (tokens.length > 0) {
        console.log('\nTop holdings:');
        for (const token of tokens.slice(0, 5)) {
            console.log(`  • ${token.symbol}: ${token.uiBalance.toLocaleString()}`);
        }
    }
    console.log('');
}
