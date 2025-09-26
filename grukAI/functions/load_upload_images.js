import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";
import { Buffer } from "buffer";
import cors from "cors";

admin.initializeApp();
const db = admin.firestore();
const bucket = admin.storage().bucket();

// Allow requests from any origin (or replace "*" with your frontend URL)
const corsHandler = cors({ origin: true });

export const uploadImage = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    // Handle preflight request
    if (req.method === "OPTIONS") return res.status(204).send("");

    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).send("Missing image data");
      }

      const buffer = Buffer.from(imageBase64, "base64");
      const fileName = `images/${uuidv4()}.jpg`;
      const file = bucket.file(fileName);

      await file.save(buffer, {
        metadata: { contentType: "image/jpeg" },
      });

      // Generate signed URL
      const [url] = await file.getSignedUrl({
        action: "read",
        expires: "03-01-2030",
      });

      const docRef = await db.collection("images").add({
        url,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.status(200).json({ id: docRef.id, url });
    } catch (error) {
      console.error(error);
      res.status(500).send(error.message);
    }
  });
});
