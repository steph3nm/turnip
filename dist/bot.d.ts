export interface TradingBotConfig {
    privateKey: string;
    accountAddress: string;
    apiUrl: string;
    aiProvider: 'openai' | 'openrouter';
    aiApiKey: string;
    riskPercentage: number;
    maxPositionSize: number;
    enableAI: boolean;
}
export declare class TradingBot {
    private trader;
    private ai;
    private config;
    constructor(config: TradingBotConfig);
    /**
     * Fetch market data for a symbol (BTC, ETH, etc.)
     * Returns price, 24h change, volume, and high/low
     */
    getMarketData(symbol: string): Promise<import("./hyperliquid/trader").MarketData | null>;
    /**
     * Get account information including positions and PNL
     */
    getAccountInfo(): Promise<any>;
    /**
     * Get AI-powered trading signal for a symbol
     * Uses OpenAI or OpenRouter to analyze market data
     */
    getAITradingSignal(symbol: string, marketData: any): Promise<string>;
    /**
     * Execute a trade on Hyperliquid
     * WARNING: This will place a real order with real money
     */
    executeTrade(symbol: string, side: 'buy' | 'sell', amount: number, price?: number): Promise<any>;
    /**
     * Calculate current PNL (Profit and Loss)
     */
    getPNL(): Promise<{
        totalPNL: number;
        unrealizedPNL: number;
        realizedPNL: number;
        accountValue: number;
    } | null>;
    /**
     * Calculate unrealized PNL from open positions
     */
    private calculateUnrealizedPNL;
    /**
     * Get all open positions
     */
    getOpenPositions(): Promise<{
        symbol: any;
        side: string;
        size: number;
        entryPrice: number;
        currentPrice: number;
        pnl: number;
    }[]>;
    /**
     * Close a specific position
     */
    closePosition(symbol: string): Promise<void>;
    /**
     * Check if AI is enabled
     */
    isAIEnabled(): boolean;
}
