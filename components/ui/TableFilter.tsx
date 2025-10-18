"use client";
import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search, 
  Filter, 
  Calendar, 
  X, 
  ChevronDown, 
  ChevronUp,
  RotateCcw
} from "lucide-react";
import { format, subDays, subMonths, subYears, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

interface FilterOption {
  label: string;
  value: string;
}

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface TableFilterProps {
  data: Array<Record<string, unknown>>;
  onFilteredDataChange: (filteredData: Array<Record<string, unknown>>) => void;
  searchFields?: string[];
  statusFields?: string[];
  dateFields?: string[];
  numberFields?: string[];
  className?: string;
}

export function TableFilter({
  data,
  onFilteredDataChange,
  searchFields = [],
  statusFields = [],
  dateFields = [],
  numberFields = [],
  className = ""
}: TableFilterProps) {
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<Record<string, string>>({});
  const [dateRanges, setDateRanges] = useState<Record<string, DateRange>>({});
  const [numberRanges, setNumberRanges] = useState<Record<string, { min: string; max: string }>>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Auto-detect fields if not provided
  const detectedFields = useMemo(() => {
    if (data.length === 0) return { searchFields: [], statusFields: [], dateFields: [], numberFields: [] };
    
    const firstItem = data[0];
    const keys = Object.keys(firstItem);
    
    const search = keys.filter(key => {
      const value = firstItem[key];
      return typeof value === 'string' && !key.includes('Id') && !key.includes('Date') && !key.includes('Status');
    });
    
    const status = keys.filter(key => 
      key.toLowerCase().includes('status') || 
      key.toLowerCase().includes('state') ||
      key.toLowerCase().includes('condition')
    );
    
    const date = keys.filter(key => 
      key.toLowerCase().includes('date') || 
      key.toLowerCase().includes('time') ||
      key.toLowerCase().includes('created') ||
      key.toLowerCase().includes('updated')
    );
    
    const number = keys.filter(key => {
      const value = firstItem[key];
      return typeof value === 'number' || 
             (typeof value === 'string' && !isNaN(Number(value)) && value !== '');
    });
    
    return { searchFields: search, statusFields: status, dateFields: date, numberFields: number };
  }, [data]);

  // Use detected fields if not provided
  const finalSearchFields = searchFields.length > 0 ? searchFields : detectedFields.searchFields;
  const finalStatusFields = statusFields.length > 0 ? statusFields : detectedFields.statusFields;
  const finalDateFields = dateFields.length > 0 ? dateFields : detectedFields.dateFields;
  const finalNumberFields = numberFields.length > 0 ? numberFields : detectedFields.numberFields;

  // Get unique values for status fields
  const statusOptions = useMemo(() => {
    const options: Record<string, FilterOption[]> = {};
    
    finalStatusFields.forEach(field => {
      const values = new Set<string>();
      data.forEach(item => {
        const value = item[field];
        if (value && typeof value === 'string') {
          values.add(value);
        }
      });
      options[field] = Array.from(values).map(value => ({
        label: value.charAt(0).toUpperCase() + value.slice(1),
        value: value
      }));
    });
    
    return options;
  }, [data, finalStatusFields]);

  // Apply filters
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        finalSearchFields.some(field => {
          const value = item[field];
          return value && String(value).toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Status filters
    Object.entries(selectedStatus).forEach(([field, value]) => {
      if (value && value !== 'all') {
        filtered = filtered.filter(item => item[field] === value);
      }
    });

    // Date range filters
    Object.entries(dateRanges).forEach(([field, range]) => {
      if (range.from || range.to) {
        filtered = filtered.filter(item => {
          const fieldValue = item[field];
          if (!fieldValue) return false;
          
          // Handle different date formats
          let itemDate: Date;
          if (typeof fieldValue === 'string') {
            // Try parsing ISO date string or other formats
            itemDate = new Date(fieldValue);
          } else if (fieldValue instanceof Date) {
            itemDate = fieldValue;
          } else {
            return false;
          }
          
          if (isNaN(itemDate.getTime())) return false;
          
          // Normalize dates to start/end of day for proper comparison
          const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
          
          if (range.from) {
            const fromDate = new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate());
            if (itemDateOnly < fromDate) return false;
          }
          
          if (range.to) {
            const toDate = new Date(range.to.getFullYear(), range.to.getMonth(), range.to.getDate());
            if (itemDateOnly > toDate) return false;
          }
          
          return true;
        });
      }
    });

    // Number range filters
    Object.entries(numberRanges).forEach(([field, range]) => {
      if (range.min || range.max) {
        filtered = filtered.filter(item => {
          const value = Number(item[field]);
          if (isNaN(value)) return false;
          
          if (range.min && value < Number(range.min)) return false;
          if (range.max && value > Number(range.max)) return false;
          
          return true;
        });
      }
    });

    return filtered;
  }, [data, searchTerm, selectedStatus, dateRanges, numberRanges, finalSearchFields]);

  // Update active filters
  useEffect(() => {
    const active: string[] = [];
    
    if (searchTerm) active.push(`Search: "${searchTerm}"`);
    
    Object.entries(selectedStatus).forEach(([field, value]) => {
      if (value && value !== 'all') active.push(`${field}: ${value}`);
    });
    
    Object.entries(dateRanges).forEach(([field, range]) => {
      if (range.from || range.to) {
        if (range.from && range.to) {
          const from = format(range.from, 'MMM dd');
          const to = format(range.to, 'MMM dd');
          active.push(`${field}: ${from} - ${to}`);
        } else if (range.from) {
          const from = format(range.from, 'MMM dd');
          active.push(`${field}: from ${from}`);
        } else if (range.to) {
          const to = format(range.to, 'MMM dd');
          active.push(`${field}: until ${to}`);
        }
      }
    });
    
    Object.entries(numberRanges).forEach(([field, range]) => {
      if (range.min || range.max) {
        const min = range.min || 'Min';
        const max = range.max || 'Max';
        active.push(`${field}: ${min} - ${max}`);
      }
    });
    
    setActiveFilters(active);
  }, [searchTerm, selectedStatus, dateRanges, numberRanges]);

  // Notify parent of filtered data changes
  useEffect(() => {
    onFilteredDataChange(filteredData);
  }, [filteredData, onFilteredDataChange]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedStatus({});
    setDateRanges({});
    setNumberRanges({});
  };

  // Quick date range presets
  const datePresets = [
    { label: "Today", getRange: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
    { label: "Yesterday", getRange: () => ({ from: startOfDay(subDays(new Date(), 1)), to: endOfDay(subDays(new Date(), 1)) }) },
    { label: "Last 7 days", getRange: () => ({ from: startOfDay(subDays(new Date(), 7)), to: endOfDay(new Date()) }) },
    { label: "Last 30 days", getRange: () => ({ from: startOfDay(subDays(new Date(), 30)), to: endOfDay(new Date()) }) },
    { label: "This month", getRange: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
    { label: "Last month", getRange: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
    { label: "Last 3 months", getRange: () => ({ from: startOfDay(subMonths(new Date(), 3)), to: endOfDay(new Date()) }) },
    { label: "This year", getRange: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }) },
    { label: "Last year", getRange: () => ({ from: startOfYear(subYears(new Date(), 1)), to: endOfYear(subYears(new Date(), 1)) }) },
  ];

  const applyDatePreset = (field: string, preset: typeof datePresets[0]) => {
    const range = preset.getRange();
    setDateRanges(prev => ({
      ...prev,
      [field]: range
    }));
  };

  return (
    <Card className={`mb-6 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
            {activeFilters.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilters.length}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {isExpanded ? "Less" : "More"}
            </Button>
            {activeFilters.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Clear All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search across all fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter, index) => (
              <Badge key={index} variant="outline" className="flex items-center gap-1">
                {filter}
                <X 
                  className="w-3 h-3 cursor-pointer hover:text-red-500" 
                  onClick={() => {
                    // Remove specific filter logic would go here
                    clearAllFilters();
                  }}
                />
              </Badge>
            ))}
          </div>
        )}

        {/* Results Count */}
        <div className="text-sm text-gray-600">
          Showing {filteredData.length} of {data.length} results
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            {/* Status Filters */}
            {finalStatusFields.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {finalStatusFields.map(field => (
                  <div key={field} className="space-y-2">
                    <label className="text-sm font-medium capitalize">
                      {field.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <Select
                      value={selectedStatus[field] || "all"}
                      onValueChange={(value) => setSelectedStatus(prev => ({
                        ...prev,
                        [field]: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`All ${field}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All {field}</SelectItem>
                        {statusOptions[field]?.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}

            {/* Date Range Filters */}
            {finalDateFields.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Date Ranges</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {finalDateFields.map(field => (
                    <div key={field} className="space-y-2">
                      <label className="text-sm font-medium capitalize">
                        {field.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      
                      {/* Quick Presets */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {datePresets.map(preset => (
                          <Button
                            key={preset.label}
                            variant="outline"
                            size="sm"
                            onClick={() => applyDatePreset(field, preset)}
                            className="text-xs h-7"
                          >
                            {preset.label}
                          </Button>
                        ))}
                      </div>
                      
                      {/* Date Inputs */}
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          placeholder="From"
                          value={dateRanges[field]?.from ? format(dateRanges[field].from!, 'yyyy-MM-dd') : ''}
                          onChange={(e) => setDateRanges(prev => ({
                            ...prev,
                            [field]: {
                              ...prev[field],
                              from: e.target.value ? new Date(e.target.value) : null
                            }
                          }))}
                          className="text-sm"
                        />
                        <Input
                          type="date"
                          placeholder="To"
                          value={dateRanges[field]?.to ? format(dateRanges[field].to!, 'yyyy-MM-dd') : ''}
                          onChange={(e) => setDateRanges(prev => ({
                            ...prev,
                            [field]: {
                              ...prev[field],
                              to: e.target.value ? new Date(e.target.value) : null
                            }
                          }))}
                          className="text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDateRanges(prev => ({
                            ...prev,
                            [field]: { from: null, to: null }
                          }))}
                          className="px-2"
                          title="Clear date filter"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Number Range Filters */}
            {finalNumberFields.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Number Ranges</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {finalNumberFields.map(field => (
                    <div key={field} className="space-y-2">
                      <label className="text-sm font-medium capitalize">
                        {field.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={numberRanges[field]?.min || ''}
                          onChange={(e) => setNumberRanges(prev => ({
                            ...prev,
                            [field]: {
                              ...prev[field],
                              min: e.target.value
                            }
                          }))}
                          className="text-sm"
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={numberRanges[field]?.max || ''}
                          onChange={(e) => setNumberRanges(prev => ({
                            ...prev,
                            [field]: {
                              ...prev[field],
                              max: e.target.value
                            }
                          }))}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
