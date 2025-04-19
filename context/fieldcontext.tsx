import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define the shape of the context value
interface FieldContextType {
  selectedField: any; // Replace `any` with the appropriate type for your field
  setSelectedField: React.Dispatch<React.SetStateAction<any>>; // Replace `any` with the same type as above
}

// Create the context with a default value of `undefined`
const FieldContext = createContext<FieldContextType | undefined>(undefined);

// Create a provider component
export const FieldProvider = ({ children }: { children: ReactNode }) => {
  const [selectedField, setSelectedField] = useState<any>(null); // Replace `any` with the appropriate type

  return (
    <FieldContext.Provider value={{ selectedField, setSelectedField }}>
      {children}
    </FieldContext.Provider>
  );
};

// Create a hook to use the context
export const useField = (): FieldContextType => {
  const context = useContext(FieldContext);
  if (!context) {
    throw new Error('useField must be used within a FieldProvider');
  }
  return context;
};