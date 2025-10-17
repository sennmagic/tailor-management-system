import {
  extractDataArray,
  mapItemToLookupOption,
  processApiResponse,
  getMeasurementTypeOptions,
  makeApiRequest,
  handleFactoryLookup,
  handleEntityLookup
} from '@/lib/helpers/lookup/apiHelpers';
import { fetchAPI } from '@/lib/apiService';

// Mock the API service
jest.mock('@/lib/apiService', () => ({
  fetchAPI: jest.fn(),
}));

const mockFetchAPI = fetchAPI as jest.MockedFunction<typeof fetchAPI>;

describe('API Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractDataArray', () => {
    it('should return array when response is already an array', () => {
      const arrayResponse = [{ id: 1, name: 'Test' }];
      const result = extractDataArray(arrayResponse);
      expect(result).toEqual(arrayResponse);
    });

    it('should extract data from object response', () => {
      const objectResponse = {
        data: [{ id: 1, name: 'Test' }],
        meta: { total: 1 }
      };
      const result = extractDataArray(objectResponse);
      expect(result).toEqual([{ id: 1, name: 'Test' }]);
    });

    it('should extract items from object response', () => {
      const objectResponse = {
        items: [{ id: 1, name: 'Test' }]
      };
      const result = extractDataArray(objectResponse);
      expect(result).toEqual([{ id: 1, name: 'Test' }]);
    });

    it('should extract results from object response', () => {
      const objectResponse = {
        results: [{ id: 1, name: 'Test' }]
      };
      const result = extractDataArray(objectResponse);
      expect(result).toEqual([{ id: 1, name: 'Test' }]);
    });

    it('should extract entity-specific field', () => {
      const objectResponse = {
        customerInfo: [{ id: 1, name: 'Test' }]
      };
      const result = extractDataArray(objectResponse, 'customer');
      expect(result).toEqual([{ id: 1, name: 'Test' }]);
    });

    it('should return empty array for invalid response', () => {
      const result = extractDataArray(null);
      expect(result).toEqual([]);
    });
  });

  describe('mapItemToLookupOption', () => {
    it('should return null for item without id', () => {
      const result = mapItemToLookupOption({ name: 'Test' }, {});
      expect(result).toBeNull();
    });

    it('should handle catalog items correctly', () => {
      const item = {
        _id: '1',
        catalogName: 'Test Catalog',
        codeNumber: 'TC001'
      };
      const result = mapItemToLookupOption(item, { endpoint: 'catalogs' });
      
      expect(result).toEqual({
        id: '1',
        label: 'Test Catalog - TC001'
      });
    });

    it('should handle catalog items without code number', () => {
      const item = {
        _id: '1',
        catalogName: 'Test Catalog'
      };
      const result = mapItemToLookupOption(item, { endpoint: 'catalogs' });
      
      expect(result).toEqual({
        id: '1',
        label: 'Test Catalog'
      });
    });

    it('should handle factory items correctly', () => {
      const item = {
        _id: '1',
        factoryName: 'Test Factory'
      };
      const result = mapItemToLookupOption(item, { 
        endpoint: 'factories', 
        isFactoryLookup: true 
      });
      
      expect(result).toEqual({
        id: '1',
        label: 'Test Factory'
      });
    });

    it('should handle generic items correctly', () => {
      const item = {
        _id: '1',
        name: 'Test Item'
      };
      const result = mapItemToLookupOption(item, { 
        endpoint: 'items',
        entityName: 'item'
      });
      
      expect(result).toEqual({
        id: '1',
        label: 'Test Item'
      });
    });

    it('should fallback to entity name when no display field found', () => {
      const item = {
        _id: '1'
      };
      const result = mapItemToLookupOption(item, { 
        endpoint: 'items',
        entityName: 'item'
      });
      
      expect(result).toEqual({
        id: '1',
        label: 'item 1'
      });
    });

    it('should use custom display field', () => {
      const item = {
        _id: '1',
        customField: 'Custom Value'
      };
      const result = mapItemToLookupOption(item, { 
        endpoint: 'items',
        displayField: 'customField'
      });
      
      expect(result).toEqual({
        id: '1',
        label: 'Custom Value'
      });
    });
  });

  describe('processApiResponse', () => {
    it('should process valid API response', () => {
      const response = {
        data: [
          { _id: '1', name: 'Item 1' },
          { _id: '2', name: 'Item 2' }
        ]
      };
      const config = { endpoint: 'items', entityName: 'item' };
      
      const result = processApiResponse(response, config);
      
      expect(result).toEqual([
        { id: '1', label: 'Item 1' },
        { id: '2', label: 'Item 2' }
      ]);
    });

    it('should return empty array for invalid response', () => {
      const result = processApiResponse(null, {});
      expect(result).toEqual([]);
    });

    it('should filter out null items', () => {
      const response = {
        data: [
          { _id: '1', name: 'Item 1' },
          { name: 'Item without ID' }, // This should be filtered out
          { _id: '2', name: 'Item 2' }
        ]
      };
      const config = { endpoint: 'items', entityName: 'item' };
      
      const result = processApiResponse(response, config);
      
      expect(result).toEqual([
        { id: '1', label: 'Item 1' },
        { id: '2', label: 'Item 2' }
      ]);
    });
  });

  describe('getMeasurementTypeOptions', () => {
    it('should return measurement type options', () => {
      const result = getMeasurementTypeOptions();
      
      expect(result).toEqual([
        { id: 'DAURA SURUWAL', label: 'DAURA SURUWAL' },
        { id: 'SUIT', label: 'SUIT' }
      ]);
    });
  });

  describe('makeApiRequest', () => {
    it('should make successful API request', async () => {
      const mockResponse = { data: [{ id: 1, name: 'Test' }] };
      mockFetchAPI.mockResolvedValue(mockResponse);
      
      const result = await makeApiRequest('test', true);
      
      expect(mockFetchAPI).toHaveBeenCalledWith({
        endpoint: 'test',
        method: 'GET',
        withAuth: true
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle API request errors', async () => {
      const mockError = new Error('Network error');
      mockFetchAPI.mockRejectedValue(mockError);
      
      const result = await makeApiRequest('test', true);
      
      expect(result).toEqual({ error: 'Network error' });
    });
  });

  describe('handleFactoryLookup', () => {
    it('should try multiple endpoints for factory lookup', async () => {
      const mockResponse = { data: [{ _id: '1', factoryName: 'Factory 1' }] };
      mockFetchAPI
        .mockResolvedValueOnce({ error: 'Not found' })
        .mockResolvedValueOnce(mockResponse);
      
      const config = { endpoint: 'factory', entityName: 'factory', fieldPath: 'factoryId' };
      const result = await handleFactoryLookup(config);
      
      expect(mockFetchAPI).toHaveBeenCalledTimes(2);
      expect(mockFetchAPI).toHaveBeenCalledWith({
        endpoint: 'factory',
        method: 'GET',
        withAuth: true
      });
      expect(mockFetchAPI).toHaveBeenCalledWith({
        endpoint: 'factories',
        method: 'GET',
        withAuth: true
      });
      expect(result.options).toEqual([{ id: '1', label: 'Factory 1' }]);
    });

    it('should return error when all endpoints fail', async () => {
      mockFetchAPI.mockResolvedValue({ error: 'Not found' });
      
      const config = { endpoint: 'factory', entityName: 'factory', fieldPath: 'factoryId' };
      const result = await handleFactoryLookup(config);
      
      expect(result.options).toEqual([]);
      expect(result.error).toBe('Unable to load factory options');
    });
  });

  describe('handleEntityLookup', () => {
    it('should handle successful entity lookup', async () => {
      const mockResponse = { data: [{ _id: '1', name: 'Item 1' }] };
      mockFetchAPI.mockResolvedValue(mockResponse);
      
      const config = { 
        endpoint: 'items', 
        entityName: 'item', 
        fieldPath: 'itemId' 
      };
      const result = await handleEntityLookup(config);
      
      expect(mockFetchAPI).toHaveBeenCalledWith({
        endpoint: 'items',
        method: 'GET',
        withAuth: true
      });
      expect(result.options).toEqual([{ id: '1', label: 'Item 1' }]);
    });

    it('should handle catalog endpoint fallback', async () => {
      const mockResponse = { data: [{ _id: '1', catalogName: 'Catalog 1' }] };
      mockFetchAPI
        .mockResolvedValueOnce({ error: 'Not found' })
        .mockResolvedValueOnce(mockResponse);
      
      const config = { 
        endpoint: 'catalogs', 
        entityName: 'catalog', 
        fieldPath: 'catalogId' 
      };
      const result = await handleEntityLookup(config);
      
      expect(mockFetchAPI).toHaveBeenCalledTimes(2);
      expect(result.options).toEqual([{ id: '1', label: 'Catalog 1' }]);
    });

    it('should try without authentication as fallback', async () => {
      const mockResponse = { data: [{ _id: '1', name: 'Item 1' }] };
      mockFetchAPI
        .mockResolvedValueOnce({ error: 'Unauthorized' })
        .mockResolvedValueOnce(mockResponse);
      
      const config = { 
        endpoint: 'items', 
        entityName: 'item', 
        fieldPath: 'itemId' 
      };
      const result = await handleEntityLookup(config);
      
      expect(mockFetchAPI).toHaveBeenCalledTimes(2);
      expect(mockFetchAPI).toHaveBeenNthCalledWith(1, {
        endpoint: 'items',
        method: 'GET',
        withAuth: true
      });
      expect(mockFetchAPI).toHaveBeenNthCalledWith(2, {
        endpoint: 'items',
        method: 'GET',
        withAuth: false
      });
      expect(result.options).toEqual([{ id: '1', label: 'Item 1' }]);
    });

    it('should handle brand filtering for catalogs', async () => {
      const mockResponse = { data: [{ _id: '1', catalogName: 'Catalog 1' }] };
      mockFetchAPI.mockResolvedValue(mockResponse);
      
      const config = { 
        endpoint: 'catalogs', 
        entityName: 'catalog', 
        fieldPath: 'catalogId',
        brandFilter: true
      };
      const result = await handleEntityLookup(config);
      
      expect(mockFetchAPI).toHaveBeenCalledWith({
        endpoint: '/catalogs',
        method: 'GET',
        withAuth: true
      });
      expect(result.options).toEqual([{ id: '1', label: 'Catalog 1' }]);
    });

    it('should return error when all attempts fail', async () => {
      mockFetchAPI.mockResolvedValue({ error: 'Network error' });
      
      const config = { 
        endpoint: 'items', 
        entityName: 'item', 
        fieldPath: 'itemId' 
      };
      const result = await handleEntityLookup(config);
      
      expect(result.options).toEqual([]);
      expect(result.error).toBe('Unable to load options');
    });
  });
});
