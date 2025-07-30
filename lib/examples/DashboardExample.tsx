import React, { useState } from 'react';
import { 
  useDashboardData, 
  useOrders, 
  useCustomers, 
  useAppointments,
  useNotifications 
} from '@/lib/hooks';
import { 
  OrderLogic, 
  CustomerLogic, 
  AppointmentLogic, 
  UtilityLogic,
  OrderSearchFilter,
  CustomerSearchFilter,
  AppointmentSearchFilter 
} from '@/lib/utils';
import { OrderStatus, AppointmentStatus } from '@/lib/types';

export function DashboardExample() {
  const { metrics, isLoading, error, refreshData } = useDashboardData();
  const { orders, updateOrderStatus } = useOrders();
  const { customers, searchCustomers } = useCustomers();
  const { appointments, updateAppointmentStatus } = useAppointments();
  const { notifications, markAsRead } = useNotifications();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');

  // Example of using business logic
  const handleOrderStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Check if status transition is valid
    if (OrderLogic.canUpdateOrderStatus(order.status, newStatus)) {
      await updateOrderStatus(orderId, newStatus);
    } else {
      console.error('Invalid status transition');
    }
  };

  // Example of using search and filter
  const filteredOrders = OrderSearchFilter.searchOrders(orders, {
    query: searchQuery,
    status: statusFilter || undefined
  });

  const topCustomers = CustomerLogic.getCustomersByOrderCount(customers, orders, 2);
  const overdueOrders = OrderLogic.getOverdueOrders(orders);
  const upcomingAppointments = AppointmentLogic.getUpcomingAppointments(appointments, 7);

  // Example of using utility functions
  const formatOrderAmount = (amount: number) => UtilityLogic.formatCurrency(amount);
  const formatOrderDate = (date: string) => UtilityLogic.formatDate(date);

  if (isLoading) {
    return <div>Loading dashboard data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Example</h1>
      
      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border rounded"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
            className="px-4 py-2 border rounded"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
          <p className="text-2xl font-bold">{metrics.totalOrders}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
          <p className="text-2xl font-bold">{UtilityLogic.formatCurrency(metrics.totalRevenue)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Pending Orders</h3>
          <p className="text-2xl font-bold text-yellow-600">{metrics.pendingOrders}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Overdue Orders</h3>
          <p className="text-2xl font-bold text-red-600">{metrics.overdueOrders}</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
        </div>
        <div className="p-4">
          {filteredOrders.slice(0, 5).map((order) => (
            <div key={order.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
              <div>
                <p className="font-medium">Order #{order.id}</p>
                <p className="text-sm text-gray-500">
                  {formatOrderDate(order.createdAt)} - {formatOrderAmount(order.totalAmount)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs ${OrderLogic.getOrderStatusColor(order.status)}`}>
                  {order.status}
                </span>
                <select
                  value={order.status}
                  onChange={(e) => handleOrderStatusUpdate(order.id, e.target.value as OrderStatus)}
                  className="text-xs border rounded px-2 py-1"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Top Customers</h2>
        </div>
        <div className="p-4">
          {topCustomers.slice(0, 5).map((customer) => {
            const stats = CustomerLogic.getCustomerStats(customer, orders);
            return (
              <div key={customer.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                <div>
                  <p className="font-medium">{CustomerLogic.getCustomerFullName(customer)}</p>
                  <p className="text-sm text-gray-500">
                    {stats.totalOrders} orders - {UtilityLogic.formatCurrency(stats.totalSpent)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{customer.email}</p>
                  <p className="text-xs text-gray-500">{customer.phone}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Upcoming Appointments</h2>
        </div>
        <div className="p-4">
          {upcomingAppointments.slice(0, 5).map((appointment) => (
            <div key={appointment.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
              <div>
                <p className="font-medium">
                  {appointment.type} - {UtilityLogic.formatDateTime(appointment.date)}
                </p>
                <p className="text-sm text-gray-500">{appointment.notes}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs ${AppointmentLogic.getAppointmentStatusColor(appointment.status)}`}>
                  {appointment.status}
                </span>
                <select
                  value={appointment.status}
                  onChange={(e) => updateAppointmentStatus(appointment.id, e.target.value as AppointmentStatus)}
                  className="text-xs border rounded px-2 py-1"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Refresh Button */}
      <button
        onClick={refreshData}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Refresh Data
      </button>
    </div>
  );
} 