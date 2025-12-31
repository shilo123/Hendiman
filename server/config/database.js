const { MongoClient } = require("mongodb");

let collection;
let collectionJobs;
let collectionRatings;
let collectionPayments;
let collectionChats;
let collectionFinancials;
let collectionInquiries;
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
    // צור index על location עבור geospatial queries
    try {
      await collection.createIndex({ location: "2dsphere" });
    } catch (indexError) {
      // אם ה-index כבר קיים או יש שגיאה אחרת, זה בסדר
      // 85 = IndexOptionsConflict, 86 = IndexKeySpecsConflict (index כבר קיים)
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

module.exports = {
  connectDatabase,
  getCollection,
  getCollectionJobs,
  getCollectionRatings,
  getCollectionPayments,
  getCollectionChats,
  getCollectionFinancials,
  getCollectionInquiries,
};
