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
    isLoading = false
  }: { 
    data: Record<string, unknown>, 
    onSubmit: (values: Record<string, unknown>) => void, 
    onCancel: () => void,
    isLoading?: boolean
  }) {
    const [formState, setFormState] = useState<Record<string, unknown>>(data || {});
    
    // Use the lookup hook instead of duplicating functions
    const {
      lookupOptions,
      lookupErrors,
      detectFieldType,
      getStatusOptions,
      formatFieldName,
      formatValue,
      formatStatusValue,
      shouldDisplayField,
      analyzeFormStructure,
      fetchLookupOptions,
      resetLookups,
      filterSubmitFields,
      getEmptyFormData,
      renderCellValue
    } = useLookup({ data });

    // Initialize form analysis
    useEffect(() => {
      console.log('🔍 Analyzing form structure:', data);
      analyzeFormStructure(data);
    }, [data, analyzeFormStructure]);

    // Update form state when data changes
    useEffect(() => {
      if (data) {
        setFormState(data);
      }
    }, [data]);

    // Handle form field changes with deep object support
    function handleFieldChange(fieldPath: string, newValue: any) {
      setFormState(prev => {
        const newState = { ...prev };
        const pathParts = fieldPath.split('.');
        
        let current: any = newState;
        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i];
          
          // Handle array indices like specialDates[0]
          const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
          if (arrayMatch) {
            const arrayName = arrayMatch[1];
            const arrayIndex = parseInt(arrayMatch[2]);
            
            if (!(arrayName in current)) {
              current[arrayName] = [];
            }
            if (!Array.isArray(current[arrayName])) {
              current[arrayName] = [];
            }
            
            // Ensure array has enough elements
            while (current[arrayName].length <= arrayIndex) {
              current[arrayName].push({});
            }
            
            current = current[arrayName][arrayIndex];
          } else {
            if (!(part in current)) {
              current[part] = {};
            }
            current = current[part];
          }
        }
        
        const lastPart = pathParts[pathParts.length - 1];
        const arrayMatch = lastPart.match(/^(\w+)\[(\d+)\]$/);
        if (arrayMatch) {
          const arrayName = arrayMatch[1];
          const arrayIndex = parseInt(arrayMatch[2]);
          
          if (!(arrayName in current)) {
            current[arrayName] = [];
          }
          if (!Array.isArray(current[arrayName])) {
            current[arrayName] = [];
          }
          
          // Ensure array has enough elements
          while (current[arrayName].length <= arrayIndex) {
            current[arrayName].push({});
          }
          
          current[arrayName][arrayIndex] = newValue;
        } else {
          current[lastPart] = newValue;
        }
        
        return newState;
      });
    }

    // Get field value from nested path
    function getFieldValue(fieldPath: string): any {
      const pathParts = fieldPath.split('.');
      let current = formState;
      
      for (const part of pathParts) {
        if (current && typeof current === 'object') {
          // Handle array indices like specialDates[0]
          const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
          if (arrayMatch) {
            const arrayName = arrayMatch[1];
            const arrayIndex = parseInt(arrayMatch[2]);
            
            if (arrayName in current && Array.isArray((current as any)[arrayName])) {
              const array = (current as any)[arrayName];
              if (arrayIndex >= 0 && arrayIndex < array.length) {
                current = array[arrayIndex];
              } else {
                return '';
              }
            } else {
              return '';
            }
          } else if (part in current) {
            current = (current as any)[part];
          } else {
            return '';
          }
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
      
      // Skip fields that shouldn't be displayed (including "is" fields)
      if (!shouldDisplayField(key, value)) {
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
          const hasError = lookupErrors[fieldPath];
          
          // Handle different types of lookups
          let selectValue = '';
          if (fieldType.config?.isArrayItemLookup) {
            // For array item lookups (like label in specialDates), use the string value directly
            selectValue = currentValue || '';
          } else if (currentValue && typeof currentValue === 'object' && currentValue !== null) {
            // For object lookups, extract the ID from the object
            selectValue = (currentValue as any)._id || (currentValue as any).id || '';
          } else {
            // For regular ID-based lookups
            selectValue = currentValue || '';
          }
          
          return (
            <div key={fieldPath} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {formatFieldName(key)}
                <span className="text-xs text-primary ml-2">🔗 Lookup Field</span>
              </label>
              <select
                value={selectValue}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  if (fieldType.config?.isArrayItemLookup) {
                    // For array item lookups, store the label string directly
                    const selectedOption = options.find(opt => opt.id === selectedId);
                    handleFieldChange(fieldPath, selectedOption ? selectedOption.label : '');
                  } else if (fieldType.config?.isObjectLookup) {
                    // For object lookups, find the selected option and store the full object
                    const selectedOption = options.find(opt => opt.id === selectedId);
                    if (selectedOption) {
                      // Store the full object data instead of just the ID
                      handleFieldChange(fieldPath, { _id: selectedId, name: selectedOption.label });
                    } else {
                      handleFieldChange(fieldPath, null);
                    }
                  } else {
                    // For regular ID-based lookups, store just the ID
                    handleFieldChange(fieldPath, selectedId);
                  }
                }}
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
              {hasError && (
                <div className="text-red-600 text-sm flex items-center gap-2">
                  <span>❌</span>
                  <span>{hasError}</span>
                  <button 
                    onClick={() => {
                      // Clear error and retry
                      resetLookups();
                      // Re-trigger lookup fetch
                      if (fieldType.config) {
                        fetchLookupOptions(fieldPath, fieldType.config);
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Retry
                  </button>
                </div>
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
              <span className="text-xs text-secondary ml-2">�� Object Field</span>
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
      
      // Enhanced template detection for empty arrays
      const inferTemplateFromFieldName = (fieldName: string) => {
        const lowerFieldName = fieldName.toLowerCase();
        
        // Common patterns for array fields
        if (lowerFieldName.includes('date') || lowerFieldName.includes('special')) {
          return { label: '', date: '' };
        }
        if (lowerFieldName.includes('contact') || lowerFieldName.includes('phone')) {
          return { label: '', value: '' };
        }
        if (lowerFieldName.includes('address')) {
          return { type: '', value: '' };
        }
        if (lowerFieldName.includes('social') || lowerFieldName.includes('link')) {
          return { platform: '', url: '' };
        }
        if (lowerFieldName.includes('tag') || lowerFieldName.includes('category')) {
          return { name: '', value: '' };
        }
        
        // Default pattern for key-value pairs
        return { label: '', value: '' };
      };
      
      const addItem = () => {
        let newItem;
        if (config.isComplexArray && config.itemTemplate && Object.keys(config.itemTemplate).length > 0) {
          // Use the getEmptyFormData function from useLookup to create proper empty template
          newItem = getEmptyFormData([config.itemTemplate], Object.keys(config.itemTemplate));
        } else if (currentArray.length > 0 && currentArray[0]) {
          // Use the first existing item as template
          newItem = getEmptyFormData([currentArray[0]], Object.keys(currentArray[0]));
        } else {
          // Infer template from field name
          newItem = inferTemplateFromFieldName(key);
        }
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

      // Get the template for array items with enhanced fallback logic
      let itemTemplate = config.itemTemplate;
      let templateKeys = Object.keys(itemTemplate || {});
      
      // If template is empty but we have items, use the first item's structure
      if (templateKeys.length === 0 && currentArray.length > 0 && currentArray[0]) {
        itemTemplate = currentArray[0];
        templateKeys = Object.keys(currentArray[0]);
      }
      
      // If still no template, infer from field name
      if (templateKeys.length === 0) {
        itemTemplate = inferTemplateFromFieldName(key);
        templateKeys = Object.keys(itemTemplate);
      }

      // Debug logging
      console.log('🔍 Array Field Debug:', {
        key,
        fieldPath,
        config,
        itemTemplate,
        templateKeys,
        currentArray,
        isComplexArray: config.isComplexArray
      });

      // Check if this is a simple key-value structure (like label-value pairs or label-date pairs)
      let isSimpleKeyValue = templateKeys.length === 2 && 
        (templateKeys.includes('label') && (templateKeys.includes('value') || templateKeys.includes('date')) ||
         templateKeys.includes('key') && templateKeys.includes('value') ||
         templateKeys.includes('name') && templateKeys.includes('value') ||
         templateKeys.includes('platform') && templateKeys.includes('url') ||
         templateKeys.includes('type') && templateKeys.includes('value'));

      // Fallback: If no template but we have existing items, try to detect from the first item
      if (!isSimpleKeyValue && currentArray.length > 0 && currentArray[0]) {
        const firstItemKeys = Object.keys(currentArray[0]);
        isSimpleKeyValue = firstItemKeys.length === 2 && 
          (firstItemKeys.includes('label') && (firstItemKeys.includes('value') || firstItemKeys.includes('date')) ||
           firstItemKeys.includes('key') && firstItemKeys.includes('value') ||
           firstItemKeys.includes('name') && firstItemKeys.includes('value') ||
           firstItemKeys.includes('platform') && firstItemKeys.includes('url') ||
           firstItemKeys.includes('type') && firstItemKeys.includes('value'));
      }

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
              {templateKeys.length > 0 ? (
                <div>
                  <p>No items yet. Click "Add Item" to create a new {formatFieldName(key)} entry.</p>
                  {isSimpleKeyValue && (
                    <p className="text-xs text-gray-400 mt-2">
                      Expected format: {templateKeys.join(' + ')}
                    </p>
                  )}
                </div>
              ) : (
                <p>No items. Click "Add Item" to start.</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {currentArray.map((item, index) => (
                <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">
                        {formatFieldName(key)} #{index + 1}
                      </span>
                    </div>
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
                    isSimpleKeyValue ? (
                      // Simple key-value layout for label-value pairs or label-date pairs
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Label
                          </label>
                          <Input
                            type="text"
                            value={getFieldValue(`${fieldPath}[${index}].label`) || getFieldValue(`${fieldPath}[${index}].key`) || getFieldValue(`${fieldPath}[${index}].name`) || ''}
                            onChange={(e) => {
                              const labelKey = templateKeys.find(k => k === 'label' || k === 'key' || k === 'name');
                              if (labelKey) {
                                handleFieldChange(`${fieldPath}[${index}].${labelKey}`, e.target.value);
                              }
                            }}
                            className="h-10 w-full text-sm"
                            placeholder="Enter label"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {templateKeys.includes('date') ? 'Date' : 'Value'}
                          </label>
                          {templateKeys.includes('date') ? (
                            <Input
                              type="date"
                              value={getFieldValue(`${fieldPath}[${index}].date`) ? String(getFieldValue(`${fieldPath}[${index}].date`)).split('T')[0] : ''}
                              onChange={(e) => handleFieldChange(`${fieldPath}[${index}].date`, e.target.value)}
                              className="h-10 w-full text-sm"
                            />
                          ) : (
                            <Input
                              type="text"
                              value={getFieldValue(`${fieldPath}[${index}].value`) || ''}
                              onChange={(e) => handleFieldChange(`${fieldPath}[${index}].value`, e.target.value)}
                              className="h-10 w-full text-sm"
                              placeholder="Enter value"
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      // Complex layout for other structures
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Render fields based on template or existing item structure */}
                        {templateKeys.length > 0 ? (
                          templateKeys.map((subKey) => {
                            const subValue = itemTemplate[subKey];
                            const fieldType = detectFieldType(subKey, subValue, `${fieldPath}[${index}]`);
                            
                            // Skip internal fields
                            if (!shouldDisplayField(subKey, subValue)) {
                              return null;
                            }

                            return (
                              <div key={subKey} className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  {formatFieldName(subKey)}
                                </label>
                                
                                {/* Render appropriate input based on field type */}
                                {fieldType.type === 'date' ? (
                                  <Input
                                    type="date"
                                    value={getFieldValue(`${fieldPath}[${index}].${subKey}`) ? String(getFieldValue(`${fieldPath}[${index}].${subKey}`)).split('T')[0] : ''}
                                    onChange={(e) => handleFieldChange(`${fieldPath}[${index}].${subKey}`, e.target.value)}
                                    className="h-10 w-full text-sm"
                                  />
                                ) : fieldType.type === 'lookup' ? (
                                  <select
                                    value={getFieldValue(`${fieldPath}[${index}].${subKey}`) || ''}
                                    onChange={(e) => handleFieldChange(`${fieldPath}[${index}].${subKey}`, e.target.value)}
                                    className="h-10 w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  >
                                    <option value="">Select {formatFieldName(subKey)}</option>
                                    {/* Add common options for special dates */}
                                    {subKey === 'label' && [
                                      'Birthday', 'Anniversary', 'Wedding', 'Graduation', 
                                      'Holiday', 'Meeting', 'Appointment', 'Other'
                                    ].map(option => (
                                      <option key={option} value={option}>{option}</option>
                                    ))}
                                  </select>
                                ) : fieldType.type === 'boolean' ? (
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      checked={Boolean(getFieldValue(`${fieldPath}[${index}].${subKey}`))}
                                      onCheckedChange={(checked) => handleFieldChange(`${fieldPath}[${index}].${subKey}`, checked)}
                                    />
                                    <span className="text-sm text-gray-600">Yes</span>
                                  </div>
                                ) : fieldType.type === 'number' ? (
                                  <Input
                                    type="number"
                                    value={getFieldValue(`${fieldPath}[${index}].${subKey}`) || ''}
                                    onChange={(e) => handleFieldChange(`${fieldPath}[${index}].${subKey}`, parseFloat(e.target.value) || 0)}
                                    className="h-10 w-full text-sm"
                                    placeholder={`Enter ${formatFieldName(subKey)}`}
                                  />
                                ) : (
                                  <Input
                                    type="text"
                                    value={getFieldValue(`${fieldPath}[${index}].${subKey}`) || ''}
                                    onChange={(e) => handleFieldChange(`${fieldPath}[${index}].${subKey}`, e.target.value)}
                                    className="h-10 w-full text-sm"
                                    placeholder={`Enter ${formatFieldName(subKey)}`}
                                  />
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="col-span-full text-gray-500 text-center py-4">
                            No template available for this array item
                          </div>
                        )}
                      </div>
                    )
                  ) : (
                    <Input
                      type="text"
                      value={item || ''}
                      onChange={(e) => updateItem(index, e.target.value)}
                      placeholder={`Enter ${formatFieldName(key)} item`}
                      className="h-10 w-full"
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
         // Skip fields that shouldn't be displayed (including "is" fields)
         if (!shouldDisplayField(key, value)) {
           return;
         }
         
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
      
      // Use the filterSubmitFields function from useLookup hook
      const cleanedFormState = filterSubmitFields(formState);
      
      console.log('Submitting cleaned form state:', cleanedFormState);
      onSubmit(cleanedFormState);
    }

         return (
       <form
         onSubmit={handleSubmit}
         className="w-full h-full bg-white p-0 m-0 flex flex-col overflow-auto"
       >
        <div className="mb-6 px-6 pt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {Object.keys(formState).some(k => formState[k] && typeof formState[k] === 'object' && (formState[k] as any)._id) 
              ? 'Edit Item' 
              : 'Add New Item'
            }
          </h2>
          <p className="text-gray-600">
            Form fields are automatically generated based on your JSON data structure
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