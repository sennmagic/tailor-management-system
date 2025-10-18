"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { fetchAPI, useAPI, useAPIMutation } from "@/lib/apiService";
import { useAlert } from "@/components/ui/alertProvider";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { DynamicForm } from "@/components/Forms/DynamicFom";
import OrderFormWithErrorBoundary from "@/components/ui/orderForm";
import { OrderTable } from "@/components/ui/orderTable";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { ViewDetailsModal } from "@/components/ui/ViewDetailsModal";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { TableFilter } from "@/components/ui/TableFilter";
import { useLookup } from "@/lib/hooks/useLookup";
import { getEntityDisplayName } from "@/lib/config/endpoints";
import Link from "next/link";

export default function SlugPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  let slug = params.slug as string | undefined;
  if (Array.isArray(slug)) slug = slug[0];
  const { showAlert } = useAlert();
  
  // State management
  const [viewIdx, setViewIdx] = useState<number | null>(null);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [postCreatePrompt, setPostCreatePrompt] = useState<null | { type: 'customer' | 'measurement' | 'order', id?: string }>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; idx?: number }>({ open: false });
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<number | null>(null);
  const [filteredData, setFilteredData] = useState<Array<Record<string, unknown>>>([]);
  const hasAutoOpenedRef = useRef(false);

  // React Query hooks
  const { data: apiData, error, isLoading, refetch } = useAPI({
    endpoint: slug || '',
    method: 'GET',
    enabled: !!slug,
  });

  // Use the unified lookup hook
  const {
    extractDataArray,
    isStatusField,
    getStatusOptions,
    formatStatusValue,
    filterSubmitFields,
    getEmptyFormData
  } = useLookup({ data: [], selfEntityName: slug });

  // Extract data array from API response
  const apiResponse = useMemo(() => {
    if (!apiData) return [];
    return extractDataArray(apiData);
  }, [apiData, extractDataArray]);

  // Initialize filtered data when apiResponse changes
  useEffect(() => {
    setFilteredData(apiResponse);
  }, [apiResponse]);

  // Mutation hooks for CRUD operations
  const createMutation = useAPIMutation({
    endpoint: slug || '',
    method: 'POST',
    onSuccess: () => {
      showAlert("Created successfully!", "success");
      refetch();
      if (slug === 'measurements') {
        setPostCreatePrompt({ type: 'measurement' });
      } else if (slug === 'customers') {
        setPostCreatePrompt({ type: 'customer' });
      }
    },
    onError: (error) => {
      showAlert(`Failed to create: ${error}`, "destructive");
    },
  });

  const patchMutation = useAPIMutation({
    endpoint: slug || '',
    method: 'PATCH',
    onSuccess: () => {
      showAlert("Update successful!", "success");
      refetch();
    },
    onError: (error) => {
      showAlert(`Failed to update: ${error}`, "destructive");
    },
  });

  const deleteMutation = useAPIMutation({
    endpoint: slug || '',
    method: 'DELETE',
    onSuccess: () => {
      showAlert("Deleted successfully!", "success");
      refetch();
    },
    onError: (error) => {
      showAlert(`Failed to delete: ${error}`, "destructive");
    },
  });

  // Auto open order form when /orders?open=1
  useEffect(() => {
    if (slug === 'orders') {
      const shouldOpen = searchParams?.get('open') === '1';
      if (shouldOpen && !addOpen && !hasAutoOpenedRef.current) {
        hasAutoOpenedRef.current = true;
        setAddOpen(true);
      }
    }
  }, [slug, addOpen]);

  // Get table columns based on data
  const allKeys = useMemo(() => {
    const filterOutIds = (arr: string[]) => arr.filter(k => k !== '_id' && k !== 'id');
    let keys = apiResponse[0] ? filterOutIds(Object.keys(apiResponse[0])).slice(0, 4) : [];
    if (keys.length === 0 && apiResponse.length > 0) {
      return ["value"];
    }
    
    // For orders, ensure status fields are included and prioritized
    if (slug === 'orders' && apiResponse[0]) {
      const orderKeys = filterOutIds(Object.keys(apiResponse[0]));
      const statusKeys = orderKeys.filter(key => isStatusField(key));
      const nonStatusKeys = orderKeys.filter(key => !isStatusField(key)).slice(0, 3);
      keys = [...statusKeys, ...nonStatusKeys];
    }
    
    return filterOutIds(keys);
  }, [apiResponse, slug, isStatusField]);

  // API operations
  const handleCreate = async (data: Record<string, unknown>) => {
    const filteredData = filterSubmitFields(data);
    await createMutation.mutateAsync(filteredData);
    setAddOpen(false);
  };

  const handleUpdate = async (data: Record<string, unknown>, idx: number) => {
    const itemToEdit = apiResponse[idx];
    const editId = itemToEdit?._id as string;
    const filteredData = filterSubmitFields(data);
    
    if (!editId) {
      showAlert("Item ID not found for update", "destructive");
      return;
    }
    
    const result = await fetchAPI({
      endpoint: slug || '',
      method: 'PUT',
      id: editId,
      data: filteredData,
      withAuth: true
    });
    
    if (result.error) {
      showAlert(`Failed to update: ${result.error}`, "destructive");
    } else {
      showAlert("Update successful!", "success");
      refetch();
      setEditIdx(null);
    }
  };

  const handleDelete = async (idx: number) => {
    const itemToDelete = apiResponse[idx];
    const deleteId = itemToDelete?._id as string;
    
    if (!deleteId) {
      showAlert("Item ID not found for deletion", "destructive");
      return;
    }
    
    const result = await fetchAPI({
      endpoint: slug || '',
      method: 'DELETE',
      id: deleteId,
      withAuth: true
    });
    
    if (result.error) {
      showAlert(`Failed to delete: ${result.error}`, "destructive");
    } else {
      showAlert("Deleted successfully!", "success");
      refetch();
      setConfirmDelete({ open: false });
    }
  };

  const handleFieldUpdate = async (idx: number, fieldName: string, newValue: string) => {
    const itemToUpdate = apiResponse[idx];
    const fieldId = itemToUpdate?._id as string;
    
    if (!fieldId) {
      showAlert("Item ID not found for field update", "destructive");
      return;
    }
    
    const method = slug === 'orders' ? 'PATCH' : 'PUT';
    
    const result = await fetchAPI({
      endpoint: slug || '',
      method: method,
      id: fieldId,
      data: { [fieldName]: newValue },
      withAuth: true
    });
    
    if (result.error) {
      showAlert(`Failed to update field: ${result.error}`, "destructive");
    } else {
      showAlert("Field updated successfully!", "success");
      refetch();
    }
  };

  return (
    <div>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {slug && (
            <BreadcrumbItem>
              <BreadcrumbPage>
                {getEntityDisplayName(slug)}
              </BreadcrumbPage>
            </BreadcrumbItem>
          )}
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">
          {slug === 'orders' ? 'Orders Management' : getEntityDisplayName(slug || '')}
        </h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setAddOpen(true)}
            disabled={createMutation.isLoading}
          >
            {createMutation.isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Adding...
              </div>
            ) : (
              slug === 'orders' ? '+ Create Order' : `+ Add ${getEntityDisplayName(slug || '')}`
            )}
          </Button>
        </div>
      </div>
      
      {/* Show OrderForm when addOpen is true for orders */}
      {slug === 'orders' && addOpen && (
        <OrderFormWithErrorBoundary 
          onSuccess={() => { 
            setAddOpen(false); 
            setPostCreatePrompt({ type: 'order' }); 
            if (searchParams?.get('open') === '1') router.replace('/orders');
          }}
          onCancel={() => {
            hasAutoOpenedRef.current = true;
            setAddOpen(false);
            if (searchParams?.get('open') === '1') router.replace('/orders');
          }}
          mode="create"
        />
      )}
      
      {/* Table Filter */}
      {!addOpen && apiResponse.length > 0 && (
        <TableFilter
          data={apiResponse}
          onFilteredDataChange={setFilteredData}
          searchFields={[]} // Auto-detect
          statusFields={[]} // Auto-detect
          dateFields={[]} // Auto-detect
          numberFields={[]} // Auto-detect
        />
      )}

      {/* Use improved OrderTable for orders page, DataTable for other pages */}
      {!addOpen && (
        <>
          {slug === 'orders' ? (
            <OrderTable
              orders={filteredData as any[]}
              loading={isLoading}
              onEdit={(order) => {
                const orderIndex = apiResponse.findIndex(item => item._id === order._id);
                if (orderIndex !== -1) {
                  setEditIdx(orderIndex);
                }
              }}
              onView={(order) => {
                const orderIndex = apiResponse.findIndex(item => item._id === order._id);
                if (orderIndex !== -1) {
                  setViewIdx(orderIndex);
                }
              }}
              onDelete={(orderId) => {
                const orderIndex = apiResponse.findIndex(item => item._id === orderId);
                if (orderIndex !== -1) {
                  setConfirmDelete({ open: true, idx: orderIndex });
                }
              }}
              onStatusChange={(orderId, status, field) => {
                const orderIndex = apiResponse.findIndex(item => item._id === orderId);
                if (orderIndex !== -1) {
                  handleFieldUpdate(orderIndex, field, status);
                }
              }}
            />
          ) : (
            <DataTable
              data={filteredData}
              loading={isLoading}
              error={error}
              slug={slug}
              onView={setViewIdx}
              onEdit={setEditIdx}
              onDelete={(idx) => setConfirmDelete({ open: true, idx })}
              onFieldUpdate={handleFieldUpdate}
              isUpdatingStatus={isUpdatingStatus}
            />
          )}
        </>
      )}

      {/* Modals */}
      <ViewDetailsModal 
        data={viewIdx !== null ? apiResponse[viewIdx] : null}
        open={viewIdx !== null}
        onClose={() => setViewIdx(null)}
      />

      {/* Edit Modal - Use OrderForm for orders, DynamicForm for others */}
      {slug === 'orders' ? (
        editIdx !== null && (
          <OrderFormWithErrorBoundary
            initialData={apiResponse[editIdx]}
            onSuccess={() => setEditIdx(null)}
            onCancel={() => setEditIdx(null)}
            mode="edit"
          />
        )
      ) : (
        <Modal open={editIdx !== null} onClose={() => setEditIdx(null)} isFullScreen={true}>
          {editIdx !== null && (
            <DynamicForm
              data={apiResponse[editIdx]}
              onSubmit={async (values) => {
                await handleUpdate(values, editIdx!);
              }}
              onCancel={() => setEditIdx(null)}
              isLoading={patchMutation.isLoading}
              currentEntity={slug}
            />
          )}
        </Modal>
      )}

      <ConfirmDialog
        open={confirmDelete.open}
        title="Delete item?"
        message="Are you sure you want to delete this item? This action cannot be undone."
        primaryLabel="Delete"
        danger
        onSecondary={() => setConfirmDelete({ open: false })}
        onPrimary={() => {
          if (confirmDelete.idx !== undefined && confirmDelete.idx !== null) {
            handleDelete(confirmDelete.idx);
          }
        }}
      />

      {/* Only show dynamic form modal for non-orders pages */}
      {slug !== 'orders' && (
        <Modal open={addOpen} onClose={() => setAddOpen(false)} isFullScreen={true}>
          <DynamicForm
            data={getEmptyFormData(apiResponse, allKeys)}
            onSubmit={async (values) => {
              await handleCreate(values);
            }}
            onCancel={() => setAddOpen(false)}
            isLoading={createMutation.isLoading}
            currentEntity={slug}
          />
        </Modal>
      )}

      {/* Post-create prompts */}
      <ConfirmDialog
        open={postCreatePrompt?.type === 'measurement'}
        title="Measurement created"
        description="Proceed to create an order?"
        secondaryLabel="Close"
        primaryLabel="Go to Orders"
        onSecondary={() => setPostCreatePrompt(null)}
        onPrimary={() => { setPostCreatePrompt(null); router.push('/orders?open=1'); }}
      />
      <ConfirmDialog
        open={postCreatePrompt?.type === 'customer'}
        title="Customer created"
        description="Proceed to create a measurement?"
        secondaryLabel="Close"
        primaryLabel="Go to Measurements"
        onSecondary={() => setPostCreatePrompt(null)}
        onPrimary={() => { setPostCreatePrompt(null); router.push('/measurements?open=1'); }}
      />
      <ConfirmDialog
        open={postCreatePrompt?.type === 'order'}
        title="Order created successfully"
        description="You can review and download the invoice from the invoices page."
        secondaryLabel="Stay"
        primaryLabel="Go to Invoices"
        onSecondary={() => setPostCreatePrompt(null)}
        onPrimary={() => { setPostCreatePrompt(null); router.push('/invoices'); }}
      />
    </div>
  );
}