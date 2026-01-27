const { MongoClient } = require("mongodb");
const { serverLogger } = require("../utils/logger");

let collection;
let collectionJobs;
let collectionRatings;
let collectionPayments;
let collectionChats;
let collectionFinancials;
let collectionInquiries;
let collectionReceipts;
let collectionCanceld;
let collectionSupportChats;
let db;

async function connectDatabase() {
  try {
    const url = process.env.MONGODB_URI;
    if (!url) {
      throw new Error("❌ MONGODB_URI לא הוגדרה בקובץ .env");
    }
    const connection = await MongoClient.connect(url);
    db = connection.db("Hendiman");
    serverLogger.log("✅ חיבור למונגו הצליח!");
    collection = db.collection("Users-Hendiman");
    collectionJobs = db.collection("Jobs");
    collectionRatings = db.collection("rating");
    collectionPayments = db.collection("payment");
    collectionChats = db.collection("chats");
    collectionFinancials = db.collection("managers_financials");
    collectionInquiries = db.collection("inquiries");
    collectionReceipts = db.collection("receipts");
    collectionCanceld = db.collection("canceld");
    collectionSupportChats = db.collection("support_chats");
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
    } catch (ttlIndexError) {
      // אם ה-index כבר קיים או יש שגיאה אחרת, זה בסדר
      if (ttlIndexError.code !== 85 && ttlIndexError.code !== 86) {
        serverLogger.warn(
          "⚠️ Warning creating TTL index:",
          ttlIndexError.message
        );
      }
    }

    // Create index on chats.jobId for fast message queries
    try {
      await collectionChats.createIndex({ jobId: 1 });
    } catch (chatsIndexError) {
      // Index already exists or other error - that's fine
      if (chatsIndexError.code !== 85 && chatsIndexError.code !== 86) {
        serverLogger.warn(
          "⚠️ Warning creating chats index:",
          chatsIndexError.message
        );
      }
    }

    // Create indexes on Jobs collection for fast active job queries
    try {
      // Single index on handymanId (works with arrays and direct matches)
      await collectionJobs.createIndex({ handymanId: 1 }, { background: true });
      serverLogger.log("✅ Created index on Jobs: handymanId");
    } catch (jobsIndexError1) {
      if (jobsIndexError1.code !== 85 && jobsIndexError1.code !== 86) {
        serverLogger.warn(
          "⚠️ Warning creating jobs handymanId index:",
          jobsIndexError1.message
        );
      }
    }

    try {
      // Single index on clientId
      await collectionJobs.createIndex({ clientId: 1 }, { background: true });
      serverLogger.log("✅ Created index on Jobs: clientId");
    } catch (jobsIndexError2) {
      if (jobsIndexError2.code !== 85 && jobsIndexError2.code !== 86) {
        serverLogger.warn(
          "⚠️ Warning creating jobs clientId index:",
          jobsIndexError2.message
        );
      }
    }

    try {
      // Single index on status for general filtering
      await collectionJobs.createIndex({ status: 1 }, { background: true });
      serverLogger.log("✅ Created index on Jobs: status");
    } catch (jobsIndexError3) {
      if (jobsIndexError3.code !== 85 && jobsIndexError3.code !== 86) {
        serverLogger.warn(
          "⚠️ Warning creating jobs status index:",
          jobsIndexError3.message
        );
      }
    }

    try {
      // Compound index for handyman active jobs: handymanId + status + isDeleted
      await collectionJobs.createIndex(
        { handymanId: 1, status: 1, isDeleted: 1 },
        { background: true }
      );
      serverLogger.log(
        "✅ Created compound index on Jobs: handymanId + status + isDeleted"
      );
    } catch (jobsIndexError4) {
      if (jobsIndexError4.code !== 85 && jobsIndexError4.code !== 86) {
        serverLogger.warn(
          "⚠️ Warning creating jobs handymanId compound index:",
          jobsIndexError4.message
        );
      }
    }

    try {
      // Compound index for client active jobs: clientId + status + isDeleted
      await collectionJobs.createIndex(
        { clientId: 1, status: 1, isDeleted: 1 },
        { background: true }
      );
      serverLogger.log(
        "✅ Created compound index on Jobs: clientId + status + isDeleted"
      );
    } catch (jobsIndexError5) {
      if (jobsIndexError5.code !== 85 && jobsIndexError5.code !== 86) {
        serverLogger.warn(
          "⚠️ Warning creating jobs clientId compound index:",
          jobsIndexError5.message
        );
      }
    }

    // Create indexes on rating collection for fast handyman ratings pagination
    try {
      await collectionRatings.createIndex(
        { handymanId: 1, createdAt: -1 },
        { background: true }
      );
      serverLogger.log(
        "✅ Created compound index on rating: handymanId + createdAt(desc)"
      );
    } catch (ratingsIndexError1) {
      if (ratingsIndexError1.code !== 85 && ratingsIndexError1.code !== 86) {
        serverLogger.warn(
          "⚠️ Warning creating rating handymanId+createdAt index:",
          ratingsIndexError1.message
        );
      }
    }

    // Fallback index: use _id for recency when createdAt is missing/inconsistent
    try {
      await collectionRatings.createIndex(
        { handymanId: 1, _id: -1 },
        { background: true }
      );
      serverLogger.log(
        "✅ Created compound index on rating: handymanId + _id(desc)"
      );
    } catch (ratingsIndexError2) {
      if (ratingsIndexError2.code !== 85 && ratingsIndexError2.code !== 86) {
        serverLogger.warn(
          "⚠️ Warning creating rating handymanId+_id index:",
          ratingsIndexError2.message
        );
      }
    }

    // Speeds up looking up a rating by jobId (used by jobs history cards)
    try {
      await collectionRatings.createIndex({ jobId: 1 }, { background: true });
      serverLogger.log("✅ Created index on rating: jobId");
    } catch (ratingsIndexErrorJobId) {
      if (
        ratingsIndexErrorJobId.code !== 85 &&
        ratingsIndexErrorJobId.code !== 86
      ) {
        serverLogger.warn(
          "⚠️ Warning creating rating jobId index:",
          ratingsIndexErrorJobId.message
        );
      }
    }

    // Optimizes /handyman/:handymanId/jobs/history sorting by updatedAt/createdAt
    try {
      await collectionJobs.createIndex(
        { handymanId: 1, isDeleted: 1, updatedAt: -1, createdAt: -1 },
        { background: true }
      );
      serverLogger.log(
        "✅ Created compound index on Jobs: handymanId + isDeleted + updatedAt(desc) + createdAt(desc)"
      );
    } catch (jobsIndexErrorHistory) {
      if (
        jobsIndexErrorHistory.code !== 85 &&
        jobsIndexErrorHistory.code !== 86
      ) {
        serverLogger.warn(
          "⚠️ Warning creating jobs history sort index:",
          jobsIndexErrorHistory.message
        );
      }
    }

    // Fast pagination by recency using _id (works even if updatedAt/createdAt are missing/inconsistent)
    try {
      await collectionJobs.createIndex(
        { handymanId: 1, _id: -1 },
        { background: true }
      );
      serverLogger.log(
        "✅ Created compound index on Jobs: handymanId + _id(desc)"
      );
    } catch (jobsIndexErrorIdSort) {
      if (
        jobsIndexErrorIdSort.code !== 85 &&
        jobsIndexErrorIdSort.code !== 86
      ) {
        serverLogger.warn(
          "⚠️ Warning creating jobs handymanId+_id index:",
          jobsIndexErrorIdSort.message
        );
      }
    }

    return { collection, collectionJobs, db };
  } catch (error) {
    serverLogger.error("❌ שגיאה בחיבור למונגו:", error.message);
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

function getCollectionSupportChats() {
  return collectionSupportChats;
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
  getCollectionSupportChats,
  getDb,
};
