// Static field type patterns and constants for useLookup hook

// Number field patterns for measurement and general fields
export const NUMBER_FIELD_PATTERNS = [
  'age', 'price', 'cost', 'total', 'quantity', 'count', 'number', 'size',
  'around', 'length', 'width', 'height', 'area', 'volume', 'percentage', 'rate', 'score',
  'sleeve', 'hip', 'waist', 'shoulder', 'high', 'knee', 'bottom', 'weight', 'neck', 'biceps', 'back'
];

// Lookup field patterns for array analysis
export const LOOKUP_FIELD_PATTERNS = ['catalog', 'brand'];

// Name field patterns for object detection
export const NAME_FIELD_PATTERNS = ['name', 'brand', 'code', 'title', 'label'];

// Status field patterns
export const STATUS_FIELD_PATTERNS = ['status', 'state', 'condition', 'phase', 'specialization', 'category'];

// Date field patterns
export const DATE_FIELD_PATTERNS = ['date', 'dob'];

// Measurement type patterns
export const MEASUREMENT_TYPE_PATTERNS = ['measurementtype', 'measurement_type', 'measurementtype'];

// ID pattern for foreign key detection
export const ID_PATTERN = /^(.*?)(?:[\s_\-])?id$/i;

// Date string pattern
export const DATE_STRING_PATTERN = /^\d{4}-\d{2}-\d{2}/;

/**
 * Checks if a field name matches number field patterns
 */
export function isNumberField(fieldName: string): boolean {
  const lowerKey = fieldName.toLowerCase();
  return NUMBER_FIELD_PATTERNS.some(pattern => lowerKey.includes(pattern));
}

/**
 * Checks if a field name matches date field patterns
 */
export function isDateFieldPattern(fieldName: string): boolean {
  const lowerKey = fieldName.toLowerCase();
  return DATE_FIELD_PATTERNS.some(pattern => lowerKey.includes(pattern));
}

/**
 * Checks if a field name matches status field patterns
 */
export function isStatusFieldPattern(fieldName: string): boolean {
  const lowerKey = fieldName.toLowerCase();
  return STATUS_FIELD_PATTERNS.some(pattern => lowerKey.includes(pattern));
}

/**
 * Checks if a field name matches measurement type patterns
 */
export function isMeasurementTypePattern(fieldName: string): boolean {
  const lowerKey = fieldName.toLowerCase();
  return MEASUREMENT_TYPE_PATTERNS.some(pattern => lowerKey === pattern) ||
         (lowerKey.includes('measurement') && lowerKey.includes('type'));
}

/**
 * Checks if a field name matches lookup field patterns
 */
export function isLookupFieldPattern(fieldName: string): boolean {
  const lowerKey = fieldName.toLowerCase();
  return LOOKUP_FIELD_PATTERNS.some(pattern => lowerKey.includes(pattern));
}

/**
 * Checks if an object has name-like fields
 */
export function hasNameFields(obj: Record<string, unknown>): boolean {
  const objKeys = Object.keys(obj);
  return objKeys.some(k => 
    NAME_FIELD_PATTERNS.some(pattern => k.toLowerCase().includes(pattern))
  );
}

/**
 * Checks if an object has ID fields
 */
export function hasIdFields(obj: Record<string, unknown>): boolean {
  const objKeys = Object.keys(obj);
  return objKeys.some(k => k === '_id' || k === 'id');
}

/**
 * Gets the inferred entity from an ID field
 */
export function getInferredEntityFromId(fieldName: string): string | null {
  const match = fieldName.match(ID_PATTERN);
  if (!match) return null;
  
  return (match[1] || '').replace(/[^a-zA-Z]/g, '').toLowerCase();
}

/**
 * Detects lookup fields in array items
 */
export function detectArrayLookupFields(value: unknown[]): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [];
  }
  
  const itemTemplate = value[0];
  if (!itemTemplate || typeof itemTemplate !== 'object') {
    return [];
  }
  
  const allKeys = new Set<string>();
  value.forEach(item => {
    if (item && typeof item === 'object') {
      Object.keys(item as Record<string, unknown>).forEach(key => allKeys.add(key));
    }
  });
  
  const lookupFields: string[] = [];
  
  allKeys.forEach(key => {
    if (isLookupFieldPattern(key)) {
      // Check if this field has different values across items
      const uniqueValues = new Set();
      value.forEach(item => {
        if (item && typeof item === 'object' && (item as Record<string, unknown>)[key]) {
          uniqueValues.add(String((item as Record<string, unknown>)[key]));
        }
      });
      
      // If we have multiple unique values, it's a good lookup field
      if (uniqueValues.size > 1) {
        lookupFields.push(key);
      }
    }
  });
  
  return lookupFields;
}
