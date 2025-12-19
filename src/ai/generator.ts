import OpenAI from 'openai';
import { writeFileSync } from 'fs';
import { join } from 'path';

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

export class ImageGenerator {
  private client: OpenAI;
  private defaultQuality: 'low' | 'medium' | 'high';
  private defaultSize: '1024x1024' | '1024x1792' | '1792x1024';
  private defaultFormat: 'png' | 'jpeg' | 'webp';

  constructor(config: {
    apiKey: string;
    quality?: 'low' | 'medium' | 'high';
    size?: '1024x1024' | '1024x1792' | '1792x1024';
    format?: 'png' | 'jpeg' | 'webp';
  }) {
    this.client = new OpenAI({ apiKey: config.apiKey });
    this.defaultQuality = config.quality || 'high';
    this.defaultSize = config.size || '1024x1024';
    this.defaultFormat = config.format || 'png';
  }

  /**
   * Generate an AI image using OpenAI GPT Image 1.5
   */
  async generate(options: GenerateOptions): Promise<GeneratedImage> {
    const quality = options.quality || this.defaultQuality;
    const size = options.size || this.defaultSize;
    const format = options.format || this.defaultFormat;

    // Map quality to OpenAI parameters
    const qualityMap = {
      low: 'low',
      medium: 'medium',
      high: 'high',
    } as const;

    const response = await this.client.images.generate({
      model: 'gpt-image-1',
      prompt: options.prompt,
      n: 1,
      size: size,
      quality: qualityMap[quality],
      response_format: 'b64_json',
    });

    const imageData = response.data?.[0];
    
    if (!imageData?.b64_json) {
      throw new Error('No image data returned from OpenAI');
    }

    const result: GeneratedImage = {
      url: imageData.url || '',
      base64: imageData.b64_json,
      prompt: options.prompt,
      revisedPrompt: imageData.revised_prompt,
    };

    // Save to file if path provided
    if (options.outputPath) {
      const buffer = Buffer.from(imageData.b64_json, 'base64');
      const filePath = options.outputPath.endsWith(`.${format}`) 
        ? options.outputPath 
        : `${options.outputPath}.${format}`;
      writeFileSync(filePath, buffer);
      result.filePath = filePath;
    }

    return result;
  }

  /**
   * Generate multiple images with variations
   */
  async generateVariations(
    prompt: string,
    count: number = 3,
    options?: Partial<GenerateOptions>
  ): Promise<GeneratedImage[]> {
    const variations: GeneratedImage[] = [];
    
    for (let i = 0; i < count; i++) {
      const variation = await this.generate({
        prompt: `${prompt} (variation ${i + 1})`,
        ...options,
      });
      variations.push(variation);
    }

    return variations;
  }

  /**
   * Enhance a prompt for better art generation
   */
  async enhancePrompt(prompt: string): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert at crafting prompts for AI image generation. 
Your task is to enhance the given prompt to create more vivid, detailed, and artistic images.
Focus on:
- Adding artistic style references (e.g., "in the style of vaporwave", "pixel art aesthetic")
- Enhancing visual details (lighting, colors, composition)
- Adding mood and atmosphere
- Keeping the core concept intact
Return only the enhanced prompt, nothing else.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content || prompt;
  }

  /**
   * Get estimated cost for generation
   */
  estimateCost(quality: 'low' | 'medium' | 'high', size: string): number {
    // GPT Image 1.5 pricing (approximate)
    const basePrices = {
      low: 0.01,
      medium: 0.02,
      high: 0.04,
    };

    const sizeMultipliers: Record<string, number> = {
      '1024x1024': 1,
      '1024x1792': 1.5,
      '1792x1024': 1.5,
    };

    return basePrices[quality] * (sizeMultipliers[size] || 1);
  }
}
