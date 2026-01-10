const { getCollectionFinancials } = require("../config/database");
const { ObjectId } = require("mongodb");
const { serverLogger } = require("../utils/logger");

// Pricing constants per model (per token)
const PRICING = {
  "gpt-4.1-mini": {
    input: 0.0000004, // $0.0000004 per input token
    output: 0.0000016, // $0.0000016 per output token
  },
  "gpt-4.1-nano": {
    input: 0.0000002, // $0.0000002 per input token
    output: 0.0000008, // $0.0000008 per output token
  },
};

// Default to mini for backward compatibility
const DEFAULT_MODEL = "gpt-4.1-mini";

/**
 * Calculate cost from OpenAI usage object
 * @param {Object} usage - OpenAI usage object with prompt_tokens, completion_tokens, total_tokens
 * @param {String} model - Model name (gpt-4.1-mini or gpt-4.1-nano), defaults to gpt-4.1-mini
 * @returns {Object} - { inputTokens, outputTokens, totalCostUSD, model }
 */
function calculateAICost(usage, model = DEFAULT_MODEL) {
  if (!usage) {
    return { inputTokens: 0, outputTokens: 0, totalCostUSD: 0, model };
  }

  const inputTokens = usage.prompt_tokens || 0;
  const outputTokens = usage.completion_tokens || 0;

  // Get pricing for the model, fallback to mini if model not found
  const modelPricing = PRICING[model] || PRICING[DEFAULT_MODEL];
  const inputPrice = modelPricing.input;
  const outputPrice = modelPricing.output;

  const inputCost = inputTokens * inputPrice;
  const outputCost = outputTokens * outputPrice;
  const totalCostUSD = inputCost + outputCost;

  return {
    inputTokens,
    outputTokens,
    totalTokens: usage.total_tokens || inputTokens + outputTokens,
    totalCostUSD,
    model,
  };
}

/**
 * Update financials collection with AI expenses
 * Creates a new document for each AI expense with createdAt
 * @param {Number} costUSD - Cost in USD to add
 * @param {Number} inputTokens - Number of input tokens used
 * @param {Number} outputTokens - Number of output tokens used
 */
async function trackAICost(costUSD, inputTokens = 0, outputTokens = 0) {
  try {
    const financialsCol = getCollectionFinancials();
    if (!financialsCol) {
      serverLogger.error("Financials collection not available");
      return;
    }

    // Create new document for each AI expense
    await financialsCol.insertOne({
      expenses: {
        "AI expenses": costUSD,
      },
      createdAt: new Date(),
    });
  } catch (error) {
    serverLogger.error("Error tracking AI cost:", error);
    // Don't throw - we don't want to break the API call if tracking fails
  }
}

/**
 * Track AI usage from OpenAI response
 * @param {Object} usage - OpenAI usage object
 * @param {String} model - Model name (gpt-4.1-mini or gpt-4.1-nano), defaults to gpt-4.1-mini
 */
async function trackAIUsage(usage, model = DEFAULT_MODEL) {
  const costData = calculateAICost(usage, model);
  await trackAICost(
    costData.totalCostUSD,
    costData.inputTokens,
    costData.outputTokens
  );
  return costData;
}

module.exports = {
  calculateAICost,
  trackAICost,
  trackAIUsage,
  PRICING,
  DEFAULT_MODEL,
};
