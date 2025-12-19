import { Connection } from '@solana/web3.js';
export interface TokenInfo {
    mint: string;
    name: string;
    symbol: string;
    description?: string;
    image?: string;
    decimals: number;
    supply: number;
    holders?: number;
    price?: number;
    marketCap?: number;
}
export interface TokenBalance {
    mint: string;
    symbol: string;
    name: string;
    balance: number;
    decimals: number;
    uiBalance: number;
    value?: number;
}
export interface Transaction {
    signature: string;
    timestamp: number;
    type: string;
    fee: number;
    status: 'success' | 'failed';
}
export declare class HeliusClient {
    private connection;
    private apiKey;
    private network;
    private baseUrl;
    constructor(config: {
        apiKey: string;
        network?: 'mainnet-beta' | 'devnet';
    });
    /**
     * Get connection for direct Solana operations
     */
    getConnection(): Connection;
    /**
     * Get SOL balance for a wallet
     */
    getBalance(address: string): Promise<number>;
    /**
     * Get token balances for a wallet
     */
    getTokenBalances(address: string): Promise<TokenBalance[]>;
    /**
     * Get token metadata
     */
    getTokenInfo(mint: string): Promise<TokenInfo | null>;
    /**
     * Get recent transactions for a wallet
     */
    getTransactions(address: string, limit?: number): Promise<Transaction[]>;
    /**
     * Get token price from Jupiter
     */
    getTokenPrice(mint: string): Promise<number | null>;
    /**
     * Subscribe to token transfers (webhook setup)
     */
    createWebhook(config: {
        webhookURL: string;
        accountAddresses: string[];
        transactionTypes?: string[];
    }): Promise<string>;
    /**
     * Check if the API key and connection are valid
     */
    healthCheck(): Promise<boolean>;
}
