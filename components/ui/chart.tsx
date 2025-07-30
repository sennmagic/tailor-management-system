"use client";

import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, ShoppingCart, DollarSign, Calendar, Package, Truck, Factory, FileText, Filter, BarChart, LineChart, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ChartData {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}

interface TimeSeriesData {
  date: string;
  value: number;
  series: string;
}

interface StatisticsChartProps {
  data: any[];
  slug: string;
  className?: string;
  loading?: boolean;
  error?: string | null;
}

type ChartType = 'area' | 'bar' | 'line' | 'pie';
type TimeRange = '7d' | '30d' | '3m' | '6m' | '12m' | 'all';

export function StatisticsChart({ data, slug, className = "", loading = false, error = null }: StatisticsChartProps) {
  const [chartType, setChartType] = useState<ChartType>('area');
  const [timeRange, setTimeRange] = useState<TimeRange>('12m');
  const [selectedMetric, setSelectedMetric] = useState<string>('all');

  // Log the data being received
  console.log(`📊 StatisticsChart received data:`, {
    slug,
    dataLength: data?.length || 0,
    loading,
    error,
    sampleData: data?.[0] ? Object.keys(data[0]).slice(0, 5) : 'No data'
  });

  // Generate time series data for the area chart
  const timeSeriesData = useMemo(() => {
    if (!data.length) return [];

    console.log(`🔄 Processing statistics data for ${slug}...`);
    
    // If data is already in time series format from statistics endpoint
    if (data[0] && (data[0].date || data[0].month || data[0].timeSeries)) {
      console.log(`📊 Using pre-formatted statistics data for ${slug}:`, data);
      return data.map((item: any) => ({
        date: item.date || item.month || item.period,
        value: item.value || item.count || item.total,
        series: item.series || item.category || 'Total'
      }));
    }
    
    // Fallback to generating time series from raw data with flexible field detection
    console.log(`🔄 Generating time series from raw data for ${slug}...`);
    const seriesData: TimeSeriesData[] = [];
    const now = new Date();
    
    // Detect date field dynamically
    const getDateField = (item: any) => {
      const dateFields = ['createdAt', 'created_at', 'date', 'timestamp', 'created', 'updatedAt', 'updated_at'];
      for (const field of dateFields) {
        if (item[field]) {
          console.log(`📅 Found date field: ${field} = ${item[field]}`);
          return item[field];
        }
      }
      return null;
    };
    
    // Detect status field dynamically
    const getStatusField = (item: any) => {
      const statusFields = ['status', 'state', 'condition', 'phase', 'stage', 'type'];
      for (const field of statusFields) {
        if (item[field]) {
          console.log(`🏷️ Found status field: ${field} = ${item[field]}`);
          return item[field];
        }
      }
      return null;
    };
    
    // Calculate months to show based on time range
    const getMonthsToShow = () => {
      switch (timeRange) {
        case '7d': return 1;
        case '30d': return 1;
        case '3m': return 3;
        case '6m': return 6;
        case '12m': return 12;
        case 'all': return 12;
        default: return 12;
      }
    };
    
    const monthsToShow = getMonthsToShow();
    
    // Generate monthly data points
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
      
      // Count items for this month
      const monthItems = data.filter((item: any) => {
        const itemDate = getDateField(item);
        if (!itemDate) return false;
        
        const itemDateObj = new Date(itemDate);
        return itemDateObj.getFullYear() === date.getFullYear() && 
               itemDateObj.getMonth() === date.getMonth();
      });
      
      seriesData.push({
        date: monthKey,
        value: monthItems.length,
        series: 'Total'
      });
    }
    
    console.log(`📊 Generated time series data for ${slug}:`, seriesData);
    return seriesData;
  }, [data, timeRange]);

  // Generate statistics cards
  const statistics = useMemo(() => {
    if (!data.length) return [];

    const totalItems = data.length;
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    
    const thisMonthItems = data.filter((item: any) => {
      const dateField = ['createdAt', 'created_at', 'date', 'timestamp', 'created', 'updatedAt', 'updated_at']
        .find(field => item[field]);
      
      if (!dateField) return false;
      
      const itemDate = new Date(item[dateField]);
      return itemDate.getMonth() === thisMonth && itemDate.getFullYear() === thisYear;
    }).length;

    return [
      {
        label: 'Total Records',
        value: totalItems,
        color: 'bg-blue-500',
        icon: <BarChart3 className="w-5 h-5" />
      },
      {
        label: 'This Month',
        value: thisMonthItems,
        color: 'bg-green-500',
        icon: <Calendar className="w-5 h-5" />
      }
    ];
  }, [data]);

  const getSeriesColor = (series: string) => {
    const colors = {
      'Total': 'bg-primary',
      'Orders': 'bg-primary',
      'Customers': 'bg-secondary',
      'Revenue': 'bg-secondary',
      'default': 'bg-primary'
    };
    return colors[series as keyof typeof colors] || colors.default;
  };

  const getSlugIcon = () => {
    const icons = {
      'orders': <ShoppingCart className="w-5 h-5" />,
      'customers': <Users className="w-5 h-5" />,
      'products': <Package className="w-5 h-5" />,
      'factories': <Factory className="w-5 h-5" />,
      'vendors': <Truck className="w-5 h-5" />,
      'default': <BarChart3 className="w-5 h-5" />
    };
    return icons[slug as keyof typeof icons] || icons.default;
  };

  // Render chart based on type
  const renderChart = () => {
    if (!timeSeriesData.length) {
      return (
        <div className="flex items-center justify-center h-80 text-gray-500">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">No data available</p>
          </div>
        </div>
      );
    }

    const maxValue = Math.max(...timeSeriesData.map(d => d.value), 1);
    const filteredData = timeSeriesData.slice(0, 6);

    return (
      <div className="relative h-64">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500">
          <span>{Math.round(maxValue)}</span>
          <span>{Math.round(maxValue * 0.75)}</span>
          <span>{Math.round(maxValue * 0.5)}</span>
          <span>{Math.round(maxValue * 0.25)}</span>
          <span>0</span>
        </div>
        
        {/* Chart area */}
        <div className="ml-8 h-full relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="border-t border-gray-200" />
            ))}
          </div>
          
          {/* Area chart */}
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              <linearGradient id="gradient-blue" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.6" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            
            {/* Area fill */}
            <path
              d={`M 0 100 L ${filteredData.map((point, index) => {
                const x = (index / (filteredData.length - 1)) * 100;
                const y = 100 - ((point.value / maxValue) * 100);
                return `${x}% ${y}%`;
              }).join(' L ')} L 100% 100% Z`}
              fill="url(#gradient-blue)"
              opacity="0.3"
            />
            
            {/* Line */}
            <polyline
              points={filteredData.map((point, index) => {
                const x = (index / (filteredData.length - 1)) * 100;
                const y = 100 - ((point.value / maxValue) * 100);
                return `${x}% ${y}%`;
              }).join(', ')}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Data points */}
            {filteredData.map((point, index) => {
              const x = (index / (filteredData.length - 1)) * 100;
              const y = 100 - ((point.value / maxValue) * 100);
              return (
                <circle
                  key={index}
                  cx={`${x}%`}
                  cy={`${y}%`}
                  r="3"
                  fill="var(--primary)"
                  stroke="white"
                  strokeWidth="1"
                />
              );
            })}
          </svg>
          
          {/* X-axis labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
            {filteredData.map((item, i) => (
              <span key={i} className="bg-white px-2 py-1 rounded border">
                {item.date}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>Error loading chart data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  try {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {statistics.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.color} text-white`}>
                  {stat.icon}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${getSeriesColor('Total')} text-white`}>
                  {getSlugIcon()}
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">
                    {slug.charAt(0).toUpperCase() + slug.slice(1)} Analytics
                  </CardTitle>
                  <p className="text-sm text-gray-600">Performance overview</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="3m">Last 3 months</SelectItem>
                    <SelectItem value="6m">Last 6 months</SelectItem>
                    <SelectItem value="12m">Last 12 months</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {renderChart()}
          </CardContent>
        </Card>
      </div>
    );
  } catch (err) {
    console.error('Error rendering StatisticsChart:', err);
    return (
      <Card className={`${className}`}>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>Error rendering statistics chart</p>
          </div>
        </CardContent>
      </Card>
    );
  }
} 