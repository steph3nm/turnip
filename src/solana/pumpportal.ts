import { Keypair, Connection, VersionedTransaction } from '@solana/web3.js';
import axios from 'axios';
import FormData from 'form-data';
import bs58 from 'bs58';

export interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image: Buffer | string; // Base64 or Buffer
  twitter?: string;
  telegram?: string;
  website?: string;
}

export interface DeployOptions {
  metadata: TokenMetadata;
  devBuyAmount?: number; // SOL amount to buy at launch
  slippage?: number; // Slippage percentage (default 10)
}

export interface DeployResult {
  success: boolean;
  mint?: string;
  signature?: string;
  metadataUri?: string;
  pumpUrl?: string;
  error?: string;
}

export class PumpPortalClient {
  private connection: Connection;
  private wallet: Keypair;
  private baseUrl: string = 'https://pumpportal.fun/api';

  constructor(config: {
    connection: Connection;
    privateKey: string;
  }) {
    this.connection = config.connection;
    
    // Parse private key (base58 encoded)
    try {
      const secretKey = bs58.decode(config.privateKey);
      this.wallet = Keypair.fromSecretKey(secretKey);
    } catch (error) {
      throw new Error('Invalid wallet private key. Must be base58 encoded.');
    }
  }

  /**
   * Get the wallet public key
   */
  getPublicKey(): string {
    return this.wallet.publicKey.toBase58();
  }

  /**
   * Upload metadata and image to IPFS via PumpPortal
   */
  async uploadMetadata(metadata: TokenMetadata): Promise<string> {
    const formData = new FormData();
    
    formData.append('name', metadata.name);
    formData.append('symbol', metadata.symbol);
    formData.append('description', metadata.description);
    
    // Handle image - convert base64 to buffer if needed
    let imageBuffer: Buffer;
    if (typeof metadata.image === 'string') {
      imageBuffer = Buffer.from(metadata.image, 'base64');
    } else {
      imageBuffer = metadata.image;
    }
    formData.append('file', imageBuffer, { filename: 'image.png', contentType: 'image/png' });

    if (metadata.twitter) formData.append('twitter', metadata.twitter);
    if (metadata.telegram) formData.append('telegram', metadata.telegram);
    if (metadata.website) formData.append('website', metadata.website);
    formData.append('showName', 'true');

    const response = await axios.post(
      `${this.baseUrl}/ipfs`,
      formData,
      {
        headers: formData.getHeaders(),
      }
    );

    if (!response.data.metadataUri) {
      throw new Error('Failed to upload metadata to IPFS');
    }

    return response.data.metadataUri;
  }

  /**
   * Deploy a new token on pump.fun
   */
  async deploy(options: DeployOptions): Promise<DeployResult> {
    try {
      // First upload metadata to IPFS
      const metadataUri = await this.uploadMetadata(options.metadata);
      
      // Generate a new mint keypair
      const mintKeypair = Keypair.generate();

      // Create the token via PumpPortal API
      const response = await axios.post(
        `${this.baseUrl}/trade-local`,
        {
          publicKey: this.wallet.publicKey.toBase58(),
          action: 'create',
          tokenMetadata: {
            name: options.metadata.name,
            symbol: options.metadata.symbol,
            uri: metadataUri,
          },
          mint: mintKeypair.publicKey.toBase58(),
          denominatedInSol: 'true',
          amount: options.devBuyAmount || 0, // Dev buy amount in SOL
          slippage: options.slippage || 10,
          priorityFee: 0.0005,
          pool: 'pump',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.data) {
        throw new Error('No response from PumpPortal API');
      }

      // Decode and sign the transaction
      const tx = VersionedTransaction.deserialize(
        new Uint8Array(Buffer.from(response.data, 'base64'))
      );

      tx.sign([this.wallet, mintKeypair]);

      // Send the transaction
      const signature = await this.connection.sendTransaction(tx, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 3,
      });

      // Wait for confirmation
      const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      return {
        success: true,
        mint: mintKeypair.publicKey.toBase58(),
        signature,
        metadataUri,
        pumpUrl: `https://pump.fun/${mintKeypair.publicKey.toBase58()}`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Buy tokens on pump.fun
   */
  async buy(mint: string, solAmount: number, slippage: number = 10): Promise<{
    success: boolean;
    signature?: string;
    error?: string;
  }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/trade-local`,
        {
          publicKey: this.wallet.publicKey.toBase58(),
          action: 'buy',
          mint,
          denominatedInSol: 'true',
          amount: solAmount,
          slippage,
          priorityFee: 0.0005,
          pool: 'pump',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const tx = VersionedTransaction.deserialize(
        new Uint8Array(Buffer.from(response.data, 'base64'))
      );

      tx.sign([this.wallet]);

      const signature = await this.connection.sendTransaction(tx, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      await this.connection.confirmTransaction(signature, 'confirmed');

      return { success: true, signature };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  /**
   * Sell tokens on pump.fun
   */
  async sell(mint: string, tokenAmount: number, slippage: number = 10): Promise<{
    success: boolean;
    signature?: string;
    error?: string;
  }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/trade-local`,
        {
          publicKey: this.wallet.publicKey.toBase58(),
          action: 'sell',
          mint,
          denominatedInSol: 'false',
          amount: tokenAmount,
          slippage,
          priorityFee: 0.0005,
          pool: 'pump',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const tx = VersionedTransaction.deserialize(
        new Uint8Array(Buffer.from(response.data, 'base64'))
      );

      tx.sign([this.wallet]);

      const signature = await this.connection.sendTransaction(tx, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      await this.connection.confirmTransaction(signature, 'confirmed');

      return { success: true, signature };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }
}
