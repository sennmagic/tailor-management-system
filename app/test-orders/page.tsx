"use client"

import React from 'react'
import { useAPI } from '@/lib/apiService'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function TestOrdersPage() {
  const { data: orderData, error: orderError, isLoading: orderLoading, refetch } = useAPI({
    endpoint: 'orders',
    method: 'GET',
    withAuth: true
  })

  console.log('TestOrdersPage Debug:', {
    orderData,
    orderError,
    orderLoading,
    hasData: !!orderData,
    dataType: typeof orderData,
    isArray: Array.isArray(orderData),
    dataLength: Array.isArray(orderData) ? orderData.length : 'not array'
  })

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Test Orders API</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            API Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <strong>Loading:</strong> {orderLoading ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Error:</strong> {orderError || 'None'}
            </div>
            <div>
              <strong>Has Data:</strong> {orderData ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Data Type:</strong> {typeof orderData}
            </div>
            <div>
              <strong>Is Array:</strong> {Array.isArray(orderData) ? 'Yes' : 'No'}
            </div>
            {Array.isArray(orderData) && (
              <div>
                <strong>Array Length:</strong> {orderData.length}
              </div>
            )}
            <Button onClick={() => refetch()} disabled={orderLoading}>
              {orderLoading ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {orderLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading orders...</span>
          </CardContent>
        </Card>
      )}

      {orderError && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">API Error</h3>
              <p className="text-gray-600">{orderError}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {orderData && (
        <Card>
          <CardHeader>
            <CardTitle>Raw Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(orderData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 