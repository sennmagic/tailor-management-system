"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { fetchAPI } from "@/lib/apiService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAlert } from "@/components/ui/alertProvider";
import { MdVisibility, MdEdit, MdDelete, MdDownload } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import Link from "next/link";

// Date picker components
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className=" rounded shadow-lg max-w-lg w-full p-6 relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl">&times;</button>
        {children}
      </div>
    </div>
  );
}

function DynamicForm({ 
  data, 
  onSubmit, 
  onCancel, 
  getConsistentFormTemplate,
  isLoading = false
}: { 
  data: Record<string, unknown>, 
  onSubmit: (values: Record<string, unknown>) => void, 
  onCancel: () => void,
  getConsistentFormTemplate: () => any,
  isLoading?: boolean
}) {
  const [formState, setFormState] = useState<Record<string, unknown>>({ ...data });

  // Dynamic lookup options cache
  const [lookupOptions, setLookupOptions] = useState<Record<string, Array<{ id: string; label: string }>>>({});

  // Helper to infer endpoint from field name
  function inferEndpoint(field: string) {
    // Remove 'Id' suffix and convert to plural endpoint
    const base = field.replace(/Id$/i, "");
    if (!base) return null;
    
    // Convert to lowercase and pluralize
    const endpoint = base.charAt(0).toLowerCase() + base.slice(1);
    return endpoint.endsWith('s') ? endpoint : endpoint + 's';
  }

  // Helper to fetch options for a field
  async function fetchLookupOptions(field: string) {
    const endpoint = inferEndpoint(field);
    if (!endpoint) return;
    
    console.log(`Fetching lookup options for ${field} from ${endpoint}`);
    try {
      const { data: json } = await fetchAPI({ endpoint, method: 'GET' });
      
      // Try to find the array in the response
      const arr = Array.isArray(json) ? json : (json?.data || json?.items || []);
      
      const options = arr.map((item: any) => ({
        id: item._id || item.id,
        label: item.name || item.title || item.label || item.codeNumber || item._id || item.id
      }));
      
      console.log(`Found ${options.length} options for ${field}:`, options);
      setLookupOptions(prev => ({ ...prev, [field]: options }));
    } catch (e) {
      console.error(`Error fetching options for ${field}:`, e);
    }
  }

  // Fetch lookup options for all ID fields on mount
  useEffect(() => {
    Object.keys(data).forEach((key) => {
      if (/Id$/i.test(key) && !lookupOptions[key]) {
        fetchLookupOptions(key);
      }
    });
  }, [data, lookupOptions]);

  // Get the superset template for array fields, memoized to avoid infinite loops
  const arrayTemplates = useMemo(() => {
    const templates: Record<string, any> = {};
    const supersetTemplate = typeof getConsistentFormTemplate === 'function' ? getConsistentFormTemplate() : undefined;
    if (supersetTemplate) {
      Object.entries(supersetTemplate).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
          templates[key] = value[0];
        }
      });
    }
    return templates;
  }, []); // Remove getConsistentFormTemplate from dependencies to prevent infinite loops

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, type, value, checked } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleCheckboxChange(name: string, checked: boolean) {
    setFormState((prev) => ({
      ...prev,
      [name]: checked,
    }));
  }

  // Handle dropdown selection for ID fields
  function handleDropdownChange(fieldName: string, selectedId: string) {
    setFormState((prev) => ({
      ...prev,
      [fieldName]: selectedId,
    }));
  }

  function isDateField(fieldName: string): boolean {
    const lower = fieldName.toLowerCase();
    return lower === 'dob' || lower === 'date';
  }

  // Check if field is an ID field that should show dropdown
  function isIdField(fieldName: string): boolean {
    return /Id$/i.test(fieldName);
  }

  // Check if field is a status field that should show status dropdown
  function isStatusField(fieldName: string): boolean {
    return fieldName.toLowerCase() === 'status';
  }

  // Check if status field exists in the data template
  function hasStatusField(): boolean {
    return Object.keys(data).some(key => key.toLowerCase() === 'status');
  }

  // Get display label for ID field
  function getDisplayLabel(fieldName: string, value: unknown): string {
    if (!value) return `Select ${fieldName.replace(/Id$/i, '').replace(/_/g, ' ').toLowerCase()}`;
    
    const options = lookupOptions[fieldName] || [];
    const option = options.find(opt => opt.id === value);
    return option ? option.label : String(value);
  }



  function formatDateForInput(dateValue: unknown): string {
    if (!dateValue) return '';
    if (typeof dateValue === 'string') {
      // Try to parse and format the date
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      return dateValue;
    }
    return '';
  }

  function renderNestedObject(parentKey: string, value: Record<string, unknown>) {
    return (
      <div key={parentKey} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <label className="font-semibold text-gray-700 text-sm">{parentKey.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
          {Object.entries(value)
            .filter(([k]) => !SKIP_FIELDS.includes(k))
            .map(([subKey, subValue]) => {
              if (typeof subValue === "object" && subValue !== null && !Array.isArray(subValue)) {
                return renderNestedObject(subKey, subValue as Record<string, unknown>);
              }
              return (
                <div key={subKey} className="flex flex-col w-full">
                  <label className="text-xs font-medium text-gray-600 mb-1">{subKey.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</label>
                  {isDateField(subKey) ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "h-14 w-full text-xl px-6 justify-start text-left font-normal focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200",
                            !subValue && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-5 w-5" />
                          {subValue ? formatDateForInput(subValue) : `Select ${subKey.replace(/_/g, " ").toLowerCase()}`}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={subValue ? new Date(subValue as string) : undefined}
                          onSelect={(date: Date | undefined) => {
                            setFormState(prev => ({
                              ...prev,
                              [parentKey]: { ...prev[parentKey] as Record<string, unknown>, [subKey]: date ? date.toISOString().split('T')[0] : '' }
                            }));
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    // Check if this is a lookup field in nested object
                    isIdField(subKey) && lookupOptions[subKey] ? (
                      <select
                        value={subValue === null || subValue === undefined ? "" : String(subValue)}
                        onChange={(e) => {
                          setFormState(prev => ({
                            ...prev,
                            [parentKey]: { ...prev[parentKey] as Record<string, unknown>, [subKey]: e.target.value }
                          }));
                        }}
                        className="h-14 w-full text-xl px-6 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 border border-gray-300 rounded-md bg-white"
                      >
                        <option value="">{`Select ${subKey.replace(/Id$/i, '').replace(/_/g, ' ').toLowerCase()}`}</option>
                        {lookupOptions[subKey].map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : isStatusField(subKey) && hasStatusField() ? (
                      <select
                        value={subValue === null || subValue === undefined ? "" : String(subValue)}
                        onChange={(e) => {
                          setFormState(prev => ({
                            ...prev,
                            [parentKey]: { ...prev[parentKey] as Record<string, unknown>, [subKey]: e.target.value }
                          }));
                        }}
                        className="h-14 w-full text-xl px-6 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 border border-gray-300 rounded-md bg-white"
                      >
                        <option value="">Select Status</option>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    ) : (
                      <Input
                        name={`${parentKey}.${subKey}`}
                        value={
                          subValue === null || subValue === undefined
                            ? ""
                            : typeof subValue === "object"
                              ? (Array.isArray(subValue) && subValue.length === 0) || (Object.keys(subValue).length === 0)
                                ? ""
                                : JSON.stringify(subValue)
                              : String(subValue)
                        }
                        onChange={(e) => {
                          setFormState(prev => ({
                            ...prev,
                            [parentKey]: { ...prev[parentKey] as Record<string, unknown>, [subKey]: e.target.value }
                          }));
                        }}
                        className="h-14 w-full text-xl px-6 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder={`Enter ${subKey.replace(/_/g, " ").toLowerCase()}`}
                      />
                    )
                  )}
                </div>
              );
            })}
        </div>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(formState);
  }

  // Separate fields into different categories for better organization
  const regularFields: [string, unknown][] = [];
  const arrayFields: [string, unknown][] = [];
  const objectFields: [string, unknown][] = [];
  const checkboxFields: [string, unknown][] = [];

  Object.entries(formState)
    .filter(([key]) => !SKIP_FIELDS.includes(key))
    .forEach(([key, value]) => {
      const isCheckbox = key.toLowerCase() === "is" || key.toLowerCase().startsWith("is");
      
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
        arrayFields.push([key, value]);
      } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        objectFields.push([key, value]);
      } else if (isCheckbox || typeof value === "boolean") {
        checkboxFields.push([key, value]);
      } else {
        regularFields.push([key, value]);
      }
    });

  return (
    <form
      onSubmit={handleSubmit}
      className="fixed inset-0 z-[100] w-screen h-screen bg-white p-0 m-0 flex flex-col overflow-auto"
      style={{ borderRadius: 0, boxShadow: 'none', maxWidth: '100vw', minWidth: '100vw', maxHeight: '100vh', minHeight: '100vh' }}
    >
      <div className="mb-6 px-12 pt-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-1">Edit Item</h2>
        <p className="text-gray-500 text-lg">Update the details below to modify this record</p>
      </div>

      {/* Regular Fields Section */}
      {regularFields.length > 0 && (
        <div className="mb-8 px-12">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
            <h3 className="text-xl font-semibold text-gray-800">Basic Information</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
            {regularFields.map(([key, value]) => (
              <div key={key} className="flex flex-col w-full">
                <label className="font-medium mb-2 text-base text-gray-700" htmlFor={key}>
                  {key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                </label>
                {isDateField(key) ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "h-14 w-full text-xl px-6 justify-start text-left font-normal focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200",
                          !value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-5 w-5" />
                        {value ? formatDateForInput(value) : `Select ${key.replace(/_/g, " ").toLowerCase()}`}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={value ? new Date(value as string) : undefined}
                        onSelect={(date: Date | undefined) => {
                          setFormState(prev => ({
                            ...prev,
                            [key]: date ? date.toISOString().split('T')[0] : ''
                          }));
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                ) : typeof value === "string" ? (
                  // Check if this is a lookup field (ends with Id or Item)
                  isIdField(key) && lookupOptions[key] ? (
                    <select
                      name={key}
                      value={value as string}
                      onChange={(e) => handleDropdownChange(key, e.target.value)}
                      className="h-14 w-full text-xl px-6 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 border border-gray-300 rounded-md bg-white"
                    >
                      <option value="">{`Select ${key.replace(/Id$/i, '').replace(/_/g, ' ').toLowerCase()}`}</option>
                      {lookupOptions[key].map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : isStatusField(key) && hasStatusField() ? (
                    <select
                      name={key}
                      value={value as string}
                      onChange={(e) => {
                        setFormState(prev => ({ ...prev, [key]: e.target.value }));
                      }}
                      className="h-14 w-full text-xl px-6 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 border border-gray-300 rounded-md bg-white"
                    >
                      <option value="">Select Status</option>
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  ) : (
                    <Input 
                      name={key} 
                      value={value} 
                      onChange={handleChange} 
                      type="text"
                      className="h-14 w-full text-xl px-6 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder={`Enter ${key.replace(/_/g, " ").toLowerCase()}`}
                    />
                  )
                ) : typeof value === "number" ? (
                  <Input 
                    name={key} 
                    value={value} 
                    onChange={handleChange} 
                    type="number"
                    className="h-14 w-full text-xl px-6 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder={`Enter ${key.replace(/_/g, " ").toLowerCase()}`}
                  />
                ) : (
                  <Input 
                    name={key} 
                    value={JSON.stringify(value)} 
                    onChange={handleChange} 
                    type="text"
                    className="h-14 w-full text-xl px-6 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder={`Enter ${key.replace(/_/g, " ").toLowerCase()}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checkbox Fields Section */}
      {checkboxFields.length > 0 && (
        <div className="mb-8 px-12">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-green-500 rounded-full"></div>
            <h3 className="text-xl font-semibold text-gray-800">Settings & Options</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
            {checkboxFields.map(([key, value]) => (
              <div key={key} className="flex items-center space-x-3 p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer w-full" onClick={() => handleCheckboxChange(key, !value)}>
                <Checkbox
                  checked={!!value}
                  onCheckedChange={(checked) => handleCheckboxChange(key, !!checked)}
                  id={key}
                  className="w-6 h-6"
                />
                <label htmlFor={key} className="text-lg font-medium text-gray-700 cursor-pointer flex-1">
                  {key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Object Fields Section */}
      {objectFields.length > 0 && (
        <div className="mb-8 px-12">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
            <h3 className="text-xl font-semibold text-gray-800">Complex Data</h3>
          </div>
          <div className="space-y-4 w-full">
            {objectFields.map(([key, value]) => 
              renderNestedObject(key, value as Record<string, unknown>)
            )}
          </div>
        </div>
      )}

      {/* Array Fields Section */}
      {Object.keys(arrayTemplates).length > 0 && (
        <div className="mb-8 px-12">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
            <h3 className="text-xl font-semibold text-gray-800">List Items</h3>
          </div>
          <div className="space-y-6 w-full">
            {Object.entries(arrayTemplates).map(([key, template]) => {
              const arr = (formState[key] as Array<Record<string, unknown>>) || [];
              const subKeys = Object.keys(template).filter((k) => k !== "_id");
              if (!subKeys.length) return null;
              return (
                <div key={key} className="border border-gray-200 rounded-lg p-6 w-full">
                  <div className="flex items-center justify-between mb-3">
                    <label className="font-semibold text-gray-700 text-lg">{key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</label>
                    <Button 
                      type="button" 
                      size="lg" 
                      onClick={() => {
                        const newItem = { ...template };
                        Object.keys(newItem).forEach(k => newItem[k] = ""); // clear values
                        const newArr = [...(arr || []), newItem];
                        setFormState(prev => ({ ...prev, [key]: newArr }));
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-lg"
                    >
                      + Add Item
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-200 rounded-lg text-lg shadow-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          {subKeys.map((subKey) => (
                            <th key={subKey} className="border-b border-gray-200 px-4 py-3 text-left font-medium text-gray-700">
                              {subKey.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                            </th>
                          ))}
                          <th className="border-b border-gray-200 px-4 py-3 text-left font-medium text-gray-700 w-20">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {arr.length === 0 ? (
                          <tr><td colSpan={subKeys.length + 1} className="text-center text-gray-400 py-6">No items. Click &quot;+ Add Item&quot; to add.</td></tr>
                        ) : (
                          arr.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              {subKeys.map((subKey) => (
                                <td key={subKey} className="border-b border-gray-100 px-4 py-3">
                                  {isDateField(subKey) ? (
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          className={cn(
                                            "h-20 w-full text-2xl px-12 justify-start text-left font-normal focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200",
                                            !item[subKey] && "text-muted-foreground"
                                          )}
                                        >
                                          <CalendarIcon className="mr-2 h-6 w-6" />
                                          {item[subKey] ? formatDateForInput(item[subKey]) : `Select ${subKey.replace(/_/g, " ").toLowerCase()}`}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                          mode="single"
                                          selected={item[subKey] ? new Date(item[subKey] as string) : undefined}
                                          onSelect={(date: Date | undefined) => {
                                            const newArr = [...(arr as Array<Record<string, unknown>>)]
                                            newArr[idx][subKey] = date ? date.toISOString().split('T')[0] : '';
                                            setFormState(prev => ({ ...prev, [key]: newArr }));
                                          }}
                                          initialFocus
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  ) : (
                                    // Check if this is a lookup field in array table
                                    isIdField(subKey) && lookupOptions[subKey] ? (
                                      <select
                                        value={item[subKey] === null || item[subKey] === undefined ? "" : String(item[subKey])}
                                        onChange={e => {
                                          const newArr = [...(arr as Array<Record<string, unknown>>)]
                                          newArr[idx][subKey] = e.target.value;
                                          setFormState(prev => ({ ...prev, [key]: newArr }));
                                        }}
                                        className="h-20 w-full text-2xl px-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 border border-gray-300 rounded-md bg-white"
                                      >
                                        <option value="">{`Select ${subKey.replace(/Id$/i, '').replace(/_/g, ' ').toLowerCase()}`}</option>
                                        {lookupOptions[subKey].map((option) => (
                                          <option key={option.id} value={option.id}>
                                            {option.label}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <Input
                                        value={
                                          item[subKey] === null || item[subKey] === undefined
                                            ? ""
                                            : typeof item[subKey] === "object"
                                              ? (Array.isArray(item[subKey]) && item[subKey].length === 0) || (Object.keys(item[subKey]).length === 0)
                                                ? ""
                                                : JSON.stringify(item[subKey])
                                              : String(item[subKey])
                                        }
                                        onChange={e => {
                                          const newArr = [...(arr as Array<Record<string, unknown>>)]
                                          newArr[idx][subKey] = e.target.value;
                                          setFormState(prev => ({ ...prev, [key]: newArr }));
                                        }}
                                        className="h-20 w-full text-2xl px-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                        placeholder={`Enter ${subKey.replace(/_/g, " ").toLowerCase()}`}
                                      />
                                    )
                                  )}
                                </td>
                              ))}
                              <td className="border-b border-gray-100 px-4 py-3">
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="lg"
                                  onClick={() => {
                                    const newArr = (arr as Array<Record<string, unknown>>).filter((_, i) => i !== idx);
                                    setFormState(prev => ({ ...prev, [key]: newArr }));
                                  }}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 text-lg"
                                >
                                  Remove
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 px-12 pb-12 mt-auto">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
          className="px-6 py-3 text-lg"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      </div>
    </form>
  );
}

function extractDataArray(data: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(data)) {
    if (data.length > 0 && typeof data[0] === "object") return data as Array<Record<string, unknown>>;
    if (data.length > 0 && typeof data[0] !== "object") {
      return (data as unknown[]).map((item) => ({ value: item }));
    }
    return [];
  }
  if (data && typeof data === "object") {
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
        return value as Array<Record<string, unknown>>;
      }
      if (Array.isArray(value) && value.length > 0 && typeof value[0] !== "object") {
        return value.map((item) => ({ value: item }));
      }
    }
  }
  return [];
}

const SKIP_FIELDS = ["updatedAt", "createdAt", "__v", "_id", "isDeleted"];

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

  // Helper function to format field names
  function formatFieldName(key: string): string {
    return key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  }

  // Helper function to format values
  function formatValue(value: unknown): string {
    if (value == null || value === undefined) return "Not specified";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "string" && value.trim() === "") return "Not specified";
    if (typeof value === "object" && value !== null) {
      if (Array.isArray(value)) {
        return value.length === 0 ? "No items" : `${value.length} item(s)`;
      }
      if (Object.keys(value).length === 0) return "No data";
      return "Object data";
    }
    return String(value);
  }

  // Helper function to check if value should be displayed
  function shouldDisplayField(key: string, value: unknown): boolean {
    const skipFields = ["_id", "__v", "createdAt", "updatedAt", "isDeleted"];
    if (skipFields.includes(key)) return false;
    if (value === null || value === undefined) return false;
    if (typeof value === "string" && value.trim() === "") return false;
    return true;
  }

  // Helper function to check if field is a date field
  function isDateField(fieldName: string): boolean {
    const lower = fieldName.toLowerCase();
    return lower === 'dob' || lower === 'date' || lower.includes('date') || lower.includes('time');
  }

  // Helper function to check if field is a status field
  function isStatusField(fieldName: string): boolean {
    const lower = fieldName.toLowerCase();
    // Check for exact matches
    if (lower === 'status') return true;
    
    // Check for compound words containing 'status' (like PaymentStatus, OrderStatus, etc.)
    if (lower.includes('status')) return true;
    
    // Check for payment-related fields
    if (lower.includes('payment')) return true;
    
    // Check for state-related fields
    if (lower.includes('state')) return true;
    
    // Check for common status-like fields
    const statusKeywords = ['condition', 'phase', 'stage', 'mode', 'type'];
    return statusKeywords.some(keyword => lower.includes(keyword));
  }

  // Helper function to get status badge styling
  function getStatusBadgeStyle(status: string): { bg: string; text: string; border: string; icon?: string } {
    const lowerStatus = status.toLowerCase();
    
    // Success/Positive statuses
    if (lowerStatus.includes('paid') || lowerStatus.includes('completed') || lowerStatus.includes('approved') || 
        lowerStatus.includes('active') || lowerStatus.includes('success') || lowerStatus.includes('done') ||
        lowerStatus.includes('finished') || lowerStatus.includes('delivered') || lowerStatus.includes('confirmed')) {
      return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', icon: '✓' };
    }
    
    // Warning/Pending statuses
    if (lowerStatus.includes('pending') || lowerStatus.includes('processing') || lowerStatus.includes('waiting') ||
        lowerStatus.includes('on-hold') || lowerStatus.includes('scheduled') || lowerStatus.includes('draft')) {
      return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', icon: '⏳' };
    }
    
    // Error/Failed statuses
    if (lowerStatus.includes('failed') || lowerStatus.includes('cancelled') || lowerStatus.includes('rejected') || 
        lowerStatus.includes('inactive') || lowerStatus.includes('error') || lowerStatus.includes('declined') ||
        lowerStatus.includes('expired') || lowerStatus.includes('void')) {
      return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', icon: '✗' };
    }
    
    // Progress/Partial statuses
    if (lowerStatus.includes('progress') || lowerStatus.includes('partial') || lowerStatus.includes('in-progress') ||
        lowerStatus.includes('ongoing') || lowerStatus.includes('running') || lowerStatus.includes('working')) {
      return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', icon: '⟳' };
    }
    
    // Info/Neutral statuses
    if (lowerStatus.includes('info') || lowerStatus.includes('new') || lowerStatus.includes('created') ||
        lowerStatus.includes('submitted') || lowerStatus.includes('received')) {
      return { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200', icon: 'ℹ' };
    }
    
    // Default gray for unknown statuses
    return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', icon: '•' };
  }

  // Helper function to format status value with badge
  function formatStatusValue(value: unknown): React.ReactNode {
    if (value == null || value === undefined || value === '') return "Not specified";
    
    const statusStr = String(value);
    const style = getStatusBadgeStyle(statusStr);
    
    // Format the status text nicely
    const formattedText = statusStr
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/-/g, ' ') // Replace hyphens with spaces
      .replace(/_/g, ' ') // Replace underscores with spaces
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border shadow-sm ${style.bg} ${style.text} ${style.border}`}>
        {style.icon && <span className="text-base">{style.icon}</span>}
        <span>{formattedText}</span>
      </span>
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
    <div className="fixed inset-0 z-50 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-900">Item Details</h2>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
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
                    {formatStatusValue(value)}
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
                  <div className="bg-white rounded border border-purple-200 p-3 text-sm text-gray-700 font-mono max-h-64 overflow-y-auto shadow-sm">
                    {JSON.stringify(value, null, 2)}
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
                    <div className="bg-white rounded border border-orange-200 p-3 shadow-sm">
                      <div className="text-sm text-gray-700 font-mono max-h-64 overflow-y-auto">
                        {JSON.stringify(value, null, 2)}
                      </div>
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
  const [apiResponse, setApiResponse] = useState<Array<Record<string, unknown>>>([]);
  const { showAlert } = useAlert();
  const [viewIdx, setViewIdx] = useState<number | null>(null);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Loading states for actions
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState<number | null>(null);
  const [invoicePreview, setInvoicePreview] = useState<{ url: string; customerId: string; statusData?: any } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchAPI({ endpoint: slug, method: "GET" }).then(({ data, error }) => {
     
      const arr = extractDataArray(data);
      setApiResponse(arr);
      setError(error);
      setLoading(false);
    });
  }, [slug]);

  const allKeys = useMemo(() => {
    const keys = apiResponse[0] ? Object.keys(apiResponse[0]).slice(0, 4) : [];
    if (keys.length === 0 && apiResponse.length > 0) {
      return ["value"];
    }
    return keys;
  }, [apiResponse]);

  // Helper function to check if field is a status field
  function isStatusField(fieldName: string): boolean {
    const lower = fieldName.toLowerCase();
    // Check for exact matches
    if (lower === 'status') return true;
    
    // Check for compound words containing 'status' (like PaymentStatus, OrderStatus, etc.)
    if (lower.includes('status')) return true;
    
    // Check for payment-related fields
    if (lower.includes('payment')) return true;
    
    // Check for state-related fields
    if (lower.includes('state')) return true;
    
    // Check for common status-like fields
    const statusKeywords = ['condition', 'phase', 'stage', 'mode', 'type'];
    return statusKeywords.some(keyword => lower.includes(keyword));
  }

  // Helper function to get status badge styling
  function getStatusBadgeStyle(status: string): { bg: string; text: string; border: string; icon?: string } {
    const lowerStatus = status.toLowerCase();
    
    // Success/Positive statuses
    if (lowerStatus.includes('paid') || lowerStatus.includes('completed') || lowerStatus.includes('approved') || 
        lowerStatus.includes('active') || lowerStatus.includes('success') || lowerStatus.includes('done') ||
        lowerStatus.includes('finished') || lowerStatus.includes('delivered') || lowerStatus.includes('confirmed')) {
      return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', icon: '✓' };
    }
    
    // Warning/Pending statuses
    if (lowerStatus.includes('pending') || lowerStatus.includes('processing') || lowerStatus.includes('waiting') ||
        lowerStatus.includes('on-hold') || lowerStatus.includes('scheduled') || lowerStatus.includes('draft')) {
      return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', icon: '⏳' };
    }
    
    // Error/Failed statuses
    if (lowerStatus.includes('failed') || lowerStatus.includes('cancelled') || lowerStatus.includes('rejected') || 
        lowerStatus.includes('inactive') || lowerStatus.includes('error') || lowerStatus.includes('declined') ||
        lowerStatus.includes('expired') || lowerStatus.includes('void')) {
      return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', icon: '✗' };
    }
    
    // Progress/Partial statuses
    if (lowerStatus.includes('progress') || lowerStatus.includes('partial') || lowerStatus.includes('in-progress') ||
        lowerStatus.includes('ongoing') || lowerStatus.includes('running') || lowerStatus.includes('working')) {
      return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', icon: '⟳' };
    }
    
    // Info/Neutral statuses
    if (lowerStatus.includes('info') || lowerStatus.includes('new') || lowerStatus.includes('created') ||
        lowerStatus.includes('submitted') || lowerStatus.includes('received')) {
      return { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200', icon: 'ℹ' };
    }
    
    // Default gray for unknown statuses
    return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', icon: '•' };
  }

  // Helper function to format status value with badge
  function formatStatusValue(value: unknown): React.ReactNode {
    if (value == null || value === undefined || value === '') return "Not specified";
    
    const statusStr = String(value);
    const style = getStatusBadgeStyle(statusStr);
    
    // Format the status text nicely
    const formattedText = statusStr
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/-/g, ' ') // Replace hyphens with spaces
      .replace(/_/g, ' ') // Replace underscores with spaces
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border shadow-sm ${style.bg} ${style.text} ${style.border}`}>
        {style.icon && <span className="text-base">{style.icon}</span>}
        <span>{formattedText}</span>
      </span>
    );
  }

  function renderCellValue(value: unknown, fieldName?: string) {
    if (value == null) return <span className="text-gray-400">-</span>;
    
    // If this is a status field, render it with a badge
    if (fieldName && isStatusField(fieldName)) {
      return formatStatusValue(value);
    }
    
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    if (typeof value === "object" && value && Object.keys(value).length === 0) {
      return <span className="text-gray-400">{'{}'}</span>;
    }
    return <span className="text-gray-400">-</span>;
  }

  function filterSubmitFields(values: Record<string, unknown>) {
    const filtered: Record<string, unknown> = {};
    Object.entries(values).forEach(([k, v]) => {
      if (!SKIP_FIELDS.includes(k)) filtered[k] = v;
    });
    return filtered;
  }

  async function handleEditSave(values: Record<string, unknown>) {
    setIsEditing(true);
    const id = (values as Record<string, unknown>)._id as string | undefined;
    const endpointSlug = typeof slug === 'string' ? slug : '';
    const filteredValues = filterSubmitFields(values);
    
    try {
      const { error } = await fetchAPI({
        endpoint: `${endpointSlug}/${id}`,
        method: "PUT",
        data: filteredValues,
        withAuth: true,
      });
      
      if (error) {
        showAlert("Failed to update: " + error, "destructive");
      } else {
        fetchAPI({ endpoint: endpointSlug, method: "GET" }).then(({ data }) => {
          setApiResponse(extractDataArray(data));
        });
        setEditIdx(null);
        showAlert("Update successful!", "success");
      }
    } finally {
      setIsEditing(false);
    }
  }

  async function handleDelete(idx: number) {
    setIsDeleting(idx);
    const itemToDelete = apiResponse[idx];
    const id = itemToDelete._id as string;
    const endpointSlug = typeof slug === 'string' ? slug : '';
    
    try {
      const { error } = await fetchAPI({
        endpoint: `${endpointSlug}/${id}`,
        method: "DELETE",
        withAuth: true,
      });
      
      if (error) {
        showAlert("Failed to delete: " + error, "destructive");
      } else {
        // Update local state only after successful server deletion
        setApiResponse((prev) => prev.filter((_, i) => i !== idx));
        setDeleteIdx(null);
        showAlert("Deleted successfully!", "success");
      }
    } catch {
      showAlert("Failed to delete item", "destructive");
    } finally {
      setIsDeleting(null);
    }
  }

  async function handleStatusUpdate(idx: number, newStatus: string) {
    setIsUpdatingStatus(idx);
    const itemToUpdate = apiResponse[idx];
    const id = itemToUpdate._id as string;
    const endpointSlug = typeof slug === 'string' ? slug : '';
    
    try {
      const { error } = await fetchAPI({
        endpoint: `${endpointSlug}/${id}`,
        method: "PUT",
        data: { status: newStatus },
        withAuth: true,
      });
      
      if (error) {
        showAlert("Failed to update status: " + error, "destructive");
      } else {
        // Update local state
        setApiResponse((prev) => 
          prev.map((item, i) => 
            i === idx ? { ...item, status: newStatus } : item
          )
        );
        showAlert("Status updated successfully!", "success");
      }
    } catch {
      showAlert("Failed to update status", "destructive");
    } finally {
      setIsUpdatingStatus(null);
    }
  }

  async function handleStatusFieldUpdate(idx: number, fieldName: string, newValue: string) {
    setIsUpdatingStatus(idx);
    const itemToUpdate = apiResponse[idx];
    const id = itemToUpdate._id as string;
    const endpointSlug = typeof slug === 'string' ? slug : '';
    
    try {
      const { error } = await fetchAPI({
        endpoint: `${endpointSlug}/${id}`,
        method: "PUT",
        data: { [fieldName]: newValue },
        withAuth: true,
      });
      
      if (error) {
        showAlert(`Failed to update ${fieldName}: ` + error, "destructive");
      } else {
        // Update local state
        setApiResponse((prev) => 
          prev.map((item, i) => 
            i === idx ? { ...item, [fieldName]: newValue } : item
          )
        );
        showAlert(`${fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} updated successfully!`, "success");
      }
    } catch {
      showAlert(`Failed to update ${fieldName}`, "destructive");
    } finally {
      setIsUpdatingStatus(null);
    }
  }

  async function handlePreviewInvoice(idx: number) {
    setIsDownloading(idx);
    const itemToDownload = apiResponse[idx];
    const customerId = itemToDownload.customerId as string;
    
    if (!customerId) {
      showAlert("No customer ID found for this order", "destructive");
      setIsDownloading(null);
      return;
    }
    
    try {
      const { data, error } = await fetchAPI({
        endpoint: `invoice/${customerId}`,
        method: "GET",
        withAuth: true,
      });
      
      if (error) {
        showAlert("Failed to load invoice preview: " + error, "destructive");
      } else if (data && data.previewUrl) {
        // Find status fields in the order data
        const statusFields: Record<string, any> = {};
        Object.entries(itemToDownload).forEach(([key, value]) => {
          if (key.toLowerCase().includes('status')) {
            statusFields[key] = value;
          }
        });
        
        setInvoicePreview({ 
          url: data.previewUrl, 
          customerId,
          statusData: statusFields
        });
      } else {
        showAlert("No preview URL received from server", "destructive");
      }
    } catch (error) {
      showAlert("Failed to load invoice preview", "destructive");
    } finally {
      setIsDownloading(null);
    }
  }

  async function handleDownloadReceipt(customerId: string) {
    try {
      const { data, error } = await fetchAPI({
        endpoint: `invoice/${customerId}/download`,
        method: "GET",
        withAuth: true,
      });
      
      if (error) {
        showAlert("Failed to download receipt: " + error, "destructive");
      } else if (data && data.downloadUrl) {
        // Create a temporary link to download the file
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = `receipt-${customerId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showAlert("Receipt downloaded successfully!", "success");
        setInvoicePreview(null);
      } else {
        showAlert("No download URL received from server", "destructive");
      }
    } catch (error) {
      showAlert("Failed to download receipt", "destructive");
    }
  }

  async function handleStatusChangeInPreview(statusKey: string, newValue: string) {
    if (!invoicePreview) return;
    
    try {
      const { error } = await fetchAPI({
        endpoint: `orders/${invoicePreview.customerId}`,
        method: "PUT",
        data: { [statusKey]: newValue },
        withAuth: true,
      });
      
      if (error) {
        showAlert("Failed to update status: " + error, "destructive");
      } else {
        // Update local state
        setApiResponse((prev) => 
          prev.map((item) => 
            item.customerId === invoicePreview.customerId 
              ? { ...item, [statusKey]: newValue }
              : item
          )
        );
        
        // Update preview state
        setInvoicePreview(prev => prev ? {
          ...prev,
          statusData: {
            ...prev.statusData,
            [statusKey]: newValue
          }
        } : null);
        
        showAlert("Status updated successfully!", "success");
      }
    } catch (error) {
      showAlert("Failed to update status", "destructive");
    }
  }

  // Build a superset of all keys (recursively) from all items in apiResponse
  function getConsistentFormTemplate() {
    function mergeKeys(a: any, b: any): any {
      if (Array.isArray(a) && Array.isArray(b)) return [];
      if (typeof a === 'object' && a && typeof b === 'object' && b) {
        const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
        const result: Record<string, any> = {};
        keys.forEach((k) => {
          if (!SKIP_FIELDS.includes(k)) {
            result[k] = mergeKeys(a[k], b[k]);
          }
        });
        return result;
      }
      return undefined;
    }
    if (!apiResponse.length) return {};
    let superset = { ...apiResponse[0] };
    for (let i = 1; i < apiResponse.length; i++) {
      superset = mergeKeys(superset, apiResponse[i]);
    }
    return superset;
  }

  function getEmptyFormData() {
    function makeEmptyTemplate(obj: any): any {
      if (Array.isArray(obj)) {
        // If array has a template item, use its structure for new items
        if (obj.length > 0 && typeof obj[0] === 'object') {
          // Optionally, start with an empty array, but keep the template for rendering
          return [];
        }
        return [];
      }
      if (obj === null || obj === undefined) return "";
      if (typeof obj === "boolean") return false;
      if (typeof obj === "number") return "";
      if (typeof obj === "string") return "";
      if (typeof obj === "object") {
        const result: Record<string, any> = {};
        Object.keys(obj).forEach((k) => {
          if (!SKIP_FIELDS.includes(k)) {
            result[k] = makeEmptyTemplate(obj[k]);
          }
        });
        return result;
      }
      return "";
    }
    const template = getConsistentFormTemplate();
    if (Object.keys(template).length > 0) {
      return makeEmptyTemplate(template);
    }
    if (allKeys.length === 1 && allKeys[0] === "value") {
      return { value: "" };
    }
    return {};
  }

  async function handleAddSave(values: Record<string, unknown>) {
    setIsAdding(true);
    const endpointSlug = typeof slug === 'string' ? slug : '';
    const filteredValues = filterSubmitFields(values);
    
    try {
      const { error } = await fetchAPI({
        endpoint: endpointSlug,
        method: "POST",
        data: filteredValues,
        withAuth: true,
      });
      
      if (error) {
        showAlert("Failed to create: " + error, "destructive");
      } else {
        fetchAPI({ endpoint: endpointSlug, method: "GET" }).then(({ data }) => {
          setApiResponse(extractDataArray(data));
        });
        setAddOpen(false);
        showAlert("Created successfully!", "success");
      }
    } finally {
      setIsAdding(false);
    }
  }

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
        <h1 className="text-2xl font-bold">{slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : 'Item'}</h1>
        <Button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          onClick={() => setAddOpen(true)}
          disabled={isAdding}
        >
          {isAdding ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Adding...
            </div>
          ) : (
            `+ Add ${slug ?? 'Item'}`
          )}
        </Button>
      </div>
      <div className="overflow-x-auto bg-white rounded shadow">
        {loading ? (
          <div className="p-6">
            <Skeleton className="h-8 w-full mb-2" />
            <Skeleton className="h-8 w-full mb-2" />
            <Skeleton className="h-8 w-full mb-2" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">{error}</div>
        ) : apiResponse.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No data found.</div>
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
                apiResponse.map((row, idx) => (
                  <TableRow
                    key={idx}
                    className="hover:bg-blue-50 transition"
                  >
                    {allKeys.map((key) => (
                      <TableCell key={key}>
                        {isStatusField(key) ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              {renderCellValue(row[key], key)}
                            </div>
                            <select
                              value={String(row[key] || '')}
                              onChange={(e) => handleStatusFieldUpdate(idx, key, e.target.value)}
                              disabled={isUpdatingStatus === idx}
                              className="text-xs px-2 py-1 border border-gray-300 rounded bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-w-24"
                              title={`Change ${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}`}
                            >
                              <option value="">Select Status</option>
                              <option value="pending">Pending</option>
                              <option value="in-progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="returned">Returned</option>
                              <option value="draft">Draft</option>
                              <option value="submitted">Submitted</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="failed">Failed</option>
                              <option value="expired">Expired</option>
                            </select>
                            {isUpdatingStatus === idx && (
                              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            )}
                          </div>
                        ) : (
                          renderCellValue(row[key], key)
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setViewIdx(idx)}
                          className="bg-blue-500 text-white text-xs flex items-center gap-1"
                          title="View details"
                          size="icon"
                        >
                          <MdVisibility className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => setEditIdx(idx)}
                          className="bg-yellow-400 text-xs flex items-center gap-1"
                          title="Edit"
                          size="icon"
                          disabled={isEditing}
                        >
                          {isEditing && editIdx === idx ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <MdEdit className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          onClick={() => setDeleteIdx(idx)}
                          className="bg-red-500 text-white text-xs flex items-center gap-1"
                          title="Delete"
                          size="icon"
                          disabled={isDeleting === idx}
                        >
                          {isDeleting === idx ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <MdDelete className="w-4 h-4" />
                          )}
                        </Button>
                        {slug === 'orders' && (
                          <Button
                            onClick={() => handlePreviewInvoice(idx)}
                            className="bg-green-500 text-white text-xs flex items-center gap-1"
                            title="Preview Invoice"
                            size="icon"
                            disabled={isDownloading === idx}
                          >
                            {isDownloading === idx ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <MdDownload className="w-4 h-4" />
                            )}
                          </Button>
                        )}

                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
      <ViewDetailsModal 
        data={viewIdx !== null ? apiResponse[viewIdx] : null}
        open={viewIdx !== null}
        onClose={() => setViewIdx(null)}
      />
      <Modal open={editIdx !== null} onClose={() => setEditIdx(null)}>
        <h2 className="text-lg font-semibold mb-2">Edit Row</h2>
        {editIdx !== null && (
          <DynamicForm
            data={apiResponse[editIdx]}
            onSubmit={handleEditSave}
            onCancel={() => setEditIdx(null)}
            getConsistentFormTemplate={getConsistentFormTemplate}
            isLoading={isEditing}
          />
        )}
      </Modal>
      <Modal open={deleteIdx !== null} onClose={() => setDeleteIdx(null)}>
        <h2 className="text-lg font-semibold mb-2">Are you sure you want to delete?</h2>
        <div className="flex gap-2 mt-4">
          <Button 
            onClick={() => handleDelete(deleteIdx as number)} 
            className="bg-red-500 text-white"
            disabled={isDeleting === deleteIdx}
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
      <Modal open={addOpen} onClose={() => setAddOpen(false)}>
        <h2 className="text-lg font-semibold mb-2">Add New {slug ?? 'Item'}</h2>
        <DynamicForm
          data={getEmptyFormData()}
          onSubmit={handleAddSave}
          onCancel={() => setAddOpen(false)}
          getConsistentFormTemplate={getConsistentFormTemplate}
          isLoading={isAdding}
        />
      </Modal>
      <Modal open={invoicePreview !== null} onClose={() => setInvoicePreview(null)}>
        <div className="w-full max-w-4xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Invoice Preview</h2>
            <button 
              onClick={() => setInvoicePreview(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {invoicePreview && (
            <>
              {/* Status Section */}
              {invoicePreview.statusData && Object.keys(invoicePreview.statusData).length > 0 && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-md font-semibold mb-3 text-gray-800">Order Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(invoicePreview.statusData).map(([statusKey, statusValue]) => (
                      <div key={statusKey} className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700 min-w-24">
                          {statusKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                        </label>
                        <select
                          value={String(statusValue || '')}
                          onChange={(e) => handleStatusChangeInPreview(statusKey, e.target.value)}
                          className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        >
                          <option value="">Select Status</option>
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="returned">Returned</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Invoice Preview */}
              <div className="mb-4">
                <iframe
                  src={invoicePreview.url}
                  className="w-full h-96 border border-gray-300 rounded-lg"
                  title="Invoice Preview"
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => handleDownloadReceipt(invoicePreview.customerId)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                  Download Receipt
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setInvoicePreview(null)}
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}