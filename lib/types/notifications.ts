// Notification Types
export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  action: NotificationAction;
  createdAt: string;
  updatedAt: string;
  isRead?: boolean;
  recipientId?: string;
  metadata?: NotificationMetadata;
}

export type NotificationType = 'customer' | 'catalog' | 'order' | 'employee' | 'appointment' | 'system';
export type NotificationAction = 'created' | 'updated' | 'deleted' | 'completed' | 'cancelled' | 'reminder';

export interface NotificationMetadata {
  customerId?: string;
  orderId?: string;
  employeeId?: string;
  amount?: number;
  items?: string[];
  contact?: string;
  reason?: string;
}

// API Response Types
export interface NotificationResponse {
  data: Notification[];
  message: string;
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
  itemsPerPage: number;
}

// Notification State Types
export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  pagination: PaginationMeta | null;
}

// Notification Filter Types
export interface NotificationFilters {
  type?: NotificationType;
  action?: NotificationAction;
  isRead?: boolean;
  startDate?: string;
  endDate?: string;
  search?: string;
}

// Notification Settings
export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  types: {
    customer: boolean;
    catalog: boolean;
    order: boolean;
    employee: boolean;
    appointment: boolean;
    system: boolean;
  };
} 