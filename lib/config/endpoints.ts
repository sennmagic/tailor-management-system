// Centralized endpoint and entity configuration
export interface EntityConfig {
  endpoint: string;
  displayName: string;
  pluralName: string;
  singularName: string;
  hasStatusField: boolean;
  statusFieldName?: string;
  statusOptions?: string[];
  hasPagination: boolean;
  pageSize?: number;
  allowedMethods: ('GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE')[];
  requiresAuth: boolean;
  customFields?: {
    [key: string]: {
      type: 'lookup' | 'status' | 'date' | 'array' | 'object' | 'boolean' | 'number' | 'text';
      options?: string[];
      endpoint?: string;
      displayField?: string;
    };
  };
}

export const ENTITY_CONFIGS: Record<string, EntityConfig> = {
  customers: {
    endpoint: 'customers',
    displayName: 'Customers',
    pluralName: 'customers',
    singularName: 'customer',
    hasStatusField: false,
    hasPagination: true,
    pageSize: 7,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    requiresAuth: true,
  },
  orders: {
    endpoint: 'orders',
    displayName: 'Orders',
    pluralName: 'orders',
    singularName: 'order',
    hasStatusField: true,
    statusFieldName: 'orderStatus',
    statusOptions: ['Pending', 'Cutting', 'Sewing', 'Ready', 'Delivered', 'Cancelled'],
    hasPagination: false, // Orders use server-side pagination
    allowedMethods: ['GET', 'POST', 'PATCH', 'DELETE'],
    requiresAuth: true,
    customFields: {
      paymentStatus: {
        type: 'status',
        options: ['Paid', 'Unpaid', 'Partial'],
      },
      orderStatus: {
        type: 'status',
        options: ['Pending', 'Cutting', 'Sewing', 'Ready', 'Delivered', 'Cancelled'],
      },
    },
  },
  measurements: {
    endpoint: 'measurements',
    displayName: 'Measurements',
    pluralName: 'measurements',
    singularName: 'measurement',
    hasStatusField: true,
    statusFieldName: 'status',
    statusOptions: ['DRAFT', 'COMPLETED', 'IN PROGRESS'],
    hasPagination: true,
    pageSize: 7,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    requiresAuth: true,
    customFields: {
      measurementType: {
        type: 'lookup',
        options: ['DAURA SURUWAL', 'SUIT'],
        endpoint: 'measurementTypes',
      },
    },
  },
  vendors: {
    endpoint: 'vendors',
    displayName: 'Vendors',
    pluralName: 'vendors',
    singularName: 'vendor',
    hasStatusField: true,
    statusFieldName: 'status',
    statusOptions: ['Active', 'Inactive', 'Pending'],
    hasPagination: true,
    pageSize: 7,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    requiresAuth: true,
  },
  factories: {
    endpoint: 'factories',
    displayName: 'Factories',
    pluralName: 'factories',
    singularName: 'factory',
    hasStatusField: true,
    statusFieldName: 'status',
    statusOptions: ['Available', 'Busy', 'Inactive', 'Working'],
    hasPagination: true,
    pageSize: 7,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    requiresAuth: true,
    customFields: {
      specialization: {
        type: 'status',
        options: ['Daura Suruwal', 'Shirt', 'Pant', 'Coat', 'Tie', 'Cufflinks', 'Waistcoat', 'Blazer', 'Other'],
      },
    },
  },
  catalogs: {
    endpoint: 'catalogs',
    displayName: 'Catalogs',
    pluralName: 'catalogs',
    singularName: 'catalog',
    hasStatusField: false,
    hasPagination: true,
    pageSize: 7,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    requiresAuth: true,
  },
  invoices: {
    endpoint: 'invoices',
    displayName: 'Invoices',
    pluralName: 'invoices',
    singularName: 'invoice',
    hasStatusField: true,
    statusFieldName: 'status',
    statusOptions: ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'],
    hasPagination: true,
    pageSize: 7,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    requiresAuth: true,
  },
  employees: {
    endpoint: 'employees',
    displayName: 'Employees',
    pluralName: 'employees',
    singularName: 'employee',
    hasStatusField: true,
    statusFieldName: 'status',
    statusOptions: ['Active', 'Inactive', 'On Leave'],
    hasPagination: true,
    pageSize: 7,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    requiresAuth: true,
    customFields: {
      role: {
        type: 'status',
        options: ['Tailor', 'Accountant', 'Admin', 'SuperAdmin', 'Data Entry Clerk', 'Receptionist'],
      },
      gender: {
        type: 'status',
        options: ['Male', 'Female', 'Others'],
      },
    },
  },
  appointments: {
    endpoint: 'appointments',
    displayName: 'Appointments',
    pluralName: 'appointments',
    singularName: 'appointment',
    hasStatusField: true,
    statusFieldName: 'status',
    statusOptions: ['Scheduled', 'Confirmed', 'Completed', 'Cancelled'],
    hasPagination: true,
    pageSize: 7,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    requiresAuth: true,
    customFields: {
      appointmentType: {
        type: 'status',
        options: ['Consultation', 'Fitting', 'Delivery', 'Follow-up', 'Other'],
      },
    },
  },
  notifications: {
    endpoint: 'notifications',
    displayName: 'Notifications',
    pluralName: 'notifications',
    singularName: 'notification',
    hasStatusField: true,
    statusFieldName: 'status',
    statusOptions: ['Unread', 'Read', 'Archived'],
    hasPagination: true,
    pageSize: 7,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    requiresAuth: true,
    customFields: {
      type: {
        type: 'status',
        options: ['customer', 'employee', 'order', 'vendor', 'appointment', 'catalog', 'general'],
      },
      priority: {
        type: 'status',
        options: ['info', 'success', 'warning', 'error'],
      },
    },
  },
};

// Helper functions
export function getEntityConfig(entityName: string): EntityConfig | null {
  return ENTITY_CONFIGS[entityName] || null;
}

export function getEntityDisplayName(entityName: string): string {
  const config = getEntityConfig(entityName);
  return config?.displayName || entityName.charAt(0).toUpperCase() + entityName.slice(1);
}

export function getEntityEndpoint(entityName: string): string {
  const config = getEntityConfig(entityName);
  return config?.endpoint || entityName;
}

export function getEntityStatusOptions(entityName: string, fieldName?: string): string[] {
  const config = getEntityConfig(entityName);
  if (!config) return [];
  
  if (fieldName && config.customFields?.[fieldName]?.options) {
    return config.customFields[fieldName].options!;
  }
  
  if (config.statusOptions) {
    return config.statusOptions;
  }
  
  return [];
}

export function isEntityStatusField(entityName: string, fieldName: string): boolean {
  const config = getEntityConfig(entityName);
  if (!config) return false;
  
  if (config.statusFieldName === fieldName) return true;
  if (config.customFields?.[fieldName]?.type === 'status') return true;
  
  // Fallback to field name patterns
  const lowerFieldName = fieldName.toLowerCase();
  return lowerFieldName.includes('status') || 
         lowerFieldName.includes('state') || 
         lowerFieldName.includes('condition');
}

export function getEntityPaginationConfig(entityName: string): { hasPagination: boolean; pageSize: number } {
  const config = getEntityConfig(entityName);
  return {
    hasPagination: config?.hasPagination ?? true,
    pageSize: config?.pageSize ?? 7,
  };
}

export function getAllowedMethods(entityName: string): string[] {
  const config = getEntityConfig(entityName);
  return config?.allowedMethods ?? ['GET', 'POST', 'PUT', 'DELETE'];
}

export function requiresAuth(entityName: string): boolean {
  const config = getEntityConfig(entityName);
  return config?.requiresAuth ?? true;
}
