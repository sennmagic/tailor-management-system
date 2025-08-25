'use client'

import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/apiService';

interface EmployeeContextType {
  employeeData: any;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}



const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export function useEmployee() {
  const context = useContext(EmployeeContext);
  if (context === undefined) {
    throw new Error('useEmployee must be used within an EmployeeProvider');
  }
  return context;
}

interface EmployeeProviderProps {
  children: ReactNode;
}

export function EmployeeProvider({ children }: EmployeeProviderProps) {
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployeeData = async () => {
    setIsLoading(true);
    setError(null);
    
    const { data, error: apiError } = await fetchAPI({
      endpoint: "employees/getEmployeeInfo",
      method: "GET",
      withAuth: true,
    });
    
    console.log("Employee API Response:", { data, error: apiError });
    
    if (apiError) {
      setError(apiError);
    } else {
      setEmployeeData(data);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  return (
    <EmployeeContext.Provider value={{ 
      employeeData, 
      isLoading, 
      error,
      refetch: fetchEmployeeData
    }}>
      {children}
    </EmployeeContext.Provider>
  );
} 