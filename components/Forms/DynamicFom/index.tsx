import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
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
    const [initialData, setInitialData] = useState<Record<string, unknown>>(data || {});
    const [currentStep, setCurrentStep] = useState(0);
    
    // Use the lookup hook instead of duplicating functions
    const {
      lookupOptions,
      lookupErrors,
      detectFieldType,
      formatFieldName,
      shouldDisplayField,
      fetchLookupOptions,
      resetLookups,
      filterSubmitFields,
      getEmptyFormData,
    } = useLookup({ data });

    // Update form state when data changes, but preserve user input
    useEffect(() => {
      if (data) {
        const isNewForm = JSON.stringify(initialData) !== JSON.stringify(data);
        
        if (isNewForm) {
          setInitialData(data);
          setFormState(data);
          setCurrentStep(0); // Reset to first step for new form
        } else {
          setFormState(prev => {
            if (!prev || Object.keys(prev).length === 0) {
              return data;
            }
            return prev;
          });
        }
      }
    }, [data, initialData]);

    // Handle form field changes with deep object support
    function handleFieldChange(fieldPath: string, newValue: any) {
      setFormState(prev => {
        const newState = { ...prev };
        const pathParts = fieldPath.split('.');
        
        let current: any = newState;
        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i];
          
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

    // Organize fields into steps with type-based organization
    function organizeFieldsIntoSteps(): Array<{
      title: string;
      fields: Array<[string, unknown, string]>;
      stepType: 'basic' | 'complex';
    }> {
      const steps: Array<{
        title: string;
        fields: Array<[string, unknown, string]>;
        stepType: 'basic' | 'complex';
      }> = [];
      
      const fieldGroups = organizeFields(formState);
      
      // Step 1: Basic Information (combines basic, lookup, and status fields)
      const basicStepFields = [
        ...fieldGroups.basic,
        ...fieldGroups.lookup,
        ...fieldGroups.status
      ];
      
      if (basicStepFields.length > 0) {
        steps.push({
          title: 'Basic Information',
          fields: basicStepFields,
          stepType: 'basic'
        });
      }
      
      // Additional steps: Each complex field gets its own step
      fieldGroups.complex.forEach(([key, value, fieldPath]) => {
        steps.push({
          title: formatFieldName(key),
          fields: [[key, value, fieldPath]],
          stepType: 'complex'
        });
      });
      
      return steps;
    }

    const steps = organizeFieldsIntoSteps();

    // Render field based on its type
    function renderField(key: string, value: unknown, fieldPath: string): React.ReactNode {
      const fieldType = detectFieldType(key, value, fieldPath.split('.').slice(0, -1).join('.'));
      const currentValue = getFieldValue(fieldPath);
      
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
          const isLoadingLookup = !options.length && !lookupErrors[fieldPath];
          const hasError = lookupErrors[fieldPath];
          
          let selectValue = '';
          if (fieldType.config?.isArrayItemLookup) {
            selectValue = currentValue || '';
          } else if (currentValue && typeof currentValue === 'object' && currentValue !== null) {
            selectValue = (currentValue as any)._id || (currentValue as any).id || '';
          } else {
            selectValue = currentValue || '';
          }
          
          return (
            <div key={fieldPath} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {formatFieldName(key)}
                <span className="text-xs text-blue-600 ml-2">Lookup Field</span>
              </label>
              <select
                value={selectValue}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  if (fieldType.config?.isArrayItemLookup) {
                    const selectedOption = options.find(opt => opt.id === selectedId);
                    handleFieldChange(fieldPath, selectedOption ? selectedOption.label : '');
                  } else if (fieldType.config?.isObjectLookup) {
                    const selectedOption = options.find(opt => opt.id === selectedId);
                    if (selectedOption) {
                      handleFieldChange(fieldPath, { _id: selectedId, name: selectedOption.label });
                    } else {
                      handleFieldChange(fieldPath, null);
                    }
                  } else {
                    handleFieldChange(fieldPath, selectedId);
                  }
                }}
                className={`${commonInputProps.className} ${hasError ? 'border-red-500' : ''}`}
                disabled={isLoadingLookup}
              >
                <option value="">
                  {isLoadingLookup ? 'Loading options...' : `Select ${formatFieldName(key)}`}
                </option>
                {options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              {hasError && (
                <div className="text-red-600 text-sm flex items-center gap-2">
                  <span>Error</span>
                  <span>{hasError}</span>
                  <button 
                    onClick={() => {
                      resetLookups();
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
              {isLoadingLookup && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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
                <span className="text-xs text-secondary ml-2">Status Field</span>
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
                <span className="text-xs text-secondary ml-2">Date Field</span>
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
                  <span className="text-xs text-secondary ml-2">Boolean Field</span>
                </span>
              </label>
            </div>
          );

        case 'number':
          return (
            <div key={fieldPath} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {formatFieldName(key)}
                <span className="text-xs text-secondary ml-2">Number Field</span>
              </label>
              <Input
                type="number"
                value={currentValue ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    handleFieldChange(fieldPath, undefined);
                    return;
                  }
                  if (!isNaN(Number(val))) {
                    handleFieldChange(fieldPath, val);
                  }
                }}
                placeholder={commonInputProps.placeholder}
              />
            </div>
          );

        case 'array':
          return renderArrayField(key, value as any[], fieldPath, fieldType.config);

        case 'object':
          return renderObjectField(key, value as Record<string, unknown>, fieldPath, 0);

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
              <span className="text-xs text-secondary ml-2">Object Field</span>
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(obj).map(([subKey, subValue]) => 
              renderField(subKey, subValue, `${fieldPath}.${subKey}`)
            )}
          </div>
        </div>
      );
    }

    // Render array fields with dynamic item management
    function renderArrayField(key: string, arr: any[], fieldPath: string, config: any): React.ReactNode {
      const currentArray = getFieldValue(fieldPath) as any[] || [];
      
      const inferTemplateFromFieldName = (fieldName: string) => {
        const lowerFieldName = fieldName.toLowerCase();
        
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
        
        return { label: '', value: '' };
      };
      
      const addItem = () => {
        let newItem;
        if (config.isComplexArray && config.itemTemplate && Object.keys(config.itemTemplate).length > 0) {
          newItem = getEmptyFormData([config.itemTemplate], Object.keys(config.itemTemplate));
        } else if (currentArray.length > 0 && currentArray[0]) {
          newItem = getEmptyFormData([currentArray[0]], Object.keys(currentArray[0]));
        } else {
          newItem = inferTemplateFromFieldName(key);
        }
        handleFieldChange(fieldPath, [...currentArray, newItem]);
      };

      const removeItem = (index: number) => {
        const newArray = currentArray.filter((_, i) => i !== index);
        handleFieldChange(fieldPath, newArray);
      };

      let itemTemplate = config.itemTemplate;
      let templateKeys = Object.keys(itemTemplate || {});
      
      if (templateKeys.length === 0 && currentArray.length > 0 && currentArray[0]) {
        itemTemplate = currentArray[0];
        templateKeys = Object.keys(currentArray[0]);
      }
      
      if (templateKeys.length === 0) {
        itemTemplate = inferTemplateFromFieldName(key);
        templateKeys = Object.keys(itemTemplate);
      }

      let isSimpleKeyValue = templateKeys.length === 2 && 
        (templateKeys.includes('label') && (templateKeys.includes('value') || templateKeys.includes('date')) ||
         templateKeys.includes('key') && templateKeys.includes('value') ||
         templateKeys.includes('name') && templateKeys.includes('value') ||
         templateKeys.includes('platform') && templateKeys.includes('url') ||
         templateKeys.includes('type') && templateKeys.includes('value'));

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
                <span className="text-xs text-secondary ml-2">Array Field</span>
              </h3>
            </div>
            <Button
              type="button"
              onClick={addItem}
              variant="outline"
              size="sm"
            >
              Add Item
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {templateKeys.length > 0 ? (
                          templateKeys.map((subKey) => {
                            const subValue = itemTemplate[subKey];
                            const fieldType = detectFieldType(subKey, subValue, `${fieldPath}[${index}]`);
                            
                            if (!shouldDisplayField(subKey, subValue)) {
                              return null;
                            }

                            return (
                              <div key={subKey} className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  {formatFieldName(subKey)}
                                </label>
                                
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
                      onChange={(e) => {
                        const newArray = [...currentArray];
                        newArray[index] = e.target.value;
                        handleFieldChange(fieldPath, newArray);
                      }}
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

    function handleSubmit() {
      const cleanedFormState = filterSubmitFields(formState);
      console.log('Submitting cleaned form state:', cleanedFormState);
      onSubmit(cleanedFormState);
    }

    function nextStep() {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }

    function prevStep() {
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1);
      }
    }

    function goToStep(stepIndex: number) {
      if (stepIndex >= 0 && stepIndex < steps.length) {
        setCurrentStep(stepIndex);
      }
    }

    if (steps.length === 0) {
      return (
        <div className="w-full h-full bg-white p-6 flex items-center justify-center">
          <p className="text-gray-500">No form fields available</p>
        </div>
      );
    }

    const currentStepData = steps[currentStep];

    return (
      <div className="w-full h-full bg-white flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <h2 className="text-2xl font-bold mb-2">
            {Object.keys(formState).some(k => formState[k] && typeof formState[k] === 'object' && (formState[k] as any)._id) 
              ? 'Edit Item' 
              : 'Add New Item'
            }
          </h2>
          <p className="text-blue-100">
            Complete the form step by step with organized field types
          </p>
        </div>

        {/* Stepper */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <button
                  type="button"
                  onClick={() => goToStep(index)}
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                    index === currentStep
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : index < currentStep
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400'
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </button>
                
                <div className="ml-3 mr-8">
                  <button
                    type="button"
                    onClick={() => goToStep(index)}
                    className={`text-sm font-medium transition-colors ${
                      index === currentStep
                        ? 'text-blue-600'
                        : index < currentStep
                        ? 'text-green-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {step.title}
                  </button>
                  <div className={`text-xs ${
                    index === currentStep ? 'text-blue-500' : 'text-gray-400'
                  }`}>
                    {step.fields.length} field{step.fields.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {index < steps.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-gray-300 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        <div className="flex-1 px-6 py-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {currentStepData.title}
              </h3>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>

            {currentStepData.stepType === 'basic' ? (
              // Basic step with type-organized sections
              <div className="space-y-8">
                {/* Organize basic step fields by type */}
                {(() => {
                  const basicFields = currentStepData.fields.filter(([key, value, fieldPath]) => {
                    const fieldType = detectFieldType(key, value, fieldPath.split('.').slice(0, -1).join('.'));
                    return !['lookup', 'status'].includes(fieldType.type);
                  });
                  
                  const lookupFields = currentStepData.fields.filter(([key, value, fieldPath]) => {
                    const fieldType = detectFieldType(key, value, fieldPath.split('.').slice(0, -1).join('.'));
                    return fieldType.type === 'lookup';
                  });
                  
                  const statusFields = currentStepData.fields.filter(([key, value, fieldPath]) => {
                    const fieldType = detectFieldType(key, value, fieldPath.split('.').slice(0, -1).join('.'));
                    return fieldType.type === 'status';
                  });

                  return (
                    <>
                      {/* Basic Fields */}
                      {basicFields.length > 0 && (
                        <section>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                            <h4 className="text-lg font-semibold text-gray-800">Core Information</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {basicFields.map(([key, value, fieldPath]) => 
                              renderField(key, value, fieldPath)
                            )}
                          </div>
                        </section>
                      )}

                      {/* Lookup Fields */}
                      {lookupFields.length > 0 && (
                        <section>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                            <h4 className="text-lg font-semibold text-gray-800">Related Data</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {lookupFields.map(([key, value, fieldPath]) => 
                              renderField(key, value, fieldPath)
                            )}
                          </div>
                        </section>
                      )}

                      {/* Status Fields */}
                      {statusFields.length > 0 && (
                        <section>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-1 h-6 bg-amber-500 rounded-full"></div>
                            <h4 className="text-lg font-semibold text-gray-800">Status & State</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {statusFields.map(([key, value, fieldPath]) => 
                              renderField(key, value, fieldPath)
                            )}
                          </div>
                        </section>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              // Complex step - single complex field
              <div className="space-y-6">
                {currentStepData.fields.map(([key, value, fieldPath]) => 
                  renderField(key, value, fieldPath)
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                variant="outline"
              >
                Cancel
              </Button>
              
              {currentStep > 0 && (
                <Button
                  type="button"
                  onClick={prevStep}
                  disabled={isLoading}
                  variant="outline"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>

            <div className="flex gap-3">
              {currentStep < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={isLoading}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Complete
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
}