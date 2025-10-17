import { useState, useEffect, useCallback, useRef } from "react";

import pluralize from 'pluralize';
import { 
  FieldType, 
  LookupOption, 
  UseLookupProps, 
  UseLookupReturn 
} from './useLookupTypes';
import {
  getStatusOptions,
  getStatusBadgeStyle,
  formatFieldName,
  formatStatusValue,
  isStatusField,
  isDateField,
  isMeasurementTypeField,
  isFactoryField,
  shouldDisplayField,
  extractDataArray,
  getCurrentEntity
} from './useLookupUtils';
import {
  isNumberField,
  isDateFieldPattern,
  isStatusFieldPattern,
  isMeasurementTypePattern,
  hasNameFields,
  hasIdFields,
  getInferredEntityFromId,
  detectArrayLookupFields,
  ID_PATTERN,
  DATE_STRING_PATTERN,
  getMeasurementTypeOptions,
  handleFactoryLookup,
  handleEntityLookup
} from '../helpers/lookup';

export function useLookup({ 
  data, 
  onLookupChange,
  selfEntityName
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

  // Determine current entity (singular) from prop or URL pathname
  const currentEntity = getCurrentEntity(selfEntityName);

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
        const measurementTypeOptions = getMeasurementTypeOptions();
        setLookupOptions(prev => ({ ...prev, [fieldPath]: measurementTypeOptions }));
        return;
      }
      // Special handling for singular factory endpoint
      if (config.endpoint === 'factory' || (config.entityName && String(config.entityName).toLowerCase() === 'factory')) {
        const result = await handleFactoryLookup({ ...config, fieldPath });
        if (result.options.length > 0) {
          setLookupOptions(prev => ({ ...prev, [fieldPath]: result.options }));
        } else {
          setLookupErrors(prev => ({ ...prev, [fieldPath]: result.error || 'Unable to load options' }));
        }
        return;
      }
      // Special handling for factories - try API first, then fallback to mock data
      if (config.endpoint === 'factories' || config.isFactoryLookup) {
        const result = await handleFactoryLookup({ ...config, fieldPath });
        if (result.options.length > 0) {
          setLookupOptions(prev => ({ ...prev, [fieldPath]: result.options }));
        } else {
          setLookupErrors(prev => ({ ...prev, [fieldPath]: result.error || 'Unable to load options' }));
        }
        return;
      }
      // Handle regular entity lookup
      const result = await handleEntityLookup({ ...config, fieldPath });
      if (result.options.length > 0) {
        setLookupOptions(prev => ({ ...prev, [fieldPath]: result.options }));
      } else {
        setLookupErrors(prev => ({ ...prev, [fieldPath]: result.error || 'Unable to load options' }));
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
    const lowerParent = parentPath.toLowerCase();
     

    
    // Skip internal MongoDB fields
    if (key === '_id' || key === '__v' || key === 'createdAt' || key === 'updatedAt' || key === 'isDeleted') {
      return { type: 'text' };
    }

    // Array detection
    if (Array.isArray(value)) {
      const isComplexArray = value.length > 0 && typeof value[0] === 'object';
      const itemTemplate = value.length > 0 ? value[0] : {};
      
      // Dynamically analyze array items to find lookup fields
      const lookupFields = detectArrayLookupFields(value);
      
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
      const hasNameField = hasNameFields(value as Record<string, unknown>);
      
      // Also check if the object has an _id field (common in MongoDB objects)
      const hasIdField = hasIdFields(value as Record<string, unknown>);
      
      if (hasNameField || hasIdField) {
        // Determine the entity type based on the field name
        let entityName = key.toLowerCase();
        let endpoint = '';
        
        // Remove 'Id' suffix for entity name
        if (entityName.endsWith('id')) {
          entityName = entityName.replace(/id$/, '');
        }
        
        // Endpoint resolution with special cases
        endpoint = entityName.toLowerCase() === 'factory'
          ? 'factory'
          : pluralize(entityName.toLowerCase());
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
    if (isNumberField(key)) {
      return { type: 'number' };
    }

    // Date field detection
    if (isDateFieldPattern(key) || 
        (typeof value === 'string' && DATE_STRING_PATTERN.test(value as string))) {
      return { type: 'date' };
    }

    // Status field detection
    if (isStatusFieldPattern(key)) {
      return { 
        type: 'status',
        config: {
          options: getStatusOptions(key)
        }
      };
    }

    // Lookup field detection (foreign key relationships) - robust patterns
    if (ID_PATTERN.test(key) && lowerKey !== 'id' && !lowerKey.startsWith('_')) {
      const inferredEntity = getInferredEntityFromId(key);
      // Prevent self-referential lookup at top-level
      if (currentEntity && inferredEntity === currentEntity && parentPath === '') {
        return { type: 'text' };
      }
      if (inferredEntity) {
        const endpoint = inferredEntity === 'factory' ? 'factory' : pluralize(inferredEntity);
        return {
          type: 'lookup',
          config: {
            endpoint,
            displayField: 'name',
            entityName: inferredEntity,
            fieldPath: fullPath
          }
        };
      }
    }

    // Direct catalog field detection (not just catalogId)
    // (Removed static block for catalog endpoint; now handled dynamically)







    // Factory lookup detection - only for exact "factory" field, not "factoryName" or other variations
    // (Removed static block for factory endpoint; now handled dynamically)
    // Factory ID and other factory-related fields (but not exact "factory" or "factoryName")
    // (Removed static block for factoryid/factory_id endpoint; now handled dynamically)

    // Measurement Type lookup detection
    if (isMeasurementTypePattern(key)) {
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




  // Format value for display
  const formatValue = useCallback((value: unknown): string => {
    if (value == null || value === undefined) return "Not specified";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "string" && value.trim() === "") return "Not specified";
    if (typeof value === "object" && value !== null) {
      if (Array.isArray(value)) {
        return value.length === 0 ? "No items" : `${value.length} item(s)`;
      }
      const obj = value as Record<string, unknown>;
    
    // BFS pattern detection for objects
    const queue: Record<string, unknown>[] = [obj];
    const visited = new Set<Record<string, unknown>>();
    
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || visited.has(current)) continue;
      visited.add(current);
      
      const keys = Object.keys(current).filter(k => 
        k !== '_id' && k !== '__v' && k !== 'createdAt' && k !== 'updatedAt'
      );
      
      // Check for value-unit pattern
    if (keys.length === 2) {
  const firstKey = keys[0];
  const secondKey = keys[1];
  const firstVal = current[firstKey];
  const secondVal = current[secondKey];
  
  if (firstVal !== null && firstVal !== undefined && 
      secondVal !== null && secondVal !== undefined) {
    
    // Determine which should be primary based on data type
    const isFirstNumeric = !isNaN(Number(firstVal)) && typeof firstVal !== 'string';
    const isSecondNumeric = !isNaN(Number(secondVal)) && typeof secondVal !== 'string';
    
    // If first is numeric and second is not, assume value-unit pattern
    if (isFirstNumeric && !isSecondNumeric) {
      return `${String(firstVal)} ${String(secondVal)}`;
    }
    // If second is numeric and first is not, reverse it
    else if (!isFirstNumeric && isSecondNumeric) {
      return `${String(secondVal)} ${String(firstVal)}`;
    }
    // If both are same type, use order or semantic hints
    else {
      // Check if field names suggest an order
      const firstKeyLower = firstKey.toLowerCase();
      const secondKeyLower = secondKey.toLowerCase();
      
      // Value/quantity fields should come first
      if (firstKeyLower.includes('value') || firstKeyLower.includes('amount') || 
          firstKeyLower.includes('quantity') || firstKeyLower.includes('number')) {
        return `${String(firstVal)} ${String(secondVal)}`;
      }
      if (secondKeyLower.includes('value') || secondKeyLower.includes('amount') || 
          secondKeyLower.includes('quantity') || secondKeyLower.includes('number')) {
        return `${String(secondVal)} ${String(firstVal)}`;
      }
      
      // Default: use array order with separator
      return `${String(firstVal)} - ${String(secondVal)}`;
    }
  }
}

// For objects with more than 2 keys, try to find the best 2
if (keys.length > 2) {
  // Look for common primary-secondary patterns
  let primaryKey = null;
  let secondaryKey = null;
  
  // Find primary key (value-like)
  primaryKey = keys.find(k => {
    const lower = k.toLowerCase();
    return lower.includes('value') || lower.includes('amount') || 
           lower.includes('quantity') || lower.includes('number') ||
           lower.includes('price') || lower.includes('cost');
  });
  
  // Find secondary key (unit-like)
  if (primaryKey) {
    secondaryKey = keys.find(k => k !== primaryKey && (
      k.toLowerCase().includes('unit') || k.toLowerCase().includes('type') ||
      k.toLowerCase().includes('currency') || k.toLowerCase().includes('measure')
    ));
  }
  
  // If found a good pair, use them
  if (primaryKey && secondaryKey) {
    const primaryVal = current[primaryKey];
    const secondaryVal = current[secondaryKey];
    if (primaryVal !== null && primaryVal !== undefined && 
        secondaryVal !== null && secondaryVal !== undefined) {
      return `${String(primaryVal)} ${String(secondaryVal)}`;
    }
  }
  
  // Fallback: use first two non-null values
  const validKeys = keys.filter(k => current[k] !== null && current[k] !== undefined);
  if (validKeys.length >= 2) {
    const val1 = current[validKeys[0]];
    const val2 = current[validKeys[1]];
    return `${String(val1)} - ${String(val2)}`;
  }
}
      // Check for name-code pattern
      const nameKey = keys.find(k => k.toLowerCase().includes('name'));
      const codeKey = keys.find(k => k.toLowerCase().includes('code') || k.toLowerCase().includes('number'));
      if (nameKey && codeKey && current[nameKey] && current[codeKey]) {
        return `${String(current[nameKey])} - ${String(current[codeKey])}`;
      }
      
      // Check for display name pattern
      const displayKey = keys.find(k => ['name', 'displayName', 'title', 'label', 'catalogName'].includes(k));
      if (displayKey && current[displayKey]) {
        return String(current[displayKey]);
      }
      
      // Add nested objects to queue with proper type checking
      keys.forEach(key => {
        const nestedValue = current[key];
        if (nestedValue && 
            typeof nestedValue === 'object' && 
            !Array.isArray(nestedValue) && 
            nestedValue.constructor === Object) {
          queue.push(nestedValue as Record<string, unknown>);
        }
      });
    }
    
    // Fallback for objects without detected patterns
    const entries = Object.entries(obj).filter(([k, v]) => 
      k !== '_id' && k !== '__v' && v !== null && v !== undefined && v !== ''
    );
    
    if (entries.length === 0) return "No data";
    if (entries.length <= 2) {
      return entries.map(([k, v]) => `${k}: ${String(v)}`).join(', ');
    }
    
    return "Object data";
  }
  
  return String(value);
}, []);

  // Check if field should be displayed
  const shouldDisplayFieldCallback = useCallback((key: string, value: unknown): boolean => {
    return shouldDisplayField(key, value, currentEntity);
  }, [currentEntity]);

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
    shouldDisplayField: shouldDisplayFieldCallback,
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
// ...existing code...
// ...existing code...
filterSubmitFields: (values: Record<string, unknown>) => {
  function filter(obj: any, parentKey?: string): any {
    if (Array.isArray(obj)) {
      return obj.map(item => filter(item, parentKey));
    }
    if (obj && typeof obj === 'object') {
      // If parentKey ends with 'Id' and obj has _id, return the string _id
      if (parentKey && parentKey.endsWith('Id') && typeof obj._id === 'string') {
        return obj._id;
      }
      // Otherwise, recursively filter fields
      const result: any = {};
      for (const key in obj) {
        result[key] = filter(obj[key], key);
      }
      return result;
    }
    return obj;
  }
  return filter(values);
},
// ...existing code...
// ...existing code...

// Remove the standalone filterSubmitFields function at the bottom
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


