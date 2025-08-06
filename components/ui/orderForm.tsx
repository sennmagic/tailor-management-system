"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card'
import { Input } from './input'
import { Button } from './button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Textarea } from './textarea'
import { Skeleton } from './skeleton'
import { useLookup } from '@/lib/hooks/useLookup'
import { useFormValidation } from '@/lib/hooks/useFormValidation'
import { useAPIMutation, useAPI } from '@/lib/apiService'
import { useAlert } from './alertProvider'
import { Plus, Trash2, Calendar, User, Package, DollarSign, AlertCircle, ChevronDown, FileText, Settings, ShoppingCart } from 'lucide-react'
import ErrorBoundary from '@/components/error/ErrorBoundary'

interface OrderFormProps {
  initialData?: any
  onSuccess?: (data: any) => void
  onCancel?: () => void
  mode?: 'create' | 'edit'
}

export function OrderForm({ 
  initialData, 
  onSuccess, 
  onCancel, 
  mode = 'create' 
}: OrderFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [activeTab, setActiveTab] = useState('basic')
  const [uiError, setUiError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { showAlert } = useAlert()

  // Skeleton loader component for the form
  const FormSkeleton = () => (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>

        {/* Tab Navigation Skeleton */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex space-x-1 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-20 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Form Content Skeleton */}
        <div className="flex-1 overflow-y-auto p-6 max-h-[60vh]">
          <div className="space-y-4">
            {/* Basic Fields */}
            <div className="space-y-3">
              <Skeleton className="h-5 w-24" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </div>

            {/* Lookup Fields */}
            <div className="space-y-3">
              <Skeleton className="h-5 w-20" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Skeleton */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <Skeleton className="h-4 w-28" />
          <div className="flex gap-3">
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </div>
    </div>
  )

  // Fetch order data from backend to get form structure - for both create and edit modes
  const { data: orderData, error: orderError, isLoading: orderLoading } = useAPI({
    endpoint: 'orders',
    method: 'GET',
    withAuth: true,
    enabled: true
  })

  // API mutation for creating/updating orders
  const createOrderMutation = useAPIMutation({
    endpoint: 'orders',
    method: 'POST',
    onSuccess: (data) => {
      setIsSubmitting(false)
      showAlert('Order created successfully!', 'success')
      // Only close form on successful submission
      setTimeout(() => onSuccess?.(data), 2000)
    },
    onError: (error) => {
      setIsSubmitting(false)
      
      // Handle validation errors - keep form open and show field errors
      if (error.includes('Validation failed') || error.includes('required')) {
        const fieldErrors: Record<string, string> = {}
        
        // Parse validation errors and map to specific fields
        if (error.includes('customerId')) {
          fieldErrors.customerId = 'Customer is required'
        }
        if (error.includes('factoryId')) {
          fieldErrors.factoryId = 'Factory is required'
        }
        if (error.includes('measurementId')) {
          fieldErrors.measurementId = 'Measurement is required'
        }
        if (error.includes('catalogItem')) {
          fieldErrors['orderItems'] = 'Catalog items are required'
        }
        
        // Set field errors to show red lines - form stays open
        setErrors(fieldErrors)
        showAlert('Please fix the validation errors above', 'destructive')
        
        // Automatically switch to the tab with errors
        const tabWithErrors = getTabWithErrors()
        if (tabWithErrors && tabWithErrors !== activeTab) {
          setActiveTab(tabWithErrors)
        }
      } else {
        showAlert(`Failed to create order: ${error}`, 'destructive')
        // Don't close form on other errors either
      }
    }
  })

  const updateOrderMutation = useAPIMutation({
    endpoint: 'orders',
    method: 'PATCH',
    onSuccess: (data) => {
      setIsSubmitting(false)
      showAlert('Order updated successfully!', 'success')
      // Only close form on successful submission
      setTimeout(() => onSuccess?.(data), 2000)
    },
    onError: (error) => {
      setIsSubmitting(false)
      
      // Handle validation errors - keep form open and show field errors
      if (error.includes('Validation failed') || error.includes('required')) {
        const fieldErrors: Record<string, string> = {}
        
        // Parse validation errors and map to specific fields
        if (error.includes('customerId')) {
          fieldErrors.customerId = 'Customer is required'
        }
        if (error.includes('factoryId')) {
          fieldErrors.factoryId = 'Factory is required'
        }
        if (error.includes('measurementId')) {
          fieldErrors.measurementId = 'Measurement is required'
        }
        if (error.includes('catalogItem')) {
          fieldErrors['orderItems'] = 'Catalog items are required'
        }
        
        // Set field errors to show red lines - form stays open
        setErrors(fieldErrors)
        showAlert('Please fix the validation errors above', 'destructive')
        
        // Automatically switch to the tab with errors
        const tabWithErrors = getTabWithErrors()
        if (tabWithErrors && tabWithErrors !== activeTab) {
          setActiveTab(tabWithErrors)
        }
      } else {
        showAlert(`Failed to update order: ${error}`, 'destructive')
        // Don't close form on other errors either
      }
    }
  })

  // Use lookup hook for dynamic field detection and data fetching
  const {
    lookupOptions,
    lookupErrors,
    isLoading: lookupLoading,
    detectFieldType,
    formatFieldName,
    getStatusOptions,
    getStatusBadgeStyle,
    fetchLookupOptions,
    analyzeFormStructure,
    filterSubmitFields
  } = useLookup({ 
    data: orderData?.orderInfo?.[0] || {
      customerId: '',
      factoryId: '',
      measurementId: '',
      catalogId: '',
      brandName: ''
    }
  })

  // Initialize form when order data is loaded (both create and edit modes)
  useEffect(() => {
    try {
      if (orderData) {
        const orderInfo = orderData?.orderInfo || []
        const baseOrder = Array.isArray(orderInfo) && orderInfo.length > 0 
          ? orderInfo[0] 
          : {}
        
        if (mode === 'edit') {
          // In edit mode, prioritize initialData over baseOrder
          if (initialData && Object.keys(initialData).length > 0) {
            // Use initialData as the primary source, merge with baseOrder for structure
            const editFormData = { ...baseOrder, ...initialData }
            setFormData(editFormData)
            console.log('🔄 Edit mode - initialized with initialData:', editFormData)
          } else {
            // Fallback to baseOrder if no initialData provided
            setFormData(baseOrder)
            console.log('🔄 Edit mode - no initialData, using baseOrder:', baseOrder)
          }
        } else if (mode === 'create') {
          const createFormData: Record<string, any> = {}
          
          Object.keys(baseOrder).forEach(key => {
            const value = baseOrder[key]
            const fieldType = detectFieldType(key, value)
            const isLookupField = fieldType.type === 'lookup'
            
            if (key === '_id') {
              createFormData[key] = ''
            } else if (isLookupField) {
              createFormData[key] = ''
            } else if (Array.isArray(value)) {
              createFormData[key] = []
            } else if (typeof value === 'object' && value !== null) {
              createFormData[key] = {}
            } else if (typeof value === 'number') {
              createFormData[key] = 0
            } else if (typeof value === 'boolean') {
              createFormData[key] = false
            } else {
              createFormData[key] = ''
            }
          })
          
          setFormData(createFormData)
        }
      }
    } catch (err) {
      setUiError('Failed to initialize form: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }, [orderData, mode, initialData, detectFieldType])

  // Handle initialData changes in edit mode
  useEffect(() => {
    if (mode === 'edit' && initialData && Object.keys(initialData).length > 0) {
      console.log('🔄 Edit mode - initialData changed:', initialData)
      setFormData(initialData)
    }
  }, [initialData, mode])

  // Analyze form structure when orderData changes
  useEffect(() => {
    const structureData = orderData?.orderInfo?.[0] || {
      customerId: '',
      factoryId: '',
      measurementId: '',
      catalogId: '',
      brandName: ''
    }
    
    if (structureData && typeof structureData === 'object' && Object.keys(structureData).length > 0) {
      analyzeFormStructure(structureData)
    }
  }, [orderData])



  // Simple form state management like dynamic form
  // const [errors, setErrors] = useState<Record<string, string>>({})

  // Simple field change handler like dynamic form
  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
    
    // Clear error for this field when user starts typing/selecting
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }

    // Real-time validation for required fields
    const validationErrors: Record<string, string> = {}
    
    // Check if the current field is required and validate it
    if (fieldName === 'customerId' && (!value || (typeof value === 'object' && !value._id) || (typeof value === 'string' && value.trim() === ''))) {
      validationErrors.customerId = 'Customer is required'
    }
    
    if (fieldName === 'factoryId' && (!value || (typeof value === 'object' && !value._id) || (typeof value === 'string' && value.trim() === ''))) {
      validationErrors.factoryId = 'Factory is required'
    }
    
    if (fieldName === 'measurementId' && (!value || (typeof value === 'object' && !value._id) || (typeof value === 'string' && value.trim() === ''))) {
      validationErrors.measurementId = 'Measurement is required'
    }

    // Update errors with real-time validation
    if (Object.keys(validationErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...validationErrors }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsSubmitting(true)
    setErrors({})
    setUiError(null)

    // Instant validation before submission
    const validationErrors: Record<string, string> = {}
    
    // Check required fields
    if (!formData.customerId || (typeof formData.customerId === 'object' && !formData.customerId._id) || (typeof formData.customerId === 'string' && formData.customerId.trim() === '')) {
      validationErrors.customerId = 'Customer is required'
    }
    
    if (!formData.factoryId || (typeof formData.factoryId === 'object' && !formData.factoryId._id) || (typeof formData.factoryId === 'string' && formData.factoryId.trim() === '')) {
      validationErrors.factoryId = 'Factory is required'
    }
    
    if (!formData.measurementId || (typeof formData.measurementId === 'object' && !formData.measurementId._id) || (typeof formData.measurementId === 'string' && formData.measurementId.trim() === '')) {
      validationErrors.measurementId = 'Measurement is required'
    }

    // If there are validation errors, show them and stop submission
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setIsSubmitting(false)
      showAlert('Please fix the validation errors above', 'destructive')
      
      // Automatically switch to the tab with errors
      const tabWithErrors = getTabWithErrors()
      if (tabWithErrors && tabWithErrors !== activeTab) {
        setActiveTab(tabWithErrors)
      }
      
      return
    }

    let submissionData = filterSubmitFields(formData)
    
    // Convert lookup field objects to ID strings for API submission
    Object.keys(submissionData).forEach(key => {
      const value = submissionData[key]
      if (typeof value === 'object' && value !== null && (value as any)._id) {
        submissionData[key] = (value as any)._id
      } else if (Array.isArray(value)) {
        submissionData[key] = value.map((item: any) => {
          if (typeof item === 'object' && item !== null) {
            const processedItem = { ...item }
            if (processedItem.catalogItem && typeof processedItem.catalogItem === 'object') {
              processedItem.catalogItem = (processedItem.catalogItem as any)._id || (processedItem.catalogItem as any).id
            }
            return processedItem
          }
          return item
        })
      }
    })
    
    // For edit mode, include the ID in the submission data
    if (mode === 'edit' && formData._id) {
      submissionData = { ...submissionData, _id: formData._id }
    }
        
    if (!submissionData || Object.keys(submissionData).length === 0) {
      const testData = {
        customerId: 'test-customer-id',
        orderDate: new Date().toISOString().split('T')[0],
        status: 'DRAFT',
        _id: mode === 'edit' ? formData._id : undefined
      }
      
      if (mode === 'create') {
        await createOrderMutation.mutateAsync(testData)
      } else {
        await updateOrderMutation.mutateAsync(testData)
      }
      return
    }

    try {
      if (mode === 'create') {
        await createOrderMutation.mutateAsync(submissionData)
      } else {
        const orderId = formData._id
        if (!orderId) {
          setUiError('Order ID is required for updates')
          setIsSubmitting(false)
          return
        }
        
        await updateOrderMutation.mutateAsync({
          ...submissionData,
          _id: orderId
        })
      }
    } catch (error: any) {
      setUiError(`Form submission failed: ${error?.message || 'Unknown error occurred'}`)
      setIsSubmitting(false)
    }
  }

  const renderField = (fieldName: string, value: any) => {
    try {
      const error = errors && errors[fieldName]
      const fieldType = detectFieldType(fieldName, value)
      const label = formatFieldName(fieldName)
      const placeholder = `Enter ${label.toLowerCase()}`
      
      if (['_id', '__v', 'createdAt', 'updatedAt', 'isDeleted'].includes(fieldName)) {
        return null
      }

      // Show skeleton for loading fields
      if (lookupLoading && fieldType.type === 'lookup') {
        return (
          <div key={fieldName} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        )
      }

      if (fieldType.type === 'lookup') {
        const options = (lookupOptions && lookupOptions[fieldName]) || []
        const fieldLabel = formatFieldName(fieldName)
        
        let currentValue = ''
        let displayValue = ''
        
        if (typeof value === 'object' && value !== null) {
          currentValue = value._id || value.id || ''
          displayValue = value.name || value.label || value.brandName || currentValue
        } else if (typeof value === 'string') {
          currentValue = value
          displayValue = value
        }
        
        return (
          <div key={fieldName} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{fieldLabel}</label>
            <Select
              value={currentValue || ''}
              onValueChange={(val) => {
                const selectedItem = options.find((item: any) => item.id === val) as any
                
                let newValue: any
                if (selectedItem) {
                  newValue = {
                    _id: val,
                    name: selectedItem.name || selectedItem.label || selectedItem.brandName,
                    ...(selectedItem.codeNumber && { codeNumber: selectedItem.codeNumber }),
                    ...(selectedItem.pricePerMeter && { pricePerMeter: selectedItem.pricePerMeter })
                  }
                } else {
                  newValue = val
                }
                
                handleFieldChange(fieldName, newValue)
              }}
              disabled={lookupLoading}
            >
              <SelectTrigger className={`h-10 ${error ? 'border-red-500' : ''}`}>
                <SelectValue placeholder={lookupLoading ? `Loading ${fieldLabel.toLowerCase()}...` : `Select ${fieldLabel.toLowerCase()}`}>
                  {displayValue || `Select ${fieldLabel.toLowerCase()}`}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {lookupLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading {fieldLabel.toLowerCase()}...
                  </SelectItem>
                ) : (lookupErrors && lookupErrors[fieldName]) ? (
                  <SelectItem value="error" disabled>
                    Error loading {fieldLabel.toLowerCase()}
                  </SelectItem>
                ) : options.length > 0 ? (
                  options.map((item: any) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label || item.name || item.brandName || `${fieldLabel} ${item.id}`}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="empty" disabled>
                    No {fieldLabel.toLowerCase()} available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {error && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            )}
            {lookupErrors && lookupErrors[fieldName] && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Failed to load {fieldLabel.toLowerCase()}: {lookupErrors[fieldName]}
              </p>
            )}
          </div>
        )
      }

      switch (fieldType.type) {
        case 'text':
          return (
            <div key={fieldName} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{label}</label>
              <Input
                type="text"
                value={value || ''}
                onChange={(e) => {
                  const newValue = e.target.value
                  handleFieldChange(fieldName, newValue)
                }}
                placeholder={placeholder}
                className={`h-10 ${error ? 'border-red-500' : ''}`}
              />
              {error && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </p>
              )}
            </div>
          )

        case 'number':
          return (
            <div key={fieldName} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{label}</label>
              <Input
                type="number"
                value={value || ''}
                onChange={(e) => {
                  const newValue = parseFloat(e.target.value) || 0
                  handleFieldChange(fieldName, newValue)
                }}
                placeholder={placeholder}
                className={`h-10 ${error ? 'border-red-500' : ''}`}
                min={0}
                step={0.01}
              />
              {error && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </p>
              )}
            </div>
          )

        case 'date':
          return (
            <div key={fieldName} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{label}</label>
              <Input
                type="date"
                value={value || ''}
                onChange={(e) => {
                  const newValue = e.target.value
                  handleFieldChange(fieldName, newValue)
                }}
                className={`h-10 ${error ? 'border-red-500' : ''}`}
              />
              {error && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </p>
              )}
            </div>
          )

        case 'status':
          const statusOptions = getStatusOptions(fieldName) || []
          
          return (
            <div key={fieldName} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{label}</label>
              <Select
                value={value || ''}
                onValueChange={(val) => {
                  handleFieldChange(fieldName, val)
                }}
              >
                <SelectTrigger className={`h-10 ${error ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(statusOptions) && statusOptions.length > 0 ? (
                    statusOptions.map((option: string) => (
                      <SelectItem key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-options" disabled>
                      No status options available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {error && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </p>
              )}
            </div>
          )

        case 'array':
          const arrayItems = value || []
          
          return (
            <div key={fieldName} className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newItem = arrayItems.length > 0 
                      ? { ...arrayItems[0], _id: undefined }
                      : { itemType: 'COAT', itemName: '' }
                    
                    const newArray = [...arrayItems, newItem]
                    handleFieldChange(fieldName, newArray)
                  }}
                  className="flex items-center gap-2 bg-primary-50 hover:bg-primary-100 text-primary-700 border-primary-200"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </div>
              <div className="space-y-4">
                {arrayItems.map((item: any, index: number) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-700">Item {index + 1}</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newArray = arrayItems.filter((_: any, i: number) => i !== index)
                          handleFieldChange(fieldName, newArray)
                        }}
                        className="text-red-500 hover:text-red-700 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Item Type</label>
                        <Select
                          value={item.itemType || ''}
                          onValueChange={(val) => {
                            const newArray = [...arrayItems]
                            newArray[index] = { ...newArray[index], itemType: val }
                            handleFieldChange(fieldName, newArray)
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select item type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="COAT">Coat</SelectItem>
                            <SelectItem value="PANT">Pant</SelectItem>
                            <SelectItem value="WAIST_COAT">Waist Coat</SelectItem>
                            <SelectItem value="DAURA">Daura</SelectItem>
                            <SelectItem value="SHIRT">Shirt</SelectItem>
                            <SelectItem value="SUIT">Suit</SelectItem>
                            <SelectItem value="DRESS">Dress</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Item Name</label>
                        <Input
                          type="text"
                          value={item.itemName || ''}
                          onChange={(e) => {
                            const newArray = [...arrayItems]
                            newArray[index] = { ...newArray[index], itemName: e.target.value }
                            handleFieldChange(fieldName, newArray)
                          }}
                          placeholder="Enter item name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Brand Name</label>
                        <Select
                          value={item.catalogItem?.brandName || ''}
                          onValueChange={(val) => {
                            const selectedBrand = (lookupOptions && lookupOptions.brands)?.find((b: any) => b.id === val) as any
                            
                            // Fetch catalogs for the selected brand
                            if (selectedBrand && fetchLookupOptions) {
                              fetchLookupOptions('catalogs', {
                                endpoint: 'catalogs',
                                brandFilter: selectedBrand.brandName || selectedBrand.name
                              })
                            }
                            
                            const newArray = [...arrayItems]
                            newArray[index] = { 
                              ...newArray[index], 
                              catalogItem: { 
                                ...newArray[index].catalogItem, 
                                brandName: selectedBrand?.brandName || selectedBrand?.name || val,
                                codeNumber: newArray[index].catalogItem?.codeNumber,
                                pricePerMeter: newArray[index].catalogItem?.pricePerMeter,
                                washable: newArray[index].catalogItem?.washable
                              } 
                            }
                            handleFieldChange(fieldName, newArray)
                          }}
                          disabled={lookupLoading}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder={lookupLoading ? "Loading brands..." : "Select brand"} />
                          </SelectTrigger>
                          <SelectContent>
                            {lookupLoading ? (
                              <SelectItem value="loading" disabled>
                                Loading brands...
                              </SelectItem>
                            ) : (lookupErrors && lookupErrors.brands) ? (
                              <SelectItem value="error" disabled>
                                Error loading brands
                              </SelectItem>
                            ) : (lookupOptions && lookupOptions.brands && Array.isArray(lookupOptions.brands) && lookupOptions.brands.length > 0) ? (
                              lookupOptions.brands.map((brand: any) => (
                                <SelectItem key={brand.id} value={brand.id}>
                                  {brand.brandName || brand.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="empty" disabled>
                                No brands available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {lookupErrors && lookupErrors.brands && (
                          <p className="text-red-500 text-sm flex items-center gap-1 mt-1">
                            <AlertCircle className="h-4 w-4" />
                            Failed to load brands: {lookupErrors.brands}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Code Number</label>
                        <Input
                          type="text"
                          value={item.catalogItem?.codeNumber || ''}
                          onChange={(e) => {
                            const newArray = [...arrayItems]
                            newArray[index] = { 
                              ...newArray[index], 
                              catalogItem: { 
                                ...newArray[index].catalogItem, 
                                codeNumber: e.target.value 
                              } 
                            }
                            handleFieldChange(fieldName, newArray)
                          }}
                          placeholder="Enter code number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Price Per Meter</label>
                        <Input
                          type="number"
                          value={item.catalogItem?.pricePerMeter || ''}
                          onChange={(e) => {
                            const newArray = [...arrayItems]
                            newArray[index] = { 
                              ...newArray[index], 
                              catalogItem: { 
                                ...newArray[index].catalogItem, 
                                pricePerMeter: parseFloat(e.target.value) || 0 
                              } 
                            }
                            handleFieldChange(fieldName, newArray)
                          }}
                          min={0}
                          step={0.01}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Washable</label>
                        <Select
                          value={item.catalogItem?.washable?.toString() || 'true'}
                          onValueChange={(val) => {
                            const newArray = [...arrayItems]
                            newArray[index] = { 
                              ...newArray[index], 
                              catalogItem: { 
                                ...newArray[index].catalogItem, 
                                washable: val === 'true' 
                              } 
                            }
                            handleFieldChange(fieldName, newArray)
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select washable option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )

        default:
          return (
            <div key={fieldName} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{label}</label>
              <Input
                type="text"
                value={value || ''}
                onChange={(e) => {
                  const newValue = e.target.value
                  handleFieldChange(fieldName, newValue)
                }}
                placeholder={placeholder}
                className={`h-10 ${error ? 'border-red-500' : ''}`}
              />
              {error && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </p>
              )}
            </div>
          )
      }
    } catch (error) {
      setUiError(`Error rendering field ${fieldName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return (
        <div key={fieldName} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">{fieldName}</label>
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => {
              const newValue = e.target.value
              handleFieldChange(fieldName, newValue)
            }}
            placeholder={`Enter ${fieldName}`}
            className="h-10"
          />
        </div>
      )
    }
  }

  // Dynamic field grouping based on field types and names
  const getFieldGroups = useCallback(() => {
    if (!formData || typeof formData !== 'object' || Object.keys(formData || {}).length === 0) {
      return {}
    }
    
    const groups: Record<string, string[]> = {
      basic: [],
      items: [],
      details: [],
      additional: []
    }
    
    Object.entries(formData || {}).forEach(([fieldName, value]) => {
      try {
        const fieldType = detectFieldType(fieldName, value)
        const lowerFieldName = fieldName.toLowerCase()
        
        if (['_id', '__v', 'createdAt', 'updatedAt', 'isDeleted'].includes(fieldName)) {
          return
        }
        
        if (lowerFieldName.includes('item') || (fieldType && fieldType.type === 'array')) {
          groups.items.push(fieldName)
        } else if (
          lowerFieldName.includes('date') || 
          lowerFieldName.includes('status') || 
          lowerFieldName.includes('payment') ||
          lowerFieldName.includes('amount') ||
          lowerFieldName.includes('total') ||
          lowerFieldName.includes('price')
        ) {
          groups.details.push(fieldName)
        } else if (
          lowerFieldName.includes('customer') ||
          lowerFieldName.includes('factory') ||
          lowerFieldName.includes('measurement') ||
          lowerFieldName.includes('vendor') ||
          lowerFieldName.includes('contact')
        ) {
          groups.basic.push(fieldName)
        } else {
          groups.additional.push(fieldName)
        }
      } catch (error) {
        groups.additional.push(fieldName)
      }
    })
    
    return groups
  }, [formData])

  // Function to determine which tab contains validation errors
  const getTabWithErrors = useCallback(() => {
    if (!errors || Object.keys(errors).length === 0) return null
    
    const fieldGroups = getFieldGroups()
    
    // Check which tab contains the fields with errors
    for (const [tabId, fields] of Object.entries(fieldGroups)) {
      const hasErrors = fields.some(fieldName => errors[fieldName])
      if (hasErrors) {
        return tabId
      }
    }
    
    return null
  }, [errors, getFieldGroups])

  // Function to check if a tab has errors
  const tabHasErrors = useCallback((tabId: string) => {
    if (!errors || Object.keys(errors).length === 0) return false
    
    const fieldGroups = getFieldGroups()
    const fields = fieldGroups[tabId] || []
    return fields.some(fieldName => errors[fieldName])
  }, [errors, getFieldGroups])

// Data-driven tab configuration
  const getTabConfig = useCallback(() => {
    try {
      const fieldGroups = getFieldGroups()
      
      return [
        {
          id: 'basic',
          label: 'Basic Info',
          icon: FileText,
          fields: fieldGroups.basic || [],
          description: 'Customer, factory, and measurement information'
        },
        {
          id: 'items',
          label: 'Order Items',
          icon: ShoppingCart,
          fields: fieldGroups.items || [],
          description: 'Products and items in the order'
        },
        {
          id: 'details',
          label: 'Order Details',
          icon: Calendar,
          fields: fieldGroups.details || [],
          description: 'Dates, status, and payment information'
        },
        {
          id: 'additional',
          label: 'Additional Info',
          icon: FileText,
          fields: fieldGroups.additional || [],
          description: 'Notes and additional information'
        }
      ].filter(tab => Array.isArray(tab.fields) && tab.fields.length > 0)
    } catch (error) {
      return []
    }
  }, [getFieldGroups])

  // Show UI error if any
  if (uiError) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <span className="ml-3 text-lg">Loading order form...</span>
          </div>
        </div>
      </div>
    )
  }

  if (orderLoading || lookupLoading || !formData || typeof formData !== 'object') {
    return <FormSkeleton />
  }

  if (orderError) {
    showAlert(`Failed to load order form: ${orderError}`, 'destructive')
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <span className="ml-3 text-lg">Loading order form...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!formData || typeof formData !== 'object') {
    showAlert('No order data available - Unable to load order form structure', 'destructive')
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <span className="ml-3 text-lg">Loading order form...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      {/* Success Alert - Moved to top center for better visibility */}
      {/* Removed successMessage state, so this block is no longer needed */}
      
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary rounded-lg shadow-sm">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {mode === 'create' ? 'Create New Order' : 'Edit Order'}
              </h2>
              <p className="text-sm text-gray mt-1">
                {mode === 'create' ? 'Fill in the details to create a new order' : 'Update the order information'}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full relative">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex space-x-1 p-4">
              {(getTabConfig() || []).map((tab: any) => {
                const hasErrors = tabHasErrors(tab.id)
                const isErrorTab = getTabWithErrors() === tab.id
                
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors relative ${
                      activeTab === tab.id
                        ? 'bg-white text-primary shadow-sm border border-gray-200'
                        : 'text-gray hover:text-gray-800 hover:bg-gray-100'
                    }`}
                    style={{
                      animation: isErrorTab && hasErrors ? 'blink 1.5s ease-in-out infinite' : 'none',
                      backgroundColor: isErrorTab && hasErrors ? 'rgb(254 242 242)' : undefined,
                      borderColor: isErrorTab && hasErrors ? 'rgb(254 202 202)' : undefined,
                      color: isErrorTab && hasErrors ? 'rgb(220 38 38)' : undefined,
                      boxShadow: isErrorTab && hasErrors ? '0 0 0 3px rgb(254 202 202 / 0.3)' : undefined
                    }}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                    {hasErrors && (
                      <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Add CSS for blinking animation */}
          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes blink {
                0%, 50% {
                  background-color: rgb(254 242 242) !important;
                  border-color: rgb(254 202 202) !important;
                  color: rgb(220 38 38) !important;
                  box-shadow: 0 0 0 3px rgb(254 202 202 / 0.3) !important;
                }
                25%, 75% {
                  background-color: rgb(239 68 68) !important;
                  border-color: rgb(239 68 68) !important;
                  color: white !important;
                  box-shadow: 0 0 0 3px rgb(239 68 68 / 0.5) !important;
                }
              }
            `
          }} />

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6 max-h-[60vh]">
            {(getTabConfig() || []).map((tab: any) => (
              <div key={tab.id} className={`${activeTab === tab.id ? 'block' : 'hidden'}`}>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">{tab.label}</h3>
                <div className="grid grid-cols-1 gap-4">
                  {tab.fields.map((fieldName: string) => renderField(fieldName, formData[fieldName]))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray">
              <span>{mode === 'create' ? 'Creating new order' : 'Updating order'}</span>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="px-6 py-2"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || isSubmitting}
                className="flex items-center gap-2 px-6 py-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    {mode === 'create' ? 'Creating...' : 'Updating...'}
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4" />
                    {mode === 'create' ? 'Create Order' : 'Update Order'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// Wrap the component with ErrorBoundary
export default function OrderFormWithErrorBoundary(props: OrderFormProps) {
  return (
    <ErrorBoundary>
      <OrderForm {...props} />
    </ErrorBoundary>
  )
} 