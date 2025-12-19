# 🥕 Turnip Agent

An agent for generating and tokenizing unique AI art on-chain using OpenAI GPT Image 1.5, PumpPortal, and Helius APIs on Solana.

## Features

- **AI Art Generation** - Generate unique images using OpenAI's GPT Image 1.5
- **One-Click Token Launch** - Deploy AI-generated art as tokens on pump.fun
- **Portfolio Dashboard** - Track your deployed tokens and holdings
- **Prompt Enhancement** - AI-powered prompt optimization for better images

## Installation

```bash
npm install -g turnip-agent
```

## Quick Start

1. Initialize configuration:
```bash
turnip init
```

2. Edit `.env` with your API keys:
```env
OPENAI_API_KEY="sk-..."
HELIUS_API_KEY="..."
WALLET_PRIVATE_KEY="..."
```

3. Generate and launch a token:
```bash
turnip launch "a cosmic turnip floating in space" --name "Cosmic Turnip" --ticker CTRNP
```

## Commands

### Generate AI Art
```bash
# Basic generation
turnip generate "a purple cat riding a skateboard"

# With options
turnip generate "abstract art" -q high -s 1024x1792 -o my-art.png

# With AI prompt enhancement
turnip generate "cool art" --enhance
```

### Deploy as Token
```bash
# Deploy an existing image
turnip deploy ./my-art.png --name "My Token" --ticker MYT

# With metadata
turnip deploy ./art.png -n "Token Name" -t TICK --twitter @handle --website https://example.com
```

### Launch (Generate + Deploy)
```bash
# Full launch in one command
turnip launch "vibrant pixel art of a turnip" -n "Pixel Turnip" -t PTRN

# With dev buy
turnip launch "rare pepe" -n "Rare Pepe" -t RPEPE --dev-buy 0.5
```

### Dashboard
```bash
# Live dashboard
turnip dashboard

# Snapshot (no refresh)
turnip dashboard --snapshot
```

### Utilities
```bash
# Check balance
turnip balance

# Validate configuration
turnip config --check

# Create .env template
turnip init
```

## Programmatic Usage

```typescript
import { TurnipAgent } from 'turnip-agent';

const agent = new TurnipAgent({
  openaiApiKey: 'sk-...',
  heliusApiKey: '...',
  walletPrivateKey: '...',
  network: 'mainnet-beta',
});

// Generate an image
const image = await agent.generate({
  prompt: 'a beautiful sunset over mountains',
  quality: 'high',
});

// Deploy as token
const result = await agent.deploy({
  image,
  name: 'Sunset Token',
  ticker: 'SUNSET',
});

// Or do it all in one step
const launched = await agent.launch({
  prompt: 'cosmic abstract art',
  name: 'Cosmic Token',
  ticker: 'COSM',
  devBuyAmount: 0.1,
});

console.log(`Token deployed: ${launched.token.pumpUrl}`);
```

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | - | OpenAI API key for image generation |
| `HELIUS_API_KEY` | Yes | - | Helius API key for Solana RPC |
| `WALLET_PRIVATE_KEY` | Yes | - | Solana wallet private key (base58) |
| `SOLANA_NETWORK` | No | `mainnet-beta` | Network (`mainnet-beta` or `devnet`) |
| `IMAGE_QUALITY` | No | `high` | Image quality (`low`, `medium`, `high`) |
| `IMAGE_SIZE` | No | `1024x1024` | Image dimensions |
| `IMAGE_FORMAT` | No | `png` | Output format (`png`, `jpeg`, `webp`) |
| `DEFAULT_SLIPPAGE` | No | `10` | Default slippage percentage |
| `DEV_BUY_AMOUNT` | No | `0` | Default dev buy amount in SOL |

## Costs

| Action | Estimated Cost |
|--------|----------------|
| Image Generation (high) | ~$0.04 |
| Image Generation (medium) | ~$0.02 |
| Image Generation (low) | ~$0.01 |
| Token Deployment | ~0.02 SOL |
| Prompt Enhancement | ~$0.001 |

## Links

- Website: [turnip.sh](https://turnip.sh)
- Documentation: [turnip.sh/docs](https://turnip.sh/docs)
- Twitter: [@turnip](https://x.com/turnip)
- GitHub: [github.com/steph3nm/turnip](https://github.com/steph3nm/turnip)

## License

MIT © [steph3n](https://x.com/__steph3n)
