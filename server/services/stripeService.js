// Initialize Stripe with secret key
// IMPORTANT: Make sure STRIPE_SECRET_KEY is set in .env
// - Test mode: sk_test_... (from Stripe Dashboard > Developers > API keys)
// - Production: sk_live_... (when ready for production)
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const fs = require("fs");
const path = require("path");

// Platform fee percentage - read from dry-data.json
function getPlatformFeePercent() {
  try {
    const dryDataPath = path.join(__dirname, "../API/dry-data.json");
    const dryData = JSON.parse(fs.readFileSync(dryDataPath, "utf8"));
    return parseFloat(dryData.FEE) || 10; // Default to 10% if not found
  } catch (error) {
    console.error("[stripeService] Error reading dry-data.json:", error);
    return parseFloat(process.env.PLATFORM_FEE_PERCENT) || 10; // Fallback to env or default
  }
}

// Get current platform fee (read from file each time to get latest value)
// Note: Always read from file to ensure we get the latest dynamic value from dry-data.json
// No caching to ensure real-time updates
function getCachedPlatformFeePercent() {
  // Always read fresh from file - no cache for dynamic updates
  return getPlatformFeePercent();
}

// Export as function reference, not as constant, to ensure dynamic reading
// This ensures we always read the latest value from dry-data.json
const PLATFORM_FEE_PERCENT = getPlatformFeePercent;

// Function to update platform fee in dry-data.json
function updatePlatformFeePercent(newFee) {
  try {
    const dryDataPath = path.join(__dirname, "../API/dry-data.json");
    const dryData = JSON.parse(fs.readFileSync(dryDataPath, "utf8"));
    dryData.FEE = parseFloat(newFee);
    fs.writeFileSync(dryDataPath, JSON.stringify(dryData, null, 2), "utf8");
    // No cache - always reads fresh from file
    return true;
  } catch (error) {
    console.error("[stripeService] Error updating dry-data.json:", error);
    return false;
  }
}

/**
 * Get or create a Stripe Connect account for a handyman
 * @param {Object} handymanUser - Handyman user object from DB
 * @param {Object} usersCollection - MongoDB collection for users
 * @returns {Promise<string>} Stripe account ID (acct_...)
 */
async function getOrCreateConnectedAccount(handymanUser, usersCollection) {
  try {
    // If handyman already has a Stripe account ID, return it
    if (handymanUser.stripeAccountId) {
      return handymanUser.stripeAccountId;
    }

    // Create a new Stripe Express account
    // Note: For Israel (IL), card_payments capability is not supported
    // We only request transfers capability for cross-border payouts
    // For IL accounts, we need to specify 'recipient' service agreement
    const account = await stripe.accounts.create({
      type: "express",
      country: "IL", // Israel
      email: handymanUser.email,
      capabilities: {
        transfers: { requested: true },
      },
      tos_acceptance: {
        service_agreement: "recipient",
      },
    });

    // Save the account ID to the database
    if (usersCollection && handymanUser._id) {
      await usersCollection.updateOne(
        { _id: handymanUser._id },
        { $set: { stripeAccountId: account.id } }
      );
    }

    return account.id;
  } catch (error) {
    // Check if the error is about Stripe Connect not being enabled
    if (error.message && error.message.includes("signed up for Connect")) {
      // Return null instead of throwing - let the calling code handle it
      return null;
    }

    // Check if the error is about card_payments capability for IL
    if (
      error.message &&
      error.message.includes("card_payments") &&
      error.message.includes("IL")
    ) {
      // Return null - account creation failed
      return null;
    }

    // Check if the error is about recipient service agreement for IL
    if (
      error.message &&
      error.message.includes("recipient") &&
      error.message.includes("IL")
    ) {
      // Return null - account creation failed
      return null;
    }

    // For other errors, still throw
    throw error;
  }
}

/**
 * Create an onboarding link for a Stripe Connect account
 * @param {string} accountId - Stripe account ID (acct_...)
 * @param {string} returnUrl - URL to return to after onboarding
 * @param {string} refreshUrl - URL to refresh onboarding if incomplete
 * @returns {Promise<string>} Onboarding URL
 */
async function createOnboardingLink(accountId, returnUrl, refreshUrl) {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      return_url: returnUrl,
      refresh_url: refreshUrl,
    });

    return accountLink.url;
  } catch (error) {
    throw error;
  }
}

/**
 * Create an Escrow Payment Intent with Stripe Connect
 * @param {Object} params - Payment parameters
 * @param {number} params.amountAgorot - Amount in agorot (ILS smallest unit)
 * @param {string} params.currency - Currency code (default: 'ils')
 * @param {string} params.handymanAccountId - Handyman's Stripe Connect account ID
 * @param {number} params.platformFeeAgorot - Platform fee in agorot
 * @param {Object} params.metadata - Additional metadata
 * @returns {Promise<Object>} {clientSecret, paymentIntentId, status}
 */
async function createEscrowPaymentIntent({
  amountAgorot,
  currency = "ils",
  handymanAccountId,
  platformFeeAgorot,
  metadata = {},
}) {
  try {
    if (!handymanAccountId || !handymanAccountId.startsWith("acct_")) {
      const error = new Error(
        `Invalid handymanAccountId: ${handymanAccountId}`
      );
      console.error(`[stripeService] ❌ ${error.message}`);
      throw error;
    }

    if (!amountAgorot || amountAgorot <= 0) {
      const error = new Error(`Invalid amountAgorot: ${amountAgorot}`);
      console.error(`[stripeService] ❌ ${error.message}`);
      throw error;
    }

    // Add timeout to prevent hanging (15 seconds - more reasonable)
    const createPromise = stripe.paymentIntents.create({
      amount: amountAgorot,
      currency: currency,
      capture_method: "manual", // Escrow: authorize now, capture later
      transfer_data: {
        destination: handymanAccountId,
      },
      application_fee_amount: platformFeeAgorot,
      metadata: metadata,
      automatic_payment_methods: {
        enabled: true, // Enable Apple Pay, Google Pay, and other wallets
      },
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            "Stripe API call timeout after 15 seconds - please check your internet connection or Stripe service status"
          )
        );
      }, 15000);
    });

    const paymentIntent = await Promise.race([createPromise, timeoutPromise]);

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    };
  } catch (error) {
    console.error(`[stripeService] ❌ Error creating Payment Intent:`, {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Create a Payment Intent for a job (legacy function - kept for backward compatibility)
 * @param {number} amount - Amount in agorot (ILS smallest unit) - e.g., 10000 for 100 ILS
 * @param {string} jobId - Job ID
 * @param {string} clientId - Client ID
 * @param {string} metadata - Additional metadata
 * @returns {Promise<Object>} Payment Intent object
 */
async function createPaymentIntent(amount, jobId, clientId, metadata = {}) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in agorot (ILS smallest unit)
      currency: "ils",
      metadata: {
        jobId: jobId,
        clientId: clientId,
        ...metadata,
      },
      // Capture method: manual means we'll capture the payment later (Escrow pattern)
      capture_method: "manual",
      // Enable Apple Pay, Google Pay, and other wallets
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return paymentIntent;
  } catch (error) {
    throw error;
  }
}

/**
 * Capture a Payment Intent (charge the customer) - Escrow release
 * @param {string} paymentIntentId - Payment Intent ID
 * @returns {Promise<Object>} Payment Intent object
 */
async function capturePaymentIntent(paymentIntentId) {
  try {
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    throw error;
  }
}

/**
 * Capture Escrow payment (alias for capturePaymentIntent)
 * @param {string} paymentIntentId - Payment Intent ID
 * @returns {Promise<Object>} Payment Intent object
 */
async function captureEscrow(paymentIntentId) {
  return capturePaymentIntent(paymentIntentId);
}

/**
 * Create a Transfer to handyman's account
 * @param {number} amount - Amount in agorot to transfer to handyman
 * @param {string} handymanStripeAccountId - Handyman's Stripe Connect account ID (if exists)
 * @param {string} metadata - Additional metadata
 * @returns {Promise<Object>} Transfer object
 */
async function createTransfer(amount, handymanStripeAccountId, metadata = {}) {
  try {
    // For now, we'll use a platform account transfer
    // In the future, this could be a Stripe Connect transfer if handymen have Connect accounts
    const transfer = await stripe.transfers.create({
      amount: amount,
      currency: "ils",
      destination: handymanStripeAccountId || null, // If handyman has Stripe account
      metadata: metadata,
    });

    return transfer;
  } catch (error) {
    throw error;
  }
}

/**
 * Cancel a Payment Intent
 * @param {string} paymentIntentId - Payment Intent ID
 * @returns {Promise<Object>} Payment Intent object
 */
async function cancelPaymentIntent(paymentIntentId) {
  try {
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    throw error;
  }
}

/**
 * Cancel Escrow payment (alias for cancelPaymentIntent)
 * @param {string} paymentIntentId - Payment Intent ID
 * @returns {Promise<Object>} Payment Intent object
 */
async function cancelEscrow(paymentIntentId) {
  return cancelPaymentIntent(paymentIntentId);
}

/**
 * Refund a payment
 * @param {string} paymentIntentId - Payment Intent ID
 * @param {number} amountAgorot - Optional: amount to refund in agorot (if not provided, full refund)
 * @returns {Promise<Object>} Refund object
 */
async function refundPayment(paymentIntentId, amountAgorot = null) {
  try {
    // First, get the payment intent to find the charge ID
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent.latest_charge) {
      throw new Error("No charge found for this payment intent");
    }

    const refundParams = {
      charge: paymentIntent.latest_charge,
    };

    if (amountAgorot !== null && amountAgorot > 0) {
      refundParams.amount = amountAgorot;
    }

    const refund = await stripe.refunds.create(refundParams);
    return refund;
  } catch (error) {
    throw error;
  }
}

/**
 * Get Payment Intent details
 * @param {string} paymentIntentId - Payment Intent ID
 * @returns {Promise<Object>} Payment Intent object
 */
async function getPaymentIntent(paymentIntentId) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  // Legacy functions (kept for backward compatibility)
  createPaymentIntent,
  capturePaymentIntent,
  createTransfer,
  cancelPaymentIntent,
  getPaymentIntent,
  // New Stripe Connect functions
  getOrCreateConnectedAccount,
  createOnboardingLink,
  createEscrowPaymentIntent,
  captureEscrow,
  cancelEscrow,
  refundPayment,
  // Constants and functions
  PLATFORM_FEE_PERCENT,
  getPlatformFeePercent,
  updatePlatformFeePercent,
};
