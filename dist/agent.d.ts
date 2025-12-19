import { GeneratedImage, GenerateOptions } from './ai/generator';
import { TokenBalance } from './solana/helius';
import { DeployResult } from './solana/pumpportal';
import { TurnipConfig, LaunchOptions, LaunchResult } from './index';
export declare class TurnipAgent {
    private imageGenerator;
    private helius;
    private pumpPortal;
    private config;
    constructor(config: TurnipConfig);
    /**
     * Get the wallet address
     */
    getWalletAddress(): string;
    /**
     * Generate an AI image
     */
    generate(options: GenerateOptions): Promise<GeneratedImage>;
    /**
     * Enhance a prompt for better image generation
     */
    enhancePrompt(prompt: string): Promise<string>;
    /**
     * Deploy a token with a previously generated image
     */
    deploy(options: {
        image: GeneratedImage;
        name: string;
        ticker: string;
        description?: string;
        twitter?: string;
        telegram?: string;
        website?: string;
        devBuyAmount?: number;
        slippage?: number;
    }): Promise<DeployResult>;
    /**
     * Full launch flow: generate image and deploy token in one call
     */
    launch(options: LaunchOptions): Promise<LaunchResult>;
    /**
     * Get wallet SOL balance
     */
    getBalance(): Promise<number>;
    /**
     * Get token balances in wallet
     */
    getTokenBalances(): Promise<TokenBalance[]>;
    /**
     * Get token price
     */
    getTokenPrice(mint: string): Promise<number | null>;
    /**
     * Buy tokens on pump.fun
     */
    buyToken(mint: string, solAmount: number, slippage?: number): Promise<{
        success: boolean;
        signature?: string;
        error?: string;
    }>;
    /**
     * Sell tokens on pump.fun
     */
    sellToken(mint: string, tokenAmount: number, slippage?: number): Promise<{
        success: boolean;
        signature?: string;
        error?: string;
    }>;
    /**
     * Check if the agent is properly configured
     */
    healthCheck(): Promise<{
        openai: boolean;
        helius: boolean;
        wallet: boolean;
        balance: number;
    }>;
}
