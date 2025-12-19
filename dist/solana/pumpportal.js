"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PumpPortalClient = void 0;
const web3_js_1 = require("@solana/web3.js");
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const bs58_1 = __importDefault(require("bs58"));
class PumpPortalClient {
    constructor(config) {
        this.baseUrl = 'https://pumpportal.fun/api';
        this.connection = config.connection;
        // Parse private key (base58 encoded)
        try {
            const secretKey = bs58_1.default.decode(config.privateKey);
            this.wallet = web3_js_1.Keypair.fromSecretKey(secretKey);
        }
        catch (error) {
            throw new Error('Invalid wallet private key. Must be base58 encoded.');
        }
    }
    /**
     * Get the wallet public key
     */
    getPublicKey() {
        return this.wallet.publicKey.toBase58();
    }
    /**
     * Upload metadata and image to IPFS via PumpPortal
     */
    async uploadMetadata(metadata) {
        const formData = new form_data_1.default();
        formData.append('name', metadata.name);
        formData.append('symbol', metadata.symbol);
        formData.append('description', metadata.description);
        // Handle image - convert base64 to buffer if needed
        let imageBuffer;
        if (typeof metadata.image === 'string') {
            imageBuffer = Buffer.from(metadata.image, 'base64');
        }
        else {
            imageBuffer = metadata.image;
        }
        formData.append('file', imageBuffer, { filename: 'image.png', contentType: 'image/png' });
        if (metadata.twitter)
            formData.append('twitter', metadata.twitter);
        if (metadata.telegram)
            formData.append('telegram', metadata.telegram);
        if (metadata.website)
            formData.append('website', metadata.website);
        formData.append('showName', 'true');
        const response = await axios_1.default.post(`${this.baseUrl}/ipfs`, formData, {
            headers: formData.getHeaders(),
        });
        if (!response.data.metadataUri) {
            throw new Error('Failed to upload metadata to IPFS');
        }
        return response.data.metadataUri;
    }
    /**
     * Deploy a new token on pump.fun
     */
    async deploy(options) {
        try {
            // First upload metadata to IPFS
            const metadataUri = await this.uploadMetadata(options.metadata);
            // Generate a new mint keypair
            const mintKeypair = web3_js_1.Keypair.generate();
            // Create the token via PumpPortal API
            const response = await axios_1.default.post(`${this.baseUrl}/trade-local`, {
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
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.data) {
                throw new Error('No response from PumpPortal API');
            }
            // Decode and sign the transaction
            const tx = web3_js_1.VersionedTransaction.deserialize(new Uint8Array(Buffer.from(response.data, 'base64')));
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
        }
        catch (error) {
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
    async buy(mint, solAmount, slippage = 10) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/trade-local`, {
                publicKey: this.wallet.publicKey.toBase58(),
                action: 'buy',
                mint,
                denominatedInSol: 'true',
                amount: solAmount,
                slippage,
                priorityFee: 0.0005,
                pool: 'pump',
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const tx = web3_js_1.VersionedTransaction.deserialize(new Uint8Array(Buffer.from(response.data, 'base64')));
            tx.sign([this.wallet]);
            const signature = await this.connection.sendTransaction(tx, {
                skipPreflight: false,
                preflightCommitment: 'confirmed',
            });
            await this.connection.confirmTransaction(signature, 'confirmed');
            return { success: true, signature };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, error: message };
        }
    }
    /**
     * Sell tokens on pump.fun
     */
    async sell(mint, tokenAmount, slippage = 10) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/trade-local`, {
                publicKey: this.wallet.publicKey.toBase58(),
                action: 'sell',
                mint,
                denominatedInSol: 'false',
                amount: tokenAmount,
                slippage,
                priorityFee: 0.0005,
                pool: 'pump',
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const tx = web3_js_1.VersionedTransaction.deserialize(new Uint8Array(Buffer.from(response.data, 'base64')));
            tx.sign([this.wallet]);
            const signature = await this.connection.sendTransaction(tx, {
                skipPreflight: false,
                preflightCommitment: 'confirmed',
            });
            await this.connection.confirmTransaction(signature, 'confirmed');
            return { success: true, signature };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, error: message };
        }
    }
}
exports.PumpPortalClient = PumpPortalClient;
