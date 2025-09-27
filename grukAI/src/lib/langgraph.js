import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import { calculateCO2 } from "./utils";

const gemini = new ChatGoogleGenerativeAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
  model: "gemini-2.5-flash",
});

const SYSTEM_PROMPT = `
You are a waste sorting assistant. Analyze the image and identify the most prominent waste/garbage item.

CRITICAL: You must respond with ONLY valid JSON in this exact format:
{
  "object": "name of the item",
  "material": "main material type",
  "disposal_instructions": "how to dispose properly",
  "points_earned": 5,
  "description_info": "brief environmental impact note"
}

Do NOT include any other text, explanations, or markdown. ONLY the JSON object.
If no waste item is found, return: {"object": "No waste found", "material": "N/A", "disposal_instructions": "N/A", "points_earned": 0, "description_info": "No waste detected"}
`;

async function blobToBase64(blob) {
  
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Convert to base64
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    
    return {
      mimeType: blob.type || "image/jpeg",
      data: base64
    };
  } catch (error) {
    console.error("Error converting blob:", error);
    throw error;
  }
}

// Function to extract structured data from text response
function parseTextResponse(responseText) {
  // Try to find any JSON in the response first
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.log("JSON found but parse failed:", e);
    }
  }

  // If no JSON, extract key information from the text
  console.log("Parsing structured data from text response");
  
  // Extract object name (look for quoted items or after "waste item")
  let object = "Unknown item";
  const objectMatch = responseText.match(/(?:\*\*|")([^"*]+(?:balloon|bottle|can|bag|container|cup|wrapper|package|box)[^"*]*)(?:\*\*|")/i) ||
                     responseText.match(/waste item.*?(?:is|:|the)\s*(?:\*\*|")?([^"*\n.]+)(?:\*\*|")?/i) ||
                     responseText.match(/identifiable.*?(?:is|:|the)\s*(?:\*\*|")?([^"*\n.]+)(?:\*\*|")?/i);
  if (objectMatch) {
    object = objectMatch[1].trim().replace(/^(the|a|an)\s+/i, '');
  }

  // Extract material type
  let material = "Unknown";
  const materialMatch = responseText.match(/(?:made|material|type).*?(?:of|from|:)\s*([^.\n,]+)/i) ||
                       responseText.match(/(plastic|metal|aluminum|paper|cardboard|glass|organic|mylar|foil|nylon)/i);
  if (materialMatch) {
    material = materialMatch[1].trim();
  }

  // Extract disposal instructions (look for numbered lists or instruction sections)
  let disposal = "Place in appropriate waste bin";
  const disposalMatch = responseText.match(/(?:disposal|trash|recycling|bin)[\s\S]*?(?:should|place|put)[\s\S]*?(?:in|into)\s*([^.\n]+)/i) ||
                       responseText.match(/(?:\*\*)?general\s+(?:waste|trash)(?:\*\*)?/i);
  if (disposalMatch) {
    disposal = disposalMatch[0].replace(/\*\*/g, '').trim();
  } else if (responseText.toLowerCase().includes('not recyclable')) {
    disposal = "Place in general trash bin - not recyclable";
  }

  // Generate points based on material type
  let points = 3; // default
  if (material.toLowerCase().includes('plastic') || material.toLowerCase().includes('mylar')) points = 4;
  if (material.toLowerCase().includes('aluminum') || material.toLowerCase().includes('metal')) points = 6;
  if (material.toLowerCase().includes('paper') || material.toLowerCase().includes('cardboard')) points = 5;
  if (material.toLowerCase().includes('glass')) points = 7;

  // Create description from key parts of the response
  const description = responseText.slice(0, 150).replace(/\*\*/g, '').trim() + "...";

  return {
    object: object,
    material: material,
    disposal_instructions: disposal,
    points_earned: points,
    description_info: description
  };
}

// Updated function to accept either blob or imageUrl
export async function analyzeImageFrontend({ imageBlob, imageUrl, prompt }) {
  const finalPrompt = prompt ? `${SYSTEM_PROMPT}\n\nAdditional context: ${prompt}` : SYSTEM_PROMPT;

  try {
    let imageData;
    
    // Use blob if provided, otherwise try to fetch URL (fallback)
    if (imageBlob) {
      imageData = await blobToBase64(imageBlob);
    } else if (imageUrl) {
      // Fallback: try to fetch from URL (may still fail due to CORS)
      console.warn("Using imageUrl fallback - may fail due to CORS");
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      const blob = await response.blob();
      imageData = await blobToBase64(blob);
    } else {
      throw new Error("Neither imageBlob nor imageUrl provided");
    }
    
    // Create message with image data
    const message = new HumanMessage({
      content: [
        {
          type: "text",
          text: finalPrompt,
        },
        {
          type: "image_url",
          image_url: {
            url: `data:${imageData.mimeType};base64,${imageData.data}`,
          },
        },
      ],
    });

    console.log("Sending message with image data to Gemini...");
    const response = await gemini.invoke([message]);
    const responseText = response.content;

    // Try to extract JSON from response
    let detectedObject;
    try {
      // First try to parse the entire response as JSON
      detectedObject = JSON.parse(responseText);
    } catch {
      // If that fails, try to find JSON within the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
        } catch (parseError) {
        }
      } else {
      }
    }

    if (!detectedObject || Object.keys(detectedObject).length === 0) {
      return "No garbage found";
    }

    // Calculate CO2 after parsing the AI response
    const co2 = calculateCO2(detectedObject);

    const finalResult = {
      ...detectedObject,
      image_url: imageUrl, // Add the original URL back if provided
      co2value: co2,
      description: detectedObject.description_info || detectedObject.description || "No description available"
    };

    return finalResult;

  } catch (error) {
    
    return {
      object: "Error",
      material: "Unknown",
      disposal_instructions: "Analysis failed due to error",
      description: error.message,
      points_earned: 0,
      co2value: "Unknown",
      image_url: imageUrl
    };
  }
}