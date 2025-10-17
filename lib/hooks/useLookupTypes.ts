// Type definitions for useLookup hook
export interface FieldType {
  type: 'lookup' | 'status' | 'date' | 'array' | 'object' | 'boolean' | 'number' | 'text';
  config?: FieldConfig;
}

export interface FieldConfig {
  endpoint?: string;
  displayField?: string;
  entityName?: string;
  fieldPath?: string;
  isObjectLookup?: boolean;
  isMeasurementTypeLookup?: boolean;
  isFactoryLookup?: boolean;
  brandFilter?: boolean;
  options?: string[];
  itemTemplate?: any;
  isComplexArray?: boolean;
  hasLookupFields?: boolean;
  lookupFields?: string[];
  fields?: string[];
}

export interface LookupOption {
  id: string;
  label: string;
}

export interface UseLookupProps {
  data?: Record<string, unknown> | Array<Record<string, unknown>>;
  onLookupChange?: (lookupOptions: Record<string, LookupOption[]>) => void;
  selfEntityName?: string;
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
  renderCellValue: (value: unknown, fieldName?: string) => React.ReactNode;
  filterSubmitFields: (values: Record<string, unknown>) => Record<string, unknown>;
  getConsistentFormTemplate: (data: Array<Record<string, unknown>>) => Record<string, unknown>;
  getEmptyFormData: (data: Array<Record<string, unknown>>, allKeys: string[]) => Record<string, unknown>;
}
