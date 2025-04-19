import { Coordinate } from '../context/fieldcontext';

// Calculate center point of field coordinates
export const calculateCenter = (coordinates: Coordinate[]): Coordinate => {
  if (!coordinates || coordinates.length === 0) {
    return { latitude: 0, longitude: 0 };
  }

  const total = coordinates.reduce(
    (acc, coord) => ({
      latitude: acc.latitude + coord.latitude,
      longitude: acc.longitude + coord.longitude,
    }),
    { latitude: 0, longitude: 0 }
  );

  return {
    latitude: total.latitude / coordinates.length,
    longitude: total.longitude / coordinates.length,
  };
};

// Get emoji for crop type
export const getCropEmoji = (cropName: string): string => {
  const cropEmojiMap: Record<string, string> = {
    Banana: '🍌',
    Corn: '🌽',
    Wheat: '🌾',
    Rice: '🌾',
    Potato: '🥔',
    Tomato: '🍅',
    Apple: '🍎',
    Orange: '🍊',
    Grapes: '🍇',
    Strawberry: '🍓',
    Coffee: '☕',
    Tea: '🍵',
    Soybean: '🌱',
    Cotton: '🧶',
    Sugarcane: '🌿',
  };

  return cropEmojiMap[cropName] || '🌱'; // Default emoji for unknown crops
};

// Get ideal soil conditions for a crop
export const getSoilRequirements = (cropName: string): string => {
  const soilRequirements: Record<string, string> = {
    Banana: 'Rich, well-drained loamy soil with high organic matter, pH 5.5-7.0',
    Corn: 'Well-drained, fertile loam with pH 5.8-7.0',
    Wheat: 'Well-drained loam or clay loam with pH 6.0-7.0',
    Rice: 'Clayey soil that can hold water, pH 5.0-6.5',
    Potato: 'Loose, well-drained sandy loam with pH 4.8-5.5',
    Tomato: 'Well-drained loam with high organic matter, pH 6.0-6.8',
  };

  return soilRequirements[cropName] || 'Well-drained soil with balanced nutrients'; // Default soil requirements
};

// Get water requirements for a crop (in mm/week)
export const getWaterRequirements = (cropName: string): number => {
  const waterNeeds: Record<string, number> = {
    Banana: 35,
    Corn: 25,
    Wheat: 20,
    Rice: 50,
    Potato: 25,
    Tomato: 30,
  };

  return waterNeeds[cropName] || 25; // Default water requirement
};

// Get growth stages for a crop with typical duration
export const getGrowthStages = (
  cropName: string
): { stage: string; duration: string }[] => {
  if (!cropName) {
    return [];
  }
  const stages: Record<string, { stage: string; duration: string }[]> = {
    Banana: [
      { stage: 'Vegetative', duration: '6-8 months' },
      { stage: 'Flowering', duration: '3 months' },
      { stage: 'Fruit Development', duration: '3-4 months' },
    ],
    Corn: [
      { stage: 'Emergence', duration: '4-5 days' },
      { stage: 'Vegetative', duration: '4-5 weeks' },
      { stage: 'Pollination', duration: '1-2 weeks' },
      { stage: 'Grain Fill', duration: '6-7 weeks' },
      { stage: 'Ripening', duration: '2-3 weeks' },
    ],
    Rice: [
      { stage: 'Germination', duration: '7-10 days' },
      { stage: 'Tillering', duration: '3-4 weeks' },
      { stage: 'Flowering', duration: '2-3 weeks' },
      { stage: 'Ripening', duration: '3-4 weeks' },
    ],
    Potato: [
      { stage: 'Sprouting', duration: '2-4 weeks' },
      { stage: 'Vegetative', duration: '4-6 weeks' },
      { stage: 'Tuber Formation', duration: '4-6 weeks' },
      { stage: 'Maturation', duration: '2-3 weeks' },
    ],
    Tomato: [
      { stage: 'Germination', duration: '5-10 days' },
      { stage: 'Vegetative', duration: '3-4 weeks' },
      { stage: 'Flowering', duration: '2-3 weeks' },
      { stage: 'Fruit Development', duration: '4-6 weeks' },
    ],
  };

  return stages[cropName] || []; // Default to an empty array if cropName is not found
};