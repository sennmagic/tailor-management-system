// Utility functions for useLookup hook
import pluralize from 'pluralize';

// Status options configuration
export const STATUS_OPTIONS: Record<string, string[]> = {
  // Order Item Types
  itemtype: ['DAURA', 'SURUWAL', 'SHIRT', 'PANT', 'WAIST_COAT', 'COAT', 'BLAZER'],
  item_type: ['DAURA', 'SURUWAL', 'SHIRT', 'PANT', 'WAIST_COAT', 'COAT', 'BLAZER'],
  
  // Payment Status (Standard)
  paymentstatus: ['Paid', 'Unpaid', 'Partial'],
  
  // Payment Status (Factory/Vendor)
  'paymentstatus_factory': ['PAID', 'PENDING'],
  'paymentstatus_vendor': ['PAID', 'PENDING'],
  
  // Order Status
  orderstatus: ['Pending', 'Cutting', 'Sewing', 'Ready', 'Delivered', 'Cancelled'],
  order_status: ['Pending', 'Cutting', 'Sewing', 'Ready', 'Delivered', 'Cancelled'],
  
  // Factory Specialization
  specialization: ['Daura Suruwal', 'Shirt', 'Pant', 'Coat', 'Tie', 'Cufflinks', 'Waistcoat', 'Blazer', 'Other'],
  
  // Factory Status
  'status_factory': ['Available', 'Busy', 'Inactive', 'Working'],
  'unit_factory': ['Available', 'Busy', 'Inactive', 'Working'],
  
  // Measurement Type
  measurementtype: ['DAURA SURUWAL', 'SUIT'],
  measurement_type: ['DAURA SURUWAL', 'SUIT'],
  
  // Measurement Status
  'status_measurement': ['DRAFT', 'COMPLETED', 'IN PROGRESS'],
  
  // Logistics Category
  category: ['AC Repair', 'Laundry Service', 'Plumbing', 'Electrical', 'Carpentry', 'Pest Control', 'Internet Provider', 'Security Service', 'Courier', 'Water Supply', 'Cleaning Service', 'Other'],
  
  // Privilege Points Type
  'type_privilege': ['REDEEMED', 'EARNED'],
  
  // Notification Type
  'type_notification': ['customer', 'employee', 'order', 'vendor', 'appointment', 'catalog', 'general'],
  
  // Notification Action
  'action_notification': ['created', 'updated', 'deleted', 'status_changed'],
  
  // Notification Priority
  'priority_notification': ['info', 'success', 'warning', 'error'],
  
  // Sidebar Type
  'type_sidebar': ['menu', 'divider', 'header', 'submenu'],
  
  // Statistics Time Period
  timeperiod: ['day', 'week', 'month', 'year'],
  time_period: ['day', 'week', 'month', 'year'],
  
  // Employee Gender
  gender: ['Male', 'Female', 'Others'],
  
  // Employee Role
  role: ['Tailor', 'Accountant', 'Admin', 'SuperAdmin', 'Data Entry Clerk', 'Receptionist'],
  
  // Appointment Source
  'booking_channel_appointment': ['Call', 'WhatsApp', 'Walk-In', 'Website', 'e'],
  
  // Appointment Type
  appointmenttype: ['Consultation', 'Fitting', 'Delivery', 'Follow-up', 'Other'],
  appointment_type: ['Consultation', 'Fitting', 'Delivery', 'Follow-up', 'Other'],
  
  // Default payment status
  payment: ['Paid', 'Unpaid', 'Partial'],
  
  // Default order status
  order: ['Pending', 'Cutting', 'Sewing', 'Ready', 'Delivered', 'Cancelled'],
  
  // Default status options
  default: ['Pending', 'Active', 'Inactive', 'Completed', 'Cancelled'],
};

// Get status options based on field context
export function getStatusOptions(fieldName: string): string[] {
  const lower = fieldName.toLowerCase();
  
  // Check for exact matches first
  if (STATUS_OPTIONS[lower]) {
    return STATUS_OPTIONS[lower];
  }
  
  // Check for compound matches
  for (const [key, options] of Object.entries(STATUS_OPTIONS)) {
    if (lower.includes(key)) {
      return options;
    }
  }
  
  // Order Item Types
  if (lower.includes('itemtype') || lower.includes('item_type')) {
    return STATUS_OPTIONS.itemtype;
  }
  
  // Payment Status (Standard)
  if (lower.includes('paymentstatus') && !lower.includes('factory') && !lower.includes('vendor')) {
    return STATUS_OPTIONS.paymentstatus;
  }
  
  // Payment Status (Factory/Vendor)
  if (lower.includes('paymentstatus') && (lower.includes('factory') || lower.includes('vendor'))) {
    return STATUS_OPTIONS['paymentstatus_factory'];
  }
  
  // Order Status
  if (lower.includes('orderstatus') || lower.includes('order_status')) {
    return STATUS_OPTIONS.orderstatus;
  }
  
  // Factory Specialization
  if (lower.includes('specialization')) {
    return STATUS_OPTIONS.specialization;
  }
  
  // Factory Status
  if (lower.includes('status') && lower.includes('factory')) {
    return STATUS_OPTIONS['status_factory'];
  }
  
  if (lower.includes('unit') && lower.includes('factory')) {
    return STATUS_OPTIONS['unit_factory'];
  }
  
  // Measurement Type
  if (lower.includes('measurementtype') || lower.includes('measurement_type')) {
    return STATUS_OPTIONS.measurementtype;
  }
  
  // Measurement Status
  if (lower.includes('status') && lower.includes('measurement')) {
    return STATUS_OPTIONS['status_measurement'];
  }
  
  // Logistics Category
  if (lower.includes('category')) {
    return STATUS_OPTIONS.category;
  }
  
  // Privilege Points Type
  if (lower.includes('type') && lower.includes('privilege')) {
    return STATUS_OPTIONS['type_privilege'];
  }
  
  // Notification Type
  if (lower.includes('type') && lower.includes('notification')) {
    return STATUS_OPTIONS['type_notification'];
  }
  
  // Notification Action
  if (lower.includes('action') && lower.includes('notification')) {
    return STATUS_OPTIONS['action_notification'];
  }
  
  // Notification Priority
  if (lower.includes('priority') && lower.includes('notification')) {
    return STATUS_OPTIONS['priority_notification'];
  }
  
  // Sidebar Type
  if (lower.includes('type') && lower.includes('sidebar')) {
    return STATUS_OPTIONS['type_sidebar'];
  }
  
  // Statistics Time Period
  if (lower.includes('timeperiod') || lower.includes('time_period')) {
    return STATUS_OPTIONS.timeperiod;
  }
  
  // Employee Gender
  if (lower.includes('gender')) {
    return STATUS_OPTIONS.gender;
  }
  
  // Employee Role
  if (lower.includes('role')) {
    return STATUS_OPTIONS.role;
  }
  
  // Appointment Source
  if (lower.includes('booking channel') && lower.includes('appointment')) {
    return STATUS_OPTIONS['booking_channel_appointment'];
  }
  
  // Appointment Type
  if (lower.includes('appointmenttype') || lower.includes('appointment_type')) {
    return STATUS_OPTIONS.appointmenttype;
  }
  
  // Default payment status
  if (lower.includes('payment')) {
    return STATUS_OPTIONS.payment;
  }
  
  // Default order status
  if (lower.includes('order')) {
    return STATUS_OPTIONS.order;
  }
  
  // Default status options
  return STATUS_OPTIONS.default;
}

// Get status badge styling
export function getStatusBadgeStyle(status: string): { bg: string; text: string; border: string; icon?: string } {
  const lowerStatus = status.toLowerCase();
  
  // Success/Completed statuses
  if (lowerStatus.includes('completed') || lowerStatus.includes('done') || 
      lowerStatus.includes('finished') || lowerStatus.includes('success') || 
      lowerStatus.includes('approved') || lowerStatus.includes('active') ||
      lowerStatus.includes('paid') || lowerStatus.includes('delivered')) {
    return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: '✓' };
  }
  
  // Warning/Pending statuses
  if (lowerStatus.includes('processing') || lowerStatus.includes('waiting') ||
      lowerStatus.includes('on-hold') || lowerStatus.includes('scheduled') || lowerStatus.includes('draft')) {
    return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: '⏳' };
  }
  
  // Error/Failed statuses
  if (lowerStatus.includes('failed') || lowerStatus.includes('rejected') || 
      lowerStatus.includes('inactive') || lowerStatus.includes('error') || lowerStatus.includes('declined') ||
      lowerStatus.includes('expired') || lowerStatus.includes('void')) {
    return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: '✗' };
  }
  
  // Progress/Partial statuses
  if (lowerStatus.includes('progress') || lowerStatus.includes('in-progress') ||
      lowerStatus.includes('ongoing') || lowerStatus.includes('running') || lowerStatus.includes('working')) {
    return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: '⟳' };
  }
  
  // Info/Neutral statuses
  if (lowerStatus.includes('info') || lowerStatus.includes('new') || lowerStatus.includes('created') ||
      lowerStatus.includes('submitted') || lowerStatus.includes('received')) {
    return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: 'ℹ' };
  }
  
  // Default gray for unknown statuses
  return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: '•' };
}

// Format field name for display
export function formatFieldName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\bid\b/gi, 'ID')
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Format status value with badge data
export function formatStatusValue(value: unknown): { text: string; style: { bg: string; text: string; border: string; icon?: string } } {
  if (value == null || value === undefined || value === '') {
    return { text: "Not specified", style: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' } };
  }
  
  const statusStr = String(value);
  const style = getStatusBadgeStyle(statusStr);
  
  // Format the status text nicely
  const formattedText = statusStr
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/-/g, ' ') // Replace hyphens with spaces
    .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize first letter of each word
    .trim();
  
  return { text: formattedText, style };
}

// Check if field is a status field
export function isStatusField(fieldName: string): boolean {
  const lower = fieldName.toLowerCase();
  // Check for exact matches
  if (lower === 'status') return true;
  
  // Check for compound words containing 'status' (like PaymentStatus, OrderStatus, etc.)
  if (lower.includes('status')) return true;
  
  // Check for payment-related fields
  if (lower.includes('payment')) return true;
  
  // Check for state-related fields
  if (lower.includes('state')) return true;
  
  // Check for common status-like fields
  const statusKeywords = ['condition', 'phase', 'stage', 'mode', 'type'];
  return statusKeywords.some(keyword => lower.includes(keyword));
}

// Check if field is a date field
export function isDateField(fieldName: string): boolean {
  const lower = fieldName.toLowerCase();
  return lower === 'dob' || lower === 'date' || lower.includes('date') || lower.includes('time');
}

// Check if field is a measurement type field
export function isMeasurementTypeField(fieldName: string): boolean {
  const lower = fieldName.toLowerCase();
  return lower === 'measurementtype' || 
         lower === 'measurement_type' || 
         lower === 'measurementtype' ||
         (lower.includes('measurement') && lower.includes('type'));
}

// Check if field is a factory field
export function isFactoryField(fieldName: string): boolean {
  const lower = fieldName.toLowerCase();
  return lower.includes('factory');
}

// Check if field should be displayed
export function shouldDisplayField(key: string, value: unknown, currentEntity?: string): boolean {
  const skipFields = ["_id", "__v", "createdAt", "updatedAt"];
  if (skipFields.includes(key)) return false;
  
  // Hide top-level self-referential ids like customerId, customer_id, customer id
  if (currentEntity) {
    const lower = key.toLowerCase();
    const normalized = lower.replace(/[^a-z]/g, ''); // remove non-letters
    const selfNormalized = `${currentEntity}id`;
    if (normalized === selfNormalized) return false;
  }
  return true;
}

// Extract data array from various response formats
export function extractDataArray(data: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(data)) {
    if (data.length > 0 && typeof data[0] === "object") return data as Array<Record<string, unknown>>;
    if (data.length > 0 && typeof data[0] !== "object") {
      return (data as unknown[]).map((item) => ({ value: item }));
    }
    return [];
  }
  if (data && typeof data === "object") {
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
        return value as Array<Record<string, unknown>>;
      }
      if (Array.isArray(value) && value.length > 0 && typeof value[0] !== "object") {
        return value.map((item) => ({ value: item }));
      }
    }
  }
  return [];
}

// Determine current entity (singular) from prop or URL pathname
export function getCurrentEntity(selfEntityName?: string): string {
  if (selfEntityName && typeof selfEntityName === 'string') {
    return pluralize.singular(selfEntityName).toLowerCase();
  }
  if (typeof window !== 'undefined') {
    const last = (window.location?.pathname || '')
      .split('/')
      .filter(Boolean)
      .slice(-1)[0] || '';
    return pluralize.singular(last).toLowerCase();
  }
  return '';
}
