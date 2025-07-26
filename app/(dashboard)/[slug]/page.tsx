"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { fetchAPI } from "@/lib/apiService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAlert } from "@/components/ui/alertProvider";
import { MdVisibility, MdEdit, MdDelete } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import Link from "next/link";

// Date picker components
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
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
  getConsistentFormTemplate 
}: { 
  data: Record<string, unknown>, 
  onSubmit: (values: Record<string, unknown>) => void, 
  onCancel: () => void,
  getConsistentFormTemplate: () => any
}) {
  const [formState, setFormState] = useState<Record<string, unknown>>({ ...data });

  // Dynamic lookup options cache
  const [lookupOptions, setLookupOptions] = useState<Record<string, Array<{ id: string; label: string }>>>({});

  // Helper to infer endpoint from field name
  function inferEndpoint(field: string) {
    let base = field.replace(/Id$|Item$/i, "");
    if (!base) return null;
    // Lowercase and pluralize (simple pluralization)
    base = base.charAt(0).toLowerCase() + base.slice(1);
    if (!base.endsWith('s')) base += 's';
    return `/api/${base}`;
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

  // Fetch lookup options for all relevant fields on mount
  useEffect(() => {
    Object.keys(data).forEach((key) => {
      if (/Id$|Item$/i.test(key) && !lookupOptions[key]) {
        fetchLookupOptions(key);
      }
    });
    // eslint-disable-next-line
  }, []);

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
  }, [getConsistentFormTemplate]);

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

  function isDateField(fieldName: string): boolean {
    const lower = fieldName.toLowerCase();
    return lower === 'dob' || lower === 'date';
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
                    /Id$|Item$/i.test(subKey) && lookupOptions[subKey] ? (
                      <select
                        value={
                          subValue === null || subValue === undefined
                            ? ""
                            : String(subValue)
                        }
                        onChange={(e) => {
                          setFormState(prev => ({
                            ...prev,
                            [parentKey]: { ...prev[parentKey] as Record<string, unknown>, [subKey]: e.target.value }
                          }));
                        }}
                        className="h-14 w-full text-xl px-6 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 border border-gray-300 rounded-md bg-white"
                      >
                        <option value="">Select {subKey.replace(/_/g, " ").toLowerCase()}</option>
                        {lookupOptions[subKey].map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
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
                  /Id$|Item$/i.test(key) && lookupOptions[key] ? (
                    lookupOptions[key] ? (
                      <select
                        name={key}
                        value={value as string}
                        onChange={(e) => {
                          setFormState(prev => ({
                            ...prev,
                            [key]: e.target.value
                          }));
                        }}
                        className="h-14 w-full text-xl px-6 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 border border-gray-300 rounded-md bg-white"
                      >
                        <option value="">Select {key.replace(/_/g, " ").toLowerCase()}</option>
                        {lookupOptions[key].map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select disabled className="h-14 w-full text-xl px-6 border border-gray-300 rounded-md bg-gray-100 text-gray-400">
                        <option>Loading...</option>
                      </select>
                    )
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
                          <tr><td colSpan={subKeys.length + 1} className="text-center text-gray-400 py-6">No items. Click "+ Add Item" to add.</td></tr>
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
                                    /Id$|Item$/i.test(subKey) && lookupOptions[subKey] ? (
                                      <select
                                        value={
                                          item[subKey] === null || item[subKey] === undefined
                                            ? ""
                                            : String(item[subKey])
                                        }
                                        onChange={e => {
                                          const newArr = [...(arr as Array<Record<string, unknown>>)]
                                          newArr[idx][subKey] = e.target.value;
                                          setFormState(prev => ({ ...prev, [key]: newArr }));
                                        }}
                                        className="h-20 w-full text-2xl px-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 border border-gray-300 rounded-md bg-white"
                                      >
                                        <option value="">Select {subKey.replace(/_/g, " ").toLowerCase()}</option>
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
        <Button type="button" variant="outline" onClick={onCancel} className="px-8 py-3 text-lg">
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
          Save Changes
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

  let allKeys: string[] = apiResponse[0] ? Object.keys(apiResponse[0]).slice(0, 4) : [];
  if (allKeys.length === 0 && apiResponse.length > 0) {
    allKeys = ["value"];
  }

  function renderCellValue(value: unknown) {
    if (value == null) return <span className="text-gray-400">-</span>;
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
    const id = (values as Record<string, unknown>)._id as string | undefined;
    const endpointSlug = typeof slug === 'string' ? slug : '';
    const filteredValues = filterSubmitFields(values);
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
  }

  async function handleDelete(idx: number) {
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
    } catch (err) {
      showAlert("Failed to delete item", "destructive");
    }
  }

  function isDateField(fieldName: string): boolean {
    const lower = fieldName.toLowerCase();
    return lower === 'dob' || lower === 'date';
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
    const endpointSlug = typeof slug === 'string' ? slug : '';
    const filteredValues = filterSubmitFields(values);
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
        >
          + Add {slug ?? 'Item'}
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
                      <TableCell key={key}>{renderCellValue(row[key])}</TableCell>
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
                        >
                          <MdEdit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => setDeleteIdx(idx)}
                          className="bg-red-500 text-white text-xs flex items-center gap-1"
                          title="Delete"
                          size="icon"
                        >
                          <MdDelete className="w-4 h-4" />
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
      <Modal open={viewIdx !== null} onClose={() => setViewIdx(null)}>
        <h2 className="text-lg font-semibold mb-2">Row Details</h2>
        <pre className="bg-gray-100 rounded p-4 text-xs overflow-x-auto max-h-96">
          {viewIdx !== null ? JSON.stringify(apiResponse[viewIdx], null, 2) : ""}
        </pre>
      </Modal>
      <Modal open={editIdx !== null} onClose={() => setEditIdx(null)}>
        <h2 className="text-lg font-semibold mb-2">Edit Row</h2>
        {editIdx !== null && (
          <DynamicForm
            data={apiResponse[editIdx]}
            onSubmit={handleEditSave}
            onCancel={() => setEditIdx(null)}
            getConsistentFormTemplate={getConsistentFormTemplate}
          />
        )}
      </Modal>
      <Modal open={deleteIdx !== null} onClose={() => setDeleteIdx(null)}>
        <h2 className="text-lg font-semibold mb-2">Are you sure you want to delete?</h2>
        <div className="flex gap-2 mt-4">
          <Button onClick={() => handleDelete(deleteIdx as number)} className="bg-red-500 text-white">Yes, Delete</Button>
          <Button variant="outline" onClick={() => setDeleteIdx(null)}>Cancel</Button>
        </div>
      </Modal>
      <Modal open={addOpen} onClose={() => setAddOpen(false)}>
        <h2 className="text-lg font-semibold mb-2">Add New {slug ?? 'Item'}</h2>
        <DynamicForm
          data={getEmptyFormData()}
          onSubmit={handleAddSave}
          onCancel={() => setAddOpen(false)}
          getConsistentFormTemplate={getConsistentFormTemplate}
        />
      </Modal>
    </div>
  );
}