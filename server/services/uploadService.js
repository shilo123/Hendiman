const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../config/s3");
const axios = require("axios");

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

async function uploadImageFromUrl(imageUrl, bucketName) {
  try {
    // Download image from URL
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    // Determine file extension from URL or content type
    let fileExtension = "jpg";
    const contentType = response.headers["content-type"];
    if (contentType) {
      if (contentType.includes("png")) fileExtension = "png";
      else if (contentType.includes("gif")) fileExtension = "gif";
      else if (contentType.includes("webp")) fileExtension = "webp";
    } else {
      // Try to get extension from URL
      const urlMatch = imageUrl.match(/\.(jpg|jpeg|png|gif|webp)/i);
      if (urlMatch) fileExtension = urlMatch[1].toLowerCase();
    }

    const fileName = `google-${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}.${fileExtension}`;

    const uploadParams = {
      Bucket: bucketName,
      Key: fileName,
      Body: Buffer.from(response.data),
      ContentType: contentType || "image/jpeg",
    };

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
    const uploadedImageUrl = `https://${bucketName}.s3.amazonaws.com/${fileName}`;
    return { success: true, imageUrl: uploadedImageUrl, fileName };
  } catch (error) {
    const errorMessage = error.message || "Unknown error";
    const errorCode = error.Code || error.name || "UnknownError";

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

async function deleteImageFromS3(imageUrl, bucketName) {
  try {
    // Extract the key (file name) from the S3 URL
    // URL format: https://bucket-name.s3.amazonaws.com/file-name
    const urlParts = imageUrl.split(`${bucketName}.s3.amazonaws.com/`);
    if (urlParts.length < 2) {
      return { success: false, error: "Invalid S3 URL format" };
    }
    const key = urlParts[1].split("?")[0]; // Remove query parameters if any

    const deleteParams = {
      Bucket: bucketName,
      Key: key,
    };

    await s3.send(new DeleteObjectCommand(deleteParams));
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Unknown S3 delete error",
      code: error.Code || error.name || "UnknownError",
    };
  }
}

module.exports = {
  uploadImageToS3,
  uploadLogoToS3,
  uploadImageFromUrl,
  deleteImageFromS3,
};
