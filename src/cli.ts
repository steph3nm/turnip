#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import dotenv from 'dotenv';
import { writeFileSync } from 'fs';
import { TurnipAgent } from './agent';
import { Dashboard, printSummary } from './dashboard';
import { TurnipConfig } from './index';

// Load environment variables
dotenv.config();

const program = new Command();

/**
 * Create agent from environment variables
 */
function createAgent(): TurnipAgent {
  const config: TurnipConfig = {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    heliusApiKey: process.env.HELIUS_API_KEY || '',
    walletPrivateKey: process.env.WALLET_PRIVATE_KEY || '',
    network: (process.env.SOLANA_NETWORK as 'mainnet-beta' | 'devnet') || 'mainnet-beta',
    imageQuality: (process.env.IMAGE_QUALITY as 'low' | 'medium' | 'high') || 'high',
    imageSize: (process.env.IMAGE_SIZE as '1024x1024' | '1024x1792' | '1792x1024') || '1024x1024',
    imageFormat: (process.env.IMAGE_FORMAT as 'png' | 'jpeg' | 'webp') || 'png',
    defaultSlippage: parseInt(process.env.DEFAULT_SLIPPAGE || '10'),
    devBuyAmount: parseFloat(process.env.DEV_BUY_AMOUNT || '0'),
  };

  // Validate required config
  if (!config.openaiApiKey) {
    console.error(chalk.red('Error: OPENAI_API_KEY not set in .env'));
    process.exit(1);
  }
  if (!config.heliusApiKey) {
    console.error(chalk.red('Error: HELIUS_API_KEY not set in .env'));
    process.exit(1);
  }
  if (!config.walletPrivateKey) {
    console.error(chalk.red('Error: WALLET_PRIVATE_KEY not set in .env'));
    process.exit(1);
  }

  return new TurnipAgent(config);
}

program
  .name('turnip')
  .description('🥕 AI art generation and tokenization agent for Solana')
  .version('0.1.0');

// Generate command
program
  .command('generate')
  .description('Generate AI art from a prompt')
  .argument('<prompt>', 'The image prompt')
  .option('-q, --quality <quality>', 'Image quality (low, medium, high)', 'high')
  .option('-s, --size <size>', 'Image size (1024x1024, 1024x1792, 1792x1024)', '1024x1024')
  .option('-f, --format <format>', 'Output format (png, jpeg, webp)', 'png')
  .option('-o, --output <path>', 'Output file path', './turnip-art')
  .option('-e, --enhance', 'Enhance the prompt with AI', false)
  .action(async (prompt, options) => {
    const spinner = ora('Generating AI art...').start();

    try {
      const agent = createAgent();

      let finalPrompt = prompt;
      if (options.enhance) {
        spinner.text = 'Enhancing prompt...';
        finalPrompt = await agent.enhancePrompt(prompt);
        spinner.info(`Enhanced prompt: ${finalPrompt}`);
        spinner.start('Generating AI art...');
      }

      const image = await agent.generate({
        prompt: finalPrompt,
        quality: options.quality,
        size: options.size,
        format: options.format,
        outputPath: options.output,
      });

      spinner.succeed('Image generated!');
      console.log(chalk.green(`\n✓ Saved to: ${image.filePath}`));
      
      if (image.revisedPrompt) {
        console.log(chalk.gray(`Revised prompt: ${image.revisedPrompt}`));
      }

      console.log(chalk.gray('\nTo deploy as a token, run:'));
      console.log(chalk.cyan(`  turnip deploy "${image.filePath}" --name "Token Name" --ticker TICK`));
    } catch (error) {
      spinner.fail('Generation failed');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      process.exit(1);
    }
  });

// Deploy command
program
  .command('deploy')
  .description('Deploy a generated image as a token on pump.fun')
  .argument('<image>', 'Path to the image file or "last" to use last generated')
  .requiredOption('-n, --name <name>', 'Token name')
  .requiredOption('-t, --ticker <ticker>', 'Token ticker/symbol')
  .option('-d, --description <desc>', 'Token description')
  .option('--twitter <handle>', 'Twitter handle')
  .option('--telegram <link>', 'Telegram link')
  .option('--website <url>', 'Website URL')
  .option('--dev-buy <amount>', 'SOL amount to buy at launch', '0')
  .option('--slippage <percent>', 'Slippage percentage', '10')
  .action(async (imagePath, options) => {
    const spinner = ora('Preparing deployment...').start();

    try {
      const agent = createAgent();

      // Read image file
      const fs = await import('fs');
      const imageBuffer = fs.readFileSync(imagePath);
      const base64 = imageBuffer.toString('base64');

      spinner.text = 'Uploading to IPFS...';
      
      const result = await agent.deploy({
        image: {
          url: '',
          base64,
          prompt: '',
        },
        name: options.name,
        ticker: options.ticker,
        description: options.description,
        twitter: options.twitter,
        telegram: options.telegram,
        website: options.website,
        devBuyAmount: parseFloat(options.devBuy),
        slippage: parseInt(options.slippage),
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      spinner.succeed('Token deployed!');
      console.log(chalk.green('\n✓ Token deployed successfully!\n'));
      console.log(`Mint:      ${chalk.cyan(result.mint)}`);
      console.log(`Signature: ${chalk.gray(result.signature)}`);
      console.log(`\nView on pump.fun: ${chalk.blue(result.pumpUrl)}`);
    } catch (error) {
      spinner.fail('Deployment failed');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      process.exit(1);
    }
  });

// Launch command (generate + deploy in one step)
program
  .command('launch')
  .description('Generate AI art and deploy as a token in one step')
  .argument('<prompt>', 'The image prompt')
  .requiredOption('-n, --name <name>', 'Token name')
  .requiredOption('-t, --ticker <ticker>', 'Token ticker/symbol')
  .option('-d, --description <desc>', 'Token description')
  .option('--twitter <handle>', 'Twitter handle')
  .option('--telegram <link>', 'Telegram link')
  .option('--website <url>', 'Website URL')
  .option('--dev-buy <amount>', 'SOL amount to buy at launch', '0')
  .option('--slippage <percent>', 'Slippage percentage', '10')
  .option('-e, --enhance', 'Enhance the prompt with AI', false)
  .action(async (prompt, options) => {
    const spinner = ora('Starting launch sequence...').start();

    try {
      const agent = createAgent();

      let finalPrompt = prompt;
      if (options.enhance) {
        spinner.text = 'Enhancing prompt...';
        finalPrompt = await agent.enhancePrompt(prompt);
        spinner.info(`Enhanced: ${finalPrompt}`);
      }

      spinner.start('Generating AI art...');
      
      const result = await agent.launch({
        prompt: finalPrompt,
        name: options.name,
        ticker: options.ticker,
        description: options.description,
        twitter: options.twitter,
        telegram: options.telegram,
        website: options.website,
        devBuyAmount: parseFloat(options.devBuy),
        slippage: parseInt(options.slippage),
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      spinner.succeed('Token launched!');
      console.log(chalk.green('\n🥕 Token launched successfully!\n'));
      console.log(`Name:      ${chalk.white(result.token!.name)}`);
      console.log(`Ticker:    ${chalk.cyan(result.token!.ticker)}`);
      console.log(`Mint:      ${chalk.gray(result.token!.mint)}`);
      console.log(`\nView on pump.fun: ${chalk.blue(result.token!.pumpUrl)}`);
    } catch (error) {
      spinner.fail('Launch failed');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      process.exit(1);
    }
  });

// Dashboard command
program
  .command('dashboard')
  .description('View your token portfolio dashboard')
  .option('-r, --refresh <seconds>', 'Refresh interval in seconds', '30')
  .option('-s, --snapshot', 'Take a snapshot without live refresh', false)
  .action(async (options) => {
    try {
      const agent = createAgent();
      const dashboard = new Dashboard(agent, {
        refreshInterval: parseInt(options.refresh) * 1000,
      });

      if (options.snapshot) {
        await dashboard.snapshot();
      } else {
        await dashboard.start();
      }
    } catch (error) {
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      process.exit(1);
    }
  });

// Balance command
program
  .command('balance')
  .description('Check wallet balance')
  .action(async () => {
    try {
      const agent = createAgent();
      await printSummary(agent);
    } catch (error) {
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      process.exit(1);
    }
  });

// Config check command
program
  .command('config')
  .description('Validate configuration')
  .option('-c, --check', 'Run health checks', true)
  .action(async (options) => {
    const spinner = ora('Checking configuration...').start();

    try {
      const agent = createAgent();
      
      if (options.check) {
        const health = await agent.healthCheck();
        spinner.stop();

        console.log(chalk.bold('\n🥕 Turnip Configuration\n'));
        console.log(`OpenAI:  ${health.openai ? chalk.green('✓ Connected') : chalk.red('✗ Not connected')}`);
        console.log(`Helius:  ${health.helius ? chalk.green('✓ Connected') : chalk.red('✗ Not connected')}`);
        console.log(`Wallet:  ${health.wallet ? chalk.green(`✓ ${health.balance.toFixed(4)} SOL`) : chalk.red('✗ No balance')}`);
        console.log(`Address: ${chalk.gray(agent.getWalletAddress())}`);
        console.log('');

        if (!health.openai || !health.helius || !health.wallet) {
          process.exit(1);
        }
      }
    } catch (error) {
      spinner.fail('Configuration check failed');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      process.exit(1);
    }
  });

// Init command
program
  .command('init')
  .description('Create a new .env file with configuration template')
  .action(() => {
    const template = `# Turnip Configuration

# OpenAI API Key for AI image generation
OPENAI_API_KEY="sk-..."

# Helius API Key for Solana RPC
HELIUS_API_KEY="..."

# Your Solana wallet private key (base58 encoded)
WALLET_PRIVATE_KEY="..."

# Network: "mainnet-beta" or "devnet"
SOLANA_NETWORK="mainnet-beta"

# Image generation settings
IMAGE_QUALITY="high"
IMAGE_SIZE="1024x1024"
IMAGE_FORMAT="png"

# Token deployment settings
DEFAULT_SLIPPAGE="10"
DEV_BUY_AMOUNT="0"
`;

    try {
      writeFileSync('.env', template);
      console.log(chalk.green('✓ Created .env file'));
      console.log(chalk.gray('Edit .env with your API keys to get started.'));
    } catch (error) {
      console.error(chalk.red('Failed to create .env file'));
      process.exit(1);
    }
  });

program.parse();
