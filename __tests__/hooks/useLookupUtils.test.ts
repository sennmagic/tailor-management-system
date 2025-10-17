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
} from '@/lib/hooks/useLookupUtils';

// Mock window.location for getCurrentEntity
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/orders'
  },
  writable: true
});

describe('useLookupUtils', () => {
  describe('getStatusOptions', () => {
    it('should return correct options for order status', () => {
      const options = getStatusOptions('orderStatus');
      expect(options).toContain('Pending');
      expect(options).toContain('Delivered');
      expect(options).toContain('Cancelled');
    });

    it('should return correct options for payment status', () => {
      const options = getStatusOptions('paymentStatus');
      expect(options).toContain('Paid');
      expect(options).toContain('Unpaid');
      expect(options).toContain('Partial');
    });

    it('should return correct options for measurement type', () => {
      const options = getStatusOptions('measurementType');
      expect(options).toContain('DAURA SURUWAL');
      expect(options).toContain('SUIT');
    });

    it('should return default options for unknown field', () => {
      const options = getStatusOptions('unknownField');
      expect(options).toEqual(['Pending', 'Active', 'Inactive', 'Completed', 'Cancelled']);
    });
  });

  describe('getStatusBadgeStyle', () => {
    it('should return success style for completed status', () => {
      const style = getStatusBadgeStyle('completed');
      expect(style.bg).toBe('bg-green-50');
      expect(style.text).toBe('text-green-700');
      expect(style.icon).toBe('✓');
    });

    it('should return warning style for pending status', () => {
      const style = getStatusBadgeStyle('pending');
      expect(style.bg).toBe('bg-yellow-50');
      expect(style.text).toBe('text-yellow-700');
      expect(style.icon).toBe('⏳');
    });

    it('should return error style for failed status', () => {
      const style = getStatusBadgeStyle('failed');
      expect(style.bg).toBe('bg-red-50');
      expect(style.text).toBe('text-red-700');
      expect(style.icon).toBe('✗');
    });

    it('should return progress style for in-progress status', () => {
      const style = getStatusBadgeStyle('in-progress');
      expect(style.bg).toBe('bg-blue-50');
      expect(style.text).toBe('text-blue-700');
      expect(style.icon).toBe('⟳');
    });

    it('should return default style for unknown status', () => {
      const style = getStatusBadgeStyle('unknown');
      expect(style.bg).toBe('bg-gray-50');
      expect(style.text).toBe('text-gray-700');
      expect(style.icon).toBe('•');
    });
  });

  describe('formatFieldName', () => {
    it('should format camelCase correctly', () => {
      expect(formatFieldName('firstName')).toBe('First Name');
      expect(formatFieldName('orderStatus')).toBe('Order Status');
    });

    it('should format snake_case correctly', () => {
      expect(formatFieldName('first_name')).toBe('First Name');
      expect(formatFieldName('order_status')).toBe('Order Status');
    });

    it('should handle ID fields correctly', () => {
      expect(formatFieldName('customerId')).toBe('Customer ID');
      expect(formatFieldName('order_id')).toBe('Order ID');
    });
  });

  describe('formatStatusValue', () => {
    it('should format null/undefined values', () => {
      const result = formatStatusValue(null);
      expect(result.text).toBe('Not specified');
      expect(result.style.bg).toBe('bg-gray-50');
    });

    it('should format string values', () => {
      const result = formatStatusValue('pending');
      expect(result.text).toBe('Pending');
      expect(result.style.bg).toBe('bg-yellow-50');
    });

    it('should format empty string', () => {
      const result = formatStatusValue('');
      expect(result.text).toBe('Not specified');
    });
  });

  describe('isStatusField', () => {
    it('should identify status fields correctly', () => {
      expect(isStatusField('status')).toBe(true);
      expect(isStatusField('orderStatus')).toBe(true);
      expect(isStatusField('paymentStatus')).toBe(true);
      expect(isStatusField('state')).toBe(true);
      expect(isStatusField('condition')).toBe(true);
    });

    it('should reject non-status fields', () => {
      expect(isStatusField('name')).toBe(false);
      expect(isStatusField('email')).toBe(false);
      expect(isStatusField('age')).toBe(false);
    });
  });

  describe('isDateField', () => {
    it('should identify date fields correctly', () => {
      expect(isDateField('date')).toBe(true);
      expect(isDateField('createdAt')).toBe(true);
      expect(isDateField('updatedAt')).toBe(true);
      expect(isDateField('dob')).toBe(true);
      expect(isDateField('birthDate')).toBe(true);
    });

    it('should reject non-date fields', () => {
      expect(isDateField('name')).toBe(false);
      expect(isDateField('status')).toBe(false);
      expect(isDateField('age')).toBe(false);
    });
  });

  describe('isMeasurementTypeField', () => {
    it('should identify measurement type fields correctly', () => {
      expect(isMeasurementTypeField('measurementType')).toBe(true);
      expect(isMeasurementTypeField('measurement_type')).toBe(true);
      expect(isMeasurementTypeField('measurementtype')).toBe(true);
    });

    it('should reject non-measurement type fields', () => {
      expect(isMeasurementTypeField('measurement')).toBe(false);
      expect(isMeasurementTypeField('type')).toBe(false);
    });
  });

  describe('isFactoryField', () => {
    it('should identify factory fields correctly', () => {
      expect(isFactoryField('factory')).toBe(true);
      expect(isFactoryField('factoryId')).toBe(true);
      expect(isFactoryField('factory_name')).toBe(true);
    });

    it('should reject non-factory fields', () => {
      expect(isFactoryField('customer')).toBe(false);
      expect(isFactoryField('order')).toBe(false);
    });
  });

  describe('shouldDisplayField', () => {
    it('should hide internal fields', () => {
      expect(shouldDisplayField('_id', '123')).toBe(false);
      expect(shouldDisplayField('__v', 0)).toBe(false);
      expect(shouldDisplayField('createdAt', '2023-01-01')).toBe(false);
      expect(shouldDisplayField('updatedAt', '2023-01-01')).toBe(false);
    });

    it('should show regular fields', () => {
      expect(shouldDisplayField('name', 'John')).toBe(true);
      expect(shouldDisplayField('email', 'john@example.com')).toBe(true);
    });

    it('should hide self-referential IDs', () => {
      expect(shouldDisplayField('customerId', '123', 'customer')).toBe(false);
      expect(shouldDisplayField('orderId', '456', 'order')).toBe(false);
    });
  });

  describe('extractDataArray', () => {
    it('should extract array data directly', () => {
      const data = [{ id: 1, name: 'Test' }];
      expect(extractDataArray(data)).toEqual(data);
    });

    it('should extract data from object with data property', () => {
      const response = { data: [{ id: 1, name: 'Test' }] };
      expect(extractDataArray(response)).toEqual([{ id: 1, name: 'Test' }]);
    });

    it('should handle non-object arrays', () => {
      const data = ['item1', 'item2'];
      expect(extractDataArray(data)).toEqual([{ value: 'item1' }, { value: 'item2' }]);
    });

    it('should return empty array for null/undefined', () => {
      expect(extractDataArray(null)).toEqual([]);
      expect(extractDataArray(undefined)).toEqual([]);
    });

    it('should return empty array for empty object', () => {
      expect(extractDataArray({})).toEqual([]);
    });
  });

  describe('getCurrentEntity', () => {
    it('should extract entity from selfEntityName', () => {
      expect(getCurrentEntity('customers')).toBe('customer');
      expect(getCurrentEntity('orders')).toBe('order');
    });

    it('should extract entity from URL pathname', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/factories' },
        writable: true
      });
      expect(getCurrentEntity()).toBe('factory');
    });

    it('should return empty string when no entity found', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/' },
        writable: true
      });
      expect(getCurrentEntity()).toBe('');
    });
  });
});
