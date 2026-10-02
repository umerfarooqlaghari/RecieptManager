import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface ReceiptData {
  storeName: string;
  date: string;
  totalAmount: number;
  currency: string;
  category: string;
  items: {
    name: string;
    price: number;
    quantity: number;
  }[];
  taxAmount: number;
}

/**
 * Analyzes a receipt image using Gemini and returns structured JSON
 */
export async function analyzeReceipt(imageBuffer: Buffer, mimeType: string = 'image/jpeg'): Promise<ReceiptData> {
  const prompt = `
      Analyze this receipt image and return a JSON object with:
      - storeName (string)
      - totalAmount (number, the final total)
      - taxAmount (number, extract the tax amount if visible, otherwise 0)
      - date (string, YYYY-MM-DD)
      - currency (string, e.g. USD, EUR, GBP)
      - category (one of: Food, Clothes, Transport, Entertainment, Others)
      - items (array of { name: string, price: number, quantity: number })
      
      Return ONLY valid JSON.
    `;

  const models = [
    "gemini-3.8-flash",           // Primary flash model
    "gemini-3.7-flash",           // Fast fallback
    "gemini-3.6-flash",           // Fallback
    "gemini-3.5-flash",           // Fallback
  ];

  let lastError: any;

  console.log(`\n---------- [Gemini] analyzeReceipt start ----------`);
  console.log(`[Gemini] Image buffer size: ${imageBuffer.length} bytes, mimeType: ${mimeType}`);
  console.log(`[Gemini] Will try models: ${models.join(', ')}`);

  for (const modelName of models) {
    try {
      console.log(`\n[Gemini] ▶ Trying model: ${modelName} ...`);
      const t0 = Date.now();
      const currentModel = genAI.getGenerativeModel({ model: modelName });
      const result = await currentModel.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBuffer.toString("base64"),
            mimeType,
          },
        },
      ]);

      const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
      const response = await result.response;
      const text = response.text();
      console.log(`[Gemini] ✅ Model ${modelName} responded in ${elapsed}s`);
      console.log(`[Gemini] Raw response text (first 500 chars):\n${text.slice(0, 500)}`);

      // Extract JSON from the markdown code block if present
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Validate and default required fields so DB insert never fails
        if (!parsed.totalAmount || isNaN(Number(parsed.totalAmount))) parsed.totalAmount = 0;
        if (!parsed.taxAmount || isNaN(Number(parsed.taxAmount))) parsed.taxAmount = 0;
        if (!parsed.currency) parsed.currency = 'USD';
        if (!parsed.storeName) parsed.storeName = 'Unknown Store';
        if (!parsed.category) parsed.category = 'Others';
        if (!Array.isArray(parsed.items)) parsed.items = [];

        // Date: must be YYYY-MM-DD; default to today if missing/malformed
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!parsed.date || !dateRegex.test(parsed.date)) {
          parsed.date = new Date().toISOString().split('T')[0];
        }

        console.log(`[Gemini] ✅ Parsed JSON successfully:`, JSON.stringify(parsed, null, 2));
        console.log(`---------- [Gemini] analyzeReceipt end ----------\n`);
        return parsed;
      }

      console.error(`[Gemini] ❌ Could not extract JSON from response text.`);
      throw new Error("Could not parse JSON from Gemini response");
    } catch (error: any) {
      lastError = error;
      const status = error.status || (error as any).response?.status;
      console.warn(`[Gemini] ⚠ Model ${modelName} failed — status: ${status}, message: ${error.message}`);

      // Try next model on transient errors or if the model name is not found (404)
      if (status === 503 || status === 429 || status === 404) {
        console.warn(`[Gemini] Model ${modelName} unavailable/not found (${status}). Trying fallback...`);
        continue;
      }

      // For other errors, log and rethrow immediately
      console.error(`[Gemini] ❌ Fatal error with model ${modelName}:`, error);
      throw error;
    }
  }

  console.error(`[Gemini] ❌ All models exhausted. Last error:`, lastError?.message);
  console.log(`---------- [Gemini] analyzeReceipt end ----------\n`);
  throw lastError || new Error("All Gemini models failed to process the receipt");
}

