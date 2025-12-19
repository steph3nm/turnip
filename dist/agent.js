"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TurnipAgent = void 0;
const generator_1 = require("./ai/generator");
const helius_1 = require("./solana/helius");
const pumpportal_1 = require("./solana/pumpportal");
class TurnipAgent {
    constructor(config) {
        this.config = config;
        // Initialize image generator
        this.imageGenerator = new generator_1.ImageGenerator({
            apiKey: config.openaiApiKey,
            quality: config.imageQuality,
            size: config.imageSize,
            format: config.imageFormat,
        });
        // Initialize Helius client
        this.helius = new helius_1.HeliusClient({
            apiKey: config.heliusApiKey,
            network: config.network,
        });
        // Initialize PumpPortal client
        this.pumpPortal = new pumpportal_1.PumpPortalClient({
            connection: this.helius.getConnection(),
            privateKey: config.walletPrivateKey,
        });
    }
    /**
     * Get the wallet address
     */
    getWalletAddress() {
        return this.pumpPortal.getPublicKey();
    }
    /**
     * Generate an AI image
     */
    async generate(options) {
        return this.imageGenerator.generate(options);
    }
    /**
     * Enhance a prompt for better image generation
     */
    async enhancePrompt(prompt) {
        return this.imageGenerator.enhancePrompt(prompt);
    }
    /**
     * Deploy a token with a previously generated image
     */
    async deploy(options) {
        const metadata = {
            name: options.name,
            symbol: options.ticker,
            description: options.description || `${options.name} - AI-generated art token`,
            image: options.image.base64,
            twitter: options.twitter,
            telegram: options.telegram,
            website: options.website,
        };
        return this.pumpPortal.deploy({
            metadata,
            devBuyAmount: options.devBuyAmount ?? this.config.devBuyAmount,
            slippage: options.slippage ?? this.config.defaultSlippage,
        });
    }
    /**
     * Full launch flow: generate image and deploy token in one call
     */
    async launch(options) {
        try {
            // Step 1: Generate the AI image
            const image = await this.imageGenerator.generate({
                prompt: options.prompt,
            });
            // Step 2: Deploy the token
            const deployResult = await this.deploy({
                image,
                name: options.name,
                ticker: options.ticker,
                description: options.description,
                twitter: options.twitter,
                telegram: options.telegram,
                website: options.website,
                devBuyAmount: options.devBuyAmount,
                slippage: options.slippage,
            });
            if (!deployResult.success) {
                return {
                    success: false,
                    error: deployResult.error,
                };
            }
            return {
                success: true,
                image: {
                    url: image.url || '',
                    ipfsUrl: deployResult.metadataUri || '',
                },
                token: {
                    mint: deployResult.mint,
                    name: options.name,
                    ticker: options.ticker,
                    signature: deployResult.signature,
                    pumpUrl: deployResult.pumpUrl,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Get wallet SOL balance
     */
    async getBalance() {
        return this.helius.getBalance(this.getWalletAddress());
    }
    /**
     * Get token balances in wallet
     */
    async getTokenBalances() {
        return this.helius.getTokenBalances(this.getWalletAddress());
    }
    /**
     * Get token price
     */
    async getTokenPrice(mint) {
        return this.helius.getTokenPrice(mint);
    }
    /**
     * Buy tokens on pump.fun
     */
    async buyToken(mint, solAmount, slippage) {
        return this.pumpPortal.buy(mint, solAmount, slippage ?? this.config.defaultSlippage);
    }
    /**
     * Sell tokens on pump.fun
     */
    async sellToken(mint, tokenAmount, slippage) {
        return this.pumpPortal.sell(mint, tokenAmount, slippage ?? this.config.defaultSlippage);
    }
    /**
     * Check if the agent is properly configured
     */
    async healthCheck() {
        let openaiOk = false;
        let heliusOk = false;
        let balance = 0;
        // Check Helius connection
        try {
            heliusOk = await this.helius.healthCheck();
            if (heliusOk) {
                balance = await this.getBalance();
            }
        }
        catch {
            heliusOk = false;
        }
        // Check OpenAI by trying a simple completion
        try {
            await this.enhancePrompt('test');
            openaiOk = true;
        }
        catch {
            openaiOk = false;
        }
        return {
            openai: openaiOk,
            helius: heliusOk,
            wallet: heliusOk && balance > 0,
            balance,
        };
    }
}
exports.TurnipAgent = TurnipAgent;
