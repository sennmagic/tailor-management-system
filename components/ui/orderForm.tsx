"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card'
import { Input } from './input'
import { Button } from './button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Textarea } from './textarea'
import { useLookup } from '@/lib/hooks/useLookup'
import { useFormValidation } from '@/lib/hooks/useFormValidation'
import { useAPIMutation, useAPI } from '@/lib/apiService'
import { Alert } from './alert'
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      setSuccessMessage('Order created successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
      onSuccess?.(data)
    },
    onError: (error) => {
      setIsSubmitting(false)
      setUiError(`Failed to create order: ${typeof error === 'string' ? error : 'Unknown error occurred'}`)
    }
  })

  const updateOrderMutation = useAPIMutation({
    endpoint: 'orders',
    method: 'PATCH',
    onSuccess: (data) => {
      setIsSubmitting(false)
      setSuccessMessage('Order updated successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
      onSuccess?.(data)
    },
    onError: (error) => {
      setIsSubmitting(false)
      setUiError(`Failed to update order: ${typeof error === 'string' ? error : 'Unknown error occurred'}`)
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
          const initialFormData = initialData 
            ? { ...baseOrder, ...initialData }
            : baseOrder
          setFormData(initialFormData)
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
    } catch (error) {
      setUiError('Error initializing form data')
      setFormData({ _id: '', orderItems: [] })
    }
  }, [orderData, initialData, mode])

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
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Simple field change handler like dynamic form
  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
    setErrors(prev => {
      if (prev[fieldName]) {
        return { ...prev, [fieldName]: '' }
      }
      return prev
    })
  }

  // Form validation function
  const validateForm = (data: Record<string, any>): Record<string, string> => {
    const validationErrors: Record<string, string> = {}
    
    // Required fields validation
    const requiredFields = ['customerId', 'factoryId', 'measurementId']
    requiredFields.forEach(field => {
      const value = data[field]
      if (!value || (typeof value === 'object' && !value._id) || (typeof value === 'string' && value.trim() === '')) {
        validationErrors[field] = `${formatFieldName(field)} is required`
      }
    })
    
    // Order items validation
    if (data.orderItems && Array.isArray(data.orderItems)) {
      data.orderItems.forEach((item: any, index: number) => {
        if (!item.catalogItem || (typeof item.catalogItem === 'object' && !item.catalogItem._id)) {
          validationErrors[`orderItems.${index}.catalogItem`] = 'Catalog item is required'
        }
      })
    }
    
    return validationErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsSubmitting(true)
    setErrors({})

    // Validate form before submission
    const validationErrors = validateForm(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setIsSubmitting(false)
      setUiError('Please fix the validation errors before submitting')
      return
    }

    let submissionData = filterSubmitFields(formData)
    
    // Convert lookup field objects to ID strings for API submission
    Object.keys(submissionData).forEach(key => {
      const value = submissionData[key]
      if (typeof value === 'object' && value !== null && (value as any)._id) {
        // Convert lookup objects to just their ID string
        submissionData[key] = (value as any)._id
      } else if (Array.isArray(value)) {
        // Handle array fields (like orderItems)
        submissionData[key] = value.map((item: any) => {
          if (typeof item === 'object' && item !== null) {
            const processedItem = { ...item }
            // Convert catalogItem object to ID string
            if (processedItem.catalogItem && typeof processedItem.catalogItem === 'object') {
              processedItem.catalogItem = (processedItem.catalogItem as any)._id || (processedItem.catalogItem as any).id
            }
            return processedItem
          }
          return item
        })
      }
    })
    
    console.log('🔄 Processed submission data:', submissionData)
    
    // For edit mode, include the ID in the submission data
    if (mode === 'edit' && formData._id) {
      submissionData = { ...submissionData, _id: formData._id }
    }
        
    if (!submissionData || Object.keys(submissionData).length === 0) {
      const testData = {
        customerId: 'test-customer-id',
        orderDate: new Date().toISOString().split('T')[0],
        status: 'DRAFT'
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
        // For edit mode, include the ID in the URL
        const orderId = formData._id
        if (!orderId) {
          setUiError('Order ID is required for updates')
          setIsSubmitting(false)
          return
        }
        
        // Check if we have authentication token
        const token = document.cookie.split('; ').find(row => row.startsWith('refresh_token='))?.split('=')[1]
        if (!token) {
          setUiError('Authentication token not found. Please login again.')
          setIsSubmitting(false)
          return
        }
        
        // Use fetchAPI directly to include ID in URL
        const { fetchAPI } = await import('@/lib/apiService')
        
        console.log('🔄 Submitting order update:', {
          orderId,
          submissionData,
          mode
        })
        
        // Try PATCH first, then PUT if PATCH fails
        let result = await fetchAPI({
          endpoint: 'orders',
          method: 'PATCH',
          id: orderId,
          data: submissionData,
          withAuth: true
        })
        
        // If PATCH fails, try PUT
        if (result.error && result.error.includes('Method Not Allowed')) {
          console.log('🔄 PATCH failed, trying PUT...')
          result = await fetchAPI({
            endpoint: 'orders',
            method: 'PATCH',
            id: orderId,
            data: submissionData,
            withAuth: true
          })
        }
        
        console.log('🔄 Update result:', result)
        
        if (result.error) {
          // Handle validation errors from API
          if (result.error.includes('must be a string') || result.error.includes('required')) {
            const apiErrors = JSON.parse(result.error.replace(/^\[|\]$/g, ''))
            const fieldErrors: Record<string, string> = {}
            
            apiErrors.forEach((error: string) => {
              if (error.includes('customerId')) {
                fieldErrors.customerId = 'Customer is required'
              } else if (error.includes('factoryId')) {
                fieldErrors.factoryId = 'Factory is required'
              } else if (error.includes('measurementId')) {
                fieldErrors.measurementId = 'Measurement is required'
              } else if (error.includes('catalogItem')) {
                fieldErrors['orderItems'] = 'Catalog items are required'
              }
            })
            
            setErrors(fieldErrors)
            setUiError('Please fix the validation errors')
          } else {
            setUiError(`Failed to update order: ${result.error}`)
          }
          setIsSubmitting(false)
        } else {
          setSuccessMessage('Order updated successfully!')
          setTimeout(() => setSuccessMessage(null), 3000)
          onSuccess?.(result.data)
          setIsSubmitting(false)
        }
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
                  className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
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
        <Alert variant="destructive" title="Application Error" description={uiError}>
          <div className="flex gap-3 justify-center mt-4">
            <Button variant="outline" onClick={() => setUiError(null)}>
              Dismiss
            </Button>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </Alert>
      </div>
    )
  }

  if (orderLoading || !formData || typeof formData !== 'object') {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            <span className="ml-3 text-lg">Loading order form...</span>
          </div>
        </div>
      </div>
    )
  }

  if (orderError) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Alert variant="destructive" title="Failed to load order form" description={orderError}>
          <div className="text-sm text-gray-500 mt-4">
            <p>Possible issues:</p>
            <ul className="list-disc list-inside mt-2">
              <li>Network connectivity problem</li>
              <li>API server is down</li>
              <li>CORS policy issue</li>
              <li>Authentication token expired</li>
            </ul>
          </div>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </Alert>
      </div>
    )
  }

  if (!formData || typeof formData !== 'object') {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Alert variant="destructive" title="No order data available" description="Unable to load order form structure" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      {/* Success Alert */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-[60]">
          <Alert variant="success" description={successMessage} autoDismiss={3000} />
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
                          <div className="p-3 bg-green-500 rounded-lg shadow-sm">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {mode === 'create' ? 'Create New Order' : 'Edit Order'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
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
              {(getTabConfig() || []).map((tab: any) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-green-600 shadow-sm border border-gray-200'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

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
            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
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