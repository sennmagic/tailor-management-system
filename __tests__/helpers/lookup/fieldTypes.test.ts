import {
  isNumberField,
  isDateFieldPattern,
  isStatusFieldPattern,
  isMeasurementTypePattern,
  hasNameFields,
  hasIdFields,
  getInferredEntityFromId,
  detectArrayLookupFields,
  NUMBER_FIELD_PATTERNS,
  LOOKUP_FIELD_PATTERNS,
  NAME_FIELD_PATTERNS,
  STATUS_FIELD_PATTERNS,
  DATE_FIELD_PATTERNS,
  MEASUREMENT_TYPE_PATTERNS,
  ID_PATTERN,
  DATE_STRING_PATTERN
} from '@/lib/helpers/lookup/fieldTypes';

describe('Field Types Helper', () => {
  describe('isNumberField', () => {
    it('should detect number fields correctly', () => {
      expect(isNumberField('age')).toBe(true);
      expect(isNumberField('price')).toBe(true);
      expect(isNumberField('total')).toBe(true);
      expect(isNumberField('quantity')).toBe(true);
      expect(isNumberField('count')).toBe(true);
      expect(isNumberField('number')).toBe(true);
      expect(isNumberField('size')).toBe(true);
      expect(isNumberField('length')).toBe(true);
      expect(isNumberField('width')).toBe(true);
      expect(isNumberField('height')).toBe(true);
      expect(isNumberField('area')).toBe(true);
      expect(isNumberField('volume')).toBe(true);
      expect(isNumberField('percentage')).toBe(true);
      expect(isNumberField('rate')).toBe(true);
      expect(isNumberField('score')).toBe(true);
      expect(isNumberField('sleeve')).toBe(true);
      expect(isNumberField('hip')).toBe(true);
      expect(isNumberField('waist')).toBe(true);
      expect(isNumberField('shoulder')).toBe(true);
      expect(isNumberField('knee')).toBe(true);
      expect(isNumberField('bottom')).toBe(true);
      expect(isNumberField('weight')).toBe(true);
      expect(isNumberField('neck')).toBe(true);
      expect(isNumberField('biceps')).toBe(true);
      expect(isNumberField('back')).toBe(true);
      expect(isNumberField('around')).toBe(true);
    });

    it('should not detect non-number fields', () => {
      expect(isNumberField('name')).toBe(false);
      expect(isNumberField('email')).toBe(false);
      expect(isNumberField('status')).toBe(false);
      expect(isNumberField('date')).toBe(false);
      expect(isNumberField('description')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isNumberField('AGE')).toBe(true);
      expect(isNumberField('Price')).toBe(true);
      expect(isNumberField('TOTAL')).toBe(true);
    });
  });

  describe('isDateFieldPattern', () => {
    it('should detect date fields correctly', () => {
      expect(isDateFieldPattern('date')).toBe(true);
      expect(isDateFieldPattern('createdAt')).toBe(true);
      expect(isDateFieldPattern('updatedAt')).toBe(true);
      expect(isDateFieldPattern('dob')).toBe(true);
      expect(isDateFieldPattern('birthDate')).toBe(true);
      expect(isDateFieldPattern('orderDate')).toBe(true);
      expect(isDateFieldPattern('deliveryDate')).toBe(true);
    });

    it('should not detect non-date fields', () => {
      expect(isDateFieldPattern('name')).toBe(false);
      expect(isDateFieldPattern('age')).toBe(false);
      expect(isDateFieldPattern('status')).toBe(false);
      expect(isDateFieldPattern('email')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isDateFieldPattern('DATE')).toBe(true);
      expect(isDateFieldPattern('CreatedAt')).toBe(true);
      expect(isDateFieldPattern('DOB')).toBe(true);
    });
  });

  describe('isStatusFieldPattern', () => {
    it('should detect status fields correctly', () => {
      expect(isStatusFieldPattern('status')).toBe(true);
      expect(isStatusFieldPattern('state')).toBe(true);
      expect(isStatusFieldPattern('condition')).toBe(true);
      expect(isStatusFieldPattern('phase')).toBe(true);
      expect(isStatusFieldPattern('specialization')).toBe(true);
      expect(isStatusFieldPattern('category')).toBe(true);
      expect(isStatusFieldPattern('orderStatus')).toBe(true);
      expect(isStatusFieldPattern('paymentStatus')).toBe(true);
      expect(isStatusFieldPattern('deliveryState')).toBe(true);
    });

    it('should not detect non-status fields', () => {
      expect(isStatusFieldPattern('name')).toBe(false);
      expect(isStatusFieldPattern('age')).toBe(false);
      expect(isStatusFieldPattern('date')).toBe(false);
      expect(isStatusFieldPattern('email')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isStatusFieldPattern('STATUS')).toBe(true);
      expect(isStatusFieldPattern('State')).toBe(true);
      expect(isStatusFieldPattern('CATEGORY')).toBe(true);
    });
  });

  describe('isMeasurementTypePattern', () => {
    it('should detect measurement type fields correctly', () => {
      expect(isMeasurementTypePattern('measurementtype')).toBe(true);
      expect(isMeasurementTypePattern('measurement_type')).toBe(true);
      expect(isMeasurementTypePattern('measurementType')).toBe(true);
    });

    it('should detect measurement type fields with both words', () => {
      expect(isMeasurementTypePattern('measurementTypeField')).toBe(true);
      expect(isMeasurementTypePattern('customMeasurementType')).toBe(true);
    });

    it('should not detect non-measurement type fields', () => {
      expect(isMeasurementTypePattern('measurement')).toBe(false);
      expect(isMeasurementTypePattern('type')).toBe(false);
      expect(isMeasurementTypePattern('name')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isMeasurementTypePattern('MEASUREMENTTYPE')).toBe(true);
      expect(isMeasurementTypePattern('Measurement_Type')).toBe(true);
    });
  });

  describe('hasNameFields', () => {
    it('should detect objects with name fields', () => {
      const obj1 = { name: 'Test' };
      expect(hasNameFields(obj1)).toBe(true);

      const obj2 = { brandName: 'Brand' };
      expect(hasNameFields(obj2)).toBe(true);

      const obj3 = { codeNumber: '123' };
      expect(hasNameFields(obj3)).toBe(true);

      const obj4 = { title: 'Title' };
      expect(hasNameFields(obj4)).toBe(true);

      const obj5 = { label: 'Label' };
      expect(hasNameFields(obj5)).toBe(true);
    });

    it('should not detect objects without name fields', () => {
      const obj1 = { id: '123' };
      expect(hasNameFields(obj1)).toBe(false);

      const obj2 = { age: 25 };
      expect(hasNameFields(obj2)).toBe(false);

      const obj3 = { status: 'active' };
      expect(hasNameFields(obj3)).toBe(false);

      const obj4 = {};
      expect(hasNameFields(obj4)).toBe(false);
    });

    it('should be case insensitive', () => {
      const obj1 = { NAME: 'Test' };
      expect(hasNameFields(obj1)).toBe(true);

      const obj2 = { BrandName: 'Brand' };
      expect(hasNameFields(obj2)).toBe(true);
    });
  });

  describe('hasIdFields', () => {
    it('should detect objects with ID fields', () => {
      const obj1 = { _id: '123' };
      expect(hasIdFields(obj1)).toBe(true);

      const obj2 = { id: '456' };
      expect(hasIdFields(obj2)).toBe(true);

      const obj3 = { _id: '123', id: '456' };
      expect(hasIdFields(obj3)).toBe(true);
    });

    it('should not detect objects without ID fields', () => {
      const obj1 = { name: 'Test' };
      expect(hasIdFields(obj1)).toBe(false);

      const obj2 = { age: 25 };
      expect(hasIdFields(obj2)).toBe(false);

      const obj3 = {};
      expect(hasIdFields(obj3)).toBe(false);
    });
  });

  describe('getInferredEntityFromId', () => {
    it('should extract entity name from ID fields', () => {
      expect(getInferredEntityFromId('customerId')).toBe('customer');
      expect(getInferredEntityFromId('factoryId')).toBe('factory');
      expect(getInferredEntityFromId('vendorId')).toBe('vendor');
      expect(getInferredEntityFromId('catalogId')).toBe('catalog');
      expect(getInferredEntityFromId('orderId')).toBe('order');
    });

    it('should handle different ID field formats', () => {
      expect(getInferredEntityFromId('customer_id')).toBe('customer');
      expect(getInferredEntityFromId('customer-id')).toBe('customer');
      expect(getInferredEntityFromId('customer id')).toBe('customer');
    });

    it('should handle complex entity names', () => {
      expect(getInferredEntityFromId('orderItemId')).toBe('orderitem');
      expect(getInferredEntityFromId('customerOrderId')).toBe('customerorder');
    });

    it('should return null for invalid ID fields', () => {
      expect(getInferredEntityFromId('id')).toBe(null);
      expect(getInferredEntityFromId('_id')).toBe(null);
      expect(getInferredEntityFromId('name')).toBe(null);
      expect(getInferredEntityFromId('')).toBe(null);
    });
  });

  describe('detectArrayLookupFields', () => {
    it('should detect lookup fields in array items', () => {
      const value = [
        { catalogId: '1', name: 'Item 1' },
        { catalogId: '2', name: 'Item 2' },
        { brandId: '1', name: 'Item 3' }
      ];
      
      const result = detectArrayLookupFields(value);
      expect(result).toContain('catalogId');
      expect(result).toContain('brandId');
    });

    it('should return empty array for non-array input', () => {
      expect(detectArrayLookupFields(null)).toEqual([]);
      expect(detectArrayLookupFields(undefined)).toEqual([]);
      expect(detectArrayLookupFields('string')).toEqual([]);
      expect(detectArrayLookupFields({})).toEqual([]);
    });

    it('should return empty array for empty array', () => {
      expect(detectArrayLookupFields([])).toEqual([]);
    });

    it('should return empty array for array with non-object items', () => {
      expect(detectArrayLookupFields([1, 2, 3])).toEqual([]);
      expect(detectArrayLookupFields(['a', 'b', 'c'])).toEqual([]);
    });

    it('should only include fields with multiple unique values', () => {
      const value = [
        { catalogId: '1', name: 'Item 1' },
        { catalogId: '1', name: 'Item 2' }, // Same catalogId
        { brandId: '1', name: 'Item 3' },
        { brandId: '2', name: 'Item 4' } // Different brandId
      ];
      
      const result = detectArrayLookupFields(value);
      expect(result).not.toContain('catalogId'); // Same values
      expect(result).toContain('brandId'); // Different values
    });
  });

  describe('Constants', () => {
    it('should have correct number field patterns', () => {
      expect(NUMBER_FIELD_PATTERNS).toContain('age');
      expect(NUMBER_FIELD_PATTERNS).toContain('price');
      expect(NUMBER_FIELD_PATTERNS).toContain('total');
      expect(NUMBER_FIELD_PATTERNS).toContain('quantity');
      expect(NUMBER_FIELD_PATTERNS).toContain('length');
      expect(NUMBER_FIELD_PATTERNS).toContain('width');
      expect(NUMBER_FIELD_PATTERNS).toContain('height');
    });

    it('should have correct lookup field patterns', () => {
      expect(LOOKUP_FIELD_PATTERNS).toContain('catalog');
      expect(LOOKUP_FIELD_PATTERNS).toContain('brand');
    });

    it('should have correct name field patterns', () => {
      expect(NAME_FIELD_PATTERNS).toContain('name');
      expect(NAME_FIELD_PATTERNS).toContain('brand');
      expect(NAME_FIELD_PATTERNS).toContain('code');
      expect(NAME_FIELD_PATTERNS).toContain('title');
      expect(NAME_FIELD_PATTERNS).toContain('label');
    });

    it('should have correct status field patterns', () => {
      expect(STATUS_FIELD_PATTERNS).toContain('status');
      expect(STATUS_FIELD_PATTERNS).toContain('state');
      expect(STATUS_FIELD_PATTERNS).toContain('condition');
      expect(STATUS_FIELD_PATTERNS).toContain('phase');
      expect(STATUS_FIELD_PATTERNS).toContain('specialization');
      expect(STATUS_FIELD_PATTERNS).toContain('category');
    });

    it('should have correct date field patterns', () => {
      expect(DATE_FIELD_PATTERNS).toContain('date');
      expect(DATE_FIELD_PATTERNS).toContain('dob');
    });

    it('should have correct measurement type patterns', () => {
      expect(MEASUREMENT_TYPE_PATTERNS).toContain('measurementtype');
      expect(MEASUREMENT_TYPE_PATTERNS).toContain('measurement_type');
    });

    it('should have correct ID pattern', () => {
      expect(ID_PATTERN.test('customerId')).toBe(true);
      expect(ID_PATTERN.test('customer_id')).toBe(true);
      expect(ID_PATTERN.test('customer-id')).toBe(true);
      expect(ID_PATTERN.test('customer id')).toBe(true);
      expect(ID_PATTERN.test('id')).toBe(false);
      expect(ID_PATTERN.test('_id')).toBe(false);
    });

    it('should have correct date string pattern', () => {
      expect(DATE_STRING_PATTERN.test('2023-01-01')).toBe(true);
      expect(DATE_STRING_PATTERN.test('2023-12-31')).toBe(true);
      expect(DATE_STRING_PATTERN.test('2023-1-1')).toBe(false);
      expect(DATE_STRING_PATTERN.test('01-01-2023')).toBe(false);
      expect(DATE_STRING_PATTERN.test('not a date')).toBe(false);
    });
  });
});
