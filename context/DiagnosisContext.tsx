import React, { createContext, useState, ReactNode, useContext } from 'react';

type DiagnosisData = {
  imageUri: string;
  result: string;
};

type DiagnosisContextType = {
  diagnosisData: DiagnosisData | null;
  setDiagnosisData: (data: DiagnosisData) => void;
};

// Create the context with default values
const DiagnosisContext = createContext<DiagnosisContextType | undefined>(undefined);

// Custom hook for using the DiagnosisContext
export const useDiagnosis = (): DiagnosisContextType => {
  const context = useContext(DiagnosisContext);
  if (!context) {
    throw new Error('useDiagnosis must be used within a DiagnosisProvider');
  }
  return context;
};

type DiagnosisProviderProps = {
  children: ReactNode;
};

export const DiagnosisProvider: React.FC<DiagnosisProviderProps> = ({ children }) => {
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisData | null>(null);
  
  return (
    <DiagnosisContext.Provider value={{ diagnosisData, setDiagnosisData }}>
      {children}
    </DiagnosisContext.Provider>
  );
};