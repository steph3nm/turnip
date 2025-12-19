"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageGenerator = void 0;
const openai_1 = __importDefault(require("openai"));
const fs_1 = require("fs");
class ImageGenerator {
    constructor(config) {
        this.client = new openai_1.default({ apiKey: config.apiKey });
        this.defaultQuality = config.quality || 'high';
        this.defaultSize = config.size || '1024x1024';
        this.defaultFormat = config.format || 'png';
    }
    /**
     * Generate an AI image using OpenAI GPT Image 1.5
     */
    async generate(options) {
        const quality = options.quality || this.defaultQuality;
        const size = options.size || this.defaultSize;
        const format = options.format || this.defaultFormat;
        // Map quality to OpenAI parameters
        const qualityMap = {
            low: 'low',
            medium: 'medium',
            high: 'high',
        };
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
        const result = {
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
            (0, fs_1.writeFileSync)(filePath, buffer);
            result.filePath = filePath;
        }
        return result;
    }
    /**
     * Generate multiple images with variations
     */
    async generateVariations(prompt, count = 3, options) {
        const variations = [];
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
    async enhancePrompt(prompt) {
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
    estimateCost(quality, size) {
        // GPT Image 1.5 pricing (approximate)
        const basePrices = {
            low: 0.01,
            medium: 0.02,
            high: 0.04,
        };
        const sizeMultipliers = {
            '1024x1024': 1,
            '1024x1792': 1.5,
            '1792x1024': 1.5,
        };
        return basePrices[quality] * (sizeMultipliers[size] || 1);
    }
}
exports.ImageGenerator = ImageGenerator;
