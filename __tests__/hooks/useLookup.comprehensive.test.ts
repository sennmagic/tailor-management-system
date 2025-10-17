import { renderHook, act, waitFor } from '@testing-library/react';
import { useLookup } from '@/lib/hooks/useLookup';
import { fetchAPI } from '@/lib/apiService';
import * as lookupHelpers from '@/lib/helpers/lookup';

// Mock the API service
jest.mock('@/lib/apiService', () => ({
  fetchAPI: jest.fn(),
}));

// Mock the lookup helpers
jest.mock('@/lib/helpers/lookup', () => ({
  isNumberField: jest.fn(),
  isDateFieldPattern: jest.fn(),
  isStatusFieldPattern: jest.fn(),
  isMeasurementTypePattern: jest.fn(),
  hasNameFields: jest.fn(),
  hasIdFields: jest.fn(),
  getInferredEntityFromId: jest.fn(),
  detectArrayLookupFields: jest.fn(),
  ID_PATTERN: /^(.*?)(?:[\s_\-])?id$/i,
  DATE_STRING_PATTERN: /^\d{4}-\d{2}-\d{2}/,
  getMeasurementTypeOptions: jest.fn(),
  handleFactoryLookup: jest.fn(),
  handleEntityLookup: jest.fn(),
}));

// Mock useLookupUtils
jest.mock('@/lib/hooks/useLookupUtils', () => ({
  getStatusOptions: jest.fn(),
  getStatusBadgeStyle: jest.fn(),
  formatFieldName: jest.fn(),
  formatStatusValue: jest.fn(),
  isStatusField: jest.fn(),
  isDateField: jest.fn(),
  isMeasurementTypeField: jest.fn(),
  isFactoryField: jest.fn(),
  shouldDisplayField: jest.fn(),
  extractDataArray: jest.fn(),
  getCurrentEntity: jest.fn(),
}));

// Mock pluralize
jest.mock('pluralize', () => ({
  singular: jest.fn((str) => str.replace(/s$/, '')),
}));

const mockFetchAPI = fetchAPI as jest.MockedFunction<typeof fetchAPI>;
const mockLookupHelpers = lookupHelpers as jest.Mocked<typeof lookupHelpers>;

describe('useLookup - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockLookupHelpers.isNumberField.mockReturnValue(false);
    mockLookupHelpers.isDateFieldPattern.mockReturnValue(false);
    mockLookupHelpers.isStatusFieldPattern.mockReturnValue(false);
    mockLookupHelpers.isMeasurementTypePattern.mockReturnValue(false);
    mockLookupHelpers.hasNameFields.mockReturnValue(false);
    mockLookupHelpers.hasIdFields.mockReturnValue(false);
    mockLookupHelpers.getInferredEntityFromId.mockReturnValue(null);
    mockLookupHelpers.detectArrayLookupFields.mockReturnValue([]);
    mockLookupHelpers.getMeasurementTypeOptions.mockReturnValue([
      { id: 'DAURA SURUWAL', label: 'DAURA SURUWAL' },
      { id: 'SUIT', label: 'SUIT' }
    ]);
    mockLookupHelpers.handleFactoryLookup.mockResolvedValue({ options: [], error: 'No factory found' });
    mockLookupHelpers.handleEntityLookup.mockResolvedValue({ options: [], error: 'No entity found' });
  });

  describe('Initialization', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useLookup());
      
      expect(result.current.lookupOptions).toEqual({});
      expect(result.current.lookupErrors).toEqual({});
      expect(result.current.isLoading).toBe(false);
    });

    it('should initialize with provided props', () => {
      const mockData = { name: 'Test' };
      const mockOnLookupChange = jest.fn();
      const mockSelfEntityName = 'customer';

      const { result } = renderHook(() => useLookup({
        data: mockData,
        onLookupChange: mockOnLookupChange,
        selfEntityName: mockSelfEntityName
      }));

      expect(result.current.data).toBe(mockData);
      expect(result.current.onLookupChange).toBe(mockOnLookupChange);
      expect(result.current.selfEntityName).toBe(mockSelfEntityName);
    });
  });

  describe('Field Type Detection', () => {
    it('should detect number fields correctly', () => {
      mockLookupHelpers.isNumberField.mockReturnValue(true);
      
      const { result } = renderHook(() => useLookup());
      
      const fieldType = result.current.detectFieldType('age', 25);
      expect(fieldType.type).toBe('number');
      expect(mockLookupHelpers.isNumberField).toHaveBeenCalledWith('age');
    });

    it('should detect date fields correctly', () => {
      mockLookupHelpers.isDateFieldPattern.mockReturnValue(true);
      
      const { result } = renderHook(() => useLookup());
      
      const fieldType = result.current.detectFieldType('createdAt', '2023-01-01');
      expect(fieldType.type).toBe('date');
      expect(mockLookupHelpers.isDateFieldPattern).toHaveBeenCalledWith('createdAt');
    });

    it('should detect status fields correctly', () => {
      mockLookupHelpers.isStatusFieldPattern.mockReturnValue(true);
      
      const { result } = renderHook(() => useLookup());
      
      const fieldType = result.current.detectFieldType('status', 'pending');
      expect(fieldType.type).toBe('status');
      expect(fieldType.config?.options).toBeDefined();
    });

    it('should detect measurement type fields correctly', () => {
      mockLookupHelpers.isMeasurementTypePattern.mockReturnValue(true);
      
      const { result } = renderHook(() => useLookup());
      
      const fieldType = result.current.detectFieldType('measurementType', 'DAURA SURUWAL');
      expect(fieldType.type).toBe('lookup');
      expect(fieldType.config?.endpoint).toBe('measurementTypes');
      expect(fieldType.config?.isMeasurementTypeLookup).toBe(true);
    });

    it('should detect lookup fields correctly', () => {
      mockLookupHelpers.getInferredEntityFromId.mockReturnValue('customer');
      
      const { result } = renderHook(() => useLookup());
      
      const fieldType = result.current.detectFieldType('customerId', '123');
      expect(fieldType.type).toBe('lookup');
      expect(fieldType.config?.entityName).toBe('customer');
      expect(fieldType.config?.endpoint).toBe('customers');
    });

    it('should detect object lookup fields correctly', () => {
      mockLookupHelpers.hasNameFields.mockReturnValue(true);
      
      const { result } = renderHook(() => useLookup());
      
      const fieldType = result.current.detectFieldType('customer', { name: 'John', _id: '123' });
      expect(fieldType.type).toBe('lookup');
      expect(fieldType.config?.isObjectLookup).toBe(true);
    });

    it('should detect array fields correctly', () => {
      mockLookupHelpers.detectArrayLookupFields.mockReturnValue(['catalogId']);
      
      const { result } = renderHook(() => useLookup());
      
      const fieldType = result.current.detectFieldType('items', [{ name: 'Item 1' }, { name: 'Item 2' }]);
      expect(fieldType.type).toBe('array');
      expect(fieldType.config?.hasLookupFields).toBe(true);
      expect(fieldType.config?.lookupFields).toEqual(['catalogId']);
    });

    it('should skip internal MongoDB fields', () => {
      const { result } = renderHook(() => useLookup());
      
      const internalFields = ['_id', '__v', 'createdAt', 'updatedAt', 'isDeleted'];
      
      internalFields.forEach(field => {
        const fieldType = result.current.detectFieldType(field, 'some value');
        expect(fieldType.type).toBe('text');
      });
    });
  });

  describe('API Request Handling', () => {
    it('should handle measurement type lookup', async () => {
      const { result } = renderHook(() => useLookup());
      
      await act(async () => {
        await result.current.performLookupRequest('measurementType', {
          endpoint: 'measurementTypes',
          isMeasurementTypeLookup: true
        }, 0);
      });

      expect(mockLookupHelpers.getMeasurementTypeOptions).toHaveBeenCalled();
    });

    it('should handle factory lookup', async () => {
      const mockOptions = [
        { id: '1', label: 'Factory 1' },
        { id: '2', label: 'Factory 2' }
      ];
      mockLookupHelpers.handleFactoryLookup.mockResolvedValue({ options: mockOptions });

      const { result } = renderHook(() => useLookup());
      
      await act(async () => {
        await result.current.performLookupRequest('factoryId', {
          endpoint: 'factory',
          entityName: 'factory'
        }, 0);
      });

      expect(mockLookupHelpers.handleFactoryLookup).toHaveBeenCalledWith({
        endpoint: 'factory',
        entityName: 'factory',
        fieldPath: 'factoryId'
      });
    });

    it('should handle regular entity lookup', async () => {
      const mockOptions = [
        { id: '1', label: 'Customer 1' },
        { id: '2', label: 'Customer 2' }
      ];
      mockLookupHelpers.handleEntityLookup.mockResolvedValue({ options: mockOptions });

      const { result } = renderHook(() => useLookup());
      
      await act(async () => {
        await result.current.performLookupRequest('customerId', {
          endpoint: 'customers',
          entityName: 'customer'
        }, 0);
      });

      expect(mockLookupHelpers.handleEntityLookup).toHaveBeenCalledWith({
        endpoint: 'customers',
        entityName: 'customer',
        fieldPath: 'customerId',
        brandFilter: undefined
      });
    });

    it('should handle lookup errors gracefully', async () => {
      mockLookupHelpers.handleEntityLookup.mockResolvedValue({ 
        options: [], 
        error: 'API Error' 
      });

      const { result } = renderHook(() => useLookup());
      
      await act(async () => {
        await result.current.performLookupRequest('customerId', {
          endpoint: 'customers',
          entityName: 'customer'
        }, 0);
      });

      expect(result.current.lookupErrors['customerId']).toBe('API Error');
    });
  });

  describe('Request Queue Management', () => {
    it('should process request queue correctly', async () => {
      const { result } = renderHook(() => useLookup());
      
      // Add requests to queue
      act(() => {
        result.current.addToQueue('field1', { endpoint: 'test1' }, 0);
        result.current.addToQueue('field2', { endpoint: 'test2' }, 0);
      });

      expect(result.current.requestQueue.length).toBe(2);
    });

    it('should limit concurrent requests', async () => {
      const { result } = renderHook(() => useLookup());
      
      // Mock multiple pending requests
      act(() => {
        result.current.setPendingRequests(new Set(['req1', 'req2', 'req3']));
      });

      expect(result.current.pendingRequests.size).toBe(3);
    });
  });

  describe('Data Analysis', () => {
    it('should analyze form structure correctly', () => {
      const { result } = renderHook(() => useLookup());
      
      const testData = {
        name: 'John',
        age: 25,
        customerId: '123',
        items: [{ name: 'Item 1' }]
      };

      const analysis = result.current.analyzeFormStructure(testData);
      
      expect(analysis).toBeDefined();
      expect(typeof analysis).toBe('string');
    });

    it('should detect field types in nested objects', () => {
      const { result } = renderHook(() => useLookup());
      
      const testData = {
        customer: {
          name: 'John',
          age: 25,
          status: 'active'
        }
      };

      const analysis = result.current.analyzeFormStructure(testData);
      expect(analysis).toBeDefined();
    });
  });

  describe('Utility Functions', () => {
    it('should format field names correctly', () => {
      const { result } = renderHook(() => useLookup());
      
      expect(result.current.formatFieldName('firstName')).toBe('First Name');
      expect(result.current.formatFieldName('customer_id')).toBe('Customer ID');
    });

    it('should format status values correctly', () => {
      const { result } = renderHook(() => useLookup());
      
      const statusResult = result.current.formatStatusValue('pending');
      expect(statusResult.text).toBe('Pending');
      expect(statusResult.style).toHaveProperty('bg');
      expect(statusResult.style).toHaveProperty('text');
      expect(statusResult.style).toHaveProperty('border');
    });

    it('should get status options correctly', () => {
      const { result } = renderHook(() => useLookup());
      
      const options = result.current.getStatusOptions('orderStatus');
      expect(Array.isArray(options)).toBe(true);
    });

    it('should check field types correctly', () => {
      const { result } = renderHook(() => useLookup());
      
      expect(result.current.isStatusField('status')).toBe(true);
      expect(result.current.isDateField('createdAt')).toBe(true);
      expect(result.current.isMeasurementTypeField('measurementType')).toBe(true);
      expect(result.current.isFactoryField('factoryId')).toBe(true);
    });

    it('should determine if field should be displayed', () => {
      const { result } = renderHook(() => useLookup());
      
      expect(result.current.shouldDisplayField('name')).toBe(true);
      expect(result.current.shouldDisplayField('_id')).toBe(false);
    });

    it('should extract data array correctly', () => {
      const { result } = renderHook(() => useLookup());
      
      const arrayData = [{ id: 1, name: 'Test' }];
      expect(result.current.extractDataArray(arrayData)).toEqual(arrayData);
      
      const objectData = { data: arrayData };
      expect(result.current.extractDataArray(objectData)).toEqual(arrayData);
    });

    it('should get current entity correctly', () => {
      const { result } = renderHook(() => useLookup({ selfEntityName: 'customer' }));
      
      expect(result.current.getCurrentEntity()).toBe('customer');
    });
  });

  describe('Form Data Handling', () => {
    it('should filter submit fields correctly', () => {
      const { result } = renderHook(() => useLookup());
      
      const testData = {
        name: 'John',
        _id: '123',
        customerId: { _id: '456', name: 'Customer' },
        items: [{ _id: '789', name: 'Item' }]
      };
      
      const filtered = result.current.filterSubmitFields(testData);
      expect(filtered).toEqual({
        name: 'John',
        _id: '123',
        customerId: '456',
        items: [{ _id: '789', name: 'Item' }]
      });
    });

    it('should get empty form data correctly', () => {
      const { result } = renderHook(() => useLookup());
      
      const testData = [
        { name: 'John', age: 25, isActive: true },
        { name: 'Jane', age: 30, isActive: false }
      ];
      
      const emptyData = result.current.getEmptyFormData(testData, ['name', 'age', 'isActive']);
      
      expect(emptyData).toEqual({
        name: '',
        age: '',
        isActive: false
      });
    });
  });

  describe('Cell Rendering', () => {
    it('should render cell values correctly', () => {
      const { result } = renderHook(() => useLookup());
      
      expect(result.current.renderCellValue(null)).toBe('-');
      expect(result.current.renderCellValue('test')).toBe('test');
      expect(result.current.renderCellValue(123)).toBe('123');
      expect(result.current.renderCellValue(true)).toBe('true');
      expect(result.current.renderCellValue({})).toBe('{}');
    });

    it('should render complex values correctly', () => {
      const { result } = renderHook(() => useLookup());
      
      const complexObject = { name: 'John', age: 25 };
      expect(result.current.renderCellValue(complexObject)).toBe('{"name":"John","age":25}');
      
      const arrayValue = [1, 2, 3];
      expect(result.current.renderCellValue(arrayValue)).toBe('[1,2,3]');
    });
  });

  describe('State Management', () => {
    it('should reset lookups correctly', () => {
      const { result } = renderHook(() => useLookup());
      
      // Set some initial state
      act(() => {
        result.current.setLookupOptions({ test: [{ id: '1', label: 'Test' }] });
        result.current.setLookupErrors({ test: 'Error' });
      });
      
      act(() => {
        result.current.resetLookups();
      });
      
      expect(result.current.lookupOptions).toEqual({});
      expect(result.current.lookupErrors).toEqual({});
    });

    it('should update lookup options correctly', () => {
      const { result } = renderHook(() => useLookup());
      
      const options = [{ id: '1', label: 'Option 1' }];
      
      act(() => {
        result.current.setLookupOptions({ test: options });
      });
      
      expect(result.current.lookupOptions.test).toEqual(options);
    });

    it('should update lookup errors correctly', () => {
      const { result } = renderHook(() => useLookup());
      
      act(() => {
        result.current.setLookupErrors({ test: 'Error message' });
      });
      
      expect(result.current.lookupErrors.test).toBe('Error message');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockLookupHelpers.handleEntityLookup.mockRejectedValue(new Error('Network error'));
      
      const { result } = renderHook(() => useLookup());
      
      await act(async () => {
        await result.current.performLookupRequest('testField', {
          endpoint: 'test',
          entityName: 'test'
        }, 0);
      });
      
      expect(result.current.lookupErrors['testField']).toBeDefined();
    });

    it('should retry failed requests', async () => {
      mockLookupHelpers.handleEntityLookup
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ options: [{ id: '1', label: 'Test' }] });
      
      const { result } = renderHook(() => useLookup());
      
      await act(async () => {
        await result.current.performLookupRequest('testField', {
          endpoint: 'test',
          entityName: 'test'
        }, 0);
      });
      
      // Should retry and eventually succeed
      expect(mockLookupHelpers.handleEntityLookup).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance and Optimization', () => {
    it('should cache successful requests', async () => {
      const mockOptions = [{ id: '1', label: 'Test' }];
      mockLookupHelpers.handleEntityLookup.mockResolvedValue({ options: mockOptions });
      
      const { result } = renderHook(() => useLookup());
      
      // First request
      await act(async () => {
        await result.current.performLookupRequest('testField', {
          endpoint: 'test',
          entityName: 'test'
        }, 0);
      });
      
      // Second request should use cache
      await act(async () => {
        await result.current.performLookupRequest('testField', {
          endpoint: 'test',
          entityName: 'test'
        }, 0);
      });
      
      // Should only call API once due to caching
      expect(mockLookupHelpers.handleEntityLookup).toHaveBeenCalledTimes(1);
    });

    it('should clean up request cache periodically', () => {
      jest.useFakeTimers();
      
      const { result } = renderHook(() => useLookup());
      
      // Set some cache
      act(() => {
        result.current.setRequestCache(new Set(['cached1', 'cached2']));
      });
      
      // Fast forward time
      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000); // 5 minutes
      });
      
      expect(result.current.requestCache.size).toBe(0);
      
      jest.useRealTimers();
    });
  });
});
