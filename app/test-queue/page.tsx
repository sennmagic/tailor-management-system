'use client';

import { useState } from 'react';
import { OrderForm } from '@/components/ui/orderForm';

export default function TestQueuePage() {
  const [showForm, setShowForm] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runQueueTest = () => {
    addResult('Starting queue test...');
    addResult('Opening form to trigger multiple lookup requests...');
    setShowForm(true);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Request Queue Test</h1>
      
      <div className="mb-6 space-x-4">
        <button
          onClick={runQueueTest}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Request Queue
        </button>
        
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          {showForm ? 'Hide Form' : 'Show Form'}
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
        
        {showForm && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <h2 className="text-lg font-semibold mb-4">Order Form</h2>
            <p className="text-sm text-gray-600 mb-4">
              This form will trigger multiple lookup requests simultaneously.
              Check the console to see the queue system in action.
            </p>
            
            <OrderForm
              mode="create"
              onSuccess={(data) => {
                addResult('✅ Form submitted successfully');
                console.log('✅ Form submitted successfully:', data);
              }}
              onCancel={() => {
                addResult('❌ Form cancelled');
                console.log('❌ Form cancelled');
                setShowForm(false);
              }}
            />
          </div>
        )}
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold text-yellow-800 mb-2">What to Check:</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Console should show "Adding X to request queue" messages</li>
          <li>• Only 3 requests should be active at any time</li>
          <li>• Requests should be processed with 500ms delays</li>
          <li>• No "Maximum update depth exceeded" errors</li>
          <li>• No "maximum request exceeded" errors</li>
        </ul>
      </div>
    </div>
  );
} 