import * as functions from "firebase-functions";
import { analyzeImageWithLangGraph } from "./functions.js";

export const analyzeImageFunction = functions.https.onRequest(async (req, res) => {
  try {
    const { imagePath } = req.body; // Path to image in Firebase Storage
    if (!imagePath) return res.status(400).json({ error: "No imagePath provided" });

    const result = await analyzeImageWithLangGraph(imagePath);
    res.json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
