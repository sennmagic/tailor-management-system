"use client"

import React, { useState } from 'react'
import { useAPI, useAPIMutation } from '@/lib/apiService'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DynamicForm } from '@/components/Forms/DynamicFom'
import { AlertCircle, Edit, Plus, RefreshCw } from 'lucide-react'

export default function TestPatchPage() {
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  // Fetch test data (using customers as an example)
  const { data: apiData, error, isLoading, refetch } = useAPI({
    endpoint: 'customers',
    method: 'GET',
    withAuth: true
  })

  // PATCH mutation for editing
  const patchMutation = useAPIMutation({
    endpoint: 'customers',
    method: 'PATCH',
    onSuccess: () => {
      console.log('PATCH successful!')
      refetch()
      setEditIdx(null)
    },
    onError: (error) => {
      console.error('PATCH failed:', error)
    },
  })

  // POST mutation for creating
  const createMutation = useAPIMutation({
    endpoint: 'customers',
    method: 'POST',
    onSuccess: () => {
      console.log('POST successful!')
      refetch()
      setAddOpen(false)
    },
    onError: (error) => {
      console.error('POST failed:', error)
    },
  })

  const handleEdit = async (data: Record<string, unknown>, idx: number) => {
    const itemToEdit = apiData?.data?.[idx]
    const editId = itemToEdit?._id as string
    console.log('PATCH request data:', { ...data, _id: editId })
    
    await patchMutation.mutateAsync({
      ...data,
      _id: editId,
    })
  }

  const handleCreate = async (data: Record<string, unknown>) => {
    console.log('POST request data:', data)
    await createMutation.mutateAsync(data)
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Test PATCH Functionality</h1>
      
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
              <strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Error:</strong> {error || 'None'}
            </div>
            <div>
              <strong>Has Data:</strong> {apiData ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>PATCH Loading:</strong> {patchMutation.isLoading ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>POST Loading:</strong> {createMutation.isLoading ? 'Yes' : 'No'}
            </div>
            <Button onClick={() => refetch()} disabled={isLoading}>
              {isLoading ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading data...</span>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">API Error</h3>
              <p className="text-gray-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {apiData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Customer Data</span>
              <Button
                onClick={() => setAddOpen(true)}
                disabled={createMutation.isLoading}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {apiData.data?.map((item: any, idx: number) => (
                <div key={item._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <strong>{item.name || item.customerName || `Customer ${idx + 1}`}</strong>
                    <p className="text-sm text-gray-600">{item.email || item.phone || 'No contact info'}</p>
                  </div>
                  <Button
                    onClick={() => setEditIdx(idx)}
                    disabled={patchMutation.isLoading}
                    size="sm"
                    variant="outline"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      {editIdx !== null && apiData?.data?.[editIdx] && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] overflow-hidden">
            <DynamicForm
              data={apiData.data[editIdx]}
              onSubmit={(values) => handleEdit(values, editIdx)}
              onCancel={() => setEditIdx(null)}
              isLoading={patchMutation.isLoading}
            />
          </div>
        </div>
      )}

      {/* Add Modal */}
      {addOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] overflow-hidden">
            <DynamicForm
              data={{}}
              onSubmit={handleCreate}
              onCancel={() => setAddOpen(false)}
              isLoading={createMutation.isLoading}
            />
          </div>
        </div>
      )}
    </div>
  )
} 