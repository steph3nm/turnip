import { Connection } from '@solana/web3.js';
export interface TokenMetadata {
    name: string;
    symbol: string;
    description: string;
    image: Buffer | string;
    twitter?: string;
    telegram?: string;
    website?: string;
}
export interface DeployOptions {
    metadata: TokenMetadata;
    devBuyAmount?: number;
    slippage?: number;
}
export interface DeployResult {
    success: boolean;
    mint?: string;
    signature?: string;
    metadataUri?: string;
    pumpUrl?: string;
    error?: string;
}
export declare class PumpPortalClient {
    private connection;
    private wallet;
    private baseUrl;
    constructor(config: {
        connection: Connection;
        privateKey: string;
    });
    /**
     * Get the wallet public key
     */
    getPublicKey(): string;
    /**
     * Upload metadata and image to IPFS via PumpPortal
     */
    uploadMetadata(metadata: TokenMetadata): Promise<string>;
    /**
     * Deploy a new token on pump.fun
     */
    deploy(options: DeployOptions): Promise<DeployResult>;
    /**
     * Buy tokens on pump.fun
     */
    buy(mint: string, solAmount: number, slippage?: number): Promise<{
        success: boolean;
        signature?: string;
        error?: string;
    }>;
    /**
     * Sell tokens on pump.fun
     */
    sell(mint: string, tokenAmount: number, slippage?: number): Promise<{
        success: boolean;
        signature?: string;
        error?: string;
    }>;
}
