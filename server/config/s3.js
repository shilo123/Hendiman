const { S3Client } = require("@aws-sdk/client-s3");

// Check if AWS credentials are configured
const hasCredentials =
  process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;

const s3Config = {
  region: process.env.AWS_REGION || "us-east-1",
};

// Only add credentials if they exist
if (hasCredentials) {
  s3Config.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

const s3 = new S3Client(s3Config);

module.exports = s3;
