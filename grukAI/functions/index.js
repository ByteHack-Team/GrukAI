import * as functions from "firebase-functions";
// import { logger } from "firebase-functions";
// import { ChatGoogleGenerativeAI } from "@langchain/google-genai"; // <-- Correct import
// import { analyzeImageWithGemini } from "./functions.js";

// // Initialize Gemini / Google PaLM
// const gemini = new ChatGoogleGenerativeAI({
//   apiKey: functions.config().gemini.apikey,
//   model: "gemini-2.5-flash", // optional, pick a Gemini model
// });

// // Optional: limit instances to reduce costs
// functions.setGlobalOptions({ maxInstances: 10 });

// // Exported Cloud Function
// export const analyzeImageFunction = functions.https.onRequest(async (req, res) => {
//   try {
//     const { imagePath } = req.body;
//     if (!imagePath) return res.status(400).json({ error: "No imagePath provided" });

//     const result = await analyzeImageWithGemini(imagePath, gemini);
//     res.json(result);
//   } catch (error) {
//     logger.error(error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

export const analyzeImageFunction = functions.https.onRequest((req, res) => {
  res.send("Function is alive!");
});