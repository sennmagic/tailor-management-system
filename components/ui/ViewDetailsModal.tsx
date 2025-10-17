"use client";
import { useLookup } from "@/lib/hooks/useLookup";
import { Button } from "@/components/ui/button";

interface ViewDetailsModalProps {
  data: Record<string, unknown> | null;
  open: boolean;
  onClose: () => void;
}

export function ViewDetailsModal({ data, open, onClose }: ViewDetailsModalProps) {
  if (!open || !data) return null;

  // Use the lookup hook for formatting functions
  const { 
    formatFieldName, 
    formatStatusValue, 
    formatValue,
    shouldDisplayField, 
    isStatusField, 
    isDateField 
  } = useLookup();

  // Helper function to safely convert value to string for modal display
  const safeStringifyModal = (val: unknown): string => {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
      return String(val);
    }
    if (typeof val === 'object' && !Array.isArray(val)) {
      const obj = val as Record<string, unknown>;
      const keys = Object.keys(obj).filter(k => k !== '_id' && k !== '__v' && k !== 'createdAt' && k !== 'updatedAt');
      if (keys.length > 0) {
        const firstKey = keys[0];
        const firstValue = obj[firstKey];
        return `${firstKey}: ${safeStringifyModal(firstValue)}`;
      }
      return 'Object';
    }
    if (Array.isArray(val)) {
      if (val.length === 0) return 'Empty Array';
      if (val.length === 1) {
        return safeStringifyModal(val[0]);
      }
      return `${safeStringifyModal(val[0])} (+${val.length - 1} more)`;
    }
    return String(val);
  };

  function renderNestedData(data: any, title: string): React.ReactNode {
    if (!data || typeof data !== 'object') {
      return <div className="text-gray-500 text-center py-4">No data available</div>;
    }

    const entries = Object.entries(data);
    if (entries.length === 0) {
      return <div className="text-gray-500 text-center py-4">No data available</div>;
    }

    return (
      <div className="space-y-4">
        {entries.map(([key, value]) => {
          if (key === '_id' || key === '__v' || key === 'createdAt' || key === 'updatedAt' || key === 'isDeleted') {
            return null; // Skip internal fields
          }

          const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Nested object - show key-value pairs
            const nestedEntries = Object.entries(value);
            return (
              <div key={key} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#2e7d32] rounded-full"></div>
                  {displayKey}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {nestedEntries.map(([nestedKey, nestedValue]) => {
                    if (nestedKey === '_id' || nestedKey === '__v') return null;
                    const nestedDisplayKey = nestedKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    return (
                      <div key={nestedKey} className="flex justify-between items-center py-2 px-3 bg-white rounded border border-gray-100">
                        <span className="text-gray-600 font-medium">{nestedDisplayKey}:</span>
                        <span className="font-semibold text-gray-900">{safeStringifyModal(nestedValue)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          } else {
            // Simple value
            return (
              <div key={key} className="flex justify-between items-center py-3 px-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <span className="text-gray-600 font-medium">{displayKey}:</span>
                <span className="font-semibold text-gray-900">{safeStringifyModal(value)}</span>
              </div>
            );
          }
        })}
      </div>
    );
  }

  // Helper function to render array data in a user-friendly way
  function renderArrayData(data: any[], title: string): React.ReactNode {
    if (!Array.isArray(data) || data.length === 0) {
      return <div className="text-gray-500 text-center py-4">No items available</div>;
    }

    return (
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 bg-[#2e7d32] rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{index + 1}</span>
              </div>
              <span className="font-semibold text-gray-800">Item {index + 1}</span>
            </div>
            {typeof item === 'object' && item !== null ? (
              <div className="space-y-3">
                {Object.entries(item).map(([key, value]) => {
                  if (key === '_id' || key === '__v') return null;
                  const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                  
                  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    // Nested object in array item
                    return (
                      <div key={key} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-[#2e7d32] rounded-full"></div>
                          {displayKey}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          {Object.entries(value).map(([nestedKey, nestedValue]) => {
                            if (nestedKey === '_id' || nestedKey === '__v') return null;
                            const nestedDisplayKey = nestedKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                            return (
                              <div key={nestedKey} className="flex justify-between items-center py-2 px-3 bg-white rounded border border-gray-100">
                                <span className="text-gray-600 font-medium">{nestedDisplayKey}:</span>
                                <span className="font-semibold text-gray-900">{safeStringifyModal(nestedValue)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  } else {
                    // Simple value in array item
                    return (
                      <div key={key} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-gray-600 font-medium">{displayKey}:</span>
                        <span className="font-semibold text-gray-900">{safeStringifyModal(value)}</span>
                      </div>
                    );
                  }
                })}
              </div>
            ) : (
              <div className="text-gray-800 font-medium bg-gray-50 rounded-lg p-3 border border-gray-200">
                {safeStringifyModal(item)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Group fields by category
  const statusFields: [string, unknown][] = [];
  const basicFields: [string, unknown][] = [];
  const dateFields: [string, unknown][] = [];
  const objectFields: [string, unknown][] = [];
  const arrayFields: [string, unknown][] = [];

  Object.entries(data).forEach(([fieldKey, value]) => {
    if (!shouldDisplayField(fieldKey, value)) return;
    
    if (Array.isArray(value)) {
      arrayFields.push([fieldKey, value]);
    } else if (typeof value === "object" && value !== null) {
      objectFields.push([fieldKey, value]);
    } else if (isStatusField(fieldKey)) {
      statusFields.push([fieldKey, value]);
    } else if (isDateField(fieldKey)) {
      dateFields.push([fieldKey, value]);
    } else {
      basicFields.push([fieldKey, value]);
    }
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#2e7d32] to-[#18281f] px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Item Details</h2>
                <p className="text-green-100 text-sm mt-1">Complete information overview</p>
              </div>
              <button 
                onClick={onClose} 
                className="text-white hover:text-green-200 transition-colors p-2 rounded-lg hover:bg-white/10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 overflow-y-auto max-h-[calc(95vh-140px)]">
            {/* Status Information */}
            {statusFields.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-[#2e7d32] rounded-full"></div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Status Information</h3>
                    <p className="text-sm text-gray-600 mt-1">Current status and state information</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {statusFields.map(([key, value]) => (
                    <div key={key} className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all duration-200">
                      <div className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#2e7d32] rounded-full"></div>
                        {formatFieldName(key)}
                      </div>
                      <div className="text-base">
                        {(() => {
                          const statusData = formatStatusValue(value);
                          return (
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${statusData.style.bg} ${statusData.style.text} ${statusData.style.border}`}>
                              {statusData.style.icon && <span>{statusData.style.icon}</span>}
                              {statusData.text}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Basic Information */}
            {basicFields.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-gray-600 rounded-full"></div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Basic Information</h3>
                    <p className="text-sm text-gray-600 mt-1">Primary data and details</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {basicFields.map(([key, value]) => (
                    <div key={key} className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all duration-200">
                      <div className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                        {formatFieldName(key)}
                      </div>
                      <div className="text-base text-gray-900 font-medium">
                        {formatValue(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Date Information */}
            {dateFields.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-[#2e7d32] rounded-full"></div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Date Information</h3>
                    <p className="text-sm text-gray-600 mt-1">Timeline and date-related data</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dateFields.map(([key, value]) => (
                    <div key={key} className="bg-green-50 rounded-xl p-6 border border-green-200 hover:shadow-md transition-all duration-200">
                      <div className="text-sm font-medium text-green-700 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#2e7d32] rounded-full"></div>
                        {formatFieldName(key)}
                      </div>
                      <div className="text-base text-green-900 font-medium">
                        {formatValue(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Object Data */}
            {objectFields.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-gray-700 rounded-full"></div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Additional Data</h3>
                    <p className="text-sm text-gray-600 mt-1">Extended information and details</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {objectFields.map(([key, value]) => (
                    <div key={key} className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all duration-200">
                      <div className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-700 rounded-full"></div>
                        {formatFieldName(key)}
                      </div>
                      <div className="bg-white rounded-lg border border-gray-200 p-4 max-h-64 overflow-y-auto">
                        {renderNestedData(value, key)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Array Data */}
            {arrayFields.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-[#2e7d32] rounded-full"></div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">List Items</h3>
                    <p className="text-sm text-gray-600 mt-1">Collection of related items</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {arrayFields.map(([key, value]) => (
                    <div key={key} className="bg-green-50 rounded-xl p-6 border border-green-200 hover:shadow-md transition-all duration-200">
                      <div className="text-sm font-medium text-green-700 mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#2e7d32] rounded-full"></div>
                        {formatFieldName(key)} ({Array.isArray(value) ? value.length : 0} items)
                      </div>
                      {Array.isArray(value) && value.length > 0 && (
                        <div className="bg-white rounded-lg border border-green-200 p-4 max-h-64 overflow-y-auto">
                          {renderArrayData(value, key)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No data message */}
            {statusFields.length === 0 && basicFields.length === 0 && dateFields.length === 0 && 
             objectFields.length === 0 && arrayFields.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-gray-500 text-lg font-medium">No details available</div>
                <div className="text-gray-400 text-sm mt-1">This item doesn't have any additional information</div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
            <div className="flex justify-end">
              <Button 
                onClick={onClose}
                className="bg-[#2e7d32] hover:bg-[#18281f] text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
