"use client";
import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Pagination from "@/components/ui/pagination";
import DownloadButton from "@/components/ui/DownloadButton";
import { MdVisibility, MdEdit, MdDelete } from "react-icons/md";
import { useLookup } from "@/lib/hooks/useLookup";

interface DataTableProps {
  data: Array<Record<string, unknown>>;
  loading: boolean;
  error: string | null;
  slug?: string;
  onView: (index: number) => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onFieldUpdate: (index: number, fieldName: string, newValue: string) => void;
  isUpdatingStatus: number | null;
}

export function DataTable({
  data,
  loading,
  error,
  slug,
  onView,
  onEdit,
  onDelete,
  onFieldUpdate,
  isUpdatingStatus
}: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 7;

  const {
    isStatusField,
    formatStatusValue,
    getStatusOptions,
    renderCellValue
  } = useLookup();

  // Get table columns based on data
  const allKeys = useMemo(() => {
    const filterOutIds = (arr: string[]) => arr.filter(k => k !== '_id' && k !== 'id');
    let keys = data[0] ? filterOutIds(Object.keys(data[0])).slice(0, 4) : [];
    if (keys.length === 0 && data.length > 0) {
      return ["value"];
    }
    
    // For orders, ensure status fields are included and prioritized
    if (slug === 'orders' && data[0]) {
      const orderKeys = filterOutIds(Object.keys(data[0]));
      const statusKeys = orderKeys.filter(key => isStatusField(key));
      const nonStatusKeys = orderKeys.filter(key => !isStatusField(key)).slice(0, 3);
      keys = [...statusKeys, ...nonStatusKeys];
    }
    
    return filterOutIds(keys);
  }, [data, slug, isStatusField]);

  // Pagination
  const totalPages = useMemo(() => Math.max(1, Math.ceil(data.length / PAGE_SIZE)), [data.length]);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return data.slice(start, start + PAGE_SIZE);
  }, [data, currentPage]);

  // Helper function to render cell value with JSX
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

  if (loading) {
    return (
      <div className="overflow-x-auto bg-white rounded shadow">
        <div className="p-6">
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overflow-x-auto bg-white rounded shadow">
        <div className="p-6 text-center text-red-500">{error}</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="overflow-x-auto bg-white rounded shadow">
        <div className="p-6 text-center text-gray-500">No data found.</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded shadow">
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
          {data.length > 0 && allKeys.length > 0 && Object.keys(data[0]).length === 0 ? (
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
                            onChange={(e) => onFieldUpdate(globalIdx, key, e.target.value)}
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
                        onClick={() => onView(globalIdx)}
                        title="View details"
                        size="icon"
                      >
                        <MdVisibility className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => onEdit(globalIdx)}
                        title="Edit"
                        size="icon"
                      >
                        <MdEdit className="w-4 h-4" />
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
                              onFieldUpdate(globalIdx, statusField, nextStatus);
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
                        onClick={() => onDelete(globalIdx)}
                        title="Delete"
                        size="icon"
                        variant="destructive"
                      >
                        <MdDelete className="w-4 h-4" />
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
    </div>
  );
}
