
import { useState, useEffect, useCallback } from "react";
import { fetchAPI } from "@/lib/apiService";

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
           const isLookupField = lowerKey.includes('label');
           // Note: Only 'label' should be treated as a lookup field
          
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
         
         // Generic endpoint generation - just add 's' to make it plural
         // This will work for any field name: vendor -> vendors, catalog -> catalogs, etc.
         // But for fields ending with 'Id', we need to remove the 'Id' first
         if (entityName.endsWith('id')) {
           entityName = entityName.replace(/id$/, '');
         }
         endpoint = entityName + 's';
        
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
      
      // Only treat as lookup if it's a known entity with a valid endpoint
      const knownEntities = ['customer', 'factory', 'measurement', 'catalog', 'vendor', 'label'];
      if (knownEntities.includes(entityName.toLowerCase())) {
        return {
          type: 'lookup',
          config: {
            endpoint: entityName.toLowerCase() + 's', // e.g., customer -> customers, not customerids
            displayField: 'name',
            entityName,
            fieldPath: fullPath // Store the full path for debugging
          }
        };
      }
    }

    // Lookup field detection for common field names (like label, etc.)
    // Note: Only treat specific fields as lookups, not all common fields
    if (lowerKey === 'label') {
      // Only 'label' should be treated as a lookup field
      return {
        type: 'lookup',
        config: {
          endpoint: 'labels',
          displayField: 'name',
          entityName: 'label',
          fieldPath: fullPath,
          isArrayItemLookup: true // Flag to indicate this is a lookup field within an array item
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

  // Get status options based on field context
  const getStatusOptions = useCallback((fieldName: string): string[] => {
    const lower = fieldName.toLowerCase();
    
    if (lower.includes('payment')) {
      return ['pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled'];
    }
    
    if (lower.includes('order')) {
      return ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
    }
    
    if (lower.includes('delivery') || lower.includes('shipment')) {
      return ['pending', 'in-transit', 'out-for-delivery', 'delivered', 'failed', 'returned'];
    }
    
    return ['pending', 'active', 'inactive', 'completed', 'cancelled'];
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
    if (!config.endpoint) return;
    
    // List of valid endpoints that actually exist
    const validEndpoints = ['customers', 'factories', 'measurements', 'catalogs', 'vendors', 'labels'];
    
    // Skip fetching if endpoint doesn't exist
    if (!validEndpoints.includes(config.endpoint)) {
      console.log(`⚠️ Skipping lookup for ${fieldPath} - endpoint /${config.endpoint} doesn't exist`);
      return;
    }
    
    // Handle array item lookups dynamically based on existing data
    if (config.isArrayItemLookup) {
      // Extract unique values from existing array data to create dynamic options
      const existingValues = new Set<string>();
      
      // Find the array data in the current form data
      let arrayFieldName = '';
      const match = fieldPath.match(/(\w+)\[\d+\]/); // Extract array name from patterns like specialDates[0]
      if (match && match[1]) {
        arrayFieldName = match[1]; // Get the base array name (e.g., 'specialDates' from 'specialDates[0]')
      } else {
        // Fallback: try to get from path parts
        const pathParts = fieldPath.split('.');
        arrayFieldName = pathParts[pathParts.length - 2];
      }
      
      console.log(`🔍 Array item lookup for ${fieldPath}:`);
      console.log(`   - Extracted array field name: ${arrayFieldName}`);
      console.log(`   - Entity name: ${config.entityName}`);
      console.log(`   - Data structure:`, data);
      
      if (data && typeof data === 'object') {
        // Navigate to the array field
        let arrayData: any[] = [];
        if (Array.isArray(data)) {
          // If data is an array, look for the array field in each item
          data.forEach(item => {
            if (item && typeof item === 'object' && item[arrayFieldName] && Array.isArray(item[arrayFieldName])) {
              arrayData = arrayData.concat(item[arrayFieldName]);
            }
          });
        } else {
          // If data is an object, look for the array field directly
          if (data && typeof data === 'object' && data[arrayFieldName] && Array.isArray(data[arrayFieldName])) {
            arrayData = data[arrayFieldName] as any[];
          }
        }
        
        // Extract unique values for the lookup field
        arrayData.forEach(item => {
          if (item && typeof item === 'object' && item[config.entityName]) {
            const value = item[config.entityName];
            if (typeof value === 'string' && value.trim()) {
              existingValues.add(value);
            }
          }
        });
      }
      
             // Create dynamic options from existing values
       const dynamicOptions: LookupOption[] = Array.from(existingValues).map(value => ({
         id: value, // Use the actual value as ID for array item lookups
         label: value
       }));
      
             // Add some common options if we don't have many existing values
       if (dynamicOptions.length < 3) {
         const commonOptions = {
           label: ['Birthday', 'Anniversary', 'Wedding', 'Graduation', 'Holiday', 'Other'],
           type: ['Personal', 'Business', 'Family', 'Other'],
           category: ['Urgent', 'Normal', 'Low Priority']
         };
        
                 const commonForType = commonOptions[config.entityName as keyof typeof commonOptions] || [];
         commonForType.forEach(option => {
           if (!existingValues.has(option)) {
             dynamicOptions.push({
               id: option, // Use the actual value as ID for array item lookups
               label: option
             });
           }
         });
      }
      
      if (dynamicOptions.length > 0) {
        console.log(`✅ Loaded ${dynamicOptions.length} dynamic options for ${fieldPath}:`, dynamicOptions);
        setLookupOptions(prev => ({ ...prev, [fieldPath]: dynamicOptions }));
        return;
      }
    }
    
    console.log(`🔄 Fetching lookup options for ${fieldPath} from /${config.endpoint}${retryCount > 0 ? ` (retry ${retryCount})` : ''}`);
    console.log(`📋 Config:`, config);
    console.log(`📍 Field path: ${fieldPath}, Config fieldPath: ${config.fieldPath}`);
    
    // Check if we're in browser and have auth token
    if (typeof window !== "undefined") {
      const token = document.cookie.split('; ').find(row => row.startsWith('refresh_token='))?.split('=')[1];
      console.log(`🔑 Auth token available: ${token ? 'Yes' : 'No'}`);
    }
    
    try {
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      console.log(`🔐 Making authenticated API request to: ${config.endpoint}`);
      const fetchPromise = fetchAPI({ 
        endpoint: config.endpoint, 
        method: 'GET',
        withAuth: true // Add authentication for lookup requests
      });
      const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
      
      console.log(`📥 Raw API response for ${fieldPath}:`, result);
      
      if (result.error) {
        console.error(`❌ Failed to fetch from /${config.endpoint}:`, result.error);
        setLookupErrors(prev => ({ 
          ...prev, 
          [fieldPath]: `Failed to load from /${config.endpoint}: ${result.error}` 
        }));
        return;
      }
      
      const response = result.data;
      if (!response) {
        console.error(`❌ No data received from /${config.endpoint}`);
        setLookupErrors(prev => ({ 
          ...prev, 
          [fieldPath]: `No data received from /${config.endpoint}` 
        }));
        return;
      }

      // Extract array from various response formats
      const entityField = config.entityName.toLowerCase() + 'Info'; // e.g., customerInfo, factoryInfo
      const dataArray = Array.isArray(response) 
        ? response 
        : response?.data || response?.items || response?.results || response?.[entityField] || [];

      console.log(`📊 Response structure for ${fieldPath}:`, {
        responseType: typeof response,
        isArray: Array.isArray(response),
        hasData: !!response?.data,
        hasItems: !!response?.items,
        hasResults: !!response?.results,
        entityField,
        hasEntityField: !!response?.[entityField],
        dataArrayLength: Array.isArray(dataArray) ? dataArray.length : 'not array',
        firstItem: Array.isArray(dataArray) && dataArray.length > 0 ? dataArray[0] : null,
        responseKeys: response ? Object.keys(response) : 'null/undefined'
      });

      if (!Array.isArray(dataArray) || dataArray.length === 0) {
        console.warn(`⚠️ No data found in /${config.endpoint}`);
        setLookupOptions(prev => ({ ...prev, [fieldPath]: [] }));
        return;
      }

      // Map to options format
      const options = dataArray.map((item: any) => {
        const id = item._id || item.id;
        if (!id) return null;

        // Try to find the best display field
        let label = '';
        
                 // For object lookups, try to find the most descriptive field
         if (config.isObjectLookup) {
           // Try entity-specific fields first (e.g., vendorName, customerName, etc.)
           const entitySpecificField = config.entityName + 'Name';
           if (item[entitySpecificField] && typeof item[entitySpecificField] === 'string') {
             label = item[entitySpecificField];
           } else {
             // Try common display fields in order of preference
             const displayFields = [
               'name', 
               'title', 
               'label', 
               'displayName', 
               'fullName',
               'brandName',
               'vendorName',
               'customerName',
               'factoryName'
             ];
             
             for (const field of displayFields) {
               if (item[field] && typeof item[field] === 'string') {
                 label = item[field];
                 break;
               }
             }
           }
           
           // For objects with multiple descriptive fields, try to combine them
           if (!label && item.brandName && item.codeNumber) {
             label = `${item.brandName} - ${item.codeNumber}`;
           } else if (!label && item.name && item.code) {
             label = `${item.name} - ${item.code}`;
           }
         } else {
          // Original logic for ID-based lookups
          const entitySpecificField = config.entityName + 'Name';
          if (item[entitySpecificField]) {
            label = item[entitySpecificField];
          } else {
            // Try common display fields
            const displayFields = ['name', 'title', 'label', 'displayName', 'fullName'];
            for (const field of displayFields) {
              if (item[field] && typeof item[field] === 'string') {
                label = item[field];
                break;
              }
            }
          }
        }

        if (!label) {
          label = `${config.entityName} ${id}`;
        }

        return { id: String(id), label: String(label) };
      }).filter((item): item is LookupOption => item !== null);

      console.log(`✅ Loaded ${options.length} options for ${fieldPath}:`, options);
      setLookupOptions(prev => ({ ...prev, [fieldPath]: options }));
      
    } catch (err) {
      console.error(`❌ Error fetching lookup options for ${fieldPath}:`, err);
      
      // Retry logic for network errors (but not for 4xx errors)
      if (retryCount < 2 && err instanceof Error && !err.message.includes('Failed to load')) {
        console.log(`🔄 Retrying lookup for ${fieldPath}...`);
        setTimeout(() => {
          fetchLookupOptions(fieldPath, config, retryCount + 1);
        }, 1000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      setLookupErrors(prev => ({ 
        ...prev, 
        [fieldPath]: `Network error while loading options: ${err instanceof Error ? err.message : 'Unknown error'}` 
      }));
    }
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
        console.log(`🔍 Analyzing array field: ${fieldPath}`);
        console.log(`   - Array length: ${value.length}`);
        
        if (value.length > 0 && typeof value[0] === 'object') {
          console.log(`   - Array item structure:`, value[0]);
          
          // Analyze the first array item to detect lookup fields within array items
          analyzeFormStructure(value[0], `${fieldPath}[0]`);
          
          // Also analyze the array field itself to detect array-level lookups
          const arrayFieldType = detectFieldType(key, value, parentPath);
          console.log(`   - Array field type:`, arrayFieldType);
          
          if (arrayFieldType.config?.hasLookupFields && arrayFieldType.config.lookupFields) {
            console.log(`   - Detected lookup fields in array:`, arrayFieldType.config.lookupFields);
            // For each detected lookup field in the array, create lookup options
            arrayFieldType.config.lookupFields.forEach((lookupField: string) => {
              const lookupFieldPath = `${fieldPath}[0].${lookupField}`;
              const lookupFieldType = detectFieldType(lookupField, value[0][lookupField], `${fieldPath}[0]`);
              console.log(`   - Lookup field ${lookupField}:`, lookupFieldType);
              if (lookupFieldType.type === 'lookup' && lookupFieldType.config) {
                console.log(`   - Fetching lookup options for: ${lookupFieldPath}`);
                fetchLookupOptions(lookupFieldPath, lookupFieldType.config);
              }
            });
          }
        } else if (value.length === 0) {
          // Handle empty arrays - analyze the array field type to detect potential lookup fields
          const arrayFieldType = detectFieldType(key, value, parentPath);
          console.log(`   - Empty array field type:`, arrayFieldType);
          
          // For empty arrays, we need to check if this array field name suggests it might contain lookup fields
          const lowerKey = key.toLowerCase();
          if (lowerKey.includes('dates') || lowerKey.includes('events') || lowerKey.includes('items')) {
            // These array types commonly contain lookup fields like 'label'
            console.log(`   - Detected potential lookup array: ${key}`);
            
            // Create lookup options for common fields that might appear in this array type
            const commonLookupFields = ['label', 'type', 'category'];
            commonLookupFields.forEach((lookupField) => {
              const lookupFieldPath = `${fieldPath}[0].${lookupField}`;
              const lookupFieldType = detectFieldType(lookupField, '', `${fieldPath}[0]`);
              console.log(`   - Potential lookup field ${lookupField}:`, lookupFieldType);
              if (lookupFieldType.type === 'lookup' && lookupFieldType.config) {
                console.log(`   - Fetching lookup options for: ${lookupFieldPath}`);
                fetchLookupOptions(lookupFieldPath, lookupFieldType.config);
              }
            });
          }
        }
      }
    });
  }, [detectFieldType, fetchLookupOptions]);

  // Reset all lookups
  const resetLookups = useCallback(() => {
    setLookupOptions({});
    setLookupErrors({});
  }, []);

  // Initialize form analysis when data changes
  useEffect(() => {
    if (data) {
      console.log('🔍 Analyzing form structure for lookups:', data);
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
  }, [data, analyzeFormStructure]);

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
      const SKIP_FIELDS = ["updatedAt", "createdAt", "__v", "_id", "isDeleted"];
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