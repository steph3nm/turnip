/**
 * Turnip - AI Art Generation & Tokenization Agent
 *
 * An agent for generating and tokenizing unique AI art on-chain
 * using OpenAI GPT Image 1.5, PumpPortal, and Helius APIs on Solana.
 */
export { TurnipAgent } from './agent';
export { ImageGenerator, type GenerateOptions, type GeneratedImage } from './ai/generator';
export { PumpPortalClient, type TokenMetadata, type DeployResult } from './solana/pumpportal';
export { HeliusClient, type TokenInfo, type TokenBalance } from './solana/helius';
export { Dashboard } from './dashboard';
export interface TurnipConfig {
    openaiApiKey: string;
    heliusApiKey: string;
    walletPrivateKey: string;
    network?: 'mainnet-beta' | 'devnet';
    imageQuality?: 'low' | 'medium' | 'high';
    imageSize?: '1024x1024' | '1024x1792' | '1792x1024';
    imageFormat?: 'png' | 'jpeg' | 'webp';
    defaultSlippage?: number;
    devBuyAmount?: number;
}
export interface LaunchOptions {
    prompt: string;
    name: string;
    ticker: string;
    description?: string;
    twitter?: string;
    telegram?: string;
    website?: string;
    devBuyAmount?: number;
    slippage?: number;
}
export interface LaunchResult {
    success: boolean;
    image?: {
        url: string;
        ipfsUrl: string;
    };
    token?: {
        mint: string;
        name: string;
        ticker: string;
        signature: string;
        pumpUrl: string;
    };
    error?: string;
}
