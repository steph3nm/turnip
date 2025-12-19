"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HyperLiquidTrader = void 0;
const axios_1 = __importDefault(require("axios"));
const ethers_1 = require("ethers");
const assets_1 = require("./assets");
class HyperLiquidTrader {
    constructor(config) {
        this.wallet = new ethers_1.ethers.Wallet(config.privateKey);
        this.accountAddress = config.accountAddress;
        this.apiUrl = config.apiUrl || 'https://api.hyperliquid.xyz';
        this.assets = assets_1.DEFAULT_ASSETS;
    }
    /**
     * Fetch current market data for a symbol
     * Uses official Hyperliquid API: POST /info with type "allMids"
     */
    async getMarketData(symbol) {
        try {
            // Get current price
            const midsResponse = await axios_1.default.post(`${this.apiUrl}/info`, {
                type: 'allMids'
            });
            const price = parseFloat(midsResponse.data[symbol] || '0');
            // Get 24h candles for volume and price changes
            const endTime = Date.now();
            const startTime = endTime - (24 * 60 * 60 * 1000);
            const candlesResponse = await axios_1.default.post(`${this.apiUrl}/info`, {
                type: 'candleSnapshot',
                req: {
                    coin: symbol,
                    interval: '1h',
                    startTime,
                    endTime
                }
            });
            const candles = candlesResponse.data;
            if (candles.length === 0) {
                return { price, change24h: 0, volume: 0, high24h: price, low24h: price };
            }
            const firstCandle = candles[0];
            const lastCandle = candles[candles.length - 1];
            const open24h = parseFloat(firstCandle.o);
            const change24h = ((price - open24h) / open24h) * 100;
            let volume = 0;
            let high24h = price;
            let low24h = price;
            candles.forEach((candle) => {
                volume += parseFloat(candle.v);
                high24h = Math.max(high24h, parseFloat(candle.h));
                low24h = Math.min(low24h, parseFloat(candle.l));
            });
            return {
                price,
                change24h,
                volume,
                high24h,
                low24h
            };
        }
        catch (error) {
            console.error(`Error fetching market data for ${symbol}:`, error);
            return null;
        }
    }
    /**
     * Get account state including positions and PNL
     * Uses official Hyperliquid API: POST /info with type "clearinghouseState"
     */
    async getAccountInfo() {
        try {
            const response = await axios_1.default.post(`${this.apiUrl}/info`, {
                type: 'clearinghouseState',
                user: this.accountAddress
            });
            return response.data;
        }
        catch (error) {
            console.error('Error fetching account info:', error);
            return null;
        }
    }
    /**
     * Get open positions
     * Parses the clearinghouse state for active positions
     */
    async getPositions() {
        try {
            const accountInfo = await this.getAccountInfo();
            if (!accountInfo)
                return [];
            return accountInfo.assetPositions || [];
        }
        catch (error) {
            console.error('Error fetching positions:', error);
            return [];
        }
    }
    /**
     * Get open orders for the account
     * Uses official Hyperliquid API: POST /info with type "openOrders"
     */
    async getOpenOrders() {
        try {
            const response = await axios_1.default.post(`${this.apiUrl}/info`, {
                type: 'openOrders',
                user: this.accountAddress
            });
            return response.data || [];
        }
        catch (error) {
            console.error('Error fetching open orders:', error);
            return [];
        }
    }
    /**
     * Get trade history
     * Uses official Hyperliquid API: POST /info with type "userFills"
     */
    async getTradeHistory() {
        try {
            const response = await axios_1.default.post(`${this.apiUrl}/info`, {
                type: 'userFills',
                user: this.accountAddress
            });
            return response.data || [];
        }
        catch (error) {
            console.error('Error fetching trade history:', error);
            return [];
        }
    }
    /**
     * Place an order on Hyperliquid
     * Uses official Hyperliquid API: POST /exchange with proper signing
     *
     * NOTE: This is a simplified implementation. Production use would require
     * proper order signing according to Hyperliquid's signing specification.
     */
    async placeOrder(params) {
        try {
            const assetIndex = this.assets.findIndex(a => a.name === params.coin);
            if (assetIndex === -1) {
                throw new Error(`Asset ${params.coin} not found`);
            }
            // Create order object
            const order = {
                a: assetIndex,
                b: params.isLong,
                p: params.price,
                s: params.size,
                r: params.reduceOnly || false,
                t: {
                    limit: {
                        tif: 'Gtc'
                    }
                }
            };
            // Note: This is a placeholder. Actual implementation requires
            // proper EIP-712 signing as per Hyperliquid documentation
            const orderRequest = {
                action: {
                    type: 'order',
                    orders: [order],
                    grouping: 'na'
                },
                nonce: Date.now(),
                signature: {
                    r: '0x',
                    s: '0x',
                    v: 27
                }
            };
            const response = await axios_1.default.post(`${this.apiUrl}/exchange`, orderRequest);
            return response.data;
        }
        catch (error) {
            console.error('Error placing order:', error);
            throw error;
        }
    }
    /**
     * Close a position for a specific coin
     */
    async closePosition(coin) {
        const positions = await this.getPositions();
        const position = positions.find((p) => p.position.coin === coin);
        if (!position) {
            throw new Error(`No open position found for ${coin}`);
        }
        const size = Math.abs(parseFloat(position.position.szi));
        const isLong = parseFloat(position.position.szi) > 0;
        // Get current market price
        const marketData = await this.getMarketData(coin);
        if (!marketData) {
            throw new Error(`Could not fetch market data for ${coin}`);
        }
        // Place a reduce-only order to close the position
        await this.placeOrder({
            coin,
            isLong: !isLong, // Opposite side to close
            price: marketData.price.toString(),
            size: size.toString(),
            reduceOnly: true
        });
    }
}
exports.HyperLiquidTrader = HyperLiquidTrader;
