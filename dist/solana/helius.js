"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeliusClient = void 0;
const web3_js_1 = require("@solana/web3.js");
const axios_1 = __importDefault(require("axios"));
class HeliusClient {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.network = config.network || 'mainnet-beta';
        // Build RPC URL
        const rpcUrl = this.network === 'mainnet-beta'
            ? `https://mainnet.helius-rpc.com/?api-key=${this.apiKey}`
            : `https://devnet.helius-rpc.com/?api-key=${this.apiKey}`;
        this.connection = new web3_js_1.Connection(rpcUrl, 'confirmed');
        this.baseUrl = `https://api.helius.xyz/v0`;
    }
    /**
     * Get connection for direct Solana operations
     */
    getConnection() {
        return this.connection;
    }
    /**
     * Get SOL balance for a wallet
     */
    async getBalance(address) {
        const pubkey = new web3_js_1.PublicKey(address);
        const balance = await this.connection.getBalance(pubkey);
        return balance / web3_js_1.LAMPORTS_PER_SOL;
    }
    /**
     * Get token balances for a wallet
     */
    async getTokenBalances(address) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/addresses/${address}/balances`, {
                params: { 'api-key': this.apiKey },
            });
            const tokens = [];
            for (const token of response.data.tokens || []) {
                tokens.push({
                    mint: token.mint,
                    symbol: token.symbol || 'Unknown',
                    name: token.name || 'Unknown Token',
                    balance: token.amount || 0,
                    decimals: token.decimals || 0,
                    uiBalance: token.amount / Math.pow(10, token.decimals || 0),
                    value: token.price ? (token.amount / Math.pow(10, token.decimals || 0)) * token.price : undefined,
                });
            }
            return tokens;
        }
        catch (error) {
            console.error('Error fetching token balances:', error);
            return [];
        }
    }
    /**
     * Get token metadata
     */
    async getTokenInfo(mint) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/token-metadata`, {
                params: {
                    'api-key': this.apiKey,
                    mintAccounts: [mint],
                },
            });
            const data = response.data[0];
            if (!data)
                return null;
            return {
                mint: data.account,
                name: data.onChainMetadata?.metadata?.name || data.legacyMetadata?.name || 'Unknown',
                symbol: data.onChainMetadata?.metadata?.symbol || data.legacyMetadata?.symbol || 'Unknown',
                description: data.offChainMetadata?.description,
                image: data.offChainMetadata?.image,
                decimals: data.onChainAccountInfo?.decimals || 9,
                supply: data.onChainAccountInfo?.supply || 0,
            };
        }
        catch (error) {
            console.error('Error fetching token info:', error);
            return null;
        }
    }
    /**
     * Get recent transactions for a wallet
     */
    async getTransactions(address, limit = 10) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/addresses/${address}/transactions`, {
                params: {
                    'api-key': this.apiKey,
                    limit,
                },
            });
            return (response.data || []).map((tx) => ({
                signature: tx.signature,
                timestamp: tx.timestamp,
                type: tx.type,
                fee: tx.fee / web3_js_1.LAMPORTS_PER_SOL,
                status: tx.transactionError ? 'failed' : 'success',
            }));
        }
        catch (error) {
            console.error('Error fetching transactions:', error);
            return [];
        }
    }
    /**
     * Get token price from Jupiter
     */
    async getTokenPrice(mint) {
        try {
            const response = await axios_1.default.get(`https://price.jup.ag/v4/price`, {
                params: { ids: mint },
            });
            return response.data.data?.[mint]?.price || null;
        }
        catch (error) {
            console.error('Error fetching token price:', error);
            return null;
        }
    }
    /**
     * Subscribe to token transfers (webhook setup)
     */
    async createWebhook(config) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/webhooks`, {
                webhookURL: config.webhookURL,
                transactionTypes: config.transactionTypes || ['TRANSFER'],
                accountAddresses: config.accountAddresses,
                webhookType: 'enhanced',
            }, {
                params: { 'api-key': this.apiKey },
            });
            return response.data.webhookID;
        }
        catch (error) {
            console.error('Error creating webhook:', error);
            throw error;
        }
    }
    /**
     * Check if the API key and connection are valid
     */
    async healthCheck() {
        try {
            const version = await this.connection.getVersion();
            return !!version;
        }
        catch {
            return false;
        }
    }
}
exports.HeliusClient = HeliusClient;
