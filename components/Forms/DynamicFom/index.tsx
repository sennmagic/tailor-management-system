import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/apiService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useLookup } from "@/lib/hooks/useLookup";

export function DynamicForm({ 
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
    const [formState, setFormState] = useState<Record<string, unknown>>(data);
    
    // Use the lookup hook instead of duplicating functions
    const {
      lookupOptions,
      lookupErrors,
      detectFieldType,
      getStatusOptions,
      formatFieldName,
      analyzeFormStructure
    } = useLookup({ data });

    // Initialize form analysis
    useEffect(() => {
      console.log('🔍 Analyzing form structure:', data);
      analyzeFormStructure(data);
    }, [data, analyzeFormStructure]);

    // Handle form field changes with deep object support
    function handleFieldChange(fieldPath: string, newValue: any) {
      setFormState(prev => {
        const newState = { ...prev };
        const pathParts = fieldPath.split('.');
        
        let current: any = newState;
        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i];
          if (!(part in current)) {
            current[part] = {};
          }
          current = current[part];
        }
        
        current[pathParts[pathParts.length - 1]] = newValue;
        return newState;
      });
    }

    // Get field value from nested path
    function getFieldValue(fieldPath: string): any {
      const pathParts = fieldPath.split('.');
      let current = formState;
      
      for (const part of pathParts) {
        if (current && typeof current === 'object' && part in current) {
          current = (current as any)[part];
        } else {
          return '';
        }
      }
      
      return current;
    }

    // Render field based on its type and structure
    function renderField(key: string, value: unknown, fieldPath: string, level = 0): React.ReactNode {
      const fieldType = detectFieldType(key, value, fieldPath.split('.').slice(0, -1).join('.'));
      const currentValue = getFieldValue(fieldPath);
      
      // Skip internal fields
      if (key === '_id' || key === '__v' || key === 'createdAt' || key === 'updatedAt') {
        return null;
      }

      const commonInputProps = {
        className: "h-12 w-full text-base",
        placeholder: `Enter ${formatFieldName(key).toLowerCase()}`
      };

      switch (fieldType.type) {
        case 'lookup':
          const options = lookupOptions[fieldPath] || [];
          const isLoading = !options.length && !lookupErrors[fieldPath];
          
          return (
            <div key={fieldPath} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {formatFieldName(key)}
                <span className="text-xs text-primary ml-2">🔗 Lookup Field</span>
              </label>
              <select
                value={currentValue || ''}
                onChange={(e) => handleFieldChange(fieldPath, e.target.value)}
                className={`${commonInputProps.className} ${lookupErrors[fieldPath] ? 'border-red-500' : ''}`}
                disabled={isLoading}
              >
                <option value="">
                  {isLoading ? 'Loading options...' : `Select ${formatFieldName(key)}`}
                </option>
                {options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              {lookupErrors[fieldPath] && (
                <div className="text-red-600 text-sm">❌ {lookupErrors[fieldPath]}</div>
              )}
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  Loading {fieldType.config?.entityName || 'options'}...
                </div>
              )}
            </div>
          );

        case 'status':
          return (
            <div key={fieldPath} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {formatFieldName(key)}
                <span className="text-xs text-secondary ml-2">📊 Status Field</span>
              </label>
              <select
                value={currentValue || ''}
                onChange={(e) => handleFieldChange(fieldPath, e.target.value)}
                className={commonInputProps.className}
              >
                <option value="">Select Status</option>
                {fieldType.config?.options.map((status: string) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          );

        case 'date':
          return (
            <div key={fieldPath} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {formatFieldName(key)}
                <span className="text-xs text-secondary ml-2">📅 Date Field</span>
              </label>
              <Input
                type="date"
                value={currentValue ? String(currentValue).split('T')[0] : ''}
                onChange={(e) => handleFieldChange(fieldPath, e.target.value)}
                className={commonInputProps.className}
              />
            </div>
          );

        case 'boolean':
          return (
            <div key={fieldPath} className="space-y-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <Checkbox
                  checked={Boolean(currentValue)}
                  onCheckedChange={(checked) => handleFieldChange(fieldPath, checked)}
                />
                <span className="text-sm font-medium text-gray-700">
                  {formatFieldName(key)}
                  <span className="text-xs text-secondary ml-2">☑️ Boolean Field</span>
                </span>
              </label>
            </div>
          );

        case 'number':
          return (
            <div key={fieldPath} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {formatFieldName(key)}
                <span className="text-xs text-secondary ml-2">🔢 Number Field</span>
              </label>
              <Input
                type="number"
                value={currentValue || ''}
                onChange={(e) => handleFieldChange(fieldPath, parseFloat(e.target.value) || 0)}
                placeholder={commonInputProps.placeholder}
              />
            </div>
          );

        case 'array':
          return renderArrayField(key, value as any[], fieldPath, fieldType.config);

        case 'object':
          return renderObjectField(key, value as Record<string, unknown>, fieldPath, level);

        default: // text
          return (
            <div key={fieldPath} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {formatFieldName(key)}
              </label>
              <Input
                type="text"
                value={currentValue || ''}
                onChange={(e) => handleFieldChange(fieldPath, e.target.value)}
                placeholder={commonInputProps.placeholder}
              />
            </div>
          );
      }
    }

    // Render nested object fields
    function renderObjectField(key: string, obj: Record<string, unknown>, fieldPath: string, level: number): React.ReactNode {
      return (
        <div key={fieldPath} className="space-y-4 p-6 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-secondary rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-800">
              {formatFieldName(key)}
              <span className="text-xs text-secondary ml-2">📦 Object Field</span>
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(obj).map(([subKey, subValue]) => 
              renderField(subKey, subValue, `${fieldPath}.${subKey}`, level + 1)
            )}
          </div>
        </div>
      );
    }

    // Render array fields with dynamic item management
    function renderArrayField(key: string, arr: any[], fieldPath: string, config: any): React.ReactNode {
      const currentArray = getFieldValue(fieldPath) as any[] || [];
      
      const addItem = () => {
        const newItem = config.isComplexArray 
          ? { ...config.itemTemplate }
          : '';
        handleFieldChange(fieldPath, [...currentArray, newItem]);
      };

      const removeItem = (index: number) => {
        const newArray = currentArray.filter((_, i) => i !== index);
        handleFieldChange(fieldPath, newArray);
      };

      const updateItem = (index: number, itemValue: any) => {
        const newArray = [...currentArray];
        newArray[index] = itemValue;
        handleFieldChange(fieldPath, newArray);
      };

      return (
        <div key={fieldPath} className="space-y-4 p-6 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-secondary rounded-full"></div>
              <h3 className="text-lg font-semibold text-gray-800">
                {formatFieldName(key)} ({currentArray.length} items)
                <span className="text-xs text-secondary ml-2">📋 Array Field</span>
              </h3>
            </div>
            <Button
              type="button"
              onClick={addItem}
              variant="outline"
              size="sm"
            >
              + Add Item
            </Button>
          </div>

          {currentArray.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              No items. Click "Add Item" to start.
            </div>
          ) : (
            <div className="space-y-3">
              {currentArray.map((item, index) => (
                <div key={index} className="p-3 bg-white border border-gray-200 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Item {index + 1}</span>
                    <Button
                      type="button"
                      onClick={() => removeItem(index)}
                      variant="destructive"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </div>
                  
                  {config.isComplexArray ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(item).map(([subKey, subValue]) => 
                        renderField(subKey, subValue, `${fieldPath}[${index}].${subKey}`)
                      )}
                    </div>
                  ) : (
                    <Input
                      type="text"
                      value={item || ''}
                      onChange={(e) => updateItem(index, e.target.value)}
                      placeholder={`Enter ${formatFieldName(key)} item`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Group fields by type for better organization
    function organizeFields(obj: Record<string, unknown>, parentPath = ''): {
      basic: Array<[string, unknown, string]>;
      lookup: Array<[string, unknown, string]>;
      status: Array<[string, unknown, string]>;
      complex: Array<[string, unknown, string]>;
    } {
      const groups: {
        basic: Array<[string, unknown, string]>;
        lookup: Array<[string, unknown, string]>;
        status: Array<[string, unknown, string]>;
        complex: Array<[string, unknown, string]>;
      } = { 
        basic: [] as Array<[string, unknown, string]>, 
        lookup: [] as Array<[string, unknown, string]>, 
        status: [] as Array<[string, unknown, string]>, 
        complex: [] as Array<[string, unknown, string]> 
      };
      
      Object.entries(obj).forEach(([key, value]) => {
        const fieldPath = parentPath ? `${parentPath}.${key}` : key;
        const fieldType = detectFieldType(key, value, parentPath);
        
        if (fieldType.type === 'lookup') {
          groups.lookup.push([key, value, fieldPath]);
        } else if (fieldType.type === 'status') {
          groups.status.push([key, value, fieldPath]);
        } else if (fieldType.type === 'array' || fieldType.type === 'object') {
          groups.complex.push([key, value, fieldPath]);
        } else {
          groups.basic.push([key, value, fieldPath]);
        }
      });
      
      return groups;
    }

    const fieldGroups = organizeFields(formState);

    function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      onSubmit(formState);
    }

    return (
      <form
        onSubmit={handleSubmit}
        className="fixed inset-0 z-50 w-screen h-screen bg-white p-0 m-0 flex flex-col overflow-auto"
      >
        <div className="mb-6 px-6 pt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {Object.keys(formState).some(k => formState[k] && typeof formState[k] === 'object' && (formState[k] as any)._id) 
              ? 'Edit Item' 
              : 'Add New Item'
            }
          </h2>
          <p className="text-gray-600">
            Form fields are automatically generated based on your JSON data structures
          </p>
        </div>


        <div className="flex-1 px-6 space-y-6 overflow-y-auto">
          {/* Basic Fields */}
          {fieldGroups.basic.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-primary rounded-full"></div>
                <h3 className="text-xl font-semibold text-gray-800">Basic Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {fieldGroups.basic.map(([key, value, fieldPath]) => 
                  renderField(key, value, fieldPath)
                )}
              </div>
            </section>
          )}

          {/* Lookup Fields */}
          {fieldGroups.lookup.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-primary rounded-full"></div>
                <h3 className="text-xl font-semibold text-gray-800">Related Data</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fieldGroups.lookup.map(([key, value, fieldPath]) => 
                  renderField(key, value, fieldPath)
                )}
              </div>
            </section>
          )}

          {/* Status Fields */}
          {fieldGroups.status.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-secondary rounded-full"></div>
                <h3 className="text-xl font-semibold text-gray-800">Status & State</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fieldGroups.status.map(([key, value, fieldPath]) => 
                  renderField(key, value, fieldPath)
                )}
              </div>
            </section>
          )}

          {/* Complex Fields */}
          {fieldGroups.complex.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-secondary rounded-full"></div>
                <h3 className="text-xl font-semibold text-gray-800">Complex Data</h3>
              </div>
              <div className="space-y-4">
                {fieldGroups.complex.map(([key, value, fieldPath]) => 
                  renderField(key, value, fieldPath)
                )}
              </div>
            </section>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-white sticky bottom-0">
          <Button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    );
  }