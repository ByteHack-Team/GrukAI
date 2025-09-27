/**
 * Estimate CO2 saved by recycling/removing one unit of garbage.
 * Values are approximate averages per type of material (kg CO2 saved per item)
 */
export function calculateCO2(object) {
  if (!object || !object.material) return 0;

  const materialCO2Map = {
    Plastic: 0.3,       // 0.3 kg CO2 saved per plastic bottle
    Aluminum: 0.5,      // 0.5 kg CO2 saved per aluminum can
    Glass: 0.2,         // 0.2 kg CO2 saved per glass bottle
    Paper: 0.1,         // 0.1 kg CO2 saved per paper item
    Organic: 0.05       // 0.05 kg CO2 saved per organic waste item
  };

  return materialCO2Map[object.material] || 0.1; // Default 0.1 if unknown
}
