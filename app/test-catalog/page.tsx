'use client';

import { useState } from 'react';
import { useLookup } from '@/lib/hooks/useLookup';
import { fetchAPI } from '@/lib/apiService';

export default function TestCatalogPage() {
  const [testData, setTestData] = useState({
    catalogId: '',
    brandName: '',
    catalog: ''
  });

  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const {
    lookupOptions,
    lookupErrors,
    isLoading,
    detectFieldType,
    fetchLookupOptions,
    analyzeFormStructure
  } = useLookup({ data: testData });

  const testCatalogLookup = () => {
    addResult('Testing catalog lookup functionality...');
    
    // Test different catalog field variations
    const testFields = [
      'catalogId',
      'brandName',
      'catalog'
    ];

    testFields.forEach((fieldName, index) => {
      setTimeout(() => {
        addResult(`Testing field: "${fieldName}"`);
        const fieldType = detectFieldType(fieldName, '');
        addResult(`Field type: ${fieldType.type}`);
        
        if (fieldType.type === 'lookup') {
          addResult(`✅ "${fieldName}" detected as lookup field`);
          addResult(`Endpoint: ${fieldType.config?.endpoint}`);
          addResult(`Entity: ${fieldType.config?.entityName}`);
          addResult(`Display field: ${fieldType.config?.displayField}`);
          
          // Trigger the lookup
          fetchLookupOptions(fieldName, fieldType.config, 0);
        } else {
          addResult(`❌ "${fieldName}" not detected as lookup field`);
        }
      }, index * 500);
    });
  };

  const testCatalogAPI = async () => {
    addResult('Testing catalogs API endpoint directly...');
    
    try {
      const result = await fetchAPI({
        endpoint: 'catalogs',
        method: 'GET',
        withAuth: true
      });
      
      if (result.error) {
        addResult(`❌ API Error: ${result.error}`);
      } else {
        addResult(`✅ API Success: ${JSON.stringify(result.data, null, 2)}`);
      }
    } catch (error) {
      addResult(`❌ API Exception: ${error}`);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Catalog Lookup Debug Test</h1>
      
      <div className="mb-6 space-x-4">
        <button
          onClick={testCatalogLookup}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Catalog Lookup
        </button>
        
        <button
          onClick={testCatalogAPI}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Test Catalogs API
        </button>
        
        <button
          onClick={clearResults}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear Results
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4 bg-gray-50">
          <h2 className="text-lg font-semibold mb-4">Test Results</h2>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {results.length === 0 ? (
              <p className="text-gray-500">No test results yet. Run a test to see results.</p>
            ) : (
              results.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="border rounded-lg p-4 bg-gray-50">
          <h2 className="text-lg font-semibold mb-4">Lookup Status</h2>
          <div className="space-y-2 text-sm">
            <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
            <div>Lookup Options: {Object.keys(lookupOptions).length}</div>
            <div>Lookup Errors: {Object.keys(lookupErrors).length}</div>
            <div className="mt-4">
              <h3 className="font-semibold">Catalog Options:</h3>
              {Object.entries(lookupOptions).map(([key, options]) => (
                <div key={key} className="ml-4">
                  <div className="font-medium">"{key}":</div>
                  <div className="ml-4">
                    {options.length > 0 ? (
                      options.slice(0, 3).map((option, idx) => (
                        <div key={idx} className="text-xs">
                          • {option.label} (ID: {option.id})
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500">No options loaded</div>
                    )}
                    {options.length > 3 && (
                      <div className="text-xs text-gray-500">
                        ... and {options.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <h3 className="font-semibold">Errors:</h3>
              {Object.entries(lookupErrors).map(([key, error]) => (
                <div key={key} className="ml-4 text-red-600">
                  "{key}": {error}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold text-yellow-800 mb-2">Debugging Steps:</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Check if catalogId is detected as lookup field</li>
          <li>• Check if brandName is detected as lookup field</li>
          <li>• Test catalogs API endpoint directly</li>
          <li>• Check console for API errors</li>
          <li>• Verify authentication is working</li>
        </ul>
      </div>
    </div>
  );
} 