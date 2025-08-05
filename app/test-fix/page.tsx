'use client';

import { useState } from 'react';
import { useLookup } from '@/lib/hooks/useLookup';

export default function TestFixPage() {
  const [testData, setTestData] = useState({
    customerId: '',
    factoryId: '',
    measurementId: ''
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

  const testLookup = () => {
    addResult('Testing lookup functionality...');
    
    // Test multiple simultaneous requests
    const testConfigs = [
      { endpoint: 'customers', entityName: 'customer', displayField: 'name' },
      { endpoint: 'factories', entityName: 'factory', displayField: 'name' },
      { endpoint: 'measurements', entityName: 'measurement', displayField: 'name' },
      { endpoint: 'catalogs', entityName: 'catalog', displayField: 'name' }
    ];

    testConfigs.forEach((config, index) => {
      setTimeout(() => {
        addResult(`Triggering request ${index + 1} for ${config.endpoint}`);
        fetchLookupOptions(`testField${index}`, config, 0);
      }, index * 100);
    });
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Circular Dependency Fix Test</h1>
      
      <div className="mb-6 space-x-4">
        <button
          onClick={testLookup}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Lookup (No Circular Dependencies)
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
              <h3 className="font-semibold">Options:</h3>
              {Object.entries(lookupOptions).map(([key, options]) => (
                <div key={key} className="ml-4">
                  {key}: {options.length} items
                </div>
              ))}
            </div>
            <div className="mt-4">
              <h3 className="font-semibold">Errors:</h3>
              {Object.entries(lookupErrors).map(([key, error]) => (
                <div key={key} className="ml-4 text-red-600">
                  {key}: {error}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
        <h3 className="font-semibold text-green-800 mb-2">Success Criteria:</h3>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• No "Maximum update depth exceeded" errors in console</li>
          <li>• No infinite re-renders</li>
          <li>• Lookup requests are processed correctly</li>
          <li>• Queue system works without circular dependencies</li>
        </ul>
      </div>
    </div>
  );
} 