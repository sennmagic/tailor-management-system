import { useState, useEffect, useCallback } from 'react';
import { fetchAPI } from '@/lib/apiService';
import { Order, OrderStatus, APIResponse } from '@/lib/types';

interface UseOrdersReturn {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<boolean>;
  createOrder: (orderData: Partial<Order>) => Promise<boolean>;
  updateOrder: (orderId: string, orderData: Partial<Order>) => Promise<boolean>;
  deleteOrder: (orderId: string) => Promise<boolean>;
}

export function useOrders(): UseOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    const { data, error: fetchError } = await fetchAPI<Order[]>({
      endpoint: 'orders',
      method: 'GET',
      withAuth: true,
    });

    if (fetchError) {
      setError(fetchError);
      setIsLoading(false);
      return;
    }

    setOrders(data || []);
    setIsLoading(false);
  }, []);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus): Promise<boolean> => {
    const { data, error: updateError } = await fetchAPI<Order>({
      endpoint: `orders/${orderId}`,
      method: 'PATCH',
      data: { status },
      withAuth: true,
    });

    if (updateError) {
      setError(updateError);
      return false;
    }

    // Update the order in the local state
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status, updatedAt: new Date().toISOString() } : order
    ));

    return true;
  }, []);

  const createOrder = useCallback(async (orderData: Partial<Order>): Promise<boolean> => {
    const { data, error: createError } = await fetchAPI<Order>({
      endpoint: 'orders',
      method: 'POST',
      data: orderData,
      withAuth: true,
    });

    if (createError) {
      setError(createError);
      return false;
    }

    if (data) {
      setOrders(prev => [...prev, data]);
    }

    return true;
  }, []);

  const updateOrder = useCallback(async (orderId: string, orderData: Partial<Order>): Promise<boolean> => {
    const { data, error: updateError } = await fetchAPI<Order>({
      endpoint: `orders/${orderId}`,
      method: 'PUT',
      data: orderData,
      withAuth: true,
    });

    if (updateError) {
      setError(updateError);
      return false;
    }

    if (data) {
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, ...data, updatedAt: new Date().toISOString() } : order
      ));
    }

    return true;
  }, []);

  const deleteOrder = useCallback(async (orderId: string): Promise<boolean> => {
    const { error: deleteError } = await fetchAPI({
      endpoint: `orders/${orderId}`,
      method: 'DELETE',
      withAuth: true,
    });

    if (deleteError) {
      setError(deleteError);
      return false;
    }

    setOrders(prev => prev.filter(order => order.id !== orderId));
    return true;
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    isLoading,
    error,
    refetch: fetchOrders,
    updateOrderStatus,
    createOrder,
    updateOrder,
    deleteOrder,
  };
} 