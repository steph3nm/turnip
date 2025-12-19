import { ImageGenerator, GeneratedImage, GenerateOptions } from './ai/generator';
import { HeliusClient, TokenBalance } from './solana/helius';
import { PumpPortalClient, DeployResult, TokenMetadata } from './solana/pumpportal';
import { TurnipConfig, LaunchOptions, LaunchResult } from './index';

export class TurnipAgent {
  private imageGenerator: ImageGenerator;
  private helius: HeliusClient;
  private pumpPortal: PumpPortalClient;
  private config: TurnipConfig;

  constructor(config: TurnipConfig) {
    this.config = config;

    // Initialize image generator
    this.imageGenerator = new ImageGenerator({
      apiKey: config.openaiApiKey,
      quality: config.imageQuality,
      size: config.imageSize,
      format: config.imageFormat,
    });

    // Initialize Helius client
    this.helius = new HeliusClient({
      apiKey: config.heliusApiKey,
      network: config.network,
    });

    // Initialize PumpPortal client
    this.pumpPortal = new PumpPortalClient({
      connection: this.helius.getConnection(),
      privateKey: config.walletPrivateKey,
    });
  }

  /**
   * Get the wallet address
   */
  getWalletAddress(): string {
    return this.pumpPortal.getPublicKey();
  }

  /**
   * Generate an AI image
   */
  async generate(options: GenerateOptions): Promise<GeneratedImage> {
    return this.imageGenerator.generate(options);
  }

  /**
   * Enhance a prompt for better image generation
   */
  async enhancePrompt(prompt: string): Promise<string> {
    return this.imageGenerator.enhancePrompt(prompt);
  }

  /**
   * Deploy a token with a previously generated image
   */
  async deploy(options: {
    image: GeneratedImage;
    name: string;
    ticker: string;
    description?: string;
    twitter?: string;
    telegram?: string;
    website?: string;
    devBuyAmount?: number;
    slippage?: number;
  }): Promise<DeployResult> {
    const metadata: TokenMetadata = {
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
  async launch(options: LaunchOptions): Promise<LaunchResult> {
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
          mint: deployResult.mint!,
          name: options.name,
          ticker: options.ticker,
          signature: deployResult.signature!,
          pumpUrl: deployResult.pumpUrl!,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get wallet SOL balance
   */
  async getBalance(): Promise<number> {
    return this.helius.getBalance(this.getWalletAddress());
  }

  /**
   * Get token balances in wallet
   */
  async getTokenBalances(): Promise<TokenBalance[]> {
    return this.helius.getTokenBalances(this.getWalletAddress());
  }

  /**
   * Get token price
   */
  async getTokenPrice(mint: string): Promise<number | null> {
    return this.helius.getTokenPrice(mint);
  }

  /**
   * Buy tokens on pump.fun
   */
  async buyToken(mint: string, solAmount: number, slippage?: number) {
    return this.pumpPortal.buy(mint, solAmount, slippage ?? this.config.defaultSlippage);
  }

  /**
   * Sell tokens on pump.fun
   */
  async sellToken(mint: string, tokenAmount: number, slippage?: number) {
    return this.pumpPortal.sell(mint, tokenAmount, slippage ?? this.config.defaultSlippage);
  }

  /**
   * Check if the agent is properly configured
   */
  async healthCheck(): Promise<{
    openai: boolean;
    helius: boolean;
    wallet: boolean;
    balance: number;
  }> {
    let openaiOk = false;
    let heliusOk = false;
    let balance = 0;

    // Check Helius connection
    try {
      heliusOk = await this.helius.healthCheck();
      if (heliusOk) {
        balance = await this.getBalance();
      }
    } catch {
      heliusOk = false;
    }

    // Check OpenAI by trying a simple completion
    try {
      await this.enhancePrompt('test');
      openaiOk = true;
    } catch {
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
