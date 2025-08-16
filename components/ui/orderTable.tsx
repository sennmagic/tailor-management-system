"use client";

import React, { useState, useMemo, useCallback } from "react";
import { fetchAPI } from "@/lib/apiService";
import { useAlert } from "@/components/ui/alertProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar,
  User,
  ShoppingBag,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Order {
  _id: string;
  customerId?: {
    _id: string;
    name: string;
    address?: string;
    contactNum?: string;
    dob?: string;
  };
  customerName?: string; // Fallback for flat structure
  orderItems?: Array<{
    itemType: string;
    itemName: string;
    catalogItem: string;
  }>;
  orderStatus?: string;
  paymentStatus?: string;
  orderDate?: string;
  deliveryDate?: string;
  totalGrossAmount?: number;
  notes?: string;
  factoryId?: {
    _id: string;
    factoryName: string;
  };
  measurementId?: {
    _id: string;
    basicMeasurements?: any;
    topMeasurements?: any;
    bottomMeasurements?: any;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface OrderTableProps {
  orders: Order[];
  loading?: boolean;
  onEdit?: (order: Order) => void;
  onView?: (order: Order) => void;
  onDelete?: (orderId: string) => void;
  onStatusChange?: (orderId: string, status: string, field: string) => void;
}

export const OrderTable = React.memo(function OrderTable({ 
  orders, 
  loading = false,
  onEdit, 
  onView, 
  onDelete, 
  onStatusChange 
}: OrderTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const { showAlert } = useAlert();

  // Helper function to get customer name - memoized
  const getCustomerName = useCallback((order: Order) => {
    if (order.customerId && typeof order.customerId === 'object' && order.customerId.name) {
      return order.customerId.name;
    }
    return order.customerName || 'Unknown Customer';
  }, []);

  // Helper function to get customer ID - memoized
  const getCustomerId = useCallback((order: Order) => {
    if (order.customerId && typeof order.customerId === 'object' && order.customerId._id) {
      return order.customerId._id;
    }
    return typeof order.customerId === 'string' ? order.customerId : '';
  }, []);

  // Memoized filtered orders for better performance
  const filteredOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    
    return orders.filter(order => {
      const customerName = getCustomerName(order);

      const matchesSearch = 
        customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderItems?.some(item => 
          item.itemName?.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesStatusFilter = statusFilter === "all" || 
        order.orderStatus?.toLowerCase() === statusFilter.toLowerCase();

      const matchesPaymentFilter = paymentFilter === "all" || 
        order.paymentStatus?.toLowerCase() === paymentFilter.toLowerCase();

      return matchesSearch && matchesStatusFilter && matchesPaymentFilter;
    });
  }, [orders, searchTerm, statusFilter, paymentFilter, getCustomerName]);

  // Memoized status badge function
  const getStatusBadge = useCallback((status: string, type: 'order' | 'payment') => {
    const statusLower = status?.toLowerCase() || '';
    
    if (type === 'order') {
      switch (statusLower) {
        case 'pending':
          return {
            className: "bg-yellow-50 text-yellow-700 border-yellow-200",
            icon: <Clock className="w-3 h-3" />,
            text: "Pending"
          };
        case 'cutting':
          return {
            className: "bg-blue-50 text-blue-700 border-blue-200",
            icon: <Loader2 className="w-3 h-3" />,
            text: "Cutting"
          };
        case 'sewing':
          return {
            className: "bg-purple-50 text-purple-700 border-purple-200",
            icon: <Loader2 className="w-3 h-3" />,
            text: "Sewing"
          };
        case 'ready':
          return {
            className: "bg-green-50 text-green-700 border-green-200",
            icon: <CheckCircle className="w-3 h-3" />,
            text: "Ready"
          };
        case 'delivered':
          return {
            className: "bg-emerald-50 text-emerald-700 border-emerald-200",
            icon: <CheckCircle className="w-3 h-3" />,
            text: "Delivered"
          };
        case 'cancelled':
          return {
            className: "bg-red-50 text-red-700 border-red-200",
            icon: <XCircle className="w-3 h-3" />,
            text: "Cancelled"
          };
        default:
          return {
            className: "bg-gray-50 text-gray-700 border-gray-200",
            icon: <AlertCircle className="w-3 h-3" />,
            text: status || "Unknown"
          };
      }
    } else {
      // Payment status
      switch (statusLower) {
        case 'pending':
          return {
            className: "bg-yellow-50 text-yellow-700 border-yellow-200",
            icon: <Clock className="w-3 h-3" />,
            text: "Pending"
          };
        case 'paid':
          return {
            className: "bg-green-50 text-green-700 border-green-200",
            icon: <CheckCircle className="w-3 h-3" />,
            text: "Paid"
          };
        case 'unpaid':
          return {
            className: "bg-red-50 text-red-700 border-red-200",
            icon: <XCircle className="w-3 h-3" />,
            text: "Unpaid"
          };
        case 'partial':
          return {
            className: "bg-orange-50 text-orange-700 border-orange-200",
            icon: <AlertCircle className="w-3 h-3" />,
            text: "Partial"
          };
        case 'processing':
          return {
            className: "bg-blue-50 text-blue-700 border-blue-200",
            icon: <Loader2 className="w-3 h-3" />,
            text: "Processing"
          };
        case 'completed':
          return {
            className: "bg-emerald-50 text-emerald-700 border-emerald-200",
            icon: <CheckCircle className="w-3 h-3" />,
            text: "Completed"
          };
        case 'failed':
          return {
            className: "bg-red-50 text-red-700 border-red-200",
            icon: <XCircle className="w-3 h-3" />,
            text: "Failed"
          };
        case 'refunded':
          return {
            className: "bg-purple-50 text-purple-700 border-purple-200",
            icon: <AlertCircle className="w-3 h-3" />,
            text: "Refunded"
          };
        default:
          return {
            className: "bg-gray-50 text-gray-700 border-gray-200",
            icon: <AlertCircle className="w-3 h-3" />,
            text: status || "Unknown"
          };
      }
    }
  }, []);

  // Optimized status change handler with debouncing
  const handleStatusChange = useCallback(async (orderId: string, newStatus: string, field: 'orderStatus' | 'paymentStatus') => {
    // Don't update if the status is empty or the same
    if (!newStatus || newStatus.trim() === '') {
      return;
    }

    // Prevent rapid updates
    if (updatingStatus === orderId) {
      return;
    }

    setUpdatingStatus(orderId);
    
    // Add a small delay to prevent rapid API calls
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const { error } = await fetchAPI({
      endpoint: `orders/${orderId}`,
      method: 'PATCH',
      data: { [field]: newStatus },
      withAuth: true,
    });

    if (error) {
      showAlert(`Failed to update status: ${error}`, "destructive");
    } else {
      showAlert('Status updated successfully!', "success");
      onStatusChange?.(orderId, newStatus, field);
    }
    
    setUpdatingStatus(null);
  }, [showAlert, onStatusChange, updatingStatus]);

  // Memoized utility functions
  const formatDate = useCallback((dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  const formatPrice = useCallback((amount?: number) => {
    if (!amount) return "$0";
    return `$${amount.toFixed(2)}`;
  }, []);

  const getOrderItemsSummary = useCallback((items?: Array<{ itemType: string; itemName: string }>) => {
    if (!items || items.length === 0) return "No items";
    if (items.length === 1) return items[0].itemName || items[0].itemType;
    return `${items[0].itemName || items[0].itemType} +${items.length - 1} more`;
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search orders, customers, items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Cutting">Cutting</option>
            <option value="Sewing">Sewing</option>
            <option value="Ready">Ready</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Payment</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Partial">Partial</option>
          </select>
        </div>
      </div>

      {/* Orders list */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No orders found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredOrders.map((order) => {
              const orderStatus = getStatusBadge(order.orderStatus || '', 'order');
              const paymentStatus = getStatusBadge(order.paymentStatus || '', 'payment');
              const customerName = getCustomerName(order);
              
              return (
                <div key={order._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    {/* Order ID and Customer */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              #{order._id?.slice(-8) || 'Unknown'}
                            </p>
                            <div className="flex items-center gap-1 text-gray-500">
                              <User className="w-3 h-3" />
                              <span className="text-sm truncate">
                                {customerName}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1 text-gray-500">
                              <ShoppingBag className="w-3 h-3" />
                              <span className="text-sm">
                                {getOrderItemsSummary(order.orderItems)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex items-center gap-3 ml-4">
                      <Badge 
                        variant="outline" 
                        className={cn("flex items-center gap-1", orderStatus.className)}
                      >
                        {orderStatus.icon}
                        {orderStatus.text}
                      </Badge>
                      
                      <Badge 
                        variant="outline" 
                        className={cn("flex items-center gap-1", paymentStatus.className)}
                      >
                        {paymentStatus.icon}
                        {paymentStatus.text}
                      </Badge>
                    </div>

                    {/* Date and Price */}
                    <div className="flex items-center gap-4 ml-6">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span className="text-sm">
                            {formatDate(order.orderDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-900 font-medium">
                          <DollarSign className="w-3 h-3" />
                          <span className="text-sm">
                            {formatPrice(order.totalGrossAmount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      {updatingStatus === order._id ? (
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onView?.(order)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit?.(order)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete?.(order._id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Quick Status Update */}
                  <div className="mt-4 flex items-center gap-2">
                    <select
                      value={order.orderStatus || ''}
                      onChange={(e) => handleStatusChange(order._id, e.target.value, 'orderStatus')}
                      disabled={updatingStatus === order._id}
                      className="text-xs px-2 py-1 border border-gray-300 rounded bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Order Status</option>
                      <option value="Pending">Pending</option>
                      <option value="Cutting">Cutting</option>
                      <option value="Sewing">Sewing</option>
                      <option value="Ready">Ready</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    
                    <select
                      value={order.paymentStatus || ''}
                      onChange={(e) => handleStatusChange(order._id, e.target.value, 'paymentStatus')}
                      disabled={updatingStatus === order._id}
                      className="text-xs px-2 py-1 border border-gray-300 rounded bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Payment Status</option>
                      <option value="Unpaid">Unpaid</option>
                      <option value="Partial">Partial</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      {filteredOrders.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Showing {filteredOrders.length} of {orders.length} orders</span>
          <span>
            Total: {formatPrice(filteredOrders.reduce((sum, order) => sum + (order.totalGrossAmount || 0), 0))}
          </span>
        </div>
      )}
    </div>
  );
}); 