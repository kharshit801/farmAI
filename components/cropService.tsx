// Interface for crop suggestion response
interface CropSuggestionResponse {
    recommendedCrops: string[];
    soilType?: string;
    climate?: string;
    rainfall?: number;
  }
  
  // Function to fetch crop suggestions from an external API
  export const fetchCropSuggestions = async (
    latitude: number, 
    longitude: number
  ): Promise<string[]> => {
    try {
      // Replace this URL with your actual crop recommendation API
      const response = await fetch(
        `https://api.example.com/crop-recommendations?lat=${latitude}&lon=${longitude}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch crop suggestions');
      }
      
      const data: CropSuggestionResponse = await response.json();
      return data.recommendedCrops || [];
      
    } catch (error) {
      console.error("Error fetching crop suggestions:", error);
      // Return some default suggestions if API fails
      return ['Rice', 'Wheat', 'Corn', 'Soybean', 'Cotton'];
    }
  };
  
  // Mock function to simulate API call when real API isn't available
  export const mockFetchCropSuggestions = async (
    latitude: number, 
    longitude: number
  ): Promise<string[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Different suggestions based on different regions
    let suggestions: string[] = [];
    
    // North India
    if (latitude > 25 && longitude > 75 && longitude < 85) {
      suggestions = ['Wheat', 'Rice', 'Sugarcane', 'Potato', 'Mustard'];
    } 
    // South India
    else if (latitude < 20 && longitude > 75 && longitude < 85) {
      suggestions = ['Rice', 'Coconut', 'Banana', 'Black Pepper', 'Coffee'];
    }
    // East India
    else if (latitude > 20 && latitude < 25 && longitude > 85) {
      suggestions = ['Rice', 'Jute', 'Tea', 'Maize', 'Oilseeds'];
    }
    // West India
    else if (latitude > 20 && longitude < 75) {
      suggestions = ['Cotton', 'Groundnut', 'Jowar', 'Bajra', 'Pulses'];
    }
    // Default suggestions
    else {
      suggestions = ['Rice', 'Wheat', 'Maize', 'Pulses', 'Vegetables'];
    }
    
    return suggestions;
  };
  
  // Calculate area of a polygon defined by coordinates (in acres)
  export const calculateArea = (
    coordinates: {latitude: number, longitude: number}[]
  ): number => {
    // Simple polygon area calculation using Shoelace formula
    if (coordinates.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < coordinates.length; i++) {
      const j = (i + 1) % coordinates.length;
      area += coordinates[i].latitude * coordinates[j].longitude;
      area -= coordinates[j].latitude * coordinates[i].longitude;
    }
    
    // Approximate conversion to acres
    area = Math.abs(area) * 111319.9 * 111319.9 / 10000 / 2;
    return parseFloat(area.toFixed(2));
  };
  
  // Calculate center point of a polygon
  export const calculateCenter = (
    coordinates: {latitude: number, longitude: number}[]
  ): {latitude: number, longitude: number} => {
    const centerLat = coordinates.reduce((sum, coord) => sum + coord.latitude, 0) / coordinates.length;
    const centerLon = coordinates.reduce((sum, coord) => sum + coord.longitude, 0) / coordinates.length;
    
    return {
      latitude: centerLat,
      longitude: centerLon
    };
  };