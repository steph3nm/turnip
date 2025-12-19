export interface GenerateOptions {
    prompt: string;
    quality?: 'low' | 'medium' | 'high';
    size?: '1024x1024' | '1024x1792' | '1792x1024';
    format?: 'png' | 'jpeg' | 'webp';
    outputPath?: string;
}
export interface GeneratedImage {
    url: string;
    base64: string;
    prompt: string;
    revisedPrompt?: string;
    filePath?: string;
}
export declare class ImageGenerator {
    private client;
    private defaultQuality;
    private defaultSize;
    private defaultFormat;
    constructor(config: {
        apiKey: string;
        quality?: 'low' | 'medium' | 'high';
        size?: '1024x1024' | '1024x1792' | '1792x1024';
        format?: 'png' | 'jpeg' | 'webp';
    });
    /**
     * Generate an AI image using OpenAI GPT Image 1.5
     */
    generate(options: GenerateOptions): Promise<GeneratedImage>;
    /**
     * Generate multiple images with variations
     */
    generateVariations(prompt: string, count?: number, options?: Partial<GenerateOptions>): Promise<GeneratedImage[]>;
    /**
     * Enhance a prompt for better art generation
     */
    enhancePrompt(prompt: string): Promise<string>;
    /**
     * Get estimated cost for generation
     */
    estimateCost(quality: 'low' | 'medium' | 'high', size: string): number;
}
