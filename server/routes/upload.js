const multer = require("multer");
const {
  uploadImageToS3,
  uploadLogoToS3,
} = require("../services/uploadService");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

function setupUploadRoutes(app) {
  // Upload image route
  app.post("/upload-image", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const bucketName = process.env.AWS_BUCKET_NAME || "hendiman123";
      const result = await uploadImageToS3(req.file, bucketName);

      if (!result.success) {
        const statusCode = result.isAccessDenied ? 403 : 500;
        if (!res.headersSent) {
          return res.status(statusCode).json({
            error: result.isAccessDenied ? "Access Denied" : "S3 Upload Failed",
            message: result.isAccessDenied
              ? "No permission to upload to S3. Please check AWS IAM permissions."
              : result.error,
            details: result.error,
            code: result.code,
          });
        }
        return;
      }

      if (!res.headersSent) {
        return res.json({ imageUrl: result.imageUrl });
      }
    } catch (error) {
      if (!res.headersSent) {
        return res.status(500).json({
          error: "Failed to upload image",
          details: error.message,
        });
      }
    }
  });

  // Upload logo route
  app.post("/upload-logo", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No logo file provided" });
      }

      const result = await uploadLogoToS3(req.file);

      if (!result.success) {
        const statusCode = result.isAccessDenied ? 403 : 500;
        if (!res.headersSent) {
          return res.status(statusCode).json({
            error: result.isAccessDenied ? "Access Denied" : "S3 Upload Failed",
            message: result.isAccessDenied
              ? "No permission to upload to S3. Please check AWS IAM permissions."
              : result.error,
            details: result.error,
            code: result.code,
          });
        }
        return;
      }

      if (!res.headersSent) {
        return res.json({ logoUrl: result.logoUrl });
      }
    } catch (error) {
      if (!res.headersSent) {
        return res.status(500).json({
          error: "Failed to upload logo",
          details: error.message,
        });
      }
    }
  });

  // Upload call image route
  app.post("/pick-call123", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const bucketName = "pick-call123";
      const result = await uploadImageToS3(req.file, bucketName);

      if (!result.success) {
        const statusCode = result.isAccessDenied ? 403 : 500;
        if (!res.headersSent) {
          return res.status(statusCode).json({
            error: result.isAccessDenied ? "Access Denied" : "S3 Upload Failed",
            message: result.isAccessDenied
              ? "No permission to upload to S3. Please check AWS IAM permissions."
              : result.error,
            details: result.error,
            code: result.code,
          });
        }
        return;
      }

      if (!res.headersSent) {
        return res.json({ imageUrl: result.imageUrl });
      }
    } catch (error) {
      if (!res.headersSent) {
        return res.status(500).json({
          error: "Failed to upload call image",
          details: error.message,
        });
      }
    }
  });
}

module.exports = setupUploadRoutes;
