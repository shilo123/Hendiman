const { MongoClient } = require("mongodb");

let collection;
let collectionJobs;
let db;

async function connectDatabase() {
  try {
    const url =
      "mongodb+srv://hazshilo:1234@cluster0.0yzklos.mongodb.net/?tlsAllowInvalidCertificates=true";
    const connection = await MongoClient.connect(url);
    db = connection.db("Hendiman");
    collection = db.collection("Users-Hendiman");
    collectionJobs = db.collection("Jobs");

    // צור index על location עבור geospatial queries
    try {
      await collection.createIndex({ location: "2dsphere" });
    } catch (indexError) {
      // אם ה-index כבר קיים או יש שגיאה אחרת, זה בסדר
      // 85 = IndexOptionsConflict, 86 = IndexKeySpecsConflict (index כבר קיים)
      if (indexError.code !== 85 && indexError.code !== 86) {
        console.error("Error creating index:", indexError.message);
      }
    }

    return { collection, collectionJobs, db };
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

function getCollection() {
  return collection;
}

function getCollectionJobs() {
  return collectionJobs;
}

function getDb() {
  return db;
}

module.exports = {
  connectDatabase,
  getCollection,
  getCollectionJobs,
  getDb,
};
