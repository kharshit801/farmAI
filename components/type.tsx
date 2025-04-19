// Type for coordinates
export type Coordinate = {
    latitude: number;
    longitude: number;
  };
  
  // Type for a complete field
  export type Field = {
    id: string;
    name: string;
    crop: string;
    area: number;
    location: string;
    coordinates: Coordinate[];
    image: any;
    suggestedCrops?: string[];
  };
  
  // Type for field being created
  export type NewField = {
    name: string;
    crop: string;
    area: number;
    location: string;
    coordinates: Coordinate[];
    suggestedCrops?: string[];
  };
  
  // Type for the map region
  export type MapRegion = {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };