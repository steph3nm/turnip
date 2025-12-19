"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradingBot = void 0;
const trader_1 = require("./hyperliquid/trader");
const openai_1 = __importDefault(require("openai"));
const chalk_1 = __importDefault(require("chalk"));
class TradingBot {
    constructor(config) {
        this.config = config;
        // Initialize Hyperliquid trader with our own implementation
        this.trader = new trader_1.HyperLiquidTrader({
            privateKey: config.privateKey,
            accountAddress: config.accountAddress,
            apiUrl: config.apiUrl,
        });
        // Initialize AI client
        if (config.aiProvider === 'openai') {
            this.ai = new openai_1.default({ apiKey: config.aiApiKey });
        }
        else {
            this.ai = new openai_1.default({
                apiKey: config.aiApiKey,
                baseURL: 'https://openrouter.ai/api/v1',
            });
        }
    }
    /**
     * Fetch market data for a symbol (BTC, ETH, etc.)
     * Returns price, 24h change, volume, and high/low
     */
    async getMarketData(symbol) {
        try {
            const data = await this.trader.getMarketData(symbol);
            return data;
        }
        catch (error) {
            console.error(chalk_1.default.red(`Error fetching market data for ${symbol}:`), error);
            return null;
        }
    }
    /**
     * Get account information including positions and PNL
     */
    async getAccountInfo() {
        try {
            const info = await this.trader.getAccountInfo();
            return info;
        }
        catch (error) {
            console.error(chalk_1.default.red('Error fetching account info:'), error);
            return null;
        }
    }
    /**
     * Get AI-powered trading signal for a symbol
     * Uses OpenAI or OpenRouter to analyze market data
     */
    async getAITradingSignal(symbol, marketData) {
        if (!this.config.enableAI) {
            return 'AI suggestions disabled';
        }
        try {
            const prompt = `You are an expert cryptocurrency trader analyzing ${symbol} market data.
      
Current Market Data:
- Price: $${marketData.price.toFixed(2)}
- 24h Change: ${marketData.change24h >= 0 ? '+' : ''}${marketData.change24h.toFixed(2)}%
- 24h Volume: $${marketData.volume.toFixed(2)}
- 24h High: $${marketData.high24h.toFixed(2)}
- 24h Low: $${marketData.low24h.toFixed(2)}

Based on this data, provide a brief trading recommendation (BUY/SELL/HOLD) with reasoning in 2-3 sentences. Focus on technical indicators and price action.`;
            const response = await this.ai.chat.completions.create({
                model: this.config.aiProvider === 'openai' ? 'gpt-4-turbo-preview' : 'anthropic/claude-3.5-sonnet',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 150,
                temperature: 0.7,
            });
            return response.choices[0]?.message?.content || 'No AI signal generated';
        }
        catch (error) {
            console.error(chalk_1.default.red('Error getting AI signal:'), error);
            return 'AI analysis unavailable';
        }
    }
    /**
     * Execute a trade on Hyperliquid
     * WARNING: This will place a real order with real money
     */
    async executeTrade(symbol, side, amount, price) {
        try {
            console.log(chalk_1.default.yellow(`\n📝 Executing ${side.toUpperCase()} order for ${amount} ${symbol}...`));
            const marketData = await this.getMarketData(symbol);
            if (!marketData) {
                throw new Error(`Could not fetch market data for ${symbol}`);
            }
            const orderPrice = price || marketData.price;
            const order = await this.trader.placeOrder({
                coin: symbol,
                isLong: side === 'buy',
                price: orderPrice.toString(),
                size: amount.toString(),
                reduceOnly: false,
            });
            console.log(chalk_1.default.green('✓ Order placed successfully'));
            return order;
        }
        catch (error) {
            console.error(chalk_1.default.red('❌ Order execution failed:'), error);
            throw error;
        }
    }
    /**
     * Calculate current PNL (Profit and Loss)
     */
    async getPNL() {
        try {
            const accountInfo = await this.getAccountInfo();
            if (!accountInfo)
                return null;
            const marginSummary = accountInfo.marginSummary;
            return {
                totalPNL: parseFloat(marginSummary.accountValue) - parseFloat(marginSummary.totalRawUsd),
                unrealizedPNL: this.calculateUnrealizedPNL(accountInfo.assetPositions),
                realizedPNL: 0, // Would need historical data
                accountValue: parseFloat(marginSummary.accountValue),
            };
        }
        catch (error) {
            console.error(chalk_1.default.red('Error calculating PNL:'), error);
            return null;
        }
    }
    /**
     * Calculate unrealized PNL from open positions
     */
    calculateUnrealizedPNL(positions) {
        if (!positions || positions.length === 0)
            return 0;
        return positions.reduce((total, pos) => {
            return total + parseFloat(pos.position.unrealizedPnl || '0');
        }, 0);
    }
    /**
     * Get all open positions
     */
    async getOpenPositions() {
        try {
            const positions = await this.trader.getPositions();
            return positions.map((pos) => ({
                symbol: pos.position.coin,
                side: parseFloat(pos.position.szi) > 0 ? 'Long' : 'Short',
                size: Math.abs(parseFloat(pos.position.szi)),
                entryPrice: parseFloat(pos.position.entryPx),
                currentPrice: 0, // Would need to fetch current market price
                pnl: parseFloat(pos.position.unrealizedPnl),
            }));
        }
        catch (error) {
            console.error(chalk_1.default.red('Error fetching positions:'), error);
            return [];
        }
    }
    /**
     * Close a specific position
     */
    async closePosition(symbol) {
        try {
            console.log(chalk_1.default.yellow(`\n🔄 Closing position for ${symbol}...`));
            await this.trader.closePosition(symbol);
            console.log(chalk_1.default.green('✓ Position closed successfully'));
        }
        catch (error) {
            console.error(chalk_1.default.red('❌ Failed to close position:'), error);
            throw error;
        }
    }
    /**
     * Check if AI is enabled
     */
    isAIEnabled() {
        return this.config.enableAI;
    }
}
exports.TradingBot = TradingBot;
