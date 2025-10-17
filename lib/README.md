# Tailor Management System - Business Logic & Hooks

This directory contains all the business logic, custom hooks, and utility functions for the tailor management system.

## 📁 Directory Structure

```
lib/
├── hooks/                    # Custom React hooks
│   ├── index.ts             # Export all hooks
│   ├── useEmployee.ts       # Employee management
│   ├── useOrders.ts         # Order management
│   ├── useCustomers.ts      # Customer management
│   ├── useMeasurements.ts   # Measurement management
│   ├── useVendors.ts        # Vendor management
│   ├── useAppointments.ts   # Appointment management
│   ├── useNotifications.ts  # Notification management
│   ├── useFormValidation.ts # Form validation
│   └── useDashboardData.ts  # Dashboard analytics
├── utils/                   # Business logic utilities
│   ├── index.ts             # Export all utilities
│   ├── businessLogic.ts     # Core business logic
│   └── searchAndFilter.ts   # Search and filter utilities
├── types/                   # TypeScript type definitions
│   ├── index.ts             # Main types
│   └── notifications.ts     # Notification types
├── apiService.ts            # API service functions
└── examples/                # Usage examples
    └── DashboardExample.tsx # Complete dashboard example
```

## 🎯 Core Business Logic

### Order Management (`OrderLogic`)

```typescript
import { OrderLogic } from '@/lib/utils';

// Calculate order total
const total = OrderLogic.calculateOrderTotal(order);

// Get status color for UI
const colorClass = OrderLogic.getOrderStatusColor('pending');

// Check if status transition is valid
const canUpdate = OrderLogic.canUpdateOrderStatus('pending', 'in_progress');

// Get orders by status
const pendingOrders = OrderLogic.getOrdersByStatus(orders, 'pending');

// Get overdue orders
const overdueOrders = OrderLogic.getOverdueOrders(orders);
```

### Customer Management (`CustomerLogic`)

```typescript
import { CustomerLogic } from '@/lib/utils';

// Get customer full name
const fullName = CustomerLogic.getCustomerFullName(customer);

// Get customer initials for avatar
const initials = CustomerLogic.getCustomerInitials(customer);

// Get customer statistics
const stats = CustomerLogic.getCustomerStats(customer, orders);
// Returns: { totalOrders, totalSpent, averageOrderValue, lastOrderDate }

// Get customers with minimum order count
const topCustomers = CustomerLogic.getCustomersByOrderCount(customers, orders, 2);
```

### Measurement Management (`MeasurementLogic`)

```typescript
import { MeasurementLogic } from '@/lib/utils';

// Get latest measurement for customer
const latestMeasurement = MeasurementLogic.getLatestMeasurement(customerId, measurements);

// Calculate changes between measurements
const changes = MeasurementLogic.calculateMeasurementChanges(oldMeasurement, newMeasurement);

// Validate measurement data
const errors = MeasurementLogic.validateMeasurement(measurement);
```

### Appointment Management (`AppointmentLogic`)

```typescript
import { AppointmentLogic } from '@/lib/utils';

// Get status color for UI
const colorClass = AppointmentLogic.getAppointmentStatusColor('scheduled');

// Check if status transition is valid
const canUpdate = AppointmentLogic.canUpdateAppointmentStatus('scheduled', 'confirmed');

// Get upcoming appointments
const upcoming = AppointmentLogic.getUpcomingAppointments(appointments, 7);

// Check for appointment conflicts
const conflicts = AppointmentLogic.checkAppointmentConflicts(newAppointment, existingAppointments);
```

### Dashboard Analytics (`DashboardLogic`)

```typescript
import { DashboardLogic } from '@/lib/utils';

// Get order status distribution
const distribution = DashboardLogic.getOrderStatusDistribution(orders);

// Get revenue by month
const revenue = DashboardLogic.getRevenueByMonth(orders, 6);

// Get top customers
const topCustomers = DashboardLogic.getTopCustomers(orders, customers, 5);
```

## 🔍 Search and Filter Utilities

### Order Search (`OrderSearchFilter`)

```typescript
import { OrderSearchFilter } from '@/lib/utils';

// Search orders with multiple filters
const filteredOrders = OrderSearchFilter.searchOrders(orders, {
  query: 'search term',
  status: 'pending',
  dateRange: { start: new Date(), end: new Date() },
  amountRange: { min: 100, max: 1000 }
});

// Get orders by date range
const dateFiltered = OrderSearchFilter.getOrdersByDateRange(orders, startDate, endDate);

// Get orders by amount range
const amountFiltered = OrderSearchFilter.getOrdersByAmountRange(orders, 100, 500);
```

### Customer Search (`CustomerSearchFilter`)

```typescript
import { CustomerSearchFilter } from '@/lib/utils';

// Search customers
const filteredCustomers = CustomerSearchFilter.searchCustomers(customers, {
  query: 'john',
  dateRange: { start: new Date(), end: new Date() }
});

// Get customers by order count
const activeCustomers = CustomerSearchFilter.getCustomersByOrderCount(customers, orders, 2);

// Get customers by total spent
const highValueCustomers = CustomerSearchFilter.getCustomersByTotalSpent(customers, orders, 1000);
```

### Advanced Search (`AdvancedSearch`)

```typescript
import { AdvancedSearch } from '@/lib/utils';

// Fuzzy search with scoring
const results = AdvancedSearch.fuzzySearch(items, 'query', ['name', 'email']);

// Multi-field search
const results = AdvancedSearch.multiFieldSearch(items, {
  name: 'john',
  email: 'gmail'
}, {
  name: 'name',
  email: 'email'
});

// Date range search
const results = AdvancedSearch.dateRangeSearch(items, 'createdAt', startDate, endDate);
```

## 🎣 Custom Hooks

### Basic Entity Hooks

All entity hooks follow the same pattern and provide:
- Data fetching with loading states
- CRUD operations
- Error handling
- Pagination support
- Search functionality

```typescript
import { useOrders, useCustomers, useAppointments } from '@/lib/hooks';

function MyComponent() {
  const { 
    orders, 
    isLoading, 
    error, 
    createOrder, 
    updateOrder, 
    deleteOrder,
    refetch 
  } = useOrders();

  const { 
    customers, 
    createCustomer, 
    updateCustomer, 
    deleteCustomer,
    searchCustomers 
  } = useCustomers();

  const { 
    appointments, 
    createAppointment, 
    updateAppointment,
    updateAppointmentStatus 
  } = useAppointments();
}
```

### Dashboard Data Hook

```typescript
import { useDashboardData } from '@/lib/hooks';

function Dashboard() {
  const { 
    metrics, 
    isLoading, 
    error, 
    refreshData,
    getRevenueTrend,
    getOrderTrend 
  } = useDashboardData();

  // metrics includes:
  // - totalOrders, totalCustomers, totalRevenue
  // - pendingOrders, overdueOrders, upcomingAppointments
  // - orderStatusDistribution, recentOrders, topCustomers
  // - revenueByMonth, orderCompletionRate, averageOrderValue
}
```

### Form Validation Hook

```typescript
import { useFormValidation } from '@/lib/hooks';

function MyForm() {
  const validationRules = {
    name: { required: true, minLength: 2 },
    email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    phone: { required: true, pattern: /^[\+]?[1-9][\d]{0,15}$/ }
  };

  const { 
    data, 
    errors, 
    setFieldValue, 
    validateForm, 
    isSubmitting 
  } = useFormValidation(initialData, validationRules);
}
```

## 🛠️ Utility Functions

### Formatting Utilities (`UtilityLogic`)

```typescript
import { UtilityLogic } from '@/lib/utils';

// Format currency
const formatted = UtilityLogic.formatCurrency(1234.56); // "₹1,234.56"

// Format dates
const date = UtilityLogic.formatDate('2024-01-15'); // "Jan 15, 2024"
const datetime = UtilityLogic.formatDateTime('2024-01-15T10:30:00'); // "Jan 15, 2024, 10:30 AM"

// Generate order number
const orderNumber = UtilityLogic.generateOrderNumber(); // "ORD-123456-789"

// Validate email/phone
const isValidEmail = UtilityLogic.validateEmail('user@example.com');
const isValidPhone = UtilityLogic.validatePhone('+1234567890');
```

## 📊 Usage Examples

### Complete Dashboard Example

See `examples/DashboardExample.tsx` for a complete implementation showing:

- Data aggregation from multiple hooks
- Real-time filtering and search
- Status updates with validation
- Business logic integration
- Error handling and loading states

### Key Features Demonstrated:

1. **Data Integration**: Combines data from multiple hooks
2. **Search & Filter**: Real-time filtering with business logic
3. **Status Management**: Validated status transitions
4. **Metrics Calculation**: Real-time analytics
5. **Error Handling**: Comprehensive error management
6. **Loading States**: Proper loading indicators
7. **Form Validation**: Client-side validation
8. **Utility Functions**: Formatting and validation

## 🔧 Best Practices

### 1. Hook Usage
- Always handle loading and error states
- Use `useCallback` for expensive operations
- Implement proper error boundaries
- Use skeleton loaders for better UX

### 2. Business Logic
- Keep business logic in utility classes
- Validate data before API calls
- Use TypeScript for type safety
- Implement proper error handling

### 3. Search & Filter
- Debounce search inputs
- Use fuzzy search for better UX
- Implement proper pagination
- Cache search results when appropriate

### 4. Performance
- Use `useMemo` for expensive calculations
- Implement proper memoization
- Avoid unnecessary re-renders
- Use React.memo for components

## 🚀 Getting Started

1. **Import hooks**:
```typescript
import { useOrders, useCustomers } from '@/lib/hooks';
```

2. **Import utilities**:
```typescript
import { OrderLogic, CustomerLogic, UtilityLogic } from '@/lib/utils';
```

3. **Use in components**:
```typescript
function MyComponent() {
  const { orders, isLoading } = useOrders();
  const topCustomers = CustomerLogic.getCustomersByOrderCount(customers, orders, 2);
  
  return (
    <div>
      {isLoading ? <Skeleton /> : <OrderList orders={orders} />}
    </div>
  );
}
```

## 📝 TypeScript Support

All hooks and utilities are fully typed with TypeScript:

- **Entity Types**: `Order`, `Customer`, `Appointment`, etc.
- **Hook Return Types**: `UseOrdersReturn`, `UseCustomersReturn`, etc.
- **Business Logic Types**: Proper typing for all utility functions
- **Search Types**: Typed search filters and results

## 🔄 API Integration

All hooks use the centralized `apiService.ts` for:
- Consistent error handling
- Authentication management
- Request/response formatting
- Retry logic
- Caching strategies

## 🎨 UI Integration

The business logic is designed to work seamlessly with:
- **Status Colors**: Pre-defined color classes for status badges
- **Formatting**: Currency, date, and time formatting
- **Validation**: Form validation with error messages
- **Loading States**: Skeleton loaders and loading indicators

This comprehensive business logic system provides a solid foundation for building a robust tailor management system with proper separation of concerns, type safety, and maintainable code structure. 