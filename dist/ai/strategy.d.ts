export interface TradingDecision {
    action: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    reasoning: string;
    suggestedSize?: number;
    stopLoss?: number;
    takeProfit?: number;
}
export declare class AIStrategy {
    private ai;
    private model;
    constructor(aiProvider: 'openai' | 'openrouter', apiKey: string);
    /**
     * Analyze market conditions and generate trading decision
     * Uses advanced AI prompting with technical analysis context
     */
    analyzeTrade(symbol: string, marketData: any, accountValue: number, riskPercentage: number): Promise<TradingDecision>;
    /**
     * Get quick market sentiment for display
     */
    getMarketSentiment(symbol: string, marketData: any): Promise<string>;
    /**
     * Analyze overall market conditions across multiple symbols
     */
    analyzeMarketConditions(marketDataMap: Map<string, any>): Promise<string>;
}
