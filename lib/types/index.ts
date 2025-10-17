// API Response Types
export interface APIResponse<T = any> {
  data: T;
  message?: string;
  success?: boolean;
  tokens?: {
    access_token?: string;
    refresh_token?: string;
  };
}

// Stronger API response types
export interface PaginatedAPIResponse<T> {
  data: T[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  message?: string;
  success?: boolean;
}

export interface LookupAPIResponse {
  data: Array<{
    _id: string;
    name?: string;
    title?: string;
    label?: string;
    displayName?: string;
    [key: string]: any;
  }>;
  message?: string;
  success?: boolean;
}

export interface StatusAPIResponse {
  data: {
    _id: string;
    status: string;
    [key: string]: any;
  };
  message?: string;
  success?: boolean;
}

// User/Employee Types
export interface Employee {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'admin' | 'tailor' | 'manager' | 'assistant';

// Sidebar Types
export interface MenuItem {
  id: string;
  title: string;
  href: string;
  icon?: string;
  isActive?: boolean;
  children?: MenuItem[];
  permissions?: UserRole[];
}

export interface SidebarData {
  menuItems: MenuItem[];
  userRole: UserRole;
  userPermissions: string[];
}

// Re-export notification types
export * from './notifications';

// Customer Types
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  measurements?: Measurement[];
  orders?: Order[];
  createdAt: string;
  updatedAt: string;
}

// Order Types
export interface Order {
  id: string;
  customerId: string;
  customer?: Customer;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  description?: string;
}

export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

// Measurement Types
export interface Measurement {
  id: string;
  customerId: string;
  chest: number;
  waist: number;
  hips: number;
  shoulder: number;
  sleeve: number;
  neck: number;
  inseam: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Vendor Types
export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  type: VendorType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type VendorType = 'fabric' | 'accessories' | 'equipment' | 'services';

// Appointment Types
export interface Appointment {
  id: string;
  customerId: string;
  customer?: Customer;
  date: string;
  time: string;
  type: AppointmentType;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentType = 'measurement' | 'fitting' | 'delivery' | 'consultation';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled';

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: ValidationRule;
}

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

// Pagination Types
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// Error Types
export class APIError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Context Types
export interface EmployeeContextType {
  employeeData: Employee | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
} 