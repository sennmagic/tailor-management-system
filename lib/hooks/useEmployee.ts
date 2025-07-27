import { useState, useEffect, useCallback } from 'react'
import { fetchAPI } from '@/lib/apiService'
import { Employee, APIError } from '@/lib/types'

interface UseEmployeeReturn {
  employee: Employee | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateEmployee: (data: Partial<Employee>) => Promise<void>
}

export function useEmployee(): UseEmployeeReturn {
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEmployee = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: apiError } = await fetchAPI<Employee>({
        endpoint: "employees/getEmployeeInfo",
        method: "GET",
        withAuth: true,
      })

      if (apiError) {
        throw new APIError(400, 'FETCH_ERROR', apiError)
      }

      if (data) {
        setEmployee(data)
      }
    } catch (err) {
      const errorMessage = err instanceof APIError 
        ? err.message 
        : 'Failed to fetch employee data'
      setError(errorMessage)
      console.error('Employee fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateEmployee = useCallback(async (updateData: Partial<Employee>) => {
    try {
      setError(null)

      const { data, error: apiError } = await fetchAPI<Employee>({
        endpoint: "employees/update",
        method: "PUT",
        data: updateData,
        withAuth: true,
      })

      if (apiError) {
        throw new APIError(400, 'UPDATE_ERROR', apiError)
      }

      if (data) {
        setEmployee(prev => prev ? { ...prev, ...data } : data)
      }
    } catch (err) {
      const errorMessage = err instanceof APIError 
        ? err.message 
        : 'Failed to update employee data'
      setError(errorMessage)
      console.error('Employee update error:', err)
      throw err
    }
  }, [])

  useEffect(() => {
    fetchEmployee()
  }, [fetchEmployee])

  return {
    employee,
    isLoading,
    error,
    refetch: fetchEmployee,
    updateEmployee
  }
} 