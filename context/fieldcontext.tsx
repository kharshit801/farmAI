import React, { createContext, useState, useContext, ReactNode } from 'react';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface Weather {
  current: {
    temp: number;
    weather: {
      main: string;
      description: string;
      icon: string;
    };
    humidity: number;
    wind_speed: number;
    precipitation: number;
    uvi: number;
    clouds: number;
  };
  daily: {
    temp: { day: number; min: number; max: number };
    precipitation: number;
    weather: { main: string };
  }[];
}

export interface Field {
  id: string;
  name: string;
  location: string;
  coordinates: Coordinate[];
  area: number;
  crop?: string;
  image: any;
  weather?: Weather;
}

interface FieldContextType {
  selectedField: Field | null;
  setSelectedField: React.Dispatch<React.SetStateAction<Field | null>>;
}

const FieldContext = createContext<FieldContextType | undefined>(undefined);

export const FieldProvider = ({ children }: { children: ReactNode }) => {
  const [selectedField, setSelectedField] = useState<Field | null>(null);

  return (
    <FieldContext.Provider value={{ selectedField, setSelectedField }}>
      {children}
    </FieldContext.Provider>
  );
};

export const useField = (): FieldContextType => {
  const context = useContext(FieldContext);
  if (!context) {
    throw new Error('useField must be used within a FieldProvider');
  }
  return context;
};