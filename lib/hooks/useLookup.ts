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
      return { 
        type: 'array', 
        config: { 
          itemTemplate: value.length > 0 ? value[0] : {},
          isComplexArray: value.length > 0 && typeof value[0] === 'object'
        }
      };
    }

    // Object detection
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
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

    // Lookup field detection (foreign key relationships)
    if (lowerKey.endsWith('id') && lowerKey !== 'id' && !lowerKey.startsWith('_')) {
      const entityName = key.replace(/Id$/i, '');
      return {
        type: 'lookup',
        config: {
          endpoint: entityName.toLowerCase() + 's',
          displayField: 'name',
          entityName
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
    const skipFields = ["_id", "__v", "createdAt", "updatedAt", "isDeleted"];
    if (skipFields.includes(key)) return false;
    if (value === null || value === undefined) return false;
    if (typeof value === "string" && value.trim() === "") return false;
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

  // Enhanced lookup fetching with better error handling
  const fetchLookupOptions = useCallback(async (fieldPath: string, config: any) => {
    if (!config.endpoint) return;
    
    console.log(`🔄 Fetching lookup options for ${fieldPath} from /${config.endpoint}`);
    
    try {
      const { data: response, error } = await fetchAPI({ 
        endpoint: config.endpoint, 
        method: 'GET' 
      });
      
      if (error) {
        console.error(`❌ Failed to fetch from /${config.endpoint}:`, error);
        setLookupErrors(prev => ({ 
          ...prev, 
          [fieldPath]: `Failed to load from /${config.endpoint}` 
        }));
        return;
      }

      // Extract array from various response formats
      const dataArray = Array.isArray(response) 
        ? response 
        : response?.data || response?.items || response?.results || [];

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
        
        // First try entity-specific name field
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

        if (!label) {
          label = `${config.entityName} ${id}`;
        }

        return { id: String(id), label: String(label) };
      }).filter((item): item is LookupOption => item !== null);

      console.log(`✅ Loaded ${options.length} options for ${fieldPath}:`, options);
      setLookupOptions(prev => ({ ...prev, [fieldPath]: options }));
      
    } catch (err) {
      console.error(`❌ Error fetching lookup options for ${fieldPath}:`, err);
      setLookupErrors(prev => ({ 
        ...prev, 
        [fieldPath]: 'Network error while loading options' 
      }));
    }
  }, []);

  // Recursively analyze form structure and fetch lookup data
  const analyzeFormStructure = useCallback((obj: any, parentPath = '') => {
    Object.entries(obj).forEach(([key, value]) => {
      const fieldPath = parentPath ? `${parentPath}.${key}` : key;
      const fieldType = detectFieldType(key, value, parentPath);
      
      if (fieldType.type === 'lookup' && fieldType.config) {
        fetchLookupOptions(fieldPath, fieldType.config);
      }
      
      if (fieldType.type === 'object' && typeof value === 'object' && value !== null) {
        analyzeFormStructure(value, fieldPath);
      }
      
      if (fieldType.type === 'array' && Array.isArray(value) && value.length > 0) {
        if (typeof value[0] === 'object') {
          analyzeFormStructure(value[0], `${fieldPath}[0]`);
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