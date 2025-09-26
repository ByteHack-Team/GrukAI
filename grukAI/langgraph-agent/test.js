import { analyzeImageWithGemini } from "./index.js";

const testImagePath = "test.jpg"; 

analyzeImageWithGemini(testImagePath)
  .then(result => console.log(result))
  .catch(err => console.error(err));
