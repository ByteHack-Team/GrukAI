export function calculateCO2(detectedObject) {
  // Simple CO2 impact calculation based on object type
  const co2Map = {
    "plastic bottle": "High",
    "plastic": "High", 
    "glass": "Medium",
    "paper": "Low",
    "cardboard": "Low",
    "aluminum": "Medium",
    "metal": "Medium",
    "organic": "Very Low",
    "electronics": "Very High"
  };

  const objectLower = (detectedObject.object || "").toLowerCase();
  const materialLower = (detectedObject.material || "").toLowerCase();

  // Check object first, then material
  for (const [key, value] of Object.entries(co2Map)) {
    if (objectLower.includes(key) || materialLower.includes(key)) {
      return value;
    }
  }

  return "Unknown";
}