import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { calculateCO2 } from "./utils";

const gemini = new ChatGoogleGenerativeAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
  model: "gemini-2.5-flash",
});

const SYSTEM_PROMPT = `
You are a waste sorting assistant. Analyze the image and return **only the most prominent garbage object detected**.
For this object, provide:

- object: the common name of the item
- material: the main material(s) it is made of
- disposal_instructions: how it should be disposed or recycled
- points_earned: reward points for proper disposal
- description_info: a short factual note about this item's environmental impact (e.g., decomposition time, hazards, recyclability), without CO2 calculation.

Do NOT calculate CO2; that will be done separately.
The description_info will later be used to create a user-friendly description in the format:
"This item can take ~450 years to break down "
`;

export async function analyzeImageFrontend(imageUrl) {
  const prompt = `
${SYSTEM_PROMPT}
Analyze this image URL: ${imageUrl}
Return the result as **valid JSON only** with this exact structure:
{
  "image_url": "...",
  "object": "...",
  "material": "...",
  "disposal_instructions": "...",
  "points_earned": ...,
  "description_info": "..."
}
If no garbage is found, return "No garbage found".
`;

  const response = await gemini.call([{ role: "user", content: prompt }]);

  let detectedObject;
  try {
    detectedObject = JSON.parse(response.text);
  } catch {
    return response.text;
  }

  if (!detectedObject || Object.keys(detectedObject).length === 0) return "No garbage found";

  // calculate CO2 after parsing the AI response
  const co2 = calculateCO2(detectedObject);


  return {
    ...detectedObject,
    co2
  };
}
