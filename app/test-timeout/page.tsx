'use client';

import { useState } from 'react';
import { testAPIConnectivity, fetchAPI } from '@/lib/apiService';

export default function TestTimeoutPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runConnectivityTest = async () => {
    setIsLoading(true);
    addResult('Starting API connectivity test...');
    
    try {
      const result = await testAPIConnectivity();
      if (result.success) {
        addResult('✅ API connectivity test passed');
      } else {
        addResult(`❌ API connectivity test failed: ${result.error}`);
      }
    } catch (error) {
      addResult(`❌ Test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runTimeoutTest = async () => {
    setIsLoading(true);
    addResult('Starting timeout test...');
    
    try {
      const startTime = Date.now();
      const result = await fetchAPI({ endpoint: 'customers', method: 'GET' });
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      addResult(`Request completed in ${duration}ms`);
      
      if (result.error) {
        addResult(`❌ Request failed: ${result.error}`);
      } else {
        addResult('✅ Request succeeded');
      }
    } catch (error) {
      addResult(`❌ Test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">API Timeout Test</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={runConnectivityTest}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test API Connectivity'}
        </button>
        
        <button
          onClick={runTimeoutTest}
          disabled={isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 ml-2"
        >
          {isLoading ? 'Testing...' : 'Test Request Timeout'}
        </button>
        
        <button
          onClick={clearResults}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 ml-2"
        >
          Clear Results
        </button>
      </div>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Test Results:</h2>
        <div className="space-y-1">
          {testResults.length === 0 ? (
            <p className="text-gray-500">No test results yet. Run a test to see results.</p>
          ) : (
            testResults.map((result, index) => (
              <div key={index} className="text-sm font-mono">
                {result}
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold text-yellow-800 mb-2">Troubleshooting Tips:</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• If you see "Request timed out after 15 seconds", the API server is slow or unreachable</li>
          <li>• If you see "Network error", check your internet connection</li>
          <li>• If you see "Unable to connect to server", the API endpoint might be down</li>
          <li>• The timeout has been reduced from 30s to 15s for better UX</li>
        </ul>
      </div>
    </div>
  );
} 