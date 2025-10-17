import { renderHook, act } from '@testing-library/react';
import { useLookup } from '@/lib/hooks/useLookup';
import { fetchAPI } from '@/lib/apiService';

// Mock the API service
jest.mock('@/lib/apiService', () => ({
  fetchAPI: jest.fn(),
}));

// Mock pluralize
jest.mock('pluralize', () => ({
  singular: jest.fn((str) => str.replace(/s$/, '')),
}));

const mockFetchAPI = fetchAPI as jest.MockedFunction<typeof fetchAPI>;

describe('useLookup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useLookup());
    
    expect(result.current.lookupOptions).toEqual({});
    expect(result.current.lookupErrors).toEqual({});
    expect(result.current.isLoading).toBe(false);
  });

  it('should detect status fields correctly', () => {
    const { result } = renderHook(() => useLookup());
    
    expect(result.current.isStatusField('status')).toBe(true);
    expect(result.current.isStatusField('orderStatus')).toBe(true);
    expect(result.current.isStatusField('paymentStatus')).toBe(true);
    expect(result.current.isStatusField('name')).toBe(false);
  });

  it('should detect date fields correctly', () => {
    const { result } = renderHook(() => useLookup());
    
    expect(result.current.isDateField('date')).toBe(true);
    expect(result.current.isDateField('createdAt')).toBe(true);
    expect(result.current.isDateField('dob')).toBe(true);
    expect(result.current.isDateField('name')).toBe(false);
  });

  it('should format field names correctly', () => {
    const { result } = renderHook(() => useLookup());
    
    expect(result.current.formatFieldName('firstName')).toBe('First Name');
    expect(result.current.formatFieldName('order_status')).toBe('Order Status');
    expect(result.current.formatFieldName('customerId')).toBe('Customer ID');
  });

  it('should format status values correctly', () => {
    const { result } = renderHook(() => useLookup());
    
    const statusResult = result.current.formatStatusValue('pending');
    expect(statusResult.text).toBe('Pending');
    expect(statusResult.style).toHaveProperty('bg');
    expect(statusResult.style).toHaveProperty('text');
    expect(statusResult.style).toHaveProperty('border');
  });

  it('should get status options for different field types', () => {
    const { result } = renderHook(() => useLookup());
    
    const orderStatusOptions = result.current.getStatusOptions('orderStatus');
    expect(orderStatusOptions).toContain('Pending');
    expect(orderStatusOptions).toContain('Delivered');
    
    const paymentStatusOptions = result.current.getStatusOptions('paymentStatus');
    expect(paymentStatusOptions).toContain('Paid');
    expect(paymentStatusOptions).toContain('Unpaid');
  });

  it('should extract data array from API response', () => {
    const { result } = renderHook(() => useLookup());
    
    // Test with array response
    const arrayResponse = [{ id: 1, name: 'Test' }];
    expect(result.current.extractDataArray(arrayResponse)).toEqual(arrayResponse);
    
    // Test with object response containing data array
    const objectResponse = { data: [{ id: 1, name: 'Test' }] };
    expect(result.current.extractDataArray(objectResponse)).toEqual([{ id: 1, name: 'Test' }]);
    
    // Test with empty response
    expect(result.current.extractDataArray(null)).toEqual([]);
  });

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

  it('should detect field types correctly', () => {
    const { result } = renderHook(() => useLookup());
    
    // Test status field detection
    const statusField = result.current.detectFieldType('status', 'pending');
    expect(statusField.type).toBe('status');
    
    // Test date field detection
    const dateField = result.current.detectFieldType('createdAt', '2023-01-01');
    expect(dateField.type).toBe('date');
    
    // Test number field detection
    const numberField = result.current.detectFieldType('age', 25);
    expect(numberField.type).toBe('number');
    
    // Test boolean field detection
    const booleanField = result.current.detectFieldType('isActive', true);
    expect(booleanField.type).toBe('boolean');
    
    // Test array field detection
    const arrayField = result.current.detectFieldType('items', [1, 2, 3]);
    expect(arrayField.type).toBe('array');
    
    // Test object field detection
    const objectField = result.current.detectFieldType('customer', { name: 'John' });
    expect(objectField.type).toBe('object');
  });

  it('should handle lookup field detection', () => {
    const { result } = renderHook(() => useLookup());
    
    // Test customer ID lookup
    const customerIdField = result.current.detectFieldType('customerId', '123');
    expect(customerIdField.type).toBe('lookup');
    expect(customerIdField.config?.entityName).toBe('customer');
    
    // Test factory ID lookup
    const factoryIdField = result.current.detectFieldType('factoryId', '456');
    expect(factoryIdField.type).toBe('lookup');
    expect(factoryIdField.config?.entityName).toBe('factory');
  });

  it('should fetch lookup options successfully', async () => {
    const mockResponse = {
      data: [
        { _id: '1', name: 'Option 1' },
        { _id: '2', name: 'Option 2' }
      ],
      error: null
    };
    
    mockFetchAPI.mockResolvedValue(mockResponse);
    
    const { result } = renderHook(() => useLookup());
    
    await act(async () => {
      await result.current.fetchLookupOptions('testField', {
        endpoint: 'test',
        entityName: 'test'
      });
    });
    
    // Wait for state updates
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    expect(mockFetchAPI).toHaveBeenCalledWith({
      endpoint: 'test',
      method: 'GET',
      withAuth: true
    });
  });

  it('should handle lookup fetch errors', async () => {
    const mockError = {
      data: null,
      error: 'Network error'
    };
    
    mockFetchAPI.mockResolvedValue(mockError);
    
    const { result } = renderHook(() => useLookup());
    
    await act(async () => {
      await result.current.fetchLookupOptions('testField', {
        endpoint: 'test',
        entityName: 'test'
      });
    });
    
    // Wait for state updates
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    expect(result.current.lookupErrors['testField']).toBe('Unable to load options');
  });

  it('should render cell values correctly', () => {
    const { result } = renderHook(() => useLookup());
    
    // Test null value
    expect(result.current.renderCellValue(null)).toBe('-');
    
    // Test string value
    expect(result.current.renderCellValue('test')).toBe('test');
    
    // Test number value
    expect(result.current.renderCellValue(123)).toBe('123');
    
    // Test boolean value
    expect(result.current.renderCellValue(true)).toBe('true');
    
    // Test empty object
    expect(result.current.renderCellValue({})).toBe('{}');
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

  it('should reset lookups correctly', () => {
    const { result } = renderHook(() => useLookup());
    
    // Set some initial state
    act(() => {
      result.current.resetLookups();
    });
    
    expect(result.current.lookupOptions).toEqual({});
    expect(result.current.lookupErrors).toEqual({});
  });
});
