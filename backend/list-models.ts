import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
async function main() {
    try {
        console.log("Fetching models...");
        // Use standard fetch against googleapis with the key since sdk might not expose listModels easily
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        if (data.models) {
            console.log("\nSupported Models for this key:");
            data.models.forEach((m: any) => {
                if (m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name.replace('models/', '')} (${m.displayName})`);
                }
            });
        } else {
            console.log("Error or no models:", data);
        }
    } catch (e) {
        console.error(e);
    }
}
main();
