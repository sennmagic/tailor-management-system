# Order Form Component

A comprehensive order management form component that integrates with the existing lookup hooks, form validation, and API service.

## Features

- **Dynamic Form Fields**: Uses the `useLookup` hook to automatically detect field types and fetch lookup options
- **Form Validation**: Integrated with `useFormValidation` hook for client-side validation
- **API Integration**: Uses `useAPIMutation` for creating and updating orders via the `/orders` endpoint
- **Responsive Design**: Mobile-friendly layout with proper grid system
- **Status Management**: Built-in status fields with color-coded badges
- **Order Items**: Dynamic order items with add/remove functionality
- **Real-time Calculations**: Automatic total amount calculation
- **Error Handling**: Comprehensive error display and validation feedback

## Usage

### Basic Usage

```tsx
import { OrderForm } from '@/components/ui/orderForm'

function MyComponent() {
  const handleSuccess = (data) => {
    console.log('Order created/updated:', data)
  }

  const handleCancel = () => {
    console.log('Form cancelled')
  }

  return (
    <OrderForm
      mode="create"
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  )
}
```

### Edit Mode

```tsx
const existingOrder = {
  customerId: 'customer123',
  orderDate: '2024-01-15',
  deliveryDate: '2024-01-20',
  status: 'pending',
  items: [
    { productId: 'product1', quantity: 2, price: 25.99 }
  ]
}

<OrderForm
  mode="edit"
  initialData={existingOrder}
  onSuccess={handleSuccess}
  onCancel={handleCancel}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialData` | `OrderFormData` | `undefined` | Initial data for edit mode |
| `onSuccess` | `(data: any) => void` | `undefined` | Callback when form is successfully submitted |
| `onCancel` | `() => void` | `undefined` | Callback when form is cancelled |
| `mode` | `'create' \| 'edit'` | `'create'` | Form mode |

## Form Fields

### Basic Information
- **Customer**: Dropdown populated from `/customers` endpoint
- **Order Date**: Date picker with validation
- **Delivery Date**: Date picker with validation
- **Status**: Dropdown with order status options
- **Priority**: Dropdown with priority levels
- **Payment Status**: Dropdown with payment status options

### Order Items
- **Product**: Dropdown populated from `/catalogs` endpoint
- **Quantity**: Number input with minimum value of 1
- **Price**: Number input with decimal support
- **Description**: Optional text input

### Additional Fields
- **Shipping Address**: Multi-line text area
- **Billing Address**: Multi-line text area
- **Notes**: Multi-line text area for additional information

## API Integration

The form automatically integrates with the `/orders` endpoint:

- **POST** `/orders` - Create new order
- **PUT** `/orders` - Update existing order

### Request Format

```json
{
  "customerId": "string",
  "orderDate": "2024-01-15",
  "deliveryDate": "2024-01-20",
  "status": "pending",
  "totalAmount": 51.98,
  "items": [
    {
      "productId": "string",
      "quantity": 2,
      "price": 25.99,
      "description": "Optional description"
    }
  ],
  "notes": "Optional notes",
  "priority": "normal",
  "paymentStatus": "pending",
  "shippingAddress": "Optional shipping address",
  "billingAddress": "Optional billing address"
}
```

## Validation Rules

The form includes the following validation rules:

- `customerId`: Required
- `orderDate`: Required
- `deliveryDate`: Required
- `status`: Required
- `priority`: Required
- `paymentStatus`: Required

## Status Options

### Order Status
- `pending`
- `confirmed`
- `processing`
- `shipped`
- `delivered`
- `cancelled`

### Payment Status
- `pending`
- `processing`
- `paid`
- `failed`
- `refunded`

### Priority Levels
- `low`
- `normal`
- `high`
- `urgent`

## Styling

The component uses the existing UI components and follows the design system:

- **Card Layout**: Uses `Card`, `CardHeader`, `CardContent`, `CardFooter`
- **Form Controls**: Uses `Input`, `Select`, `Textarea`, `Button`
- **Icons**: Uses Lucide React icons for visual consistency
- **Responsive**: Mobile-first design with proper grid breakpoints

## Error Handling

- **Validation Errors**: Displayed below each field with red styling
- **API Errors**: Handled by the mutation hooks and logged to console
- **Loading States**: Shows loading spinners during form submission

## Dependencies

- `@/lib/hooks/useLookup` - Dynamic field detection and lookup options
- `@/lib/hooks/useFormValidation` - Form validation logic
- `@/lib/apiService` - API mutation hooks
- `@/components/ui/*` - UI components
- `lucide-react` - Icons

## Example Implementation

See `lib/examples/OrderFormExample.tsx` for a complete implementation example. 