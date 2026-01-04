const { MongoClient } = require("mongodb");

let collection;
let collectionJobs;
let collectionRatings;
let collectionPayments;
let collectionChats;
let collectionFinancials;
let collectionInquiries;
let collectionReceipts;
let collectionCanceld;
let db;

async function connectDatabase() {
  try {
    const url =
      "mongodb+srv://hazshilo:1234@cluster0.0yzklos.mongodb.net/?tlsAllowInvalidCertificates=true";
    const connection = await MongoClient.connect(url);
    db = connection.db("Hendiman");
    collection = db.collection("Users-Hendiman");
    collectionJobs = db.collection("Jobs");
    collectionRatings = db.collection("rating");
    collectionPayments = db.collection("payment");
    collectionChats = db.collection("chats");
    collectionFinancials = db.collection("managers_financials");
    collectionInquiries = db.collection("inquiries");
    collectionReceipts = db.collection("receipts");
    collectionCanceld = db.collection("canceld");
    // צור index על location עבור geospatial queries
    try {
      await collection.createIndex({ location: "2dsphere" });
    } catch (indexError) {
      // אם ה-index כבר קיים או יש שגיאה אחרת, זה בסדר
      // 85 = IndexOptionsConflict, 86 = IndexKeySpecsConflict (index כבר קיים)
    }

    // צור TTL Index על expiresAt למחיקה אוטומטית של registrationData שפג תוקף
    // TTL Index מוחק אוטומטית מסמכים שהתאריך ב-expiresAt עבר
    try {
      await collection.createIndex(
        { expiresAt: 1 },
        {
          expireAfterSeconds: 0, // מוחק מיד כשהתאריך עבר
          partialFilterExpression: { type: "pending_subscription" }, // רק על מסמכים מסוג זה
        }
      );
      console.log("✅ TTL Index created for expired registrationData");
    } catch (ttlIndexError) {
      // אם ה-index כבר קיים או יש שגיאה אחרת, זה בסדר
      if (ttlIndexError.code !== 85 && ttlIndexError.code !== 86) {
        console.warn("⚠️ Warning creating TTL index:", ttlIndexError.message);
      }
    }

    return { collection, collectionJobs, db };
  } catch (error) {
    throw error;
  }
}

function getCollection() {
  return collection;
}

function getCollectionJobs() {
  return collectionJobs;
}

function getCollectionRatings() {
  return collectionRatings;
}

function getCollectionPayments() {
  return collectionPayments;
}

function getCollectionChats() {
  return collectionChats;
}

function getCollectionFinancials() {
  return collectionFinancials;
}

function getCollectionInquiries() {
  return collectionInquiries;
}

function getCollectionReceipts() {
  return collectionReceipts;
}

function getCollectionCanceld() {
  return collectionCanceld;
}

function getDb() {
  return db;
}

module.exports = {
  connectDatabase,
  getCollection,
  getCollectionJobs,
  getCollectionRatings,
  getCollectionPayments,
  getCollectionChats,
  getCollectionFinancials,
  getCollectionInquiries,
  getCollectionReceipts,
  getCollectionCanceld,
  getDb,
};
