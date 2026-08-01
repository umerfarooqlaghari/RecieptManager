import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";

dotenv.config();

const region = process.env.AWS_REGION || "us-east-1";

// S3 Client Configuration
const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// SES Client Configuration
const sesClient = new SESClient({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const bucketName = process.env.AWS_S3_BUCKET_NAME || "";
const fromEmail = process.env.AWS_SES_FROM_EMAIL || "";

async function uploadToS3(key: string, fileBuffer: Buffer, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  });

  try {
    await s3Client.send(command);
    return { key, success: true };
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw error;
  }
}

/** Uploads a receipt to S3 in a specific user folder */
export async function uploadReceipt(userId: string, fileBuffer: Buffer, fileName: string, contentType: string) {
  const key = `receipts/${userId}/${Date.now()}_${fileName}`;
  return uploadToS3(key, fileBuffer, contentType);
}

/** Uploads a profile picture under profiles/ (not receipts/) */
export async function uploadProfilePicture(userId: string, fileBuffer: Buffer, fileName: string, contentType: string) {
  const key = `profiles/${userId}/${Date.now()}_${fileName}`;
  return uploadToS3(key, fileBuffer, contentType);
}

/**
 * Generates a signed URL for viewing a receipt
 */
export async function getReceiptUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  try {
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
    return url;
  } catch (error) {
    console.error("Error generating signed URL:", error);
    throw error;
  }
}

/**
 * Sends an automated email using SES
 */
export async function sendEmail(to: string, subject: string, body: string, isHtml: boolean = true) {
  const command = new SendEmailCommand({
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Body: {
        [isHtml ? "Html" : "Text"]: {
          Data: body,
          Charset: "UTF-8",
        },
      },
      Subject: {
        Data: subject,
        Charset: "UTF-8",
      },
    },
    Source: fromEmail,
  });

  try {
    const result = await sesClient.send(command);
    return { success: true, messageId: result.MessageId };
  } catch (error) {
    console.error("Error sending email via SES:", error);
    throw error;
  }
}
