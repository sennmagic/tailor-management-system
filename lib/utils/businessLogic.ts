import { 
  Order, 
  OrderStatus, 
  Customer, 
  Measurement, 
  Appointment, 
  AppointmentStatus,
  Vendor,
  Employee,
  UserRole 
} from '@/lib/types';

// Order Management Logic
export class OrderLogic {
  static calculateOrderTotal(order: Order): number {
    return order.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  static getOrderStatusColor(status: OrderStatus): string {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  static canUpdateOrderStatus(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: [], // Cannot change from completed
      cancelled: [] // Cannot change from cancelled
    };
    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  static getOrdersByStatus(orders: Order[], status: OrderStatus): Order[] {
    return orders.filter(order => order.status === status);
  }

  static getOverdueOrders(orders: Order[]): Order[] {
    const today = new Date();
    return orders.filter(order => {
      const dueDate = new Date(order.dueDate);
      return dueDate < today && order.status !== 'completed' && order.status !== 'cancelled';
    });
  }

  static getOrdersDueToday(orders: Order[]): Order[] {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return orders.filter(order => {
      const dueDate = new Date(order.dueDate);
      return dueDate >= today && dueDate < tomorrow && order.status !== 'completed' && order.status !== 'cancelled';
    });
  }
}

// Customer Management Logic
export class CustomerLogic {
  static getCustomerFullName(customer: Customer): string {
    return customer.name;
  }

  static getCustomerInitials(customer: Customer): string {
    return customer.name
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  static getCustomerStats(customer: Customer, orders: Order[]): {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate: string | null;
  } {
    const customerOrders = orders.filter(order => order.customerId === customer.id);
    const totalOrders = customerOrders.length;
    const totalSpent = customerOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    const lastOrderDate = customerOrders.length > 0 
      ? customerOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
      : null;

    return {
      totalOrders,
      totalSpent,
      averageOrderValue,
      lastOrderDate
    };
  }

  static getCustomersByOrderCount(customers: Customer[], orders: Order[], minOrders: number = 1): Customer[] {
    return customers.filter(customer => {
      const customerOrders = orders.filter(order => order.customerId === customer.id);
      return customerOrders.length >= minOrders;
    });
  }
}

// Measurement Management Logic
export class MeasurementLogic {
  static getLatestMeasurement(customerId: string, measurements: Measurement[]): Measurement | undefined {
    const customerMeasurements = measurements.filter(m => m.customerId === customerId);
    return customerMeasurements.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  }

  static calculateMeasurementChanges(oldMeasurement: Measurement, newMeasurement: Measurement): Record<string, { old: number; new: number; change: number }> {
    const fields = ['chest', 'waist', 'hips', 'shoulder', 'sleeve', 'neck', 'inseam'];
    const changes: Record<string, { old: number; new: number; change: number }> = {};

    fields.forEach(field => {
      const oldValue = oldMeasurement[field as keyof Measurement] as number;
      const newValue = newMeasurement[field as keyof Measurement] as number;
      if (oldValue !== newValue) {
        changes[field] = {
          old: oldValue,
          new: newValue,
          change: newValue - oldValue
        };
      }
    });

    return changes;
  }

  static validateMeasurement(measurement: Partial<Measurement>): string[] {
    const errors: string[] = [];
    const requiredFields = ['chest', 'waist', 'hips', 'shoulder', 'sleeve', 'neck', 'inseam'];

    requiredFields.forEach(field => {
      const value = measurement[field as keyof Measurement] as number;
      if (value === undefined || value === null) {
        errors.push(`${field} is required`);
      } else if (value <= 0) {
        errors.push(`${field} must be greater than 0`);
      } else if (value > 200) {
        errors.push(`${field} seems too large, please verify`);
      }
    });

    return errors;
  }
}

// Appointment Management Logic
export class AppointmentLogic {
  static getAppointmentStatusColor(status: AppointmentStatus): string {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  static canUpdateAppointmentStatus(currentStatus: AppointmentStatus, newStatus: AppointmentStatus): boolean {
    const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      scheduled: ['confirmed', 'cancelled'],
      confirmed: ['completed', 'cancelled'],
      completed: [], // Cannot change from completed
      cancelled: [] // Cannot change from cancelled
    };
    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  static getUpcomingAppointments(appointments: Appointment[], days: number = 7): Appointment[] {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return appointmentDate >= now && appointmentDate <= futureDate && appointment.status !== 'cancelled';
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  static getAppointmentsByDateRange(appointments: Appointment[], startDate: Date, endDate: Date): Appointment[] {
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return appointmentDate >= startDate && appointmentDate <= endDate;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  static checkAppointmentConflicts(appointment: Partial<Appointment>, existingAppointments: Appointment[]): Appointment[] {
    if (!appointment.date || !appointment.time) return [];

    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    const appointmentEndTime = new Date(appointmentDateTime.getTime() + 60 * 60 * 1000); // Assume 1 hour duration

    return existingAppointments.filter(existing => {
      if (existing.id === appointment.id) return false; // Exclude self
      
      const existingDateTime = new Date(`${existing.date}T${existing.time}`);
      const existingEndTime = new Date(existingDateTime.getTime() + 60 * 60 * 1000);

      return (
        appointmentDateTime < existingEndTime && 
        appointmentEndTime > existingDateTime
      );
    });
  }
}

// Vendor Management Logic
export class VendorLogic {
  static getVendorTypeLabel(type: string): string {
    const labels = {
      fabric: 'Fabric Supplier',
      accessories: 'Accessories Supplier',
      equipment: 'Equipment Supplier',
      services: 'Service Provider'
    };
    return labels[type as keyof typeof labels] || type;
  }

  static getVendorsByType(vendors: Vendor[], type: string): Vendor[] {
    return vendors.filter(vendor => vendor.type === type);
  }

  static getActiveVendors(vendors: Vendor[]): Vendor[] {
    return vendors.filter(vendor => vendor.isActive);
  }
}

// Employee Management Logic
export class EmployeeLogic {
  static getEmployeeRoleLabel(role: UserRole): string {
    const labels = {
      admin: 'Administrator',
      manager: 'Manager',
      tailor: 'Tailor',
      assistant: 'Assistant'
    };
    return labels[role] || role;
  }

  static canAccessFeature(employeeRole: UserRole, requiredRoles: UserRole[]): boolean {
    return requiredRoles.includes(employeeRole);
  }

  static getEmployeesByRole(employees: Employee[], role: UserRole): Employee[] {
    return employees.filter(employee => employee.role === role);
  }

  static getActiveEmployees(employees: Employee[]): Employee[] {
    return employees.filter(employee => employee.isActive);
  }
}

// Dashboard Analytics Logic
export class DashboardLogic {
  static getOrderStatusDistribution(orders: Order[]): Record<OrderStatus, number> {
    const distribution: Record<OrderStatus, number> = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0
    };

    orders.forEach(order => {
      distribution[order.status]++;
    });

    return distribution;
  }

  static getRevenueByMonth(orders: Order[], months: number = 6): Record<string, number> {
    const revenue: Record<string, number> = {};
    const now = new Date();

    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
      revenue[monthKey] = 0;
    }

    orders.forEach(order => {
      if (order.status === 'completed') {
        const orderDate = new Date(order.createdAt);
        const monthKey = orderDate.toISOString().slice(0, 7);
        if (revenue[monthKey] !== undefined) {
          revenue[monthKey] += order.totalAmount;
        }
      }
    });

    return revenue;
  }

  static getTopCustomers(orders: Order[], customers: Customer[], limit: number = 5): Array<{ customer: Customer; totalSpent: number; orderCount: number }> {
    const customerStats = new Map<string, { totalSpent: number; orderCount: number }>();

    orders.forEach(order => {
      if (order.status === 'completed') {
        const existing = customerStats.get(order.customerId) || { totalSpent: 0, orderCount: 0 };
        existing.totalSpent += order.totalAmount;
        existing.orderCount += 1;
        customerStats.set(order.customerId, existing);
      }
    });

    return Array.from(customerStats.entries())
      .map(([customerId, stats]) => {
        const customer = customers.find(c => c.id === customerId);
        return customer ? { customer, ...stats } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b!.totalSpent - a!.totalSpent)
      .slice(0, limit) as Array<{ customer: Customer; totalSpent: number; orderCount: number }>;
  }
}

// Utility Functions
export class UtilityLogic {
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }

  static formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  static formatDateTime(date: string | Date): string {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  static calculateAge(birthDate: string | Date): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  static generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp.slice(-6)}-${random}`;
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }
} 