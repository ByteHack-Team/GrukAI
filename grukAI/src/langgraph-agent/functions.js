import { initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import * as functions from "firebase-functions";
import { ChatGooglePaLM } from "langchain/experimental/chat_models/googlepalm";
import { HumanChatMessage } from "langchain/schema";

import { calculateCO2 } from "./utils.js";

// Initialize Firebase Admin
initializeApp();

// Initialize Gemini / Google PaLM client
const gemini = new ChatGooglePaLM({
  apiKey: functions.config().gemini.apikey // Set via Firebase: firebase functions:config:set gemini.apikey="YOUR_KEY"
});

// System prompt placeholder
const SYSTEM_PROMPT = `
You are a waste sorting assistant. Analyze the image and return all garbage objects detected.
For each object, provide material, disposal instructions, CO2 value, points earned, and description.
`;

export async function analyzeImageWithGemini(imagePath) {
  const bucket = getStorage().bucket();
  const file = bucket.file(imagePath);
  const [imageUrl] = await file.getSignedUrl({ action: "read", expires: Date.now() + 1000 * 60 });

  const prompt = `
${SYSTEM_PROMPT}
Analyze this image URL: ${imageUrl}
Return JSON in this format:
[
  {
    "image_url": "...",
    "object": "...",
    "material": "...",
    "disposal_instructions": "...",
    "co2value": ...,
    "points_earned": ...,
    "description": "..."
  }
]
If no garbage is found, return "No garbage found".
`;

  const response = await gemini.call([new HumanChatMessage(prompt)]);

  let detectedObjects;
  try {
    detectedObjects = JSON.parse(response.text);
  } catch {
    return response.text; // If parsing fails, return raw text
  }

  if (!detectedObjects || detectedObjects.length === 0) return "No garbage found";

  // Add CO2 calculation for each object
  detectedObjects = detectedObjects.map(obj => ({
    ...obj,
    co2value: calculateCO2(obj)
  }));

  return detectedObjects;
}

