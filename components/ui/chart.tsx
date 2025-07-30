"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchAPI } from "@/lib/apiService";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, ShoppingCart, DollarSign, Calendar, Package, Truck, Factory, FileText } from "lucide-react";

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
  slug: string;
  className?: string;
}

export function StatisticsChart({ slug, className = "" }: StatisticsChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from the dynamic stats endpoint
  useEffect(() => {
    if (!slug) return;
    
    // Determine the endpoint based on slug pattern
    let endpoint = slug;
    
    // Special handling for endpoints that don't have stats
    if (slug === 'catalogs' || slug === 'orders') {
      // Skip statistics for these endpoints as they may not have stats endpoints
      console.log(`⚠️ Skipping statistics for ${slug} - stats endpoint may not exist`);
      setLoading(false);
      setData([]);
      return;
    }
    
    // If slug already contains 'stats', use it as is
    if (slug.includes('stats')) {
      endpoint = slug;
    } else {
      // Otherwise, append '/stats' to the slug
      endpoint = `${slug}/stats`;
    }
    
    console.log(`📊 Fetching statistics from endpoint: /${endpoint}`);
    setLoading(true);
    setError(null); // Reset error state
    
    fetchAPI({ endpoint, method: "GET" }).then(({ data, error }) => {
      if (error) {
        console.error(`❌ Error fetching from /${endpoint}:`, error);
        setError(error);
        setData([]); // Reset data on error
      } else {
        console.log(`✅ Statistics data from /${endpoint}:`, data);
        setData(data || []);
      }
      setLoading(false);
    }).catch((err) => {
      console.error(`❌ Unexpected error fetching from /${endpoint}:`, err);
      setError('Failed to load statistics');
      setData([]);
      setLoading(false);
    });
  }, [slug]);

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
    
    // Fallback to generating time series from raw data
    console.log(`🔄 Generating time series from raw data for ${slug}...`);
    const seriesData: TimeSeriesData[] = [];
    const now = new Date();
    
    // Generate last 12 months of data
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      // Count records by month
      const monthData = data.filter((item: any) => {
        if (!item.createdAt) return false;
        const itemDate = new Date(item.createdAt);
        return itemDate.getFullYear() === date.getFullYear() && 
               itemDate.getMonth() === date.getMonth();
      });
      
      // Add total count
      seriesData.push({
        date: monthKey,
        value: monthData.length,
        series: 'Total'
      });
      
      // Add status-based series
      const statusCounts: Record<string, number> = {};
      monthData.forEach((item: any) => {
        if (item.status) {
          statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
        }
      });
      
      Object.entries(statusCounts).forEach(([status, count]) => {
        seriesData.push({
          date: monthKey,
          value: count,
          series: status.charAt(0).toUpperCase() + status.slice(1)
        });
      });
    }
    
    console.log(`📊 Generated time series data for ${slug}:`, seriesData);
    return seriesData;
  }, [data, slug]);

  // Generate statistics based on the data
  const statistics = useMemo(() => {
    if (!data.length) return [];

    const stats: ChartData[] = [];
    
    // Total count
    stats.push({
      label: "Total Records",
      value: data.length,
      color: "bg-blue-500",
      icon: <BarChart3 className="w-5 h-5" />
    });

    // Status-based statistics
    const statusCounts: Record<string, number> = {};
    const dateCounts: Record<string, number> = {};
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    data.forEach((item: any) => {
      // Count by status
      if (item.status) {
        statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
      }
      
      // Count by creation month
      if (item.createdAt) {
        const date = new Date(item.createdAt);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        dateCounts[monthKey] = (dateCounts[monthKey] || 0) + 1;
      }
    });

    // Add status statistics
    Object.entries(statusCounts).forEach(([status, count]) => {
      const colorMap: Record<string, string> = {
        'pending': 'bg-yellow-500',
        'completed': 'bg-green-500',
        'active': 'bg-blue-500',
        'inactive': 'bg-gray-500',
        'approved': 'bg-green-500',
        'rejected': 'bg-red-500',
        'processing': 'bg-orange-500',
        'cancelled': 'bg-red-500',
        'delivered': 'bg-green-500',
        'shipped': 'bg-blue-500'
      };

      stats.push({
        label: `${status.charAt(0).toUpperCase() + status.slice(1)}`,
        value: count,
        color: colorMap[status.toLowerCase()] || 'bg-purple-500',
        icon: <TrendingUp className="w-5 h-5" />
      });
    });

    // Add monthly statistics
    const thisMonthCount = dateCounts[`${currentYear}-${currentMonth + 1}`] || 0;
    if (thisMonthCount > 0) {
      stats.push({
        label: "This Month",
        value: thisMonthCount,
        color: "bg-indigo-500",
        icon: <Calendar className="w-5 h-5" />
      });
    }

    // Add specific statistics based on slug
    if (slug === 'customers' || slug === 'employees') {
      const activeCount = data.filter((item: any) => item.status === 'active').length;
      stats.push({
        label: "Active",
        value: activeCount,
        color: "bg-green-500",
        icon: <Users className="w-5 h-5" />
      });
    }

    if (slug === 'orders') {
      const totalValue = data.reduce((sum: number, item: any) => {
        return sum + (item.totalAmount || item.amount || item.price || 0);
      }, 0);
      
      if (totalValue > 0) {
        stats.push({
          label: "Total Value",
          value: totalValue,
          color: "bg-green-500",
          icon: <DollarSign className="w-5 h-5" />
        });
      }
    }

    return stats.slice(0, 6); // Limit to 6 stats
  }, [data, slug]);

  // Get unique series names
  const seriesNames = useMemo(() => {
    const names = [...new Set(timeSeriesData.map(item => item.series))];
    return names;
  }, [timeSeriesData]);

  // Get color for series
  const getSeriesColor = (series: string) => {
    const colors = [
      'bg-blue-500',
      'bg-orange-500', 
      'bg-red-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500'
    ];
    const index = seriesNames.indexOf(series);
    return colors[index % colors.length];
  };

  // Get icon based on slug
  const getSlugIcon = () => {
    const slugLower = slug.toLowerCase();
    if (slugLower.includes('customer')) return <Users className="w-6 h-6" />;
    if (slugLower.includes('employee')) return <Users className="w-6 h-6" />;
    if (slugLower.includes('order')) return <ShoppingCart className="w-6 h-6" />;
    if (slugLower.includes('invoice')) return <FileText className="w-6 h-6" />;
    if (slugLower.includes('vendor')) return <Truck className="w-6 h-6" />;
    if (slugLower.includes('factory')) return <Factory className="w-6 h-6" />;
    if (slugLower.includes('catalog')) return <Package className="w-6 h-6" />;
    return <BarChart3 className="w-6 h-6" />;
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
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
            <p>Failed to load statistics: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!statistics.length) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <p>No statistics available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Wrap the entire render in error boundary
  try {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="flex items-center gap-3">
          {getSlugIcon()}
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {slug.charAt(0).toUpperCase() + slug.slice(1)} Statistics
            </h3>
            <p className="text-sm text-gray-500">
              Overview of {slug} data and metrics
            </p>
          </div>
        </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statistics.slice(0, 3).map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {typeof stat.value === 'number' && stat.label === 'Total Value' 
                      ? `$${stat.value.toLocaleString()}`
                      : stat.value.toLocaleString()
                    }
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.color} text-white`}>
                  {stat.icon}
                </div>
              </div>
              
              {/* Mini trend line */}
              <div className="mt-4 h-12 flex items-end gap-1">
                {Array.from({ length: 12 }, (_, i) => {
                  const monthData = timeSeriesData.filter(d => d.series === stat.label);
                  const value = monthData[i]?.value || 0;
                  const maxValue = Math.max(...monthData.map(d => d.value), 1);
                  const height = (value / maxValue) * 100;
                  return (
                    <div 
                      key={i}
                      className={`flex-1 rounded-sm ${stat.color.replace('bg-', 'bg-')} opacity-60`}
                      style={{ height: `${height}%` }}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Area Chart */}
      {timeSeriesData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Trends Over Time</CardTitle>
              <div className="flex gap-2">
                <select className="text-sm border border-gray-300 rounded px-2 py-1">
                  <option>Area Chart</option>
                </select>
                <select className="text-sm border border-gray-300 rounded px-2 py-1">
                  <option>Absolute</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Legend */}
            <div className="flex items-center gap-4 mb-4">
              {seriesNames.map((series) => (
                <div key={series} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded ${getSeriesColor(series)}`} />
                  <span className="text-sm text-gray-600">{series}</span>
                </div>
              ))}
            </div>
            
            {/* Chart */}
            <div className="relative h-64">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500">
                <span>350</span>
                <span>300</span>
                <span>250</span>
                <span>200</span>
                <span>150</span>
                <span>100</span>
                <span>50</span>
                <span>0</span>
              </div>
              
              {/* Chart area */}
              <div className="ml-8 h-full relative">
                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between">
                  {Array.from({ length: 8 }, (_, i) => (
                    <div key={i} className="border-t border-gray-200" />
                  ))}
                </div>
                
                {/* Area chart */}
                <svg className="absolute inset-0 w-full h-full">
                  {seriesNames.map((series, seriesIndex) => {
                    const seriesData = timeSeriesData.filter(d => d.series === series);
                    const maxValue = Math.max(...seriesData.map(d => d.value), 1);
                    
                    const points = seriesData.map((point, index) => {
                      const x = (index / (seriesData.length - 1)) * 100;
                      const y = 100 - ((point.value / maxValue) * 100);
                      return `${x}% ${y}%`;
                    }).join(', ');
                    
                    const areaPath = `M 0 100 L ${points} L 100% 100% Z`;
                    
                    return (
                      <g key={series}>
                        <defs>
                          <linearGradient id={`gradient-${series}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={getSeriesColor(series).replace('bg-', '#')} stopOpacity="0.8" />
                            <stop offset="100%" stopColor={getSeriesColor(series).replace('bg-', '#')} stopOpacity="0.2" />
                          </linearGradient>
                        </defs>
                        <path
                          d={areaPath}
                          fill={`url(#gradient-${series})`}
                          stroke={getSeriesColor(series).replace('bg-', '#')}
                          strokeWidth="2"
                        />
                      </g>
                    );
                  })}
                </svg>
                
                {/* X-axis labels */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
                  <span>2024</span>
                  <span>Apr</span>
                  <span>Jul</span>
                  <span>Oct</span>
                  <span>2025</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Statistics */}
      {statistics.length > 3 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statistics.slice(3).map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {typeof stat.value === 'number' && stat.label === 'Total Value' 
                        ? `$${stat.value.toLocaleString()}`
                        : stat.value.toLocaleString()
                      }
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color} text-white`}>
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
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