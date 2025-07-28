# Tailor Management System

A comprehensive management system built with Next.js, TypeScript, and Tailwind CSS.

## Features

### Enhanced Dynamic Form with Intelligent Lookup Fields

The system now includes an advanced dynamic form that automatically detects and handles lookup fields based on field naming patterns:

#### How Lookup Fields Work

1. **Automatic Detection**: The form automatically detects fields that should be lookup dropdowns based on naming patterns:
   - Fields ending with `Id` (e.g., `orderId`, `factoryId`, `customerId`)
   - Fields containing relationship keywords (e.g., `customerOf`, `productFor`)
   - Plural entity names (e.g., `customers`, `products`)

2. **Dynamic API Endpoint Generation**: Based on the field name, the system generates the appropriate API endpoint:
   - `orderId` → `/orders`
   - `factoryId` → `/factories` 
   - `customerId` → `/customers`
   - `smthId` → `/smths`

3. **Smart Display Field Detection**: The system automatically finds the best display field for each entity:
   - Priority order: `name`, `title`, `label`, `displayName`, `fullName`, `codeNumber`, `code`, `number`, `orderNumber`, `reference`, `description`, `shortName`, `abbreviation`, `customerName`, `productName`, `vendorName`, `factoryName`
   - Falls back to `Item {id}` if no display field is found

4. **User-Friendly Interface**: 
   - Shows friendly names in dropdowns (e.g., "John Doe" instead of "user_123")
   - Stores actual IDs as values for backend compatibility
   - Provides loading states while fetching options
   - Handles errors gracefully

#### Example Usage

```json
{
  "orderId": "order_123",
  "factoryId": "factory_456", 
  "customerId": "customer_789",
  "status": "pending"
}
```

The form will automatically:
- Fetch options from `/orders` for the `orderId` field
- Fetch options from `/factories` for the `factoryId` field  
- Fetch options from `/customers` for the `customerId` field
- Show a status dropdown for the `status` field

#### Benefits

- **Zero Configuration**: No need to manually specify which fields are lookups
- **Consistent UX**: All lookup fields behave the same way
- **Backend Ready**: Sends IDs as values while showing friendly names
- **Error Resilient**: Handles API failures gracefully
- **Loading States**: Shows loading indicators while fetching options

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `app/` - Next.js app router pages and layouts
- `components/` - Reusable UI components
- `lib/` - Utility functions and API services
- `public/` - Static assets

## Technologies Used

- **Next.js 14** - React framework with app router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **React Icons** - Icon library
- **Lucide React** - Additional icons
