export interface TraderConfig {
    privateKey: string;
    accountAddress: string;
    apiUrl?: string;
}
export interface MarketData {
    price: number;
    change24h: number;
    volume: number;
    high24h: number;
    low24h: number;
}
export interface OrderParams {
    coin: string;
    isLong: boolean;
    price: string;
    size: string;
    reduceOnly?: boolean;
}
export declare class HyperLiquidTrader {
    private wallet;
    private accountAddress;
    private apiUrl;
    private assets;
    constructor(config: TraderConfig);
    /**
     * Fetch current market data for a symbol
     * Uses official Hyperliquid API: POST /info with type "allMids"
     */
    getMarketData(symbol: string): Promise<MarketData | null>;
    /**
     * Get account state including positions and PNL
     * Uses official Hyperliquid API: POST /info with type "clearinghouseState"
     */
    getAccountInfo(): Promise<any>;
    /**
     * Get open positions
     * Parses the clearinghouse state for active positions
     */
    getPositions(): Promise<any[]>;
    /**
     * Get open orders for the account
     * Uses official Hyperliquid API: POST /info with type "openOrders"
     */
    getOpenOrders(): Promise<any[]>;
    /**
     * Get trade history
     * Uses official Hyperliquid API: POST /info with type "userFills"
     */
    getTradeHistory(): Promise<any[]>;
    /**
     * Place an order on Hyperliquid
     * Uses official Hyperliquid API: POST /exchange with proper signing
     *
     * NOTE: This is a simplified implementation. Production use would require
     * proper order signing according to Hyperliquid's signing specification.
     */
    placeOrder(params: OrderParams): Promise<any>;
    /**
     * Close a position for a specific coin
     */
    closePosition(coin: string): Promise<void>;
}
