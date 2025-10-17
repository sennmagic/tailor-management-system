"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/apiService";
import { useAlert } from "@/components/ui/alertProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatisticsChart } from "@/components/ui/chart";
import { 
  Users, 
  ShoppingBag, 
  IndianRupee, 
  TrendingUp,
  Calendar,
  Package,
  Truck,
  Factory,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  customers: number;
  orders: number;
  revenue: number;
  pendingOrders: number;
  completedOrders: number;
  totalProducts: number;
  totalFactories: number;
  totalVendors: number;
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [customersData, setCustomersData] = useState<any[]>([]);
  const { showAlert } = useAlert();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch orders for chart
        const { data: ordersResponse } = await fetchAPI({
          endpoint: 'orders',
          method: 'GET',
          withAuth: true,
        });

        // Fetch customers for chart
        const { data: customersResponse } = await fetchAPI({
          endpoint: 'customers',
          method: 'GET',
          withAuth: true,
        });

        // Process orders data
        let ordersArray = [];
        if (Array.isArray(ordersResponse)) {
          ordersArray = ordersResponse;
        } else if (ordersResponse?.data && Array.isArray(ordersResponse.data)) {
          ordersArray = ordersResponse.data;
        } else if (ordersResponse?.orderInfo && Array.isArray(ordersResponse.orderInfo)) {
          ordersArray = ordersResponse.orderInfo;
        }

        // Process customers data
        let customersArray = [];
        if (Array.isArray(customersResponse)) {
          customersArray = customersResponse;
        } else if (customersResponse?.data && Array.isArray(customersResponse.data)) {
          customersArray = customersResponse.data;
        }

        setOrdersData(ordersArray);
        setCustomersData(customersArray);

        // Calculate dashboard stats
        const pendingOrders = ordersArray.filter((order: any) => 
          order.orderStatus === 'Pending' || order.orderStatus === 'Cutting' || order.orderStatus === 'Sewing'
        ).length;

        const completedOrders = ordersArray.filter((order: any) => 
          order.orderStatus === 'Delivered' || order.orderStatus === 'Ready'
        ).length;

        const totalRevenue = ordersArray.reduce((sum: number, order: any) => 
          sum + (order.totalGrossAmount || 0), 0
        );

        setStats({
          customers: customersArray.length,
          orders: ordersArray.length,
          revenue: totalRevenue,
          pendingOrders,
          completedOrders,
          totalProducts: 0, // Will be fetched separately if needed
          totalFactories: 0, // Will be fetched separately if needed
          totalVendors: 0, // Will be fetched separately if needed
        });

      } catch (error) {
        showAlert('Failed to fetch dashboard data', 'destructive');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [showAlert]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-80 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
             

             {/* Performance Metrics - Top Priority */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <Card className="shadow-md border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Completion Rate</p>
                                     <p className="text-2xl font-bold text-primary mt-2">
                     {stats?.orders ? Math.round((stats.completedOrders / stats.orders) * 100) : 0}%
                   </p>
                 </div>
                 <CheckCircle className="w-10 h-10 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Average Order Value</p>
                                     <p className="text-2xl font-bold text-secondary mt-2">
                     Rs {stats?.orders ? Math.round((stats.revenue / stats.orders)) : 0}
                   </p>
                 </div>
                 <IndianRupee className="w-10 h-10 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Active Orders</p>
                                     <p className="text-2xl font-bold text-primary mt-2">{stats?.pendingOrders || 0}</p>
                 </div>
                                   <Clock className="w-10 h-10 text-primary" />
              </div>
            </CardContent>
          </Card>
       </div>

             {/* Charts Section */}
       <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
         {/* Orders Analytics */}
         <Card className="shadow-md border border-gray-200">
           <CardHeader className="border-b border-gray-200 pb-4">
             <div className="flex items-center justify-between">
               <div>
                 <CardTitle className="text-lg font-semibold text-gray-900">Orders Analytics</CardTitle>
                 <p className="text-sm text-gray-600 mt-1">Revenue trends and order performance</p>
               </div>
                                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                   <ShoppingBag className="w-5 h-5 text-white" />
                 </div>
             </div>
           </CardHeader>
           <CardContent className="p-6">
             <StatisticsChart 
               data={ordersData} 
               slug="orders" 
               loading={false}
               error={null}
             />
           </CardContent>
         </Card>

         {/* Customers Analytics */}
         <Card className="shadow-md border border-gray-200">
           <CardHeader className="border-b border-gray-200 pb-4">
             <div className="flex items-center justify-between">
               <div>
                 <CardTitle className="text-lg font-semibold text-gray-900">Customer Insights</CardTitle>
                 <p className="text-sm text-gray-600 mt-1">Customer growth and engagement metrics</p>
               </div>
                                <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                   <Users className="w-5 h-5 text-white" />
                 </div>
             </div>
           </CardHeader>
           <CardContent className="p-6">
             <StatisticsChart 
               data={customersData} 
               slug="customers" 
               loading={false}
               error={null}
             />
           </CardContent>
         </Card>
       </div>

       {/* Quick Actions */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <Card className="group hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200">
           <CardHeader className="pb-4">
             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                   <ShoppingBag className="w-6 h-6 text-white" />
                 </div>
               <div>
                 <CardTitle className="text-lg font-semibold text-gray-900">Orders</CardTitle>
                 <p className="text-sm text-gray-600">Manage customer orders</p>
               </div>
             </div>
           </CardHeader>
         </Card>

         <Card className="group hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200">
           <CardHeader className="pb-4">
             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                   <Users className="w-6 h-6 text-white" />
                 </div>
               <div>
                 <CardTitle className="text-lg font-semibold text-gray-900">Customers</CardTitle>
                 <p className="text-sm text-gray-600">Manage customer data</p>
               </div>
             </div>
           </CardHeader>
         </Card>

         <Card className="group hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200">
           <CardHeader className="pb-4">
             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                   <Package className="w-6 h-6 text-white" />
                 </div>
               <div>
                 <CardTitle className="text-lg font-semibold text-gray-900">Products</CardTitle>
                 <p className="text-sm text-gray-600">Manage product catalog</p>
               </div>
             </div>
           </CardHeader>
         </Card>

         <Card className="group hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200">
           <CardHeader className="pb-4">
             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                   <Factory className="w-6 h-6 text-white" />
                 </div>
               <div>
                 <CardTitle className="text-lg font-semibold text-gray-900">Factories</CardTitle>
                 <p className="text-sm text-gray-600">Manage production units</p>
               </div>
             </div>
           </CardHeader>
         </Card>

         <Card className="group hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200">
           <CardHeader className="pb-4">
             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                   <Truck className="w-6 h-6 text-white" />
                 </div>
               <div>
                 <CardTitle className="text-lg font-semibold text-gray-900">Vendors</CardTitle>
                 <p className="text-sm text-gray-600">Manage suppliers</p>
               </div>
             </div>
           </CardHeader>
         </Card>

         <Card className="group hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200">
           <CardHeader className="pb-4">
             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                   <FileText className="w-6 h-6 text-white" />
                 </div>
               <div>
                 <CardTitle className="text-lg font-semibold text-gray-900">Reports</CardTitle>
                 <p className="text-sm text-gray-600">View analytics & reports</p>
               </div>
             </div>
           </CardHeader>
         </Card>
       </div>
    </div>
  );
}