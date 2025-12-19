"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIStrategy = void 0;
const openai_1 = __importDefault(require("openai"));
const chalk_1 = __importDefault(require("chalk"));
class AIStrategy {
    constructor(aiProvider, apiKey) {
        if (aiProvider === 'openai') {
            this.ai = new openai_1.default({ apiKey });
            this.model = 'gpt-4-turbo-preview';
        }
        else {
            this.ai = new openai_1.default({
                apiKey,
                baseURL: 'https://openrouter.ai/api/v1',
            });
            this.model = 'anthropic/claude-3.5-sonnet';
        }
    }
    /**
     * Analyze market conditions and generate trading decision
     * Uses advanced AI prompting with technical analysis context
     */
    async analyzeTrade(symbol, marketData, accountValue, riskPercentage) {
        try {
            const prompt = `You are mucch, an elite cryptocurrency trading AI specializing in perpetuals and futures on Hyperliquid.

Your mission: Analyze ${symbol} and provide a precise trading decision with risk management.

=== MARKET DATA ===
Symbol: ${symbol}
Current Price: $${marketData.price.toFixed(2)}
24h Change: ${marketData.change24h >= 0 ? '+' : ''}${marketData.change24h.toFixed(2)}%
24h Volume: $${marketData.volume.toFixed(2)}
24h High: $${marketData.high24h.toFixed(2)}
24h Low: $${marketData.low24h.toFixed(2)}

=== ACCOUNT INFO ===
Account Value: $${accountValue.toFixed(2)}
Risk Per Trade: ${riskPercentage}%
Max Position Size: $${(accountValue * (riskPercentage / 100)).toFixed(2)}

=== ANALYSIS FRAMEWORK ===
1. Trend Analysis: Is the price trending up/down/sideways?
2. Volatility: Is the 24h range indicating high volatility?
3. Volume: Is volume confirming the price action?
4. Risk/Reward: What's the optimal entry, stop loss, and take profit?

=== OUTPUT FORMAT ===
Provide your analysis in exactly this JSON format (no markdown, just raw JSON):
{
  "action": "BUY" | "SELL" | "HOLD",
  "confidence": 0-100,
  "reasoning": "2-3 sentence analysis",
  "suggestedSize": position size in ${symbol},
  "stopLoss": stop loss price,
  "takeProfit": take profit price
}

Be conservative. Only suggest BUY/SELL if confidence is >70%. Consider market conditions carefully.`;
            const response = await this.ai.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are mucch, an expert AI trading analyst. Respond only with valid JSON. Be precise and conservative in your recommendations.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 500,
                temperature: 0.3, // Lower temperature for more consistent, conservative decisions
            });
            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No response from AI');
            }
            // Parse JSON response
            const decision = JSON.parse(content);
            // Validate and sanitize the decision
            if (!['BUY', 'SELL', 'HOLD'].includes(decision.action)) {
                decision.action = 'HOLD';
            }
            decision.confidence = Math.max(0, Math.min(100, decision.confidence));
            console.log(chalk_1.default.cyan(`\n🤖 AI Analysis for ${symbol}:`));
            console.log(chalk_1.default.white(`   Action: ${decision.action}`));
            console.log(chalk_1.default.white(`   Confidence: ${decision.confidence}%`));
            console.log(chalk_1.default.gray(`   Reasoning: ${decision.reasoning}`));
            if (decision.action !== 'HOLD') {
                console.log(chalk_1.default.yellow(`   Suggested Size: ${decision.suggestedSize} ${symbol}`));
                if (decision.stopLoss) {
                    console.log(chalk_1.default.red(`   Stop Loss: $${decision.stopLoss.toFixed(2)}`));
                }
                if (decision.takeProfit) {
                    console.log(chalk_1.default.green(`   Take Profit: $${decision.takeProfit.toFixed(2)}`));
                }
            }
            return decision;
        }
        catch (error) {
            console.error(chalk_1.default.red('Error in AI analysis:'), error);
            // Return safe default
            return {
                action: 'HOLD',
                confidence: 0,
                reasoning: 'AI analysis failed, defaulting to HOLD for safety',
            };
        }
    }
    /**
     * Get quick market sentiment for display
     */
    async getMarketSentiment(symbol, marketData) {
        try {
            const prompt = `Provide a one-sentence market sentiment for ${symbol} trading at $${marketData.price} with ${marketData.change24h >= 0 ? '+' : ''}${marketData.change24h.toFixed(2)}% 24h change.`;
            const response = await this.ai.chat.completions.create({
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 50,
                temperature: 0.7,
            });
            return response.choices[0]?.message?.content || 'Neutral';
        }
        catch (error) {
            return 'Unable to determine sentiment';
        }
    }
    /**
     * Analyze overall market conditions across multiple symbols
     */
    async analyzeMarketConditions(marketDataMap) {
        try {
            const summaries = [];
            marketDataMap.forEach((data, symbol) => {
                summaries.push(`${symbol}: $${data.price.toFixed(2)} (${data.change24h >= 0 ? '+' : ''}${data.change24h.toFixed(2)}%)`);
            });
            const prompt = `Based on these crypto market conditions:\n${summaries.join('\n')}\n\nProvide a brief overall market sentiment in 2 sentences.`;
            const response = await this.ai.chat.completions.create({
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 100,
                temperature: 0.7,
            });
            return response.choices[0]?.message?.content || 'Market conditions unclear';
        }
        catch (error) {
            return 'Unable to analyze market conditions';
        }
    }
}
exports.AIStrategy = AIStrategy;
