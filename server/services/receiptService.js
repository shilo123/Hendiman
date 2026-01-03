const { Resend } = require("resend");
const { ObjectId } = require("mongodb");

// FROM_EMAIL must be from a verified domain
// For local/testing: use Resend's test domain (onboarding@resend.dev) - works without domain verification
// For production: use your verified domain (receipts@handiman.co.il)
// You can override this with RESEND_FROM_EMAIL env variable
// If NODE_ENV is development or localhost, use test domain
// Determine if we're in production or local environment
const isProduction = process.env.NODE_ENV === "production";
const FROM_EMAIL = isProduction
  ? "receipts@handiman.co.il" // Production: use verified domain
  : "onboarding@resend.dev"; // Local/Development: use Resend test domain

// Initialize Resend lazily (only when needed)
// This prevents crashes if RESEND_API_KEY is not set
let resend = null;
function getResend() {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn(
        "[receiptService] RESEND_API_KEY not set. Receipt emails will not be sent."
      );
      return null;
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

/**
 * Get next counter value atomically
 * @param {string} counterName - Name of the counter
 * @param {Object} db - MongoDB database instance
 * @returns {Promise<number>} - Next counter value
 */
async function getNextCounter(counterName, db) {
  const countersCol = db.collection("counters");

  try {
    const result = await countersCol.findOneAndUpdate(
      { _id: counterName },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after" }
    );

    // Check if result exists and has value
    if (result && result.value && result.value.seq !== undefined) {
      return result.value.seq;
    }

    // Fallback: if result is null or value is undefined, try to get or create
    const existing = await countersCol.findOne({ _id: counterName });
    if (existing && existing.seq !== undefined) {
      // Counter exists but findOneAndUpdate didn't return it properly, increment manually
      const newSeq = (existing.seq || 0) + 1;
      await countersCol.updateOne(
        { _id: counterName },
        { $set: { seq: newSeq } }
      );
      return newSeq;
    }

    // Create new counter starting at 1
    await countersCol.insertOne({ _id: counterName, seq: 1 });
    return 1;
  } catch (error) {
    console.error(`Error in getNextCounter for ${counterName}:`, error);
    // Fallback: try to get existing or create new
    try {
      const existing = await countersCol.findOne({ _id: counterName });
      if (existing && existing.seq !== undefined) {
        const newSeq = existing.seq + 1;
        await countersCol.updateOne(
          { _id: counterName },
          { $set: { seq: newSeq } }
        );
        return newSeq;
      }
      await countersCol.insertOne({ _id: counterName, seq: 1 });
      return 1;
    } catch (fallbackError) {
      console.error(
        `Fallback error in getNextCounter for ${counterName}:`,
        fallbackError
      );
      throw fallbackError;
    }
  }
}

/**
 * Generate order number: HM-YYYY-XXXXXX
 */
async function generateOrderNumber(db) {
  const year = new Date().getFullYear();
  const counter = await getNextCounter("orderNumber", db);
  const paddedCounter = String(counter).padStart(6, "0");
  return `HM-${year}-${paddedCounter}`;
}

/**
 * Generate receipt number based on type
 * H-YYYY-XXXXX for handyman
 * M-YYYY-XXXXX for platform
 * S-YYYY-XXXXX for subscription
 */
async function generateReceiptNumber(type, db) {
  const year = new Date().getFullYear();
  let counterName;
  let prefix;

  switch (type) {
    case "handyman":
      counterName = "receiptHandyman";
      prefix = "H";
      break;
    case "platform":
      counterName = "receiptPlatform";
      prefix = "M";
      break;
    case "subscription":
      counterName = "receiptSubscription";
      prefix = "S";
      break;
    default:
      throw new Error(`Invalid receipt type: ${type}`);
  }

  const counter = await getNextCounter(counterName, db);
  const paddedCounter = String(counter).padStart(5, "0");
  return `${prefix}-${year}-${paddedCounter}`;
}

/**
 * Calculate VAT amounts
 */
function calculateVAT(amount, vatRate = 0.17) {
  const amountWithoutVAT = amount / (1 + vatRate);
  const vatAmount = amount - amountWithoutVAT;
  return {
    amountWithoutVAT: Math.round(amountWithoutVAT * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    totalWithVat: Math.round(amount * 100) / 100,
  };
}

/**
 * Generate HTML receipt for handyman (job payment)
 */
function generateHandymanReceiptHTML(receipt, job, handyman, client) {
  const date = new Date(receipt.createdAt).toLocaleDateString("he-IL");
  const vatInfo =
    receipt.vatRate === 0 ? "0%" : `${(receipt.vatRate * 100).toFixed(0)}%`;

  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>קבלה על עבודה</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700;900&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Heebo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #0b0b0f 0%, #1a1a24 100%);" dir="rtl">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #0b0b0f 0%, #1a1a24 100%); padding: 40px 20px;" dir="rtl">
    <tr>
      <td align="center">
        <table width="650" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);" dir="rtl">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ff6a00 0%, #ff8a2b 50%, #ffa64d 100%); padding: 40px 40px; text-align: center; position: relative; overflow: hidden;">
              <div style="position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: rgba(255, 255, 255, 0.08); border-radius: 50%;"></div>
              <div style="position: absolute; bottom: -20px; left: -20px; width: 100px; height: 100px; background: rgba(255, 255, 255, 0.06); border-radius: 50%;"></div>
              <div style="position: relative; z-index: 1;">
                <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 32px; font-weight: 900; text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2); letter-spacing: 0.5px;">קבלה על עבודה</h1>
                <p style="color: rgba(255, 255, 255, 0.95); margin: 0; font-size: 15px; font-weight: 500;">Receipt for Service</p>
              </div>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="color: #333333; font-size: 16px; margin: 0 0 20px 0;">שלום ${
                client?.username || client?.firstName || "לקוח"
              },</p>
              
              <table width="100%" cellpadding="10" cellspacing="0" style="margin-bottom: 20px; border: 1px solid #e0e0e0; border-radius: 4px;">
                <tr>
                  <td style="background-color: #f9f9f9; font-weight: bold; color: #ff6a00;">מספר קבלה:</td>
                  <td style="color: #333333;">${receipt.receiptNumber}</td>
                </tr>
                <tr>
                  <td style="background-color: #f9f9f9; font-weight: bold; color: #ff6a00;">מספר הזמנה:</td>
                  <td style="color: #333333;">${receipt.orderNumber}</td>
                </tr>
                <tr>
                  <td style="background-color: #f9f9f9; font-weight: bold; color: #ff6a00;">תאריך:</td>
                  <td style="color: #333333;">${date}</td>
                </tr>
              </table>

              <!-- Service Provider Section -->
              <div style="background: linear-gradient(135deg, #fff5e6 0%, #ffe8cc 100%); border-radius: 16px; padding: 30px; margin-bottom: 30px; border: 2px solid rgba(255, 106, 0, 0.15); box-shadow: 0 4px 20px rgba(255, 106, 0, 0.1);">
                <h2 style="color: #ff6a00; font-size: 20px; margin: 0 0 25px 0; font-weight: 900; display: flex; align-items: center; gap: 10px;" dir="rtl">
                  <span style="width: 4px; height: 24px; background: linear-gradient(135deg, #ff6a00 0%, #ff8a2b 100%); border-radius: 2px; display: inline-block;"></span>
                  פרטי נותן השירות
                </h2>
                <table width="100%" cellpadding="12" cellspacing="0" style="margin: 0;" dir="rtl">
                  <tr>
                    <td style="color: #4a5568; width: 140px; font-weight: 700; font-size: 14px; padding-bottom: 12px;">שם החברה:</td>
                    <td style="color: #1a1a24; font-weight: 800; font-size: 15px; padding-bottom: 12px;">Handiman Ltd</td>
                  </tr>
                  <tr>
                    <td style="color: #4a5568; font-weight: 700; font-size: 14px; padding-bottom: 12px;">ח.פ:</td>
                    <td style="color: #1a1a24; font-weight: 800; font-size: 15px; padding-bottom: 12px; font-family: 'Courier New', monospace;">515151515</td>
                  </tr>
                  <tr>
                    <td style="color: #4a5568; font-weight: 700; font-size: 14px; padding-bottom: 0;">אימייל:</td>
                    <td style="color: #1a1a24; font-weight: 800; font-size: 15px; padding-bottom: 0;">support@handiman.co.il</td>
                  </tr>
                </table>
              </div>
              
              <!-- Work Performer Section -->
              <div style="background: #f8f9fa; border-radius: 16px; padding: 30px; margin-bottom: 30px; border: 1px solid #e9ecef;">
                <h2 style="color: #1a1a24; font-size: 20px; margin: 0 0 25px 0; font-weight: 900; display: flex; align-items: center; gap: 10px;" dir="rtl">
                  <span style="width: 4px; height: 24px; background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%); border-radius: 2px; display: inline-block;"></span>
                  פרטי מבצע העבודה
                </h2>
                <table width="100%" cellpadding="12" cellspacing="0" style="margin: 0;" dir="rtl">
                  <tr>
                    <td style="color: #4a5568; width: 140px; font-weight: 700; font-size: 14px; padding-bottom: 12px;">שם:</td>
                    <td style="color: #1a1a24; font-weight: 800; font-size: 15px; padding-bottom: 12px;">${
                      handyman?.username || handyman?.firstName || "לא זמין"
                    }</td>
                  </tr>
                  <tr>
                    <td style="color: #4a5568; font-weight: 700; font-size: 14px; padding-bottom: 0;">טלפון:</td>
                    <td style="color: #1a1a24; font-weight: 800; font-size: 15px; padding-bottom: 0;">${
                      handyman?.phone || "לא זמין"
                    }</td>
                  </tr>
                </table>
              </div>

              <!-- Job Details Section -->
              <div style="background: #f8f9fa; border-radius: 16px; padding: 30px; margin-bottom: 30px; border: 1px solid #e9ecef;">
                <h2 style="color: #1a1a24; font-size: 20px; margin: 0 0 25px 0; font-weight: 900; display: flex; align-items: center; gap: 10px;" dir="rtl">
                  <span style="width: 4px; height: 24px; background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%); border-radius: 2px; display: inline-block;"></span>
                  פרטי העבודה
                </h2>
                <table width="100%" cellpadding="12" cellspacing="0" style="margin: 0;" dir="rtl">
                  <tr>
                    <td style="color: #4a5568; width: 140px; font-weight: 700; font-size: 14px; padding-bottom: 12px;">סוג עבודה:</td>
                    <td style="color: #1a1a24; font-weight: 800; font-size: 15px; padding-bottom: 12px;">${
                      job?.category || job?.subcategory || "לא זמין"
                    }</td>
                  </tr>
                  <tr>
                    <td style="color: #4a5568; font-weight: 700; font-size: 14px; padding-bottom: 0;">כתובת:</td>
                    <td style="color: #1a1a24; font-weight: 800; font-size: 15px; padding-bottom: 0;">${
                      job?.address || "לא זמין"
                    }</td>
                  </tr>
                </table>
              </div>

              <!-- Amounts Section -->
              <div style="background: linear-gradient(135deg, #1a1a24 0%, #2d2d3a 100%); border-radius: 20px; padding: 35px; margin-bottom: 35px; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);">
                <h2 style="color: #ffffff; font-size: 22px; margin: 0 0 30px 0; font-weight: 900; text-align: center;" dir="rtl">סיכום תשלום</h2>
                <table width="100%" cellpadding="15" cellspacing="0" style="margin: 0; border-collapse: separate; border-spacing: 0;" dir="rtl">
                  ${
                    receipt.handymanAmount
                      ? `
                  <tr>
                    <td style="color: rgba(255, 255, 255, 0.8); font-size: 15px; font-weight: 600; padding-bottom: 15px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">סכום עבודה (לפני מע״מ):</td>
                    <td style="text-align: right; color: #ffffff; font-weight: 800; font-size: 16px; padding-bottom: 15px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); font-family: 'Courier New', monospace;">${receipt.handymanAmount.toFixed(
                      2
                    )} ₪</td>
                  </tr>
                  `
                      : ""
                  }
                  ${
                    receipt.platformFee
                      ? `
                  <tr>
                    <td style="color: rgba(255, 255, 255, 0.8); font-size: 15px; font-weight: 600; padding: 15px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">עמלת תיווך (לפני מע״מ):</td>
                    <td style="text-align: right; color: #ffffff; font-weight: 800; font-size: 16px; padding: 15px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1); font-family: 'Courier New', monospace;">${receipt.platformFee.toFixed(
                      2
                    )} ₪</td>
                  </tr>
                  `
                      : ""
                  }
                  <tr>
                    <td style="color: rgba(255, 255, 255, 0.8); font-size: 15px; font-weight: 600; padding: 15px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">סה״כ לפני מע״מ:</td>
                    <td style="text-align: right; color: #ffffff; font-weight: 800; font-size: 16px; padding: 15px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1); font-family: 'Courier New', monospace;">${receipt.amount.toFixed(
                      2
                    )} ₪</td>
                  </tr>
                  <tr>
                    <td style="color: rgba(255, 255, 255, 0.8); font-size: 15px; font-weight: 600; padding: 15px 0; border-bottom: 2px solid rgba(255, 106, 0, 0.3);">מע״מ (${vatInfo}):</td>
                    <td style="text-align: right; color: #ffffff; font-weight: 800; font-size: 16px; padding: 15px 0; border-bottom: 2px solid rgba(255, 106, 0, 0.3); font-family: 'Courier New', monospace;">${receipt.vatAmount.toFixed(
                      2
                    )} ₪</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding-top: 25px;">
                      <div style="background: linear-gradient(135deg, #ff6a00 0%, #ff8a2b 100%); border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 4px 20px rgba(255, 106, 0, 0.4);">
                        <div style="color: rgba(255, 255, 255, 0.95); font-size: 14px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">סה״כ לתשלום</div>
                        <div style="color: #ffffff; font-size: 32px; font-weight: 900; font-family: 'Courier New', monospace; text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);">${receipt.totalWithVat.toFixed(
                          2
                        )} ₪</div>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Thank You Message -->
              <div style="text-align: center; padding: 30px 0; border-top: 2px solid #f0f0f0;">
                <p style="color: #1a1a24; font-size: 18px; margin: 0 0 10px 0; font-weight: 700;" dir="rtl">תודה שבחרת ב-Handiman!</p>
                <p style="color: #666666; font-size: 14px; margin: 0; font-weight: 400; line-height: 1.6;" dir="rtl">אנו מעריכים את האמון שלך בנו ומקווים לראותך שוב בקרוב</p>
                <div style="margin-top: 25px;">
                  <div style="display: inline-block; width: 60px; height: 4px; background: linear-gradient(135deg, #ff6a00 0%, #ff8a2b 100%); border-radius: 2px;"></div>
                </div>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: linear-gradient(135deg, #0b0b0f 0%, #1a1a24 100%); padding: 30px 40px; text-align: center; border-top: 3px solid rgba(255, 106, 0, 0.2);">
              <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 8px 0; font-size: 15px; font-weight: 700;">Handiman - פתרונות מקצועיים לכל בעיה</p>
              <p style="color: rgba(255, 255, 255, 0.6); margin: 0 0 20px 0; font-size: 12px; font-weight: 400;">© ${new Date().getFullYear()} Handiman Ltd. כל הזכויות שמורות.</p>
              <div style="padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                <p style="color: rgba(255, 255, 255, 0.5); margin: 0; font-size: 11px; font-weight: 400;">support@handiman.co.il | www.handiman.co.il</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Generate HTML receipt for platform (commission)
 */
function generatePlatformReceiptHTML(receipt, job, client) {
  const date = new Date(receipt.createdAt).toLocaleDateString("he-IL");
  const vatInfo = `${(receipt.vatRate * 100).toFixed(0)}%`;

  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>קבלה על עמלת תיווך</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ff6a00 0%, #ff8a2b 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">קבלה על עמלת תיווך</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="color: #333333; font-size: 16px; margin: 0 0 20px 0;">שלום ${
                client?.username || client?.firstName || "לקוח"
              },</p>
              
              <table width="100%" cellpadding="10" cellspacing="0" style="margin-bottom: 20px; border: 1px solid #e0e0e0; border-radius: 4px;">
                <tr>
                  <td style="background-color: #f9f9f9; font-weight: bold; color: #ff6a00;">מספר קבלה:</td>
                  <td style="color: #333333;">${receipt.receiptNumber}</td>
                </tr>
                <tr>
                  <td style="background-color: #f9f9f9; font-weight: bold; color: #ff6a00;">מספר הזמנה:</td>
                  <td style="color: #333333;">${receipt.orderNumber}</td>
                </tr>
                <tr>
                  <td style="background-color: #f9f9f9; font-weight: bold; color: #ff6a00;">תאריך:</td>
                  <td style="color: #333333;">${date}</td>
                </tr>
              </table>

              <h2 style="color: #ff6a00; font-size: 18px; margin: 20px 0 10px 0; border-bottom: 2px solid #ff6a00; padding-bottom: 5px;">פרטי העוסק:</h2>
              <table width="100%" cellpadding="8" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="color: #666666; width: 150px;">שם:</td>
                  <td style="color: #333333;">Handiman Ltd</td>
                </tr>
                <tr>
                  <td style="color: #666666;">ח.פ:</td>
                  <td style="color: #333333;">515151515</td>
                </tr>
                <tr>
                  <td style="color: #666666;">אימייל:</td>
                  <td style="color: #333333;">support@handiman.co.il</td>
                </tr>
              </table>

              <h2 style="color: #ff6a00; font-size: 18px; margin: 20px 0 10px 0; border-bottom: 2px solid #ff6a00; padding-bottom: 5px;">פירוט:</h2>
              <table width="100%" cellpadding="10" cellspacing="0" style="margin-bottom: 20px; border: 1px solid #e0e0e0; border-radius: 4px;">
                <tr>
                  <td style="color: #666666;">עמלת תיווך (לפני מע״מ):</td>
                  <td style="text-align: right; color: #333333; font-weight: bold;">${receipt.amount.toFixed(
                    2
                  )} ₪</td>
                </tr>
                <tr>
                  <td style="color: #666666;">מע״מ (${vatInfo}):</td>
                  <td style="text-align: right; color: #333333; font-weight: bold;">${receipt.vatAmount.toFixed(
                    2
                  )} ₪</td>
                </tr>
                <tr style="background-color: #fff5e6; border-top: 2px solid #ff6a00;">
                  <td style="color: #ff6a00; font-weight: bold; font-size: 16px;">סה״כ לתשלום:</td>
                  <td style="text-align: right; color: #ff6a00; font-weight: bold; font-size: 16px;">${receipt.totalWithVat.toFixed(
                    2
                  )} ₪</td>
                </tr>
              </table>

              <p style="color: #666666; font-size: 14px; margin: 30px 0 0 0;">תודה,<br>צוות Handiman</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #0b0b0f; padding: 20px; text-align: center;">
              <p style="color: #ffffff; margin: 0; font-size: 12px;">© ${new Date().getFullYear()} Handiman. כל הזכויות שמורות.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Generate HTML receipt for subscription
 */
function generateSubscriptionReceiptHTML(receipt, user) {
  const date = new Date(receipt.createdAt).toLocaleDateString("he-IL");
  const vatInfo = `${(receipt.vatRate * 100).toFixed(0)}%`;

  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>קבלה על תשלום מנוי חודשי</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ff6a00 0%, #ff8a2b 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">קבלה על תשלום מנוי חודשי</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="color: #333333; font-size: 16px; margin: 0 0 20px 0;">שלום ${
                user?.username || user?.firstName || "משתמש"
              },</p>
              
              <table width="100%" cellpadding="10" cellspacing="0" style="margin-bottom: 20px; border: 1px solid #e0e0e0; border-radius: 4px;">
                <tr>
                  <td style="background-color: #f9f9f9; font-weight: bold; color: #ff6a00;">מספר קבלה:</td>
                  <td style="color: #333333;">${receipt.receiptNumber}</td>
                </tr>
                <tr>
                  <td style="background-color: #f9f9f9; font-weight: bold; color: #ff6a00;">תאריך:</td>
                  <td style="color: #333333;">${date}</td>
                </tr>
              </table>

              <h2 style="color: #ff6a00; font-size: 18px; margin: 20px 0 10px 0; border-bottom: 2px solid #ff6a00; padding-bottom: 5px;">פרטי העוסק:</h2>
              <table width="100%" cellpadding="8" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="color: #666666; width: 150px;">שם:</td>
                  <td style="color: #333333;">Handiman Ltd</td>
                </tr>
                <tr>
                  <td style="color: #666666;">ח.פ:</td>
                  <td style="color: #333333;">515151515</td>
                </tr>
                <tr>
                  <td style="color: #666666;">אימייל:</td>
                  <td style="color: #333333;">support@handiman.co.il</td>
                </tr>
              </table>

              <h2 style="color: #ff6a00; font-size: 18px; margin: 20px 0 10px 0; border-bottom: 2px solid #ff6a00; padding-bottom: 5px;">פרטי מנוי:</h2>
              <table width="100%" cellpadding="8" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="color: #666666; width: 150px;">סוג מנוי:</td>
                  <td style="color: #333333;">מנוי חודשי</td>
                </tr>
                <tr>
                  <td style="color: #666666;">Stripe Subscription ID:</td>
                  <td style="color: #333333;">${
                    receipt.subscriptionId || "לא זמין"
                  }</td>
                </tr>
                <tr>
                  <td style="color: #666666;">Stripe Invoice ID:</td>
                  <td style="color: #333333;">${
                    receipt.invoiceId || "לא זמין"
                  }</td>
                </tr>
              </table>

              <h2 style="color: #ff6a00; font-size: 18px; margin: 20px 0 10px 0; border-bottom: 2px solid #ff6a00; padding-bottom: 5px;">סכומים:</h2>
              <table width="100%" cellpadding="10" cellspacing="0" style="margin-bottom: 20px; border: 1px solid #e0e0e0; border-radius: 4px;">
                <tr>
                  <td style="color: #666666;">דמי מנוי (לפני מע״מ):</td>
                  <td style="text-align: right; color: #333333; font-weight: bold;">${receipt.amount.toFixed(
                    2
                  )} ₪</td>
                </tr>
                <tr>
                  <td style="color: #666666;">מע״מ (${vatInfo}):</td>
                  <td style="text-align: right; color: #333333; font-weight: bold;">${receipt.vatAmount.toFixed(
                    2
                  )} ₪</td>
                </tr>
                <tr style="background-color: #fff5e6; border-top: 2px solid #ff6a00;">
                  <td style="color: #ff6a00; font-weight: bold; font-size: 16px;">סה״כ לתשלום:</td>
                  <td style="text-align: right; color: #ff6a00; font-weight: bold; font-size: 16px;">${receipt.totalWithVat.toFixed(
                    2
                  )} ₪</td>
                </tr>
              </table>

              <p style="color: #666666; font-size: 14px; margin: 30px 0 0 0;">תודה,<br>צוות Handiman</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #0b0b0f; padding: 20px; text-align: center;">
              <p style="color: #ffffff; margin: 0; font-size: 12px;">© ${new Date().getFullYear()} Handiman. כל הזכויות שמורות.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Send receipt email using Resend
 */
async function sendReceiptEmail(receipt, htmlContent, subject, toEmail) {
  const resendInstance = getResend();
  if (!resendInstance) {
    // If Resend is not configured, return error but don't throw
    console.warn(
      "[receiptService] Cannot send receipt email: RESEND_API_KEY not configured"
    );
    return {
      success: false,
      error: "RESEND_API_KEY not configured",
    };
  }

  // Use FROM_EMAIL from env or default
  const fromEmail = process.env.RESEND_FROM_EMAIL || FROM_EMAIL;

  const { data, error } = await resendInstance.emails.send({
    from: fromEmail,
    to: toEmail,
    subject: subject,
    html: htmlContent,
  });

  if (error) {
    console.error(`❌ [RECEIPTS] Resend API error:`, error);
    throw new Error(error.message || "Failed to send email");
  }

  return { success: true, messageId: data?.id };
}

/**
 * Create and send receipt
 */
async function createAndSendReceipt(
  receiptData,
  db,
  getCollectionReceipts,
  getCollection,
  getCollectionJobs
) {
  const receiptsCol = getCollectionReceipts();
  const usersCol = getCollection();
  const jobsCol = getCollectionJobs();
  let receiptId = null;

  try {
    // Check for duplicates
    const duplicateQuery = {
      source: receiptData.source,
      type: receiptData.type,
      status: "sent",
    };

    if (receiptData.paymentId) {
      duplicateQuery.paymentId = new ObjectId(receiptData.paymentId);
    }
    if (receiptData.invoiceId) {
      duplicateQuery.invoiceId = receiptData.invoiceId;
    }

    const existingReceipt = await receiptsCol.findOne(duplicateQuery);
    if (existingReceipt) {
      console.log(`Receipt already sent: ${existingReceipt.receiptNumber}`);
      return { success: false, reason: "duplicate" };
    }

    // Generate receipt number
    const receiptNumber = await generateReceiptNumber(receiptData.type, db);
    receiptData.receiptNumber = receiptNumber;

    // Calculate VAT
    // If platformFee exists, VAT is only on the platform fee (17%), not on handyman amount (0%)
    let vatAmount = 0;
    let totalWithVat = receiptData.amount;

    if (receiptData.platformFee && receiptData.platformFee > 0) {
      // VAT is only on platform fee (17%)
      vatAmount = receiptData.platformFee * 0.17;
      totalWithVat = receiptData.amount + vatAmount;
      receiptData.vatRate =
        receiptData.amount > 0 ? vatAmount / receiptData.amount : 0.17;
    } else {
      // Standard VAT calculation
      const vatRate = receiptData.vatRate || 0.17;
      const vatCalculation = calculateVAT(receiptData.amount, vatRate);
      vatAmount = vatCalculation.vatAmount;
      totalWithVat = vatCalculation.totalWithVat;
      receiptData.vatRate = vatRate;
    }

    receiptData.vatAmount = vatAmount;
    receiptData.totalWithVat = totalWithVat;

    // Set email details
    receiptData.fromEmail = FROM_EMAIL;
    receiptData.status = "pending";
    receiptData.createdAt = new Date();
    receiptData.updatedAt = new Date();

    // Convert IDs to ObjectId if they are strings
    if (receiptData.paymentId && typeof receiptData.paymentId === "string") {
      receiptData.paymentId = new ObjectId(receiptData.paymentId);
    }
    if (receiptData.jobId && typeof receiptData.jobId === "string") {
      receiptData.jobId = new ObjectId(receiptData.jobId);
    }
    if (receiptData.handymanId && typeof receiptData.handymanId === "string") {
      receiptData.handymanId = new ObjectId(receiptData.handymanId);
    }
    if (receiptData.clientId && typeof receiptData.clientId === "string") {
      receiptData.clientId = new ObjectId(receiptData.clientId);
    }
    if (receiptData.userId && typeof receiptData.userId === "string") {
      receiptData.userId = new ObjectId(receiptData.userId);
    }

    // Insert receipt
    const insertResult = await receiptsCol.insertOne(receiptData);
    receiptId = insertResult.insertedId;

    // Get user and job data for email
    let user = null;
    let job = null;
    let handyman = null;
    let client = null;

    if (receiptData.handymanId) {
      const handymanId =
        receiptData.handymanId instanceof ObjectId
          ? receiptData.handymanId
          : new ObjectId(receiptData.handymanId);
      handyman = await usersCol.findOne({ _id: handymanId });
    }
    if (receiptData.clientId) {
      const clientId =
        receiptData.clientId instanceof ObjectId
          ? receiptData.clientId
          : new ObjectId(receiptData.clientId);
      client = await usersCol.findOne({ _id: clientId });
    }
    if (receiptData.userId) {
      const userId =
        receiptData.userId instanceof ObjectId
          ? receiptData.userId
          : new ObjectId(receiptData.userId);
      user = await usersCol.findOne({ _id: userId });
    }
    if (receiptData.jobId) {
      const jobId =
        receiptData.jobId instanceof ObjectId
          ? receiptData.jobId
          : new ObjectId(receiptData.jobId);
      job = await jobsCol.findOne({ _id: jobId });
    }

    // Generate HTML and subject based on type
    let htmlContent;
    let subject;

    if (receiptData.type === "handyman") {
      subject = `קבלה על עבודה – הזמנה ${receiptData.orderNumber}`;
      htmlContent = generateHandymanReceiptHTML(
        receiptData,
        job,
        handyman,
        client
      );
    } else if (receiptData.type === "platform") {
      subject = `קבלה על עמלת תיווך – הזמנה ${receiptData.orderNumber}`;
      htmlContent = generatePlatformReceiptHTML(receiptData, job, client);
    } else if (receiptData.type === "subscription") {
      subject = "קבלה על תשלום מנוי חודשי";
      htmlContent = generateSubscriptionReceiptHTML(receiptData, user);
    } else {
      throw new Error(`Unknown receipt type: ${receiptData.type}`);
    }

    // Try to send email, but don't fail if email sending fails
    let emailSent = false;
    let emailError = null;

    try {
      const emailResult = await sendReceiptEmail(
        receiptData,
        htmlContent,
        subject,
        receiptData.toEmail
      );

      // Check if email was sent successfully
      if (!emailResult || !emailResult.success) {
        // Email sending failed (e.g., RESEND_API_KEY not configured)
        emailError = emailResult?.error || "Email sending failed";
        throw new Error(emailError);
      }

      // Update receipt status to sent
      await receiptsCol.updateOne(
        { _id: receiptId },
        {
          $set: {
            status: "sent",
            sentAt: new Date(),
            updatedAt: new Date(),
            subject: subject,
          },
        }
      );

      emailSent = true;
      return {
        success: true,
        receiptId,
        messageId: emailResult.messageId,
        emailSent: true,
      };
    } catch (emailError) {
      // Email sending failed, but receipt is already saved in DB
      // Update receipt with failed status and error message
      console.error(
        "❌ [RECEIPTS] Email sending failed, but receipt saved to DB:",
        emailError.message
      );

      await receiptsCol.updateOne(
        { _id: receiptId },
        {
          $set: {
            status: "failed",
            lastError: emailError.message || "Failed to send email",
            updatedAt: new Date(),
            subject: subject,
          },
        }
      );

      // Return success because receipt was saved, even though email failed
      return {
        success: true,
        receiptId,
        emailSent: false,
        emailError: emailError.message,
        message: "Receipt saved to DB but email sending failed",
      };
    }
  } catch (error) {
    // Update receipt with error if it was created
    if (receiptId) {
      const receiptsCol = getCollectionReceipts();
      await receiptsCol.updateOne(
        { _id: receiptId },
        {
          $set: {
            status: "failed",
            lastError: error.message,
            updatedAt: new Date(),
          },
        }
      );
    }

    console.error("❌ [RECEIPTS] Error creating receipt:", error);
    throw error;
  }
}

module.exports = {
  generateOrderNumber,
  generateReceiptNumber,
  calculateVAT,
  createAndSendReceipt,
  sendReceiptEmail,
};
