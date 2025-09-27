import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import { calculateCO2 } from "./utils";

const gemini = new ChatGoogleGenerativeAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
  model: "gemini-2.5-flash",
});

const SYSTEM_PROMPT = `
You are a waste sorting assistant. Analyze the image and identify ALL visible waste/garbage items.

For EACH detected waste item, provide bounding box coordinates as percentages of image dimensions (0-100 scale).

CRITICAL: You must respond with ONLY valid JSON in this exact format:

For SINGLE item:
{
  "object": "name of the item",
  "material": "main material type", 
  "disposal_instructions": "how to dispose properly",
  "points_earned": 5,
  "description_info": "brief environmental impact note",
  "bbox": [x_percent, y_percent, width_percent, height_percent]
}

For MULTIPLE items (2 or more):
{
  "items": [
    {
      "object": "name of item 1",
      "material": "main material type",
      "disposal_instructions": "how to dispose properly", 
      "points_earned": 5,
      "description_info": "brief environmental impact note",
      "bbox": [x_percent, y_percent, width_percent, height_percent]
    },
    {
      "object": "name of item 2", 
      "material": "main material type",
      "disposal_instructions": "how to dispose properly",
      "points_earned": 5, 
      "description_info": "brief environmental impact note",
      "bbox": [x_percent, y_percent, width_percent, height_percent]
    }
  ]
}

Bounding box format: [x, y, width, height] where all values are percentages (0-100) of image dimensions.
- x: left edge percentage from left of image
- y: top edge percentage from top of image  
- width: box width as percentage of image width
- height: box height as percentage of image height

If no waste item is found, return: {"object": "No waste found", "material": "N/A", "disposal_instructions": "N/A", "points_earned": 0, "description_info": "No waste detected", "bbox": [0, 0, 0, 0]}
`;

async function blobToBase64(blob) {
  console.log("Converting blob to base64, size:", blob.size, "type:", blob.type);
  
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    
    console.log("Blob converted to base64, length:", base64.length);
    
    return {
      mimeType: blob.type || "image/jpeg",
      data: base64
    };
  } catch (error) {
    console.error("Error converting blob:", error);
    throw error;
  }
}

function parseTextResponse(responseText) {
  // Try to find JSON in the response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log("=== PARSED FALLBACK JSON ===", parsed);
      return parsed; // Return the full parsed object, don't modify it here
    } catch (e) {
      console.log("JSON parse failed:", e);
    }
  }

  // Fallback parsing for single item
  let object = "Unknown item";
  const objectMatch = responseText.match(/(?:\*\*|")([^"*]+(?:bottle|can|bag|container|cup|wrapper|package|box)[^"*]*)(?:\*\*|")/i);
  if (objectMatch) {
    object = objectMatch[1].trim().replace(/^(the|a|an)\s+/i, '');
  }

  let material = "Unknown";
  const materialMatch = responseText.match(/(plastic|metal|aluminum|paper|cardboard|glass|organic)/i);
  if (materialMatch) {
    material = materialMatch[1].trim();
  }

  let points = 3;
  if (material.toLowerCase().includes('plastic')) points = 4;
  if (material.toLowerCase().includes('aluminum') || material.toLowerCase().includes('metal')) points = 6;
  if (material.toLowerCase().includes('glass')) points = 7;

  return {
    object,
    material,
    disposal_instructions: "Place in appropriate waste bin",
    points_earned: points,
    description_info: responseText.slice(0, 150).replace(/\*\*/g, '').trim() + "...",
    bbox: [10, 10, 80, 80] // Default bbox
  };
}

export async function analyzeImageFrontend({ imageBlob, imageUrl, prompt }) {
  const finalPrompt = prompt ? `${SYSTEM_PROMPT}\n\nAdditional context: ${prompt}` : SYSTEM_PROMPT;

  console.log("=== SENDING TO GEMINI ===");
  console.log("Image Blob:", imageBlob ? `${imageBlob.size} bytes, ${imageBlob.type}` : "None");
  console.log("Final Prompt:", finalPrompt);
  console.log("========================");

  try {
    let imageData;
    
    if (imageBlob) {
      imageData = await blobToBase64(imageBlob);
    } else if (imageUrl) {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      const blob = await response.blob();
      imageData = await blobToBase64(blob);
    } else {
      throw new Error("Neither imageBlob nor imageUrl provided");
    }
    
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

    console.log("=== RAW GEMINI RESPONSE ===");
    console.log("Response content:", response.content);
    console.log("===========================");

    const responseText = response.content;
    let detectedData;

    try {
      // First, try to parse the raw response as JSON
      detectedData = JSON.parse(responseText);
      console.log("=== PARSED JSON (Direct) ===");
      console.log("Parsed data:", detectedData);
      console.log("==================");
    } catch {
      console.log("=== JSON PARSE FAILED - USING TEXT PARSER ===");
      detectedData = parseTextResponse(responseText);
      console.log("Parsed from text:", detectedData);
      console.log("==========================================");
    }

    if (!detectedData) {
      console.log("=== NO DATA DETECTED ===");
      return "No garbage found";
    }

    // **KEY FIX**: Check if we have multiple items BEFORE processing
    if (detectedData.items && Array.isArray(detectedData.items) && detectedData.items.length > 0) {
      console.log("=== MULTIPLE ITEMS DETECTED ===");
      console.log("Items count:", detectedData.items.length);
      console.log("Items array:", detectedData.items);
      
      // Process each item and add CO2 calculation
      const processedItems = detectedData.items.map(item => {
        const co2 = calculateCO2(item);
        return {
          ...item,
          image_url: imageUrl,
          co2value: co2,
          description: item.description_info || item.description || "No description available"
        };
      });

      const result = {
        isMultipleItems: true,
        items: processedItems,
        totalItems: processedItems.length,
        totalPoints: processedItems.reduce((sum, item) => sum + (item.points_earned || 0), 0),
        originalImageBlob: imageBlob, // Keep original for cropping
        originalImageUrl: imageUrl
      };

      console.log("=== RETURNING MULTIPLE ITEMS RESULT ===");
      console.log("Result:", result);
      console.log("======================================");

      return result;
    } else {
      // Single item - maintain existing behavior
      console.log("=== SINGLE ITEM DETECTED ===");
      
      // If it came back with an items array but only one item, extract it
      const singleItem = detectedData.items && detectedData.items.length === 1 
        ? detectedData.items[0] 
        : detectedData;
        
      console.log("Single item data:", singleItem);
      
      const co2 = calculateCO2(singleItem);

      const finalResult = {
        ...singleItem,
        image_url: imageUrl,
        co2value: co2,
        description: singleItem.description_info || singleItem.description || "No description available",
        isMultipleItems: false
      };

      console.log("=== SINGLE ITEM RESULT ===");
      console.log("Final result:", finalResult);
      console.log("=========================");

      return finalResult;
    }

  } catch (error) {
    console.error("=== ERROR IN AI ANALYSIS ===");
    console.error("Error:", error);
    console.error("============================");
    
    return {
      object: "Error",
      material: "Unknown",
      disposal_instructions: "Analysis failed due to error", 
      description: error.message,
      points_earned: 0,
      co2value: "Unknown",
      image_url: imageUrl,
      bbox: [0, 0, 100, 100]
    };
  }
}