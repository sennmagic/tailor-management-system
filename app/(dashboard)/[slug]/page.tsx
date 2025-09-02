"use client";
import {  useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { fetchAPI, useAPI, useAPIMutation } from "@/lib/apiService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAlert } from "@/components/ui/alertProvider";
import { MdVisibility, MdEdit, MdDelete, MdDownload } from "react-icons/md";
import { Button } from "@/components/ui/button";

import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { DynamicForm } from "@/components/Forms/DynamicFom";
import OrderFormWithErrorBoundary from "@/components/ui/orderForm";
import { OrderTable } from "@/components/ui/orderTable";
import { useLookup } from "@/lib/hooks/useLookup";

import Link from "next/link";


function analyzeBFS(obj: any): { keys: string[], type: string } | null {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return null;

  const queue = [obj];
  const visited = new Set();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);

    const keys = Object.keys(current).filter(
      (k) => k !== "_id" && k !== "__v" && k !== "createdAt" && k !== "updatedAt"
    );

    // ✅ Dynamic value-unit (any numeric + unit-like key)
    const numericKey = keys.find(
      (k) => typeof current[k] === "number" || !isNaN(Number(current[k]))
    );
    const unitKey = keys.find(
      (k) =>
        k.toLowerCase().includes("unit") ||
        k.toLowerCase().includes("currency") ||
        k.toLowerCase().includes("symbol")
    );
    if (numericKey && unitKey) {
      return { keys: [numericKey, unitKey], type: "value-unit" };
    }

    // Dynamic name-code
    const nameKey = keys.find((k) => k.toLowerCase().includes("name"));
    const codeKey = keys.find(
      (k) => k.toLowerCase().includes("code") || k.toLowerCase().includes("number")
    );
    if (nameKey && codeKey) {
      return { keys: [nameKey, codeKey], type: "name-code" };
    }

    // Dynamic display name
    const displayKey = keys.find((k) =>
      ["name", "displayname", "title", "label"].some((d) => d === k.toLowerCase())
    );
    if (displayKey) {
      return { keys: [displayKey], type: "display-name" };
    }

    // BFS nested objects
    keys.forEach((key) => {
      const value = current[key];
      if (value && typeof value === "object" && !Array.isArray(value)) {
        queue.push(value);
      }
    });
  }

  return null;
}

function renderObjectBFS(value: unknown): React.ReactNode {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' 
      ? String(value) : <span className="text-gray-400">-</span>;
  }
  
  const obj = value as Record<string, unknown>;
  const pattern = analyzeBFS(obj);
  
  if (!pattern) {
    const entries = Object.entries(obj).filter(([k, v]) => 
      k !== '_id' && k !== '__v' && v !== null && v !== undefined && v !== ''
    );
    
    if (entries.length === 0) return <span className="text-gray-400">No data</span>;
    if (entries.length <= 2) {
      return (
        <div className="text-sm">
          {entries.map(([k, v]) => (
            <div key={k} className="flex items-center gap-1">
              <span className="text-gray-600 text-xs">{k}:</span>
              <span className="font-medium">{String(v)}</span>
            </div>
          ))}
        </div>
      );
    }
    return <span className="text-gray-400">Object</span>;
  }
  
  switch (pattern.type) {
    case 'value-unit':
      const val = obj[pattern.keys[0]];
      const unit = obj[pattern.keys[1]];
      return val !== null && val !== undefined && unit ? (
        <span className="flex items-center gap-1">
          <span className="font-medium">{String(val)}</span>
          <span className="text-gray-500 text-xs">{String(unit)}</span>
        </span>
      ) : <span className="text-gray-400">-</span>;
    
    case 'name-code':
      const parts = pattern.keys.map(key => obj[key]).filter(Boolean);
      return parts.length > 0 ? (
        <span>{parts.join(' - ')}</span>
      ) : <span className="text-gray-400">-</span>;
    
    case 'display-name':
      const displayValue = obj[pattern.keys[0]];
      return displayValue ? <span>{String(displayValue)}</span> : <span className="text-gray-400">-</span>;
    
    default:
      return <span className="text-gray-400">Object</span>;
  }
}



function Modal({ open, onClose, children, isFullScreen = false }: { open: boolean; onClose: () => void; children: React.ReactNode; isFullScreen?: boolean }) {
  if (!open) return null;
  
  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40">
        {children}
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="rounded-2xl shadow-lg max-w-lg w-full p-6 relative bg-white/95">
        <button onClick={onClose} className="absolute top-2 right-4 text-gray-800 hover:text-black text-2xl">&times;</button>
        {children}
      </div>
    </div>
  );
}



function ViewDetailsModal({ 
  data, 
  open, 
  onClose 
}: { 
  data: Record<string, unknown> | null, 
  open: boolean, 
  onClose: () => void 
}) {
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

 
  function renderNestedData(data: any, title: string): React.ReactNode {
    if (!data || typeof data !== 'object') {
      return <div className="text-gray-500">No data available</div>;
    }

    const entries = Object.entries(data);
    if (entries.length === 0) {
      return <div className="text-gray-500">No data available</div>;
    }

    return (
      <div className="space-y-3">
        {entries.map(([key, value]) => {
          if (key === '_id' || key === '__v' || key === 'createdAt' || key === 'updatedAt' || key === 'isDeleted') {
            return null; // Skip internal fields
          }

          const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Nested object - show key-value pairs
            const nestedEntries = Object.entries(value);
            return (
              <div key={key} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="font-medium text-gray-700 mb-2">{displayKey}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {nestedEntries.map(([nestedKey, nestedValue]) => {
                    if (nestedKey === '_id' || nestedKey === '__v') return null;
                    const nestedDisplayKey = nestedKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    return (
                      <div key={nestedKey} className="flex justify-between">
                        <span className="text-gray-600">{nestedDisplayKey}:</span>
                        <span className="font-medium">{String(nestedValue)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          } else {
            // Simple value
            return (
              <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{displayKey}</span>
                <span className="font-medium">{String(value)}</span>
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
      return <div className="text-gray-500">No items available</div>;
    }

    return (
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="font-medium text-gray-700">Item {index + 1}</span>
            </div>
            {typeof item === 'object' && item !== null ? (
              <div className="space-y-2">
                {Object.entries(item).map(([key, value]) => {
                  if (key === '_id' || key === '__v') return null;
                  const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                  
                  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    // Nested object in array item
                    return (
                      <div key={key} className="border border-gray-100 rounded p-2 bg-gray-50">
                        <div className="font-medium text-gray-600 mb-1">{displayKey}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm">
                          {Object.entries(value).map(([nestedKey, nestedValue]) => {
                            if (nestedKey === '_id' || nestedKey === '__v') return null;
                            const nestedDisplayKey = nestedKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                            return (
                              <div key={nestedKey} className="flex justify-between">
                                <span className="text-gray-500">{nestedDisplayKey}:</span>
                                <span className="font-medium">{String(nestedValue)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  } else {
                    // Simple value in array item
                    return (
                      <div key={key} className="flex justify-between items-center py-1">
                        <span className="text-gray-600">{displayKey}</span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    );
                  }
                })}
              </div>
            ) : (
              <div className="text-gray-700">{String(item)}</div>
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
    <div className="fixed inset-0 z-50 px-6 py-6 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-green-700 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-900">Item Details</h2>
        <button 
          onClick={onClose} 
          className="text-white hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-8 overflow-y-auto h-[calc(100vh-120px)]">
        {/* Status Information */}
        {statusFields.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Status Information</h3>
                <p className="text-sm text-gray-600 mt-1">Current status and state information</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {statusFields.map(([key, value]) => (
                <div key={key} className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl p-6 border border-indigo-200 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="text-sm font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"></div>
                    {formatFieldName(key)}
                  </div>
                  <div className="text-base">
                    {(() => {
                      const statusData = formatStatusValue(value);
                      return (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusData.style.bg} ${statusData.style.text} ${statusData.style.border}`}>
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
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
              <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {basicFields.map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200">
                  <div className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    {formatFieldName(key)}
                  </div>
                  <div className="text-base text-gray-900">
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
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-green-500 rounded-full"></div>
              <h3 className="text-lg font-semibold text-gray-800">Date Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dateFields.map(([key, value]) => (
                <div key={key} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100 hover:bg-green-100 transition-colors duration-200">
                  <div className="text-sm font-medium text-green-700 mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
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
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
              <h3 className="text-lg font-semibold text-gray-800">Additional Data</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {objectFields.map(([key, value]) => (
                <div key={key} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100 hover:bg-purple-100 transition-colors duration-200">
                  <div className="text-sm font-medium text-purple-700 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    {formatFieldName(key)}
                  </div>
                  <div className="bg-white rounded border border-purple-200 p-3 shadow-sm max-h-64 overflow-y-auto">
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
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
              <h3 className="text-lg font-semibold text-gray-800">List Items</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {arrayFields.map(([key, value]) => (
                <div key={key} className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-100 hover:bg-orange-100 transition-colors duration-200">
                  <div className="text-sm font-medium text-orange-700 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    {formatFieldName(key)} ({Array.isArray(value) ? value.length : 0} items)
                  </div>
                  {Array.isArray(value) && value.length > 0 && (
                    <div className="bg-white rounded border border-orange-200 p-3 shadow-sm max-h-64 overflow-y-auto">
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
          <div className="text-center py-8">
            <div className="text-gray-400 text-lg">No details available</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end p-6 border-t border-gray-200 bg-white shadow-sm">
        <Button 
          onClick={onClose}
          variant="outline"
          className="px-6"
        >
          Close
        </Button>
      </div>
    </div>
  );
}

export default function SlugPage() {
  const params = useParams();
  let slug = params.slug as string | undefined;
  if (Array.isArray(slug)) slug = slug[0];
  const { showAlert } = useAlert();
  const [viewIdx, setViewIdx] = useState<number | null>(null);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  
  // Loading states for actions
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<number | null>(null);
  const [invoicePreview, setInvoicePreview] = useState<{ url: string; customerId: string; statusData?: any } | null>(null);

  // React Query hooks
  const { data: apiData, error, isLoading, refetch } = useAPI({
    endpoint: slug || '',
    method: 'GET',
    enabled: !!slug,
   
  });

  // Use the unified lookup hook first
  const {
    extractDataArray,
    isStatusField,
    getStatusOptions,
    formatStatusValue,
    renderCellValue,
    filterSubmitFields,
    getEmptyFormData
  } = useLookup({ data: [] }); // Initialize with empty array

  // Extract data array from API response
  const apiResponse = useMemo(() => {
    if (!apiData) return [];
    return extractDataArray(apiData);
  }, [apiData, extractDataArray]);

  // Mutation hooks for CRUD operations
  const createMutation = useAPIMutation({
    endpoint: slug || '',
    method: 'POST',
    onSuccess: () => {
      showAlert("Created successfully!", "success");
      refetch();
    },
    onError: (error) => {
      showAlert(`Failed to create: ${error}`, "destructive");
    },
  });



  const patchMutation = useAPIMutation({
    endpoint: slug || '',
    method: 'PATCH',
    onSuccess: () => {
      showAlert("Update successful!", "success");
      refetch();
    },
    onError: (error) => {
      showAlert(`Failed to update: ${error}`, "destructive");
    },
  });

  const deleteMutation = useAPIMutation({
    endpoint: slug || '',
    method: 'DELETE',
    onSuccess: () => {
      showAlert("Deleted successfully!", "success");
      refetch();
    },
    onError: (error) => {
      showAlert(`Failed to delete: ${error}`, "destructive");
    },
  });

  const statusUpdateMutation = useAPIMutation({
    endpoint: slug || '',
    method: 'PUT',
    onSuccess: () => {
      showAlert("Status updated successfully!", "success");
      refetch();
    },
    onError: (error) => {
      showAlert(`Failed to update status: ${error}`, "destructive");
    },
  });
  
  const [testFormOpen, setTestFormOpen] = useState(false);
 



  // Use apiResponse directly since we removed status filtering
  const filteredOrders = useMemo(() => {
    return apiResponse;
  }, [apiResponse]);

  const allKeys = useMemo(() => {
    let keys = apiResponse[0] ? Object.keys(apiResponse[0]).slice(0, 4) : [];
    if (keys.length === 0 && apiResponse.length > 0) {
      return ["value"];
    }
    
    // For orders, ensure status fields are included and prioritized
    if (slug === 'orders' && apiResponse[0]) {
      const orderKeys = Object.keys(apiResponse[0]);
      const statusKeys = orderKeys.filter(key => isStatusField(key));
      const nonStatusKeys = orderKeys.filter(key => !isStatusField(key)).slice(0, 3);
      keys = [...statusKeys, ...nonStatusKeys];
    }
    
    return keys;
  }, [apiResponse, slug]);









  // Helper function to render cell value with JSX (using hook's renderCellValue as base)
  function renderCellValueWithJSX(value: unknown, fieldName?: string) {
    const cellText = renderCellValue(value, fieldName);
    
    if (value == null) return <span className="text-gray-400">-</span>;
    
    // If this is a status field, render it with a badge
    if (fieldName && isStatusField(fieldName)) {
      const statusData = formatStatusValue(value);
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusData.style.bg} ${statusData.style.text} ${statusData.style.border}`}>
          {statusData.style.icon && <span>{statusData.style.icon}</span>}
          {statusData.text}
        </span>
      );
    }
    
     if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return renderObjectBFS(value);
  }
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    if (typeof value === "object" && value && Object.keys(value).length === 0) {
      return <span className="text-gray-400">{'{}'}</span>;
    }
    return <span className="text-gray-400">-</span>;
  }

  // React Query based API operations
  const handleCreate = async (data: Record<string, unknown>) => {
    const filteredData = filterSubmitFields(data);
    await createMutation.mutateAsync(filteredData);
    setAddOpen(false);
  };

  const handleUpdate = async (data: Record<string, unknown>, idx: number) => {
    const itemToEdit = apiResponse[idx];
    const editId = itemToEdit?._id as string;
    const filteredData = filterSubmitFields(data);
    
    if (!editId) {
      showAlert("Item ID not found for update", "destructive");
      return;
    }
    
    console.log('🔄 Updating item:', { editId, filteredData, slug });
    
    // Use fetchAPI directly to include ID in URL
    const result = await fetchAPI({
      endpoint: slug || '',
      method: 'PUT',
      id: editId,
      data: filteredData,
      withAuth: true
    });
    
    if (result.error) {
      showAlert(`Failed to update: ${result.error}`, "destructive");
    } else {
      showAlert("Update successful!", "success");
      refetch();
      setEditIdx(null);
    }
  };

  const handleDelete = async (idx: number) => {
    const itemToDelete = apiResponse[idx];
    const deleteId = itemToDelete?._id as string;
    
    if (!deleteId) {
      showAlert("Item ID not found for deletion", "destructive");
      return;
    }
    
    
    // Use fetchAPI directly to include ID in URL
    const result = await fetchAPI({
      endpoint: slug || '',
      method: 'DELETE',
      id: deleteId,
      withAuth: true
    });
    
    if (result.error) {
      showAlert(`Failed to delete: ${result.error}`, "destructive");
    } else {
      showAlert("Deleted successfully!", "success");
      refetch();
      setDeleteIdx(null);
    }
  };

  const handleStatusUpdate = async (idx: number, fieldName: string, newValue: string) => {
    const itemToUpdate = apiResponse[idx];
    const statusId = itemToUpdate?._id as string;
    
    if (!statusId) {
      showAlert("Item ID not found for status update", "destructive");
      return;
    }
    
    
    // Use PATCH for orders, PUT for other entities
    const method = slug === 'orders' ? 'PATCH' : 'PUT';
    
    // Use fetchAPI directly to include ID in URL
    const result = await fetchAPI({
      endpoint: slug || '',
      method: method,
      id: statusId,
      data: { [fieldName]: newValue },
      withAuth: true
    });
    
    if (result.error) {
      showAlert(`Failed to update status: ${result.error}`, "destructive");
    } else {
      showAlert("Status updated successfully!", "success");
      refetch();
    }
  };

  const handleFieldUpdate = async (idx: number, fieldName: string, newValue: string) => {
    const itemToUpdate = apiResponse[idx];
    const fieldId = itemToUpdate?._id as string;
    
    if (!fieldId) {
      showAlert("Item ID not found for field update", "destructive");
      return;
    }
    
    console.log('🔄 Updating field:', { fieldId, fieldName, newValue, slug });
    
    // Use PATCH for orders, PUT for other entities
    const method = slug === 'orders' ? 'PATCH' : 'PUT';
    
    // Use fetchAPI directly to include ID in URL
    const result = await fetchAPI({
      endpoint: slug || '',
      method: method,
      id: fieldId,
      data: { [fieldName]: newValue },
      withAuth: true
    });
    
    if (result.error) {
      showAlert(`Failed to update field: ${result.error}`, "destructive");
    } else {
      showAlert("Field updated successfully!", "success");
      refetch();
    }
  };

  return (
    <div>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {slug && (
            <BreadcrumbItem>
              <BreadcrumbPage>
                {slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
              </BreadcrumbPage>
            </BreadcrumbItem>
          )}
        </BreadcrumbList>
      </Breadcrumb>
      

      
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">
          {slug === 'orders' ? 'Orders Management' : (slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : 'Item')}
        </h1>
        <div className="flex gap-2">
      
          <Button
            onClick={() => setAddOpen(true)}
            disabled={isAdding}
          >
            {isAdding ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Adding...
              </div>
            ) : (
              slug === 'orders' ? '+ Create Order' : `+ Add ${slug ?? 'Item'}`
            )}
          </Button>
        </div>
      </div>
      
      {/* Show OrderForm when addOpen is true for orders */}
      {slug === 'orders' && addOpen && (
        <OrderFormWithErrorBoundary 
          onSuccess={() => setAddOpen(false)}
          onCancel={() => setAddOpen(false)}
          mode="create"
        />
      )}
      
      {/* Status filter buttons for orders */}

      
      {/* Use improved OrderTable for orders page, regular table for other pages */}
      {!addOpen && (
        <>
          {slug === 'orders' ? (
            <OrderTable
              orders={apiResponse as any[]}
              loading={isLoading}
              onEdit={(order) => {
                // Convert order to the format expected by the existing edit functionality
                const orderIndex = apiResponse.findIndex(item => item._id === order._id);
                if (orderIndex !== -1) {
                  setEditIdx(orderIndex);
                }
              }}
              onView={(order) => {
                const orderIndex = apiResponse.findIndex(item => item._id === order._id);
                if (orderIndex !== -1) {
                  setViewIdx(orderIndex);
                }
              }}
              onDelete={(orderId) => {
                const orderIndex = apiResponse.findIndex(item => item._id === orderId);
                if (orderIndex !== -1) {
                  handleDelete(orderIndex);
                }
              }}
              onStatusChange={(orderId, status, field) => {
                const orderIndex = apiResponse.findIndex(item => item._id === orderId);
                if (orderIndex !== -1) {
                  handleFieldUpdate(orderIndex, field, status);
                }
              }}
            />
          ) : (
        <div className="overflow-x-auto bg-white rounded shadow">
          {isLoading ? (
            <div className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">{error}</div>
          ) : filteredOrders.length === 0 ? (
             <div className="p-6 text-center text-gray-500">
               No data found.
             </div>
           ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {allKeys.map((key) => (
                    <TableHead key={key}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</TableHead>
                  ))}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiResponse.length > 0 && allKeys.length > 0 && Object.keys(apiResponse[0]).length === 0 ? (
                  <TableRow>
                    {allKeys.map((key) => (
                      <TableCell key={key}>
                        <span className="text-gray-400">{'{}'}</span>
                      </TableCell>
                    ))}
                    <TableCell />
                  </TableRow>
                ) : (
                  filteredOrders.map((row, idx) => (
                    <TableRow
                      key={idx}
                      className="hover:bg-blue-50 transition"
                    >
                      {allKeys.map((key) => (
                        <TableCell key={key}>
                          {isStatusField(key) ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                {(() => {
                                  const statusData = formatStatusValue(row[key]);
                                  return (
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusData.style.bg} ${statusData.style.text} ${statusData.style.border}`}>
                                      {statusData.style.icon && <span>{statusData.style.icon}</span>}
                                      {statusData.text}
                                    </span>
                                  );
                                })()}
                              </div>
                              <select
                                value={String(row[key] || '')}
                                onChange={(e) => handleFieldUpdate(idx, key, e.target.value)}
                                disabled={isUpdatingStatus === idx}
                                className="text-xs px-2 py-1 border border-gray-300 rounded bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-w-24"
                                title={`Change ${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}`}
                              >
                                <option value="">Select Status</option>
                                {getStatusOptions(key).map((status: string) => (
                                  <option key={status} value={status}>
                                    {status.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                  </option>
                                ))}
                              </select>
                              {isUpdatingStatus === idx && (
                                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                              )}
                            </div>
                          ) : (
                            renderCellValueWithJSX(row[key], key)
                          )}
                        </TableCell>
                      ))}
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setViewIdx(idx)}
                            title="View details"
                            size="icon"
                          >
                            <MdVisibility className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => setEditIdx(idx)}
                            title="Edit"
                            size="icon"
                            disabled={patchMutation.isLoading}
                          >
                                                          {patchMutation.isLoading && editIdx === idx ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <MdEdit className="w-4 h-4" />
                            )}
                          </Button>
                          {slug === 'orders' && (
                            <Button
                              onClick={() => {
                                // Find the first status field and update it
                                const statusField = allKeys.find(key => isStatusField(key));
                                if (statusField) {
                                  const currentStatus = String(row[statusField] || '');
                                  const options = getStatusOptions(statusField);
                                  const currentIndex = options.indexOf(currentStatus);
                                  const nextStatus = options[(currentIndex + 1) % options.length];
                                  handleFieldUpdate(idx, statusField, nextStatus);
                                }
                              }}
                              title="Quick Status Change"
                              size="icon"
                              disabled={isUpdatingStatus === idx}
                            >
                              {isUpdatingStatus === idx ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              )}
                            </Button>
                          )}
                          <Button
                            onClick={() => setDeleteIdx(idx)}
                            title="Delete"
                            size="icon"
                            variant="destructive"
                            disabled={isDeleting === idx}
                          >
                            {isDeleting === idx ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <MdDelete className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
          )}
        </>
      )}
      <ViewDetailsModal 
        data={viewIdx !== null ? apiResponse[viewIdx] : null}
        open={viewIdx !== null}
        onClose={() => setViewIdx(null)}
      />
      {/* Edit Modal - Use OrderForm for orders, DynamicForm for others */}
      {slug === 'orders' ? (
        editIdx !== null && (
                          <OrderFormWithErrorBoundary
                  initialData={apiResponse[editIdx]}
                  onSuccess={() => setEditIdx(null)}
                  onCancel={() => setEditIdx(null)}
                  mode="edit"
                />
        )
      ) : (
        <Modal open={editIdx !== null} onClose={() => setEditIdx(null)} isFullScreen={true}>
          {editIdx !== null && (
            <DynamicForm
              data={apiResponse[editIdx]}
              onSubmit={async (values) => {
                await handleUpdate(values, editIdx!);
              }}
              onCancel={() => setEditIdx(null)}
              isLoading={patchMutation.isLoading}
            />
          )}
        </Modal>
      )}
      <Modal open={deleteIdx !== null} onClose={() => setDeleteIdx(null)}>
        <h2 className=" !text-black text-lg font-semibold mb-2 ">Are you sure you want to delete?</h2>
        <div className="flex gap-2 mt-4">
                  <Button 
                    onClick={() => handleDelete(deleteIdx as number)} 
                    variant="destructive"
                    disabled={isDeleting === deleteIdx}
                    className="hover:bg-red-700"
                  >
          {isDeleting === deleteIdx ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Deleting...
            </div>
          ) : (
            'Yes, Delete'
          )}
        </Button>
          <Button 
            variant="outline" 
            onClick={() => setDeleteIdx(null)}
            disabled={isDeleting === deleteIdx}
          >
            Cancel
          </Button>
        </div>
      </Modal>
      {/* Only show dynamic form modal for non-orders pages */}
      {slug !== 'orders' && (
        <Modal open={addOpen} onClose={() => setAddOpen(false)} isFullScreen={true}>
          <DynamicForm
            data={getEmptyFormData(apiResponse, allKeys)}
            onSubmit={async (values) => {
              await handleCreate(values);
            }}
            onCancel={() => setAddOpen(false)}
            isLoading={isAdding}
          />
        </Modal>
      )}
  
  
    </div>
  );
}