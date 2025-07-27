import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchAPI } from '@/lib/apiService';
import { 
  Notification, 
  NotificationResponse, 
  NotificationFilters, 
  NotificationState,
  NotificationType,
  NotificationAction 
} from '@/lib/types/notifications';

interface UseNotificationsReturn extends NotificationState {
  fetchNotifications: (page?: number, filters?: NotificationFilters) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  getNotificationsByType: (type: NotificationType) => Notification[];
  getNotificationsByAction: (action: NotificationAction) => Notification[];
  getUnreadNotifications: () => Notification[];
  refreshNotifications: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
    pagination: null,
  });

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (page = 1, filters?: NotificationFilters) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      
      if (filters) {
        if (filters.type) params.append('type', filters.type);
        if (filters.action) params.append('action', filters.action);
        if (filters.isRead !== undefined) params.append('isRead', filters.isRead.toString());
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.search) params.append('search', filters.search);
      }

      const { data, error } = await fetchAPI<NotificationResponse>({
        endpoint: `notifications?${params.toString()}`,
        method: 'GET',
        withAuth: true,
      });

      if (error) {
        throw new Error(error);
      }

      if (data) {
        const unreadCount = data.data.filter(notification => !notification.isRead).length;
        setState(prev => ({
          ...prev,
          notifications: data.data,
          unreadCount,
          pagination: data.pagination,
          isLoading: false,
        }));
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to fetch notifications',
        isLoading: false,
      }));
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await fetchAPI({
        endpoint: `notifications/${notificationId}/read`,
        method: 'PATCH',
        withAuth: true,
      });

      if (error) {
        throw new Error(error);
      }

      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(notification =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const { error } = await fetchAPI({
        endpoint: 'notifications/mark-all-read',
        method: 'PATCH',
        withAuth: true,
      });

      if (error) {
        throw new Error(error);
      }

      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(notification => ({
          ...notification,
          isRead: true,
        })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error } = await fetchAPI({
        endpoint: `notifications/${notificationId}`,
        method: 'DELETE',
        withAuth: true,
      });

      if (error) {
        throw new Error(error);
      }

      setState(prev => {
        const deletedNotification = prev.notifications.find(n => n._id === notificationId);
        return {
          ...prev,
          notifications: prev.notifications.filter(n => n._id !== notificationId),
          unreadCount: deletedNotification?.isRead ? prev.unreadCount : Math.max(0, prev.unreadCount - 1),
        };
      });
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    try {
      const { error } = await fetchAPI({
        endpoint: 'notifications/clear-all',
        method: 'DELETE',
        withAuth: true,
      });

      if (error) {
        throw new Error(error);
      }

      setState(prev => ({
        ...prev,
        notifications: [],
        unreadCount: 0,
      }));
    } catch (err) {
      console.error('Failed to clear all notifications:', err);
    }
  }, []);

  // Get notifications by type
  const getNotificationsByType = useCallback((type: NotificationType) => {
    return state.notifications.filter(notification => notification.type === type);
  }, [state.notifications]);

  // Get notifications by action
  const getNotificationsByAction = useCallback((action: NotificationAction) => {
    return state.notifications.filter(notification => notification.action === action);
  }, [state.notifications]);

  // Get unread notifications
  const getUnreadNotifications = useCallback(() => {
    return state.notifications.filter(notification => !notification.isRead);
  }, [state.notifications]);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications(1);
  }, [fetchNotifications]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  return {
    ...state,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    getNotificationsByType,
    getNotificationsByAction,
    getUnreadNotifications,
    refreshNotifications,
  };
} 