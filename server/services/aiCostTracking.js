const { getCollectionFinancials } = require("../config/database");
const { ObjectId } = require("mongodb");

// Pricing constants (per token)
const INPUT_TOKEN_PRICE = 0.00000015; // $0.00000015 per input token
const OUTPUT_TOKEN_PRICE = 0.0000006; // $0.0000006 per output token

/**
 * Calculate cost from OpenAI usage object
 * @param {Object} usage - OpenAI usage object with prompt_tokens, completion_tokens, total_tokens
 * @returns {Object} - { inputTokens, outputTokens, totalCostUSD }
 */
function calculateAICost(usage) {
  if (!usage) {
    return { inputTokens: 0, outputTokens: 0, totalCostUSD: 0 };
  }

  const inputTokens = usage.prompt_tokens || 0;
  const outputTokens = usage.completion_tokens || 0;

  const inputCost = inputTokens * INPUT_TOKEN_PRICE;
  const outputCost = outputTokens * OUTPUT_TOKEN_PRICE;
  const totalCostUSD = inputCost + outputCost;

  return {
    inputTokens,
    outputTokens,
    totalTokens: usage.total_tokens || inputTokens + outputTokens,
    totalCostUSD,
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
      console.error("Financials collection not available");
      return;
    }

    // Create new document for each AI expense
    await financialsCol.insertOne({
      expenses: {
        "AI expenses": costUSD,
      },
      createdAt: new Date(),
      // Store token info if needed for analytics
      metadata: {
        inputTokens,
        outputTokens,
      },
    });
  } catch (error) {
    console.error("Error tracking AI cost:", error);
    // Don't throw - we don't want to break the API call if tracking fails
  }
}

/**
 * Track AI usage from OpenAI response
 * @param {Object} usage - OpenAI usage object
 */
async function trackAIUsage(usage) {
  const costData = calculateAICost(usage);
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
  INPUT_TOKEN_PRICE,
  OUTPUT_TOKEN_PRICE,
};
