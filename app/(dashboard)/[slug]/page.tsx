"use client";
import {  useState, useMemo, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
import DownloadButton from "@/components/ui/DownloadButton";
import Pagination from "@/components/ui/pagination";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useLookup } from "@/lib/hooks/useLookup";

import Link from "next/link";



function renderObjectBFS(value: unknown): React.ReactNode {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' 
      ? String(value) : <span className="text-gray-400">-</span>;
  }
  
  const obj = value as Record<string, unknown>;
  const entries = Object.entries(obj).filter(([k, v]) => 
    k !== '_id' && k !== '__v' && k !== 'createdAt' && k !== 'updatedAt' && 
    v !== null && v !== undefined && v !== ''
  );
  
  if (entries.length === 0) return <span className="text-gray-400">No data</span>;
  
  // Helper function to safely convert value to string
  const safeStringify = (val: unknown): string => {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
      return String(val);
    }
    if (typeof val === 'object' && !Array.isArray(val)) {
      const nestedObj = val as Record<string, unknown>;
      const nestedKeys = Object.keys(nestedObj).filter(k => k !== '_id' && k !== '__v');
      if (nestedKeys.length > 0) {
        return safeStringify(nestedObj[nestedKeys[0]]);
      }
      return 'Object';
    }
    if (Array.isArray(val)) {
      if (val.length === 0) return 'Empty Array';
      if (val.length === 1) {
        // For single item arrays, show the item content
        return safeStringify(val[0]);
      }
      // For multiple items, show first item with count
      return `${safeStringify(val[0])} (+${val.length - 1} more)`;
    }
    return String(val);
  };
  
  // If only 1-2 entries, show them in a compact format
  if (entries.length <= 2) {
    return (
      <div className="text-sm">
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-center gap-1">
            <span className="text-gray-600 text-xs">{k}:</span>
            <span className="font-medium">{safeStringify(v)}</span>
          </div>
        ))}
      </div>
    );
  }
  
  // For more entries, show the first meaningful value
  const [firstKey, firstValue] = entries[0];
  return <span title={firstKey} className="text-sm">{safeStringify(firstValue)}</span>;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 text-gray-600 hover:text-gray-800 text-2xl bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md">&times;</button>
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

export default function SlugPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  let slug = params.slug as string | undefined;
  if (Array.isArray(slug)) slug = slug[0];
  const { showAlert } = useAlert();
  const [viewIdx, setViewIdx] = useState<number | null>(null);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [postCreatePrompt, setPostCreatePrompt] = useState<null | { type: 'customer' | 'measurement' | 'order', id?: string }>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; idx?: number }>(() => ({ open: false }));
  const hasAutoOpenedRef = useRef(false);
  
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
  } = useLookup({ data: [], selfEntityName: slug }); // Initialize with empty array

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
      if (slug === 'measurements') {
        setPostCreatePrompt({ type: 'measurement' });
      } else if (slug === 'customers') {
        setPostCreatePrompt({ type: 'customer' });
      }
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

  // Client-side pagination for non-orders tables
  const PAGE_SIZE = 7;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE)), [filteredOrders.length]);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, currentPage]);
  useEffect(() => { setCurrentPage(1); }, [slug, filteredOrders.length]);
  // Auto open order form when /orders?open=1
  useEffect(() => {
    if (slug === 'orders') {
      const shouldOpen = searchParams?.get('open') === '1';
      if (shouldOpen && !addOpen && !hasAutoOpenedRef.current) {
        hasAutoOpenedRef.current = true;
        setAddOpen(true);
      }
    }
    // Intentionally avoid adding searchParams to deps to prevent re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, addOpen]);


  const allKeys = useMemo(() => {
    const filterOutIds = (arr: string[]) => arr.filter(k => k !== '_id' && k !== 'id');
    let keys = apiResponse[0] ? filterOutIds(Object.keys(apiResponse[0])).slice(0, 4) : [];
    if (keys.length === 0 && apiResponse.length > 0) {
      return ["value"];
    }
    
    // For orders, ensure status fields are included and prioritized
    if (slug === 'orders' && apiResponse[0]) {
      const orderKeys = filterOutIds(Object.keys(apiResponse[0]));
      const statusKeys = orderKeys.filter(key => isStatusField(key));
      const nonStatusKeys = orderKeys.filter(key => !isStatusField(key)).slice(0, 3);
      keys = [...statusKeys, ...nonStatusKeys];
    }
    
    return filterOutIds(keys);
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
    
    // Handle objects - show first key value instead of "Object"
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>;
      const keys = Object.keys(obj).filter(k => k !== '_id' && k !== '__v' && k !== 'createdAt' && k !== 'updatedAt');
      
      if (keys.length === 0) {
        return <span className="text-gray-400">-</span>;
      }
      
      // Get the first meaningful key and its value
      const firstKey = keys[0];
      const firstValue = obj[firstKey];
      
      // Helper function to safely convert value to string
      const safeStringify = (val: unknown): string => {
        if (val === null || val === undefined) return '-';
        if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
          return String(val);
        }
        if (typeof val === 'object' && !Array.isArray(val)) {
          // For nested objects, try to get the first meaningful value
          const nestedObj = val as Record<string, unknown>;
          const nestedKeys = Object.keys(nestedObj).filter(k => k !== '_id' && k !== '__v');
          if (nestedKeys.length > 0) {
            return safeStringify(nestedObj[nestedKeys[0]]);
          }
          return 'Object';
        }
        if (Array.isArray(val)) {
          if (val.length === 0) return 'Empty Array';
          if (val.length === 1) {
            // For single item arrays, show the item content
            return safeStringify(val[0]);
          }
          // For multiple items, show first item with count
          return `${safeStringify(val[0])} (+${val.length - 1} more)`;
        }
        return String(val);
      };
      
      // If the first value is also an object, try to get its first key
      if (typeof firstValue === "object" && firstValue !== null && !Array.isArray(firstValue)) {
        const nestedObj = firstValue as Record<string, unknown>;
        const nestedKeys = Object.keys(nestedObj).filter(k => k !== '_id' && k !== '__v');
        if (nestedKeys.length > 0) {
          const nestedValue = nestedObj[nestedKeys[0]];
          return <span title={`${firstKey}.${nestedKeys[0]}`}>{safeStringify(nestedValue)}</span>;
        }
      }
      
      // Return the first value with a tooltip showing the key
      return <span title={firstKey}>{safeStringify(firstValue)}</span>;
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
          onSuccess={() => { 
            setAddOpen(false); 
            setPostCreatePrompt({ type: 'order' }); 
            // Clean query param after success
            if (searchParams?.get('open') === '1') router.replace('/orders');
          }}
          onCancel={() => {
            hasAutoOpenedRef.current = true; // prevent auto-reopen
            setAddOpen(false);
            if (searchParams?.get('open') === '1') router.replace('/orders');
          }}
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
                  setConfirmDelete({ open: true, idx: orderIndex });
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
           <>
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
                  paginatedRows.map((row, idx) => {
                    const globalIdx = (currentPage - 1) * PAGE_SIZE + idx;
                    return (
                    <TableRow
                      key={globalIdx}
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
                                onChange={(e) => handleFieldUpdate(globalIdx, key, e.target.value)}
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
                          {slug === 'invoices' && (
                            <DownloadButton id={String((row as any)?._id || '')} label="Download" />
                          )}
                          <Button
                            onClick={() => setViewIdx(globalIdx)}
                            title="View details"
                            size="icon"
                          >
                            <MdVisibility className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => setEditIdx(globalIdx)}
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
                                  handleFieldUpdate(globalIdx, statusField, nextStatus);
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
                            onClick={() => setConfirmDelete({ open: true, idx: globalIdx })}
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
                  );
                })
                )}
              </TableBody>
            </Table>
            {/* Pagination Controls */}
            {slug !== 'orders' && totalPages > 1 && (
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            )}
            </>
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
              currentEntity={slug}
            />
          )}
        </Modal>
      )}
      <ConfirmDialog
        open={confirmDelete.open}
        title="Delete item?"
        message="Are you sure you want to delete this item? This action cannot be undone."
        primaryLabel="Delete"
        danger
        onSecondary={() => setConfirmDelete({ open: false })}
        onPrimary={() => {
          if (confirmDelete.idx !== undefined && confirmDelete.idx !== null) {
            handleDelete(confirmDelete.idx);
          }
          setConfirmDelete({ open: false });
        }}
      />
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
            currentEntity={slug}
          />
        </Modal>
      )}
      {/* Post-create prompts */}
      <ConfirmDialog
        open={postCreatePrompt?.type === 'measurement'}
        title="Measurement created"
        description="Proceed to create an order?"
        secondaryLabel="Close"
        primaryLabel="Go to Orders"
        onSecondary={() => setPostCreatePrompt(null)}
        onPrimary={() => { setPostCreatePrompt(null); router.push('/orders?open=1'); }}
      />
      <ConfirmDialog
        open={postCreatePrompt?.type === 'customer'}
        title="Customer created"
        description="Proceed to create a measurement?"
        secondaryLabel="Close"
        primaryLabel="Go to Measurements"
        onSecondary={() => setPostCreatePrompt(null)}
        onPrimary={() => { setPostCreatePrompt(null); router.push('/measurements?open=1'); }}
      />
      <ConfirmDialog
        open={postCreatePrompt?.type === 'order'}
        title="Order created successfully"
        description="You can review and download the invoice from the invoices page."
        secondaryLabel="Stay"
        primaryLabel="Go to Invoices"
        onSecondary={() => setPostCreatePrompt(null)}
        onPrimary={() => { setPostCreatePrompt(null); router.push('/invoices'); }}
      />
  
  
    </div>
  );
}