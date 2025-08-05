"use client"

import React, { useState } from 'react'
import OrderFormWithErrorBoundary from '@/components/ui/orderForm'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Plus, Edit, Eye, Package } from 'lucide-react'

export function OrderFormExample() {
  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])

  const handleCreateOrder = () => {
    setFormMode('create')
    setSelectedOrder(null)
    setShowForm(true)
  }

  const handleEditOrder = (order: any) => {
    setFormMode('edit')
    setSelectedOrder(order)
    setShowForm(true)
  }

  const handleFormSuccess = (data: any) => {
    if (formMode === 'create') {
      setOrders(prev => [...prev, data])
    } else {
      setOrders(prev => prev.map(order => 
        order._id === data._id ? data : order
      ))
    }
    setShowForm(false)
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setSelectedOrder(null)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Order Management</h1>
        <Button onClick={handleCreateOrder} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create New Order
        </Button>
      </div>

      {showForm ? (
        <OrderFormWithErrorBoundary
          initialData={selectedOrder}
          mode={formMode}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No orders created yet.</p>
                  <p className="text-sm">Click "Create New Order" to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order, index) => (
                    <div key={order._id || index} className="border rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Order #{order._id || index + 1}</h3>
                        <p className="text-sm text-gray-600">
                          Customer: {order.customerId} | 
                          Status: {order.status} | 
                          Total: ${order.totalAmount?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditOrder(order)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 