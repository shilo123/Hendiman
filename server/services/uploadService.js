const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../config/s3");

async function uploadImageToS3(file, bucketName) {
  const fileExtension = file.originalname
    ? file.originalname.split(".").pop()
    : "jpg";
  const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${
    fileExtension || "jpg"
  }`;

  const uploadParams = {
    Bucket: bucketName,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype || "image/jpeg",
  };

  try {
    // Try to upload to S3 - let it fail naturally if credentials are missing
    await s3.send(new PutObjectCommand(uploadParams));
    const imageUrl = `https://${bucketName}.s3.amazonaws.com/${fileName}`;
    return { success: true, imageUrl, fileName };
  } catch (error) {
    console.error("S3 Upload Error:", error);
    const errorMessage = error.message || "Unknown S3 error";
    const errorCode = error.Code || error.name || "UnknownError";
    
    // Check if it's a credentials issue
    const isCredentialsIssue =
      !process.env.AWS_ACCESS_KEY_ID ||
      !process.env.AWS_SECRET_ACCESS_KEY ||
      errorMessage.includes("credentials") ||
      errorMessage.includes("Credential") ||
      errorMessage.includes("InvalidAccessKeyId") ||
      errorMessage.includes("SignatureDoesNotMatch") ||
      errorCode === "CredentialsNotConfigured";

    return {
      success: false,
      error: errorMessage,
      code: errorCode,
      isAccessDenied:
        error.name === "AccessDenied" ||
        error.Code === "AccessDenied" ||
        isCredentialsIssue,
      isCredentialsIssue: isCredentialsIssue,
    };
  }
}

async function uploadLogoToS3(file) {
  const fileExtension = file.originalname
    ? file.originalname.split(".").pop()
    : "jpg";
  const fileName = `logo-${Date.now()}-${Math.round(Math.random() * 1e9)}.${
    fileExtension || "jpg"
  }`;

  const bucketName = "hendiman-pic-logo";

  const uploadParams = {
    Bucket: bucketName,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype || "image/jpeg",
  };

  try {
    // Check if AWS credentials are configured
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return {
        success: false,
        error: "AWS credentials not configured",
        code: "CredentialsNotConfigured",
        isAccessDenied: false,
      };
    }

    await s3.send(new PutObjectCommand(uploadParams));
    const logoUrl = `https://${bucketName}.s3.amazonaws.com/${fileName}`;
    return { success: true, logoUrl, fileName };
  } catch (error) {
    console.error("S3 Upload Error:", error);
    return {
      success: false,
      error: error.message || "Unknown S3 error",
      code: error.Code || error.name || "UnknownError",
      isAccessDenied:
        error.name === "AccessDenied" ||
        error.Code === "AccessDenied" ||
        error.message?.includes("credentials") ||
        error.message?.includes("Credential"),
    };
  }
}

module.exports = {
  uploadImageToS3,
  uploadLogoToS3,
};
