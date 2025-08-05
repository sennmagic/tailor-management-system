import React, { useState, useMemo } from 'react';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';
import { Skeleton } from './skeleton';
import { 
  Bell, 
  Filter, 
  Search, 
  CheckCheck, 
  Trash2, 
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { NotificationType, NotificationAction, NotificationFilters } from '@/lib/types/notifications';

interface NotificationListProps {
  className?: string;
  maxHeight?: string;
}

const NotificationList = React.memo(function NotificationList({ className = '', maxHeight = '600px' }: NotificationListProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    pagination,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    getNotificationsByType,
    getNotificationsByAction,
    getUnreadNotifications,
    refreshNotifications,
  } = useNotifications();

  const [filters, setFilters] = useState<NotificationFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<NotificationType | 'all'>('all');
  const [selectedAction, setSelectedAction] = useState<NotificationAction | 'all'>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Filter notifications based on current filters
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(n => n.type === selectedType);
    }

    // Filter by action
    if (selectedAction !== 'all') {
      filtered = filtered.filter(n => n.action === selectedAction);
    }

    // Filter by read status
    if (showUnreadOnly) {
      filtered = filtered.filter(n => !n.isRead);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [notifications, selectedType, selectedAction, showUnreadOnly, searchTerm]);

  const handleFilterChange = (newFilters: Partial<NotificationFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handlePageChange = (page: number) => {
    fetchNotifications(page, filters);
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleClearAll = async () => {
    await clearAllNotifications();
  };

  const handleRefresh = async () => {
    await refreshNotifications();
  };

  if (error) {
    return (
      <div className={`p-4 text-center ${className}`}>
        <div className="text-red-600 mb-2">Error loading notifications</div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleRefresh} variant="ghost" size="sm" disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
              <CheckCheck className="w-4 h-4 mr-1" />
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button onClick={handleClearAll} variant="outline" size="sm">
              <Trash2 className="w-4 h-4 mr-1" />
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as NotificationType | 'all')}
            className="px-3 py-1 text-sm border rounded-md bg-white"
          >
            <option value="all">All Types</option>
            <option value="customer">Customer</option>
            <option value="catalog">Catalog</option>
            <option value="order">Order</option>
            <option value="employee">Employee</option>
            <option value="appointment">Appointment</option>
            <option value="system">System</option>
          </select>

          {/* Action Filter */}
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value as NotificationAction | 'all')}
            className="px-3 py-1 text-sm border rounded-md bg-white"
          >
            <option value="all">All Actions</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="deleted">Deleted</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="reminder">Reminder</option>
          </select>

          {/* Unread Only Toggle */}
          <Button
            variant={showUnreadOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
          >
            Unread only
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <div 
        className="space-y-2 overflow-y-auto"
        style={{ maxHeight }}
      >
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            </div>
          ))
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No notifications found</p>
            {searchTerm || selectedType !== 'all' || selectedAction !== 'all' || showUnreadOnly ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('all');
                  setSelectedAction('all');
                  setShowUnreadOnly(false);
                }}
                className="mt-2"
              >
                Clear filters
              </Button>
            ) : null}
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification._id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
            {pagination.totalItems} notifications
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevious}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNext}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

export { NotificationList } 