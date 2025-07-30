import { 
  Order, 
  Customer, 
  Appointment, 
  Vendor, 
  Employee, 
  Measurement,
  OrderStatus,
  AppointmentStatus,
  UserRole,
  VendorType,
  AppointmentType
} from '@/lib/types';

// Generic search interface
interface SearchFilters {
  query?: string;
  status?: string;
  type?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  amountRange?: {
    min: number;
    max: number;
  };
  isActive?: boolean;
}

// Order Search and Filter
export class OrderSearchFilter {
  static searchOrders(orders: Order[], filters: SearchFilters): Order[] {
    let filtered = [...orders];

    // Text search
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(query) ||
        order.customerId.toLowerCase().includes(query) ||
        order.items.some(item => 
          item.name.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query)
        )
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Date range filter
    if (filters.dateRange) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= filters.dateRange!.start && orderDate <= filters.dateRange!.end;
      });
    }

    // Amount range filter
    if (filters.amountRange) {
      filtered = filtered.filter(order => 
        order.totalAmount >= filters.amountRange!.min && order.totalAmount <= filters.amountRange!.max
      );
    }

    return filtered;
  }

  static getOrdersByDateRange(orders: Order[], startDate: Date, endDate: Date): Order[] {
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });
  }

  static getOrdersByAmountRange(orders: Order[], minAmount: number, maxAmount: number): Order[] {
    return orders.filter(order => 
      order.totalAmount >= minAmount && order.totalAmount <= maxAmount
    );
  }

  static getOrdersByCustomer(orders: Order[], customerId: string): Order[] {
    return orders.filter(order => order.customerId === customerId);
  }

  static getOrdersByStatus(orders: Order[], status: OrderStatus): Order[] {
    return orders.filter(order => order.status === status);
  }
}

// Customer Search and Filter
export class CustomerSearchFilter {
  static searchCustomers(customers: Customer[], filters: SearchFilters): Customer[] {
    let filtered = [...customers];

    // Text search
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query) ||
        customer.address?.toLowerCase().includes(query)
      );
    }

    // Date range filter (for customers with orders)
    if (filters.dateRange) {
      filtered = filtered.filter(customer => {
        const customerDate = new Date(customer.createdAt);
        return customerDate >= filters.dateRange!.start && customerDate <= filters.dateRange!.end;
      });
    }

    return filtered;
  }

  static getCustomersByOrderCount(customers: Customer[], orders: Order[], minOrders: number): Customer[] {
    return customers.filter(customer => {
      const customerOrders = orders.filter(order => order.customerId === customer.id);
      return customerOrders.length >= minOrders;
    });
  }

  static getCustomersByTotalSpent(customers: Customer[], orders: Order[], minAmount: number): Customer[] {
    return customers.filter(customer => {
      const customerOrders = orders.filter(order => order.customerId === customer.id);
      const totalSpent = customerOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      return totalSpent >= minAmount;
    });
  }
}

// Appointment Search and Filter
export class AppointmentSearchFilter {
  static searchAppointments(appointments: Appointment[], filters: SearchFilters): Appointment[] {
    let filtered = [...appointments];

    // Text search
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(appointment => 
        appointment.id.toLowerCase().includes(query) ||
        appointment.customerId.toLowerCase().includes(query) ||
        appointment.notes?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(appointment => appointment.status === filters.status);
    }

    // Type filter
    if (filters.type) {
      filtered = filtered.filter(appointment => appointment.type === filters.type);
    }

    // Date range filter
    if (filters.dateRange) {
      filtered = filtered.filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        return appointmentDate >= filters.dateRange!.start && appointmentDate <= filters.dateRange!.end;
      });
    }

    return filtered;
  }

  static getAppointmentsByDateRange(appointments: Appointment[], startDate: Date, endDate: Date): Appointment[] {
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return appointmentDate >= startDate && appointmentDate <= endDate;
    });
  }

  static getAppointmentsByStatus(appointments: Appointment[], status: AppointmentStatus): Appointment[] {
    return appointments.filter(appointment => appointment.status === status);
  }

  static getAppointmentsByType(appointments: Appointment[], type: AppointmentType): Appointment[] {
    return appointments.filter(appointment => appointment.type === type);
  }

  static getAppointmentsByCustomer(appointments: Appointment[], customerId: string): Appointment[] {
    return appointments.filter(appointment => appointment.customerId === customerId);
  }
}

// Vendor Search and Filter
export class VendorSearchFilter {
  static searchVendors(vendors: Vendor[], filters: SearchFilters): Vendor[] {
    let filtered = [...vendors];

    // Text search
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(vendor => 
        vendor.name.toLowerCase().includes(query) ||
        vendor.email.toLowerCase().includes(query) ||
        vendor.phone.toLowerCase().includes(query) ||
        vendor.address.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (filters.type) {
      filtered = filtered.filter(vendor => vendor.type === filters.type);
    }

    // Active status filter
    if (filters.isActive !== undefined) {
      filtered = filtered.filter(vendor => vendor.isActive === filters.isActive);
    }

    return filtered;
  }

  static getVendorsByType(vendors: Vendor[], type: VendorType): Vendor[] {
    return vendors.filter(vendor => vendor.type === type);
  }

  static getActiveVendors(vendors: Vendor[]): Vendor[] {
    return vendors.filter(vendor => vendor.isActive);
  }

  static getInactiveVendors(vendors: Vendor[]): Vendor[] {
    return vendors.filter(vendor => !vendor.isActive);
  }
}

// Employee Search and Filter
export class EmployeeSearchFilter {
  static searchEmployees(employees: Employee[], filters: SearchFilters): Employee[] {
    let filtered = [...employees];

    // Text search
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(employee => 
        employee.name.toLowerCase().includes(query) ||
        employee.email.toLowerCase().includes(query) ||
        employee.phone?.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (filters.type) {
      filtered = filtered.filter(employee => employee.role === filters.type);
    }

    // Active status filter
    if (filters.isActive !== undefined) {
      filtered = filtered.filter(employee => employee.isActive === filters.isActive);
    }

    return filtered;
  }

  static getEmployeesByRole(employees: Employee[], role: UserRole): Employee[] {
    return employees.filter(employee => employee.role === role);
  }

  static getActiveEmployees(employees: Employee[]): Employee[] {
    return employees.filter(employee => employee.isActive);
  }

  static getInactiveEmployees(employees: Employee[]): Employee[] {
    return employees.filter(employee => !employee.isActive);
  }
}

// Measurement Search and Filter
export class MeasurementSearchFilter {
  static searchMeasurements(measurements: Measurement[], filters: SearchFilters): Measurement[] {
    let filtered = [...measurements];

    // Text search
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(measurement => 
        measurement.id.toLowerCase().includes(query) ||
        measurement.customerId.toLowerCase().includes(query) ||
        measurement.notes?.toLowerCase().includes(query)
      );
    }

    // Date range filter
    if (filters.dateRange) {
      filtered = filtered.filter(measurement => {
        const measurementDate = new Date(measurement.createdAt);
        return measurementDate >= filters.dateRange!.start && measurementDate <= filters.dateRange!.end;
      });
    }

    return filtered;
  }

  static getMeasurementsByCustomer(measurements: Measurement[], customerId: string): Measurement[] {
    return measurements.filter(measurement => measurement.customerId === customerId);
  }

  static getMeasurementsByDateRange(measurements: Measurement[], startDate: Date, endDate: Date): Measurement[] {
    return measurements.filter(measurement => {
      const measurementDate = new Date(measurement.createdAt);
      return measurementDate >= startDate && measurementDate <= endDate;
    });
  }
}

// Advanced Search Utilities
export class AdvancedSearch {
  static fuzzySearch<T>(items: T[], query: string, searchFields: (keyof T)[]): T[] {
    if (!query.trim()) return items;

    const searchTerm = query.toLowerCase();
    const results: Array<{ item: T; score: number }> = [];

    items.forEach(item => {
      let score = 0;
      let hasMatch = false;

      searchFields.forEach(field => {
        const value = item[field];
        if (value && typeof value === 'string') {
          const fieldValue = value.toLowerCase();
          
          // Exact match
          if (fieldValue === searchTerm) {
            score += 100;
            hasMatch = true;
          }
          // Starts with
          else if (fieldValue.startsWith(searchTerm)) {
            score += 50;
            hasMatch = true;
          }
          // Contains
          else if (fieldValue.includes(searchTerm)) {
            score += 25;
            hasMatch = true;
          }
          // Word boundary match
          else if (fieldValue.split(' ').some(word => word.startsWith(searchTerm))) {
            score += 30;
            hasMatch = true;
          }
        }
      });

      if (hasMatch) {
        results.push({ item, score });
      }
    });

    return results
      .sort((a, b) => b.score - a.score)
      .map(result => result.item);
  }

  static multiFieldSearch<T>(
    items: T[], 
    searchTerms: Record<string, string>, 
    fieldMappings: Record<string, keyof T>
  ): T[] {
    let filtered = [...items];

    Object.entries(searchTerms).forEach(([searchKey, searchValue]) => {
      const field = fieldMappings[searchKey];
      if (field && searchValue) {
        filtered = filtered.filter(item => {
          const value = item[field];
          if (value && typeof value === 'string') {
            return value.toLowerCase().includes(searchValue.toLowerCase());
          }
          return false;
        });
      }
    });

    return filtered;
  }

  static dateRangeSearch<T>(
    items: T[], 
    dateField: keyof T, 
    startDate: Date, 
    endDate: Date
  ): T[] {
    return items.filter(item => {
      const dateValue = item[dateField];
      if (dateValue) {
        const itemDate = new Date(dateValue as string);
        return itemDate >= startDate && itemDate <= endDate;
      }
      return false;
    });
  }

  static numericRangeSearch<T>(
    items: T[], 
    numericField: keyof T, 
    minValue: number, 
    maxValue: number
  ): T[] {
    return items.filter(item => {
      const numericValue = item[numericField];
      if (typeof numericValue === 'number') {
        return numericValue >= minValue && numericValue <= maxValue;
      }
      return false;
    });
  }
}

// Search Result Ranking
export class SearchRanking {
  static rankSearchResults<T>(
    items: T[], 
    query: string, 
    searchFields: (keyof T)[], 
    boostFields?: Record<keyof T, number>
  ): Array<{ item: T; score: number }> {
    const results: Array<{ item: T; score: number }> = [];

    items.forEach(item => {
      let totalScore = 0;

      searchFields.forEach(field => {
        const value = item[field];
        if (value && typeof value === 'string') {
          const fieldValue = value.toLowerCase();
          const searchTerm = query.toLowerCase();
          let fieldScore = 0;

          // Exact match
          if (fieldValue === searchTerm) {
            fieldScore = 100;
          }
          // Starts with
          else if (fieldValue.startsWith(searchTerm)) {
            fieldScore = 50;
          }
          // Contains
          else if (fieldValue.includes(searchTerm)) {
            fieldScore = 25;
          }
          // Word boundary
          else if (fieldValue.split(' ').some(word => word.startsWith(searchTerm))) {
            fieldScore = 30;
          }

          // Apply boost if specified
          if (boostFields && boostFields[field]) {
            fieldScore *= boostFields[field];
          }

          totalScore += fieldScore;
        }
      });

      if (totalScore > 0) {
        results.push({ item, score: totalScore });
      }
    });

    return results.sort((a, b) => b.score - a.score);
  }
} 