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
    await s3.send(new PutObjectCommand(uploadParams));
    const imageUrl = `https://${bucketName}.s3.amazonaws.com/${fileName}`;
    return { success: true, imageUrl, fileName };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: error.Code || error.name,
      isAccessDenied:
        error.name === "AccessDenied" || error.Code === "AccessDenied",
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
    await s3.send(new PutObjectCommand(uploadParams));
    const logoUrl = `https://${bucketName}.s3.amazonaws.com/${fileName}`;
    return { success: true, logoUrl, fileName };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: error.Code || error.name,
      isAccessDenied:
        error.name === "AccessDenied" || error.Code === "AccessDenied",
    };
  }
}

module.exports = {
  uploadImageToS3,
  uploadLogoToS3,
};
