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

export interface UseDynamicFormProps {
  initialData: Record<string, unknown>;
  onFormChange?: (formState: Record<string, unknown>) => void;
}

export interface UseDynamicFormReturn {
  formState: Record<string, unknown>;
  lookupOptions: Record<string, LookupOption[]>;
  lookupErrors: Record<string, string>;
  isLoading: boolean;
  handleFieldChange: (fieldPath: string, newValue: any) => void;
  getFieldValue: (fieldPath: string) => any;
  detectFieldType: (key: string, value: unknown, parentPath?: string) => FieldType;
  formatFieldName: (key: string) => string;
  organizeFields: (obj: Record<string, unknown>, parentPath?: string) => {
    basic: Array<[string, unknown, string]>;
    lookup: Array<[string, unknown, string]>;
    status: Array<[string, unknown, string]>;
    complex: Array<[string, unknown, string]>;
  };
  resetForm: () => void;
  setFormState: (state: Record<string, unknown>) => void;
}

export function useDynamicForm({ 
  initialData, 
  onFormChange 
}: UseDynamicFormProps): UseDynamicFormReturn {
  const [formState, setFormState] = useState<Record<string, unknown>>(initialData);
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
          options: getStatusOptionsForField(key)
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

  // Get status options based on field context
  const getStatusOptionsForField = useCallback((fieldName: string): string[] => {
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

  // Handle form field changes with deep object support
  const handleFieldChange = useCallback((fieldPath: string, newValue: any) => {
    setFormState(prev => {
      const newState = { ...prev };
      const pathParts = fieldPath.split('.');
      
      let current: any = newState;
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!(part in current)) {
          current[part] = {};
        }
        current = current[part];
      }
      
      current[pathParts[pathParts.length - 1]] = newValue;
      return newState;
    });
  }, []);

  // Get field value from nested path
  const getFieldValue = useCallback((fieldPath: string): any => {
    const pathParts = fieldPath.split('.');
    let current = formState;
    
    for (const part of pathParts) {
      if (current && typeof current === 'object' && part in current) {
        current = (current as any)[part];
      } else {
        return '';
      }
    }
    
    return current;
  }, [formState]);

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

  // Group fields by type for better organization
  const organizeFields = useCallback((obj: Record<string, unknown>, parentPath = ''): {
    basic: Array<[string, unknown, string]>;
    lookup: Array<[string, unknown, string]>;
    status: Array<[string, unknown, string]>;
    complex: Array<[string, unknown, string]>;
  } => {
    const groups: {
      basic: Array<[string, unknown, string]>;
      lookup: Array<[string, unknown, string]>;
      status: Array<[string, unknown, string]>;
      complex: Array<[string, unknown, string]>;
    } = { 
      basic: [] as Array<[string, unknown, string]>, 
      lookup: [] as Array<[string, unknown, string]>, 
      status: [] as Array<[string, unknown, string]>, 
      complex: [] as Array<[string, unknown, string]> 
    };
    
    Object.entries(obj).forEach(([key, value]) => {
      const fieldPath = parentPath ? `${parentPath}.${key}` : key;
      const fieldType = detectFieldType(key, value, parentPath);
      
      if (fieldType.type === 'lookup') {
        groups.lookup.push([key, value, fieldPath]);
      } else if (fieldType.type === 'status') {
        groups.status.push([key, value, fieldPath]);
      } else if (fieldType.type === 'array' || fieldType.type === 'object') {
        groups.complex.push([key, value, fieldPath]);
      } else {
        groups.basic.push([key, value, fieldPath]);
      }
    });
    
    return groups;
  }, [detectFieldType]);

  // Reset form to initial data
  const resetForm = useCallback(() => {
    setFormState(initialData);
    setLookupOptions({});
    setLookupErrors({});
  }, [initialData]);

  // Initialize form analysis
  useEffect(() => {
    console.log('🔍 Analyzing form structure:', initialData);
    analyzeFormStructure(initialData);
  }, [initialData, analyzeFormStructure]);

  // Notify parent of form changes
  useEffect(() => {
    if (onFormChange) {
      onFormChange(formState);
    }
  }, [formState, onFormChange]);

  return {
    formState,
    lookupOptions,
    lookupErrors,
    isLoading,
    handleFieldChange,
    getFieldValue,
    detectFieldType,
    formatFieldName,
    organizeFields,
    resetForm,
    setFormState
  };
} 