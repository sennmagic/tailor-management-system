
import { useState, useEffect, useCallback, useRef } from "react";
import { fetchAPI } from "@/lib/apiService";
import pluralize from 'pluralize';

export interface FieldType {
  type: 'lookup' | 'status' | 'date' | 'array' | 'object' | 'boolean' | 'number' | 'text';
  config?: any;
}

export interface LookupOption {
  id: string;
  label: string;
}

export interface UseLookupProps {
  data?: Record<string, unknown> | Array<Record<string, unknown>>;
  onLookupChange?: (lookupOptions: Record<string, LookupOption[]>) => void;
}

export interface UseLookupReturn {
  lookupOptions: Record<string, LookupOption[]>;
  lookupErrors: Record<string, string>;
  isLoading: boolean;
  detectFieldType: (key: string, value: unknown, parentPath?: string) => FieldType;
  isStatusField: (fieldName: string) => boolean;
  isDateField: (fieldName: string) => boolean;
  isMeasurementTypeField: (fieldName: string) => boolean;
  isFactoryField: (fieldName: string) => boolean;
  getStatusOptions: (fieldName: string) => string[];
  getStatusBadgeStyle: (status: string) => { bg: string; text: string; border: string; icon?: string };
  formatFieldName: (key: string) => string;
  formatStatusValue: (value: unknown) => { text: string; style: { bg: string; text: string; border: string; icon?: string } };
  formatValue: (value: unknown) => string;
  shouldDisplayField: (key: string, value: unknown) => boolean;
  extractDataArray: (data: unknown) => Array<Record<string, unknown>>;
  resetLookups: () => void;
  analyzeFormStructure: (obj: any, parentPath?: string) => void;
  fetchLookupOptions: (fieldPath: string, config: any, retryCount?: number) => Promise<void>;
  // New functions from slug page
  renderCellValue: (value: unknown, fieldName?: string) => React.ReactNode;
  filterSubmitFields: (values: Record<string, unknown>) => Record<string, unknown>;
  getConsistentFormTemplate: (data: Array<Record<string, unknown>>) => Record<string, unknown>;
  getEmptyFormData: (data: Array<Record<string, unknown>>, allKeys: string[]) => Record<string, unknown>;
}

export function useLookup({ 
  data, 
  onLookupChange 
}: UseLookupProps = {}): UseLookupReturn {
  const [lookupOptions, setLookupOptions] = useState<Record<string, LookupOption[]>>({});
  const [lookupErrors, setLookupErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const analyzedDataRef = useRef<string>('');
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());
  const [requestQueue, setRequestQueue] = useState<Array<{fieldPath: string, config: any, retryCount: number}>>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [requestCache, setRequestCache] = useState<Set<string>>(new Set());
  const [queueVersion, setQueueVersion] = useState(0); // Add this to trigger queue processing

  // Add request limiting - only allow 3 concurrent requests
  const MAX_CONCURRENT_REQUESTS = 3;
  const REQUEST_DELAY = 500; // 500ms delay between requests

  // Use refs to avoid circular dependencies
  const lookupOptionsRef = useRef(lookupOptions);
  const pendingRequestsRef = useRef(pendingRequests);
  const requestQueueRef = useRef(requestQueue);

  // Update refs when state changes
  useEffect(() => {
    lookupOptionsRef.current = lookupOptions;
  }, [lookupOptions]);

  useEffect(() => {
    pendingRequestsRef.current = pendingRequests;
  }, [pendingRequests]);

  useEffect(() => {
    requestQueueRef.current = requestQueue;
  }, [requestQueue]);

  // Process request queue sequentially
  const processRequestQueue = useCallback(async () => {
    if (isProcessingQueue || requestQueueRef.current.length === 0) return;
    
    setIsProcessingQueue(true);
    
    while (requestQueueRef.current.length > 0 && pendingRequestsRef.current.size < MAX_CONCURRENT_REQUESTS) {
      const request = requestQueueRef.current.shift();
      if (request) {
        // Add to pending requests
        setPendingRequests(prev => new Set(prev).add(request.fieldPath));
        
        // Process the request using a separate function to avoid circular dependency
        try {
          await performLookupRequest(request.fieldPath, request.config, request.retryCount);
        } catch (error) {
        } finally {
          // Remove from pending requests
          setPendingRequests(prev => {
            const newSet = new Set(prev);
            newSet.delete(request.fieldPath);
            return newSet;
          });
        }
        
        // Add delay between requests to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
      }
    }
    
    setIsProcessingQueue(false);
  }, [isProcessingQueue]);

  // Separate function for the actual API call to avoid circular dependency
  const performLookupRequest = useCallback(async (fieldPath: string, config: any, retryCount: number) => {
    try {
      if (!config.endpoint) return;
      // Check if we already have options for this field using ref
      if (lookupOptionsRef.current[fieldPath] && lookupOptionsRef.current[fieldPath].length > 0) {
        return;
      }
      // Clear any previous errors for this field
      setLookupErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldPath];
        return newErrors;
      });
      // Check if this is a valid endpoint - only include endpoints that actually exist
  
      // Special handling for measurement types - use static options
      if (config.endpoint === 'measurementTypes' || config.isMeasurementTypeLookup) {
        const measurementTypeOptions = [
          { id: 'DAURA SURUWAL', label: 'DAURA SURUWAL' },
          { id: 'SUIT', label: 'SUIT' }
        ];
        setLookupOptions(prev => ({ ...prev, [fieldPath]: measurementTypeOptions }));
        return;
      }
      // Special handling for factories - try API first, then fallback to mock data
      if (config.endpoint === 'factories' || config.isFactoryLookup) {
        let result = await fetchAPI({ 
          endpoint: 'factories', 
          method: 'GET',
          withAuth: true
        });
        console.log('Factory fetchAPI result:', result); // Debug: show full API result
        if (!result.error && result.data) {
          const response = result.data;
          const dataArray = Array.isArray(response)
            ? response
            : response?.factoriesInfo || response?.data || response?.items || response?.results || response?.factoryInfo || [];
          console.log('Factory dataArray:', dataArray); // Debug: show processed data array
          const options = Array.isArray(dataArray) ? dataArray.map((item: any) => {
            const id = item._id || item.id;
            if (!id) return null;
            let label = '';
            const displayFields = ['factoryName', 'name', 'title', 'label', 'displayName'];
            for (const field of displayFields) {
              if (item[field] && typeof item[field] === 'string') {
                label = item[field];
                break;
              }
            }
            if (!label) {
              label = `Factory ${id}`;
            }
            return { id: String(id), label: String(label) };
          }).filter((item): item is LookupOption => item !== null) : [];
          console.log('Factory options mapped:', options); // Debug: show mapped options
          if (options.length > 0) {
            setLookupOptions(prev => {
              const updated = { ...prev, [fieldPath]: options };
              console.log('Factory options set:', updated[fieldPath]); // Debug: show options set in state
              return updated;
            });
            return;
          }
        }
        // Fallback to mock data if API fails
        // (You can add fallback logic here if needed)
      }
      // Handle brand filtering for catalogs
      let endpoint = config.endpoint;
      if (config.endpoint === 'catalogs' && config.brandFilter) {
        endpoint = `/catalogs`;
      }
      // Try with authentication first, then without if it fails
      let result = await fetchAPI({ 
        endpoint: endpoint, 
        method: 'GET',
        withAuth: true
      });
      // If catalogs endpoint fails, try alternative endpoint names
      if (result.error && config.endpoint === 'catalogs') {
        let fallbackEndpoint = 'catalog';
        if (config.brandFilter) {
          fallbackEndpoint = `catalogs`;
        }
        result = await fetchAPI({ 
          endpoint: "catalogs", 
          method: 'GET',
          withAuth: true
        });
      }
      if (result.error) {
        // Try without authentication as fallback
        if (retryCount === 0) {
          try {
            const fallbackResult = await fetchAPI({ 
              endpoint: endpoint, 
              method: 'GET',
              withAuth: false
            });
            if (!fallbackResult.error) {
              const response = fallbackResult.data;
              if (response) {
                const entityField = config.entityName.toLowerCase() + 'Info';
                const dataArray = Array.isArray(response) 
                  ? response 
                  : response?.data || response?.items || response?.results || response?.[entityField] || [];
                if (Array.isArray(dataArray) && dataArray.length > 0) {
                  const options = dataArray.map((item: any) => {
                    const id = item._id || item.id;
                    if (!id) return null;
                    let label = '';
                    
                    // Special handling for catalogs - use catalogName and codeNumber
                    if (config.endpoint === 'catalogs' || config.endpoint === 'catalog') {
                      const catalogName = item.catalogName || item.name;
                      const codeNumber = item.codeNumber || item.code || '';
                      if (catalogName) {
                        label = codeNumber ? `${catalogName} - ${codeNumber}` : catalogName;
                      }
                    } else {
                      // Generic handling for other entities
                      const displayFields = ['name', 'title', 'label', 'displayName'];
                      for (const field of displayFields) {
                        if (item[field] && typeof item[field] === 'string') {
                          label = item[field];
                          break;
                        }
                      }
                    }
                    
                    if (!label) {
                      label = `${config.entityName} ${id}`;
                    }
                    return { id: String(id), label: String(label) };
                  }).filter((item): item is LookupOption => item !== null);
                  setLookupOptions(prev => ({ ...prev, [fieldPath]: options }));
                  return;
                }
              }
            }
          } catch (err) {
            // Ignore fallback error
          }
        }
        // Set error if all attempts fail
        setLookupErrors(prev => ({ ...prev, [fieldPath]: 'Unable to load options' }));
        return;
      }
      // Process API response
      if (!result.error && result.data) {
        const response = result.data;
        const entityField = config.entityName.toLowerCase() + 'Info';
        const dataArray = Array.isArray(response) 
          ? response 
          : response?.data || response?.items || response?.results || response?.[entityField] || [];
        if (Array.isArray(dataArray) && dataArray.length > 0) {
          const options = dataArray.map((item: any) => {
            const id = item._id || item.id;
            if (!id) return null;
            let label = '';
            
            // Special handling for catalogs - use catalogName and codeNumber
            if (config.endpoint === 'catalogs' || config.endpoint === 'catalog') {
              const catalogName = item.catalogName || item.name;
              const codeNumber = item.codeNumber || item.code || '';
              if (catalogName) {
                label = codeNumber ? `${catalogName} - ${codeNumber}` : catalogName;
              }
            } else {
              // Generic handling for other entities
              const displayFields = ['name', 'title', 'label', 'displayName'];
              for (const field of displayFields) {
                if (item[field] && typeof item[field] === 'string') {
                  label = item[field];
                  break;
                }
              }
            }
            
            if (!label) {
              label = `${config.entityName} ${id}`;
            }
            return { id: String(id), label: String(label) };
          }).filter((item): item is LookupOption => item !== null);
          setLookupOptions(prev => ({ ...prev, [fieldPath]: options }));
          return;
        }
      }
    } catch (err) {
      // Retry logic for network errors (but not for 4xx errors)
      if (retryCount < 2 && err instanceof Error && !err.message.includes('Failed to load')) {
        setRequestQueue(prev => [...prev, { fieldPath, config, retryCount: retryCount + 1 }]);
        return;
      }
      // Set a user-friendly error message instead of technical details
      const errorMessage = err instanceof Error && err.message?.includes('Network error')
        ? 'Unable to load options - please check your connection'
        : err instanceof Error && err.message?.includes('timeout')
        ? 'Request timed out - please try again'
        : `Unable to load ${config.entityName} options`;
      setLookupErrors(prev => ({ ...prev, [fieldPath]: errorMessage }));
    }
  }, []);

  // Process queue when it changes or when pending requests decrease
  useEffect(() => {
    if (requestQueueRef.current.length > 0 && !isProcessingQueue && pendingRequestsRef.current.size < MAX_CONCURRENT_REQUESTS) {
      processRequestQueue();
    }
  }, [isProcessingQueue, processRequestQueue, queueVersion]);

  // Cleanup request cache periodically to prevent memory leaks
  useEffect(() => {
    const interval = setInterval(() => {
      setRequestCache(new Set());
    }, 5 * 60 * 1000); // Clear cache every 5 minutes

    return () => clearInterval(interval);
  }, []);

     // Enhanced field type detection based on JSON structure
   const detectFieldType = useCallback((key: string, value: unknown, parentPath = ''): FieldType => {
     const fullPath = parentPath ? `${parentPath}.${key}` : key;
     const lowerKey = key.toLowerCase();
     

    
    // Skip internal MongoDB fields
    if (key === '_id' || key === '__v' || key === 'createdAt' || key === 'updatedAt' || key === 'isDeleted') {
      return { type: 'text' };
    }

    // Array detection
    if (Array.isArray(value)) {
      const isComplexArray = value.length > 0 && typeof value[0] === 'object';
      const itemTemplate = value.length > 0 ? value[0] : {};
      
      // Dynamically analyze array items to find lookup fields
      let lookupFields: string[] = [];
      if (isComplexArray && itemTemplate && typeof itemTemplate === 'object') {
        // Analyze all items in the array to find common fields that could be lookups
        const allKeys = new Set<string>();
        value.forEach(item => {
          if (item && typeof item === 'object') {
            Object.keys(item).forEach(key => allKeys.add(key));
          }
        });
        
                 // Check which fields appear in multiple items and could be lookups
         allKeys.forEach(key => {
           const lowerKey = key.toLowerCase();
           // Only check for fields that have valid endpoints
           const isLookupField = lowerKey.includes('catalog') || lowerKey.includes('brand');
           
           if (isLookupField) {
             // Check if this field has different values across items (making it a good lookup candidate)
             const uniqueValues = new Set();
             value.forEach(item => {
               if (item && typeof item === 'object' && item[key]) {
                 uniqueValues.add(String(item[key]));
               }
             });
             
             // If we have multiple unique values, it's a good lookup field
             if (uniqueValues.size > 1) {
               lookupFields.push(key);
             }
           }
         });
      }
      
      return { 
        type: 'array', 
        config: { 
          itemTemplate,
          isComplexArray,
          hasLookupFields: lookupFields.length > 0,
          lookupFields // Store the detected lookup fields
        }
      };
    }

    // Object detection (but check for lookup objects first)
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const objKeys = Object.keys(value as Record<string, unknown>);
      
      // Check if this looks like a lookup object (has name, brandName, codeNumber, etc.)
      const hasNameField = objKeys.some(k => 
        k.toLowerCase().includes('name') || 
        k.toLowerCase().includes('brand') || 
        k.toLowerCase().includes('code') ||
        k.toLowerCase().includes('title') ||
        k.toLowerCase().includes('label')
      );
      
      // Also check if the object has an _id field (common in MongoDB objects)
      const hasIdField = objKeys.some(k => k === '_id' || k === 'id');
      
      if (hasNameField || hasIdField) {
        // Determine the entity type based on the field name
        let entityName = key.toLowerCase();
        let endpoint = '';
        
        // Remove 'Id' suffix for entity name
        if (entityName.endsWith('id')) {
          entityName = entityName.replace(/id$/, '');
        }
        
        // Simple approach: add 's' to make plural
        endpoint = pluralize(entityName.toLowerCase());
        console.log('Pluralized endpoint:', endpoint); // Debug: show pluralized endpoint
        
        return {
          type: 'lookup',
          config: {
            endpoint,
            displayField: 'name',
            entityName,
            fieldPath: fullPath,
            isObjectLookup: true // Flag to indicate this is an object lookup
          }
        };
      }
      
      // If not a lookup object, treat as regular object
      return { 
        type: 'object', 
        config: { 
          fields: Object.keys(value as Record<string, unknown>)
        }
      };
    }

    // Boolean detection
    if (typeof value === 'boolean') {
      return { type: 'boolean' };
    }

    // Number detection
    if (typeof value === 'number') {
      return { type: 'number' };
    }

    // Number field detection based on field name
    if (lowerKey.includes('Age') || 
        lowerKey.includes('price') || 
        lowerKey.includes('cost') || 
        lowerKey.includes('total') || 
        lowerKey.includes('quantity') || 
        lowerKey.includes('count') || 
        lowerKey.includes('number') ||
        lowerKey.includes('size') ||
        lowerKey.includes('Around') ||
        lowerKey.includes('length') ||
        lowerKey.includes('width') ||
        lowerKey.includes('height') ||
        lowerKey.includes('area') ||
        lowerKey.includes('volume') ||
        lowerKey.includes('percentage') ||
        lowerKey.includes('rate') ||
        lowerKey.includes('score') ||
            lowerKey.includes('sleeve') ||
                lowerKey.includes('hip') ||
                    lowerKey.includes('waist') ||
                        lowerKey.includes('score') ||
                            lowerKey.includes('shoulder') ||
                               lowerKey.includes('high') ||
                                  lowerKey.includes('shoulder') ||
                                     lowerKey.includes('knee') ||
                                                   lowerKey.includes('bottom') ||
                                                     lowerKey.includes('weight') ||
                                                                                                          lowerKey.includes('neck') ||
        lowerKey.includes('biceps') ||
              lowerKey.includes('back') ||
                                                                                                          lowerKey.includes('weight') ||
        lowerKey.includes('age') ||

        lowerKey.includes('around')) {
      return { type: 'number' };
    }

    // Date field detection
    if (lowerKey.includes('date') || lowerKey === 'dob' || 
        (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value as string))) {
      return { type: 'date' };
    }

    // Status field detection
    if (lowerKey.includes('status') || lowerKey.includes('state') || 
        lowerKey.includes('condition') || lowerKey.includes('phase')) {
      return { 
        type: 'status',
        config: {
          options: getStatusOptions(key)
        }
      };
    }

    // Lookup field detection (foreign key relationships) - only for known entities
    if (lowerKey.endsWith('id') && lowerKey !== 'id' && !lowerKey.startsWith('_')) {
      const entityName = key.replace(/Id$/i, '');
      
      // Simple approach: add 's' to make plural
      const endpoint = pluralize(entityName.toLowerCase());
     
      return {
        type: 'lookup',
        config: {
          endpoint,
          displayField: 'name',
          entityName,
          fieldPath: fullPath // Store the full path for debugging
        }
      };
    }

    // Direct catalog field detection (not just catalogId)
    // (Removed static block for catalog endpoint; now handled dynamically)







    // Factory lookup detection - only for exact "factory" field, not "factoryName" or other variations
    // (Removed static block for factory endpoint; now handled dynamically)
    // Factory ID and other factory-related fields (but not exact "factory" or "factoryName")
    // (Removed static block for factoryid/factory_id endpoint; now handled dynamically)

    // Measurement Type lookup detection
    if (lowerKey === 'measurementtype' || lowerKey === 'measurement_type' || lowerKey === 'measurementType' || 
        (lowerKey.includes('measurement') && lowerKey.includes('type'))) {
      return {
        type: 'lookup',
        config: {
          endpoint: 'measurementTypes', // Custom endpoint for measurement types
          displayField: 'name',
          entityName: 'measurementType',
          fieldPath: fullPath,
          isMeasurementTypeLookup: true, // Flag to indicate this is a measurement type lookup
          options: ['DAURA SURUWAL', 'SUIT'] // Updated options for measurement types
        }
      };
    }

    // Default to text
    return { type: 'text' };
  }, []);

  // Check if field is a status field
  const isStatusField = useCallback((fieldName: string): boolean => {
    const lower = fieldName.toLowerCase();
    // Check for exact matches
    if (lower === 'status') return true;
    
    // Check for compound words containing 'status' (like PaymentStatus, OrderStatus, etc.)
    if (lower.includes('status')) return true;
    
    // Check for payment-related fields
    if (lower.includes('payment')) return true;
    
    // Check for state-related fields
    if (lower.includes('state')) return true;
    
    // Check for common status-like fields
    const statusKeywords = ['condition', 'phase', 'stage', 'mode', 'type'];
    return statusKeywords.some(keyword => lower.includes(keyword));
  }, []);

  // Check if field is a date field
  const isDateField = useCallback((fieldName: string): boolean => {
    const lower = fieldName.toLowerCase();
    return lower === 'dob' || lower === 'date' || lower.includes('date') || lower.includes('time');
  }, []);

  // Check if field is a measurement type field
  const isMeasurementTypeField = useCallback((fieldName: string): boolean => {
    const lower = fieldName.toLowerCase();
    return lower === 'measurementtype' || 
           lower === 'measurement_type' || 
           lower === 'measurementtype' ||
           (lower.includes('measurement') && lower.includes('type'));
  }, []);

  // Check if field is a factory field
  const isFactoryField = useCallback((fieldName: string): boolean => {
    const lower = fieldName.toLowerCase();
    return lower.includes('factory');
  }, []);


  // Get status options based on field context
  const getStatusOptions = useCallback((fieldName: string): string[] => {
    const lower = fieldName.toLowerCase();
    
    // Order Item Types
    if (lower.includes('itemtype') || lower.includes('item_type')) {
      return ['DAURA', 'SURUWAL', 'SHIRT', 'PANT', 'WAIST_COAT', 'COAT', 'BLAZER'];
    }
    
    // Payment Status (Standard)
    if (lower.includes('paymentstatus') && !lower.includes('factory') && !lower.includes('vendor')) {
      return ['Paid', 'Unpaid', 'Partial'];
    }
    
    // Payment Status (Factory/Vendor)
    if (lower.includes('paymentstatus') && (lower.includes('factory') || lower.includes('vendor'))) {
      return ['PAID', 'PENDING'];
    }
    
    // Order Status
    if (lower.includes('orderstatus') || lower.includes('order_status')) {
      return ['Pending', 'Cutting', 'Sewing', 'Ready', 'Delivered', 'Cancelled'];
    }
    
    // Factory Specialization
    if (lower.includes('specialization')) {
      return ['Daura Suruwal', 'Shirt', 'Pant', 'Coat', 'Tie', 'Cufflinks', 'Waistcoat', 'Blazer', 'Other'];
    }
    
    // Factory Status
    if (lower.includes('status') && lower.includes('factory')) {
      return ['Available', 'Busy', 'Inactive', 'Working'];
    }
    
    // Measurement Type
    if (lower.includes('measurementtype') || lower.includes('measurement_type')) {
      return ['DAURA SURUWAL', 'SUIT'];
    }
    
    // Measurement Status
    if (lower.includes('status') && lower.includes('measurement')) {
      return ['DRAFT', 'COMPLETED', 'IN PROGRESS'];
    }
    
    // Logistics Category
    if (lower.includes('category') && lower.includes('logistics')) {
      return ['AC Repair', 'Laundry Service', 'Plumbing', 'Electrical', 'Carpentry', 'Pest Control', 'Internet Provider', 'Security Service', 'Courier', 'Water Supply', 'Cleaning Service', 'Other'];
    }
    
    // Privilege Points Type
    if (lower.includes('type') && lower.includes('privilege')) {
      return ['REDEEMED', 'EARNED'];
    }
    
    // Notification Type
    if (lower.includes('type') && lower.includes('notification')) {
      return ['customer', 'employee', 'order', 'vendor', 'appointment', 'catalog', 'general'];
    }
    
    // Notification Action
    if (lower.includes('action') && lower.includes('notification')) {
      return ['created', 'updated', 'deleted', 'status_changed'];
    }
    
    // Notification Priority
    if (lower.includes('priority') && lower.includes('notification')) {
      return ['info', 'success', 'warning', 'error'];
    }
    
    // Sidebar Type
    if (lower.includes('type') && lower.includes('sidebar')) {
      return ['menu', 'divider', 'header', 'submenu'];
    }
    
    // Statistics Time Period
    if (lower.includes('timeperiod') || lower.includes('time_period')) {
      return ['day', 'week', 'month', 'year'];
    }
    
    // Employee Gender
    if (lower.includes('gender')) {
      return ['Male', 'Female', 'Others'];
    }
    
    // Employee Role
    if (lower.includes('role')) {
      return ['Tailor', 'Accountant', 'Admin', 'SuperAdmin', 'Data Entry Clerk', 'Receptionist'];
    }
    
    // Appointment Source
    if (lower.includes('source') && lower.includes('appointment')) {
      return ['Call', 'WhatsApp', 'Walk-In', 'Website', 'Other'];
    }
    
    // Appointment Type
    if (lower.includes('appointmenttype') || lower.includes('appointment_type')) {
      return ['Consultation', 'Fitting', 'Delivery', 'Follow-up', 'Other'];
    }
    
    // Default payment status
    if (lower.includes('payment')) {
      return ['Paid', 'Unpaid', 'Partial'];
    }
    
    // Default order status
    if (lower.includes('order')) {
      return ['Pending', 'Cutting', 'Sewing', 'Ready', 'Delivered', 'Cancelled'];
    }
    
    // Default status options
    return ['Pending', 'Active', 'Inactive', 'Completed', 'Cancelled'];
  }, []);

  // Get status badge styling
  const getStatusBadgeStyle = useCallback((status: string): { bg: string; text: string; border: string; icon?: string } => {
    const lowerStatus = status.toLowerCase();
    
    // Success/Completed statuses
    if (lowerStatus.includes('completed') || lowerStatus.includes('done') || 
        lowerStatus.includes('finished') || lowerStatus.includes('success') || 
        lowerStatus.includes('approved') || lowerStatus.includes('active') ||
        lowerStatus.includes('paid') || lowerStatus.includes('delivered')) {
      return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: '✓' };
    }
    
    // Warning/Pending statuses
    if (lowerStatus.includes('processing') || lowerStatus.includes('waiting') ||
        lowerStatus.includes('on-hold') || lowerStatus.includes('scheduled') || lowerStatus.includes('draft')) {
      return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: '⏳' };
    }
    
    // Error/Failed statuses
    if (lowerStatus.includes('failed') || lowerStatus.includes('rejected') || 
        lowerStatus.includes('inactive') || lowerStatus.includes('error') || lowerStatus.includes('declined') ||
        lowerStatus.includes('expired') || lowerStatus.includes('void')) {
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: '✗' };
    }
    
    // Progress/Partial statuses
    if (lowerStatus.includes('progress') || lowerStatus.includes('in-progress') ||
        lowerStatus.includes('ongoing') || lowerStatus.includes('running') || lowerStatus.includes('working')) {
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: '⟳' };
    }
    
    // Info/Neutral statuses
    if (lowerStatus.includes('info') || lowerStatus.includes('new') || lowerStatus.includes('created') ||
        lowerStatus.includes('submitted') || lowerStatus.includes('received')) {
      return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: 'ℹ' };
    }
    
    // Default gray for unknown statuses
    return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: '•' };
  }, []);

  // Format field name for display
  const formatFieldName = useCallback((key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/\bid\b/gi, 'ID')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, []);

  // Format status value with badge data
  const formatStatusValue = useCallback((value: unknown): { text: string; style: { bg: string; text: string; border: string; icon?: string } } => {
    if (value == null || value === undefined || value === '') {
      return { text: "Not specified", style: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' } };
    }
    
    const statusStr = String(value);
    const style = getStatusBadgeStyle(statusStr);
    
    // Format the status text nicely
    const formattedText = statusStr
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/-/g, ' ') // Replace hyphens with spaces
      .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize first letter of each word
      .trim();
    
    return { text: formattedText, style };
  }, [getStatusBadgeStyle]);

  // Format value for display
  const formatValue = useCallback((value: unknown): string => {
    if (value == null || value === undefined) return "Not specified";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "string" && value.trim() === "") return "Not specified";
    if (typeof value === "object" && value !== null) {
      if (Array.isArray(value)) {
        return value.length === 0 ? "No items" : `${value.length} item(s)`;
      }
      if (Object.keys(value).length === 0) return "No data";
      return "Object data";
    }
    return String(value);
  }, []);

  // Check if field should be displayed
  const shouldDisplayField = useCallback((key: string, value: unknown): boolean => {
    const skipFields = ["_id", "__v", "createdAt", "updatedAt"];
    if (skipFields.includes(key)) return false;
    
    // Don't filter out null/undefined/empty values - show all fields for form input
    return true;
  }, []);

  // Extract data array from various response formats
  const extractDataArray = useCallback((data: unknown): Array<Record<string, unknown>> => {
    if (Array.isArray(data)) {
      if (data.length > 0 && typeof data[0] === "object") return data as Array<Record<string, unknown>>;
      if (data.length > 0 && typeof data[0] !== "object") {
        return (data as unknown[]).map((item) => ({ value: item }));
      }
      return [];
    }
    if (data && typeof data === "object") {
      for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
          return value as Array<Record<string, unknown>>;
        }
        if (Array.isArray(value) && value.length > 0 && typeof value[0] !== "object") {
          return value.map((item) => ({ value: item }));
        }
      }
    }
    return [];
  }, []);

    // Enhanced lookup fetching with better error handling and retry logic
  const fetchLookupOptions = useCallback(async (fieldPath: string, config: any, retryCount = 0) => {
    // Add the request to the queue
    setRequestQueue(prev => [...prev, { fieldPath, config, retryCount }]);
    // Trigger queue processing
    setQueueVersion(prev => prev + 1);
  }, []);

  // Recursively analyze form structure and fetch lookup data
  const analyzeFormStructure = useCallback((obj: any, parentPath = '') => {
    Object.entries(obj).forEach(([key, value]) => {
      // Skip fields that start with "is" (boolean flags) from lookup analysis
      if (key.toLowerCase().startsWith('is')) return;
      
      const fieldPath = parentPath ? `${parentPath}.${key}` : key;
      const fieldType = detectFieldType(key, value, parentPath);
      
      if (fieldType.type === 'lookup' && fieldType.config) {
        fetchLookupOptions(fieldPath, fieldType.config);
      }
      
      if (fieldType.type === 'object' && typeof value === 'object' && value !== null) {
        analyzeFormStructure(value, fieldPath);
      }
      
      if (fieldType.type === 'array' && Array.isArray(value)) {
        if (value.length > 0 && typeof value[0] === 'object') {
          // Analyze the first array item to detect lookup fields within array items
          analyzeFormStructure(value[0], `${fieldPath}[0]`);
          
          // Also analyze the array field itself to detect array-level lookups
          const arrayFieldType = detectFieldType(key, value, parentPath);
          
          if (arrayFieldType.config?.hasLookupFields && arrayFieldType.config.lookupFields) {
            // For each detected lookup field in the array, create lookup options
            arrayFieldType.config.lookupFields.forEach((lookupField: string) => {
              const lookupFieldPath = `${fieldPath}[0].${lookupField}`;
              const lookupFieldType = detectFieldType(lookupField, value[0][lookupField], `${fieldPath}[0]`);

              if (lookupFieldType.type === 'lookup' && lookupFieldType.config) {
                fetchLookupOptions(lookupFieldPath, lookupFieldType.config);
              }
            });
          }
        } else if (value.length === 0) {
          // Handle empty arrays - analyze the array field type to detect potential lookup fields
          const arrayFieldType = detectFieldType(key, value, parentPath);
          
          // For empty arrays, we need to check if this array field name suggests it might contain lookup fields
          const lowerKey = key.toLowerCase();
          if (lowerKey.includes('dates') || lowerKey.includes('events') || lowerKey.includes('items')) {
            // These array types commonly contain lookup fields like 'label'
            
            // Create lookup options for common fields that might appear in this array type
            const commonLookupFields = ['label', 'type', 'category'];
            commonLookupFields.forEach((lookupField) => {
              const lookupFieldPath = `${fieldPath}[0].${lookupField}`;
              const lookupFieldType = detectFieldType(lookupField, '', `${fieldPath}[0]`);
              if (lookupFieldType.type === 'lookup' && lookupFieldType.config) {
                fetchLookupOptions(lookupFieldPath, lookupFieldType.config);
              }
            });
          }
        }
      }
    });
  }, []);

  // Reset all lookups
  const resetLookups = useCallback(() => {
    setLookupOptions({});
    setLookupErrors({});
  }, []);

       // Initialize form analysis when data changes
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      // Create a hash of the data to check if it's changed
      const dataHash = JSON.stringify(data);
      
      // Only analyze if we haven't analyzed this data before
      if (dataHash !== analyzedDataRef.current) {
        analyzedDataRef.current = dataHash;
        
        if (Array.isArray(data)) {
          // If it's an array, analyze the first item
          if (data.length > 0) {
            analyzeFormStructure(data[0]);
          }
        } else {
          // If it's an object, analyze it directly
          analyzeFormStructure(data);
        }
      }
    }
  }, [data]);

  // Notify parent of lookup changes
  useEffect(() => {
    if (onLookupChange) {
      onLookupChange(lookupOptions);
    }
  }, [lookupOptions, onLookupChange]);

  return {
    lookupOptions,
    lookupErrors,
    isLoading,
    detectFieldType,
    isStatusField,
    isDateField,
    isMeasurementTypeField,
    isFactoryField,
    getStatusOptions,
    getStatusBadgeStyle,
    formatFieldName,
    formatStatusValue,
    formatValue,
    shouldDisplayField,
    extractDataArray,
    resetLookups,
    analyzeFormStructure,
    fetchLookupOptions,
    // New functions from slug page
    renderCellValue: (value: unknown, fieldName?: string) => {
      if (value == null) return "-";
      
      // If this is a status field, return formatted status text
      if (fieldName && isStatusField(fieldName)) {
        const statusData = formatStatusValue(value);
        return statusData.text;
      }
      
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return String(value);
      }
      if (typeof value === "object" && value && Object.keys(value).length === 0) {
        return "{}";
      }
      return "-";
    },
    filterSubmitFields: (values: Record<string, unknown>) => {
      const SKIP_FIELDS = ["updatedAt", "createdAt", "__v", "_id", "Is Deleted"];
      const filtered: Record<string, unknown> = {};
      Object.entries(values).forEach(([k, v]) => {
        if (!SKIP_FIELDS.includes(k)) filtered[k] = v;
      });
      return filtered;
    },
    getConsistentFormTemplate: (data: Array<Record<string, unknown>>) => {
      function mergeKeys(a: any, b: any): any {
        if (Array.isArray(a) && Array.isArray(b)) return [];
        if (typeof a === 'object' && a && typeof b === 'object' && b) {
          const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
          const result: Record<string, any> = {};
          keys.forEach((k) => {
            const SKIP_FIELDS = ["updatedAt", "createdAt", "__v", "_id", "isDeleted"];
            if (!SKIP_FIELDS.includes(k)) {
              result[k] = mergeKeys(a[k], b[k]);
            }
          });
          return result;
        }
        return undefined;
      }
      if (!data.length) return {};
      let superset = { ...data[0] };
      for (let i = 1; i < data.length; i++) {
        superset = mergeKeys(superset, data[i]);
      }
      return superset;
    },
    getEmptyFormData: (data: Array<Record<string, unknown>>, allKeys: string[]) => {
      function makeEmptyTemplate(obj: any): any {
        if (Array.isArray(obj)) {
          // If array has a template item, use its structure for new items
          if (obj.length > 0 && typeof obj[0] === 'object') {
            // Optionally, start with an empty array, but keep the template for rendering
            return [];
          }
          return [];
        }
        if (obj === null || obj === undefined) return "";
        if (typeof obj === "boolean") return false;
        if (typeof obj === "number") return "";
        if (typeof obj === "string") return "";
        if (typeof obj === "object") {
          const result: Record<string, any> = {};
          const SKIP_FIELDS = ["updatedAt", "createdAt", "__v", "_id", "isDeleted"];
          Object.keys(obj).forEach((k) => {
            if (!SKIP_FIELDS.includes(k)) {
              result[k] = makeEmptyTemplate(obj[k]);
            }
          });
          return result;
        }
        return "";
      }
      
      // Build a superset of all keys (recursively) from all items in data
      function getConsistentFormTemplate(data: Array<Record<string, unknown>>) {
        function mergeKeys(a: any, b: any): any {
          if (Array.isArray(a) && Array.isArray(b)) return [];
          if (typeof a === 'object' && a && typeof b === 'object' && b) {
            const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
            const result: Record<string, any> = {};
            keys.forEach((k) => {
              const SKIP_FIELDS = ["updatedAt", "createdAt", "__v", "_id", "isDeleted"];
              if (!SKIP_FIELDS.includes(k)) {
                result[k] = mergeKeys(a[k], b[k]);
              }
            });
            return result;
          }
          return undefined;
        }
        if (!data.length) return {};
        let superset = { ...data[0] };
        for (let i = 1; i < data.length; i++) {
          superset = mergeKeys(superset, data[i]);
        }
        return superset;
      }
      
      const template = getConsistentFormTemplate(data);
      if (Object.keys(template).length > 0) {
        return makeEmptyTemplate(template);
      }
      if (allKeys.length === 1 && allKeys[0] === "value") {
        return { value: "" };
      }
      return {};
    }
  };
} 