// Initialize Stripe with secret key
// IMPORTANT: Make sure STRIPE_SECRET_KEY is set in .env
// - Test mode: sk_test_... (from Stripe Dashboard > Developers > API keys)
// - Production: sk_live_... (when ready for production)
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Platform fee percentage (default 10%)
// Can be overridden with PLATFORM_FEE_PERCENT in .env
const PLATFORM_FEE_PERCENT = parseFloat(process.env.PLATFORM_FEE_PERCENT) || 10;

/**
 * Get or create a Stripe Connect account for a handyman
 * @param {Object} handymanUser - Handyman user object from DB
 * @param {Object} usersCollection - MongoDB collection for users
 * @returns {Promise<string>} Stripe account ID (acct_...)
 */
async function getOrCreateConnectedAccount(handymanUser, usersCollection) {
  try {
    console.log(
      `[stripeService] Getting or creating Stripe Connect account for handyman: ${handymanUser._id}`
    );

    // If handyman already has a Stripe account ID, return it
    if (handymanUser.stripeAccountId) {
      console.log(
        `[stripeService] Handyman already has Stripe account: ${handymanUser.stripeAccountId}`
      );
      return handymanUser.stripeAccountId;
    }

    console.log(
      `[stripeService] Creating new Stripe Express account for handyman: ${handymanUser.email}`
    );

    // Create a new Stripe Express account
    const account = await stripe.accounts.create({
      type: "express",
      country: "IL", // Israel
      email: handymanUser.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    console.log(`[stripeService] Stripe account created: ${account.id}`);

    // Save the account ID to the database
    if (usersCollection && handymanUser._id) {
      await usersCollection.updateOne(
        { _id: handymanUser._id },
        { $set: { stripeAccountId: account.id } }
      );
      console.log(
        `[stripeService] Stripe account ID saved to database for handyman: ${handymanUser._id}`
      );
    }

    return account.id;
  } catch (error) {
    console.error(
      `[stripeService] Error creating/getting Stripe Connect account for handyman ${handymanUser._id}:`,
      error
    );
    console.error("[stripeService] Error details:", {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
    });

    // Check if the error is about Stripe Connect not being enabled
    if (error.message && error.message.includes("signed up for Connect")) {
      console.warn(
        `[stripeService] Stripe Connect is not enabled for this account. Please enable it in Stripe Dashboard: https://stripe.com/docs/connect`
      );
      // Return null instead of throwing - let the calling code handle it
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
    console.error("Error creating onboarding link:", error);
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
    console.log("[stripeService] Creating Escrow Payment Intent...");
    console.log("[stripeService] Parameters:", {
      amountAgorot,
      currency,
      handymanAccountId,
      platformFeeAgorot,
      metadata,
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountAgorot,
      currency: currency,
      capture_method: "manual", // Escrow: authorize now, capture later
      transfer_data: {
        destination: handymanAccountId,
      },
      application_fee_amount: platformFeeAgorot,
      metadata: metadata,
      payment_method_types: ["card"],
    });

    console.log("[stripeService] Payment Intent created successfully:", {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    };
  } catch (error) {
    console.error(
      "[stripeService] Error creating Escrow Payment Intent:",
      error
    );
    console.error("[stripeService] Error details:", {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
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
      // We want to authorize the payment immediately but capture it later
      payment_method_types: ["card"],
    });

    return paymentIntent;
  } catch (error) {
    console.error("Error creating Payment Intent:", error);
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
    console.error("Error capturing Payment Intent:", error);
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
    console.error("Error creating Transfer:", error);
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
    console.error("Error canceling Payment Intent:", error);
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
    console.error("Error refunding payment:", error);
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
    console.error("Error retrieving Payment Intent:", error);
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
  // Constants
  PLATFORM_FEE_PERCENT,
};
