'use client';

import { useState } from 'react';
import { OrderForm } from '@/components/ui/orderForm';

export default function TestLookupPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Lookup Field Test</h1>
      
      <div className="mb-6">
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {showForm ? 'Hide Form' : 'Show Create Order Form'}
        </button>
      </div>
      
      {showForm && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h2 className="text-lg font-semibold mb-4">Testing Lookup Fields</h2>
          <p className="text-sm text-gray-600 mb-4">
            This form should properly display lookup fields without showing [object Object].
            Check the browser console for debugging information.
          </p>
          
          <OrderForm
            mode="create"
            onSuccess={(data) => {
              console.log('✅ Form submitted successfully:', data);
              alert('Order created successfully! Check console for details.');
            }}
            onCancel={() => {
              console.log('❌ Form cancelled');
              setShowForm(false);
            }}
          />
        </div>
      )}
      
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold text-yellow-800 mb-2">What to Check:</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Lookup fields should show proper labels instead of [object Object]</li>
          <li>• Dropdown options should load from the API</li>
          <li>• Console should show debugging information about lookup processing</li>
          <li>• Form should handle both object and string values correctly</li>
        </ul>
      </div>
    </div>
  );
} 