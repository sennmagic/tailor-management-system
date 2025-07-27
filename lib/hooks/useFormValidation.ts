import { useState, useCallback } from 'react'

interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
}

interface ValidationRules {
  [key: string]: ValidationRule
}

interface ValidationErrors {
  [key: string]: string
}

export function useFormValidation<T extends Record<string, any>>(
  initialData: T,
  validationRules: ValidationRules
) {
  const [data, setData] = useState<T>(initialData)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateField = useCallback((name: string, value: any): string | null => {
    const rule = validationRules[name]
    if (!rule) return null

    // Required validation
    if (rule.required && (!value || value.toString().trim() === '')) {
      return `${name.charAt(0).toUpperCase() + name.slice(1)} is required`
    }

    if (value && value.toString().trim() !== '') {
      // Min length validation
      if (rule.minLength && value.toString().length < rule.minLength) {
        return `${name.charAt(0).toUpperCase() + name.slice(1)} must be at least ${rule.minLength} characters`
      }

      // Max length validation
      if (rule.maxLength && value.toString().length > rule.maxLength) {
        return `${name.charAt(0).toUpperCase() + name.slice(1)} must be less than ${rule.maxLength} characters`
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(value.toString())) {
        return `${name.charAt(0).toUpperCase() + name.slice(1)} format is invalid`
      }

      // Custom validation
      if (rule.custom) {
        const customError = rule.custom(value)
        if (customError) return customError
      }
    }

    return null
  }, [validationRules])

  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {}
    let isValid = true

    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, data[fieldName])
      if (error) {
        newErrors[fieldName] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }, [data, validationRules, validateField])

  const setFieldValue = useCallback((name: string, value: any) => {
    setData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }, [errors])

  const setFieldError = useCallback((name: string, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }))
  }, [])

  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  const resetForm = useCallback(() => {
    setData(initialData)
    setErrors({})
    setIsSubmitting(false)
  }, [initialData])

  return {
    data,
    errors,
    isSubmitting,
    setIsSubmitting,
    setFieldValue,
    setFieldError,
    validateField,
    validateForm,
    clearErrors,
    resetForm,
    setData
  }
} 