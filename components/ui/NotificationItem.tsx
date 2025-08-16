

import React from 'react';
import { Notification, NotificationType, NotificationAction } from '@/lib/types/notifications';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  User, 
  Package, 
  ShoppingCart, 
  Users, 
  Calendar, 
  Settings,
  Check,
  Trash2,
  Clock
} from 'lucide-react';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  className?: string;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'customer':
      return <User className="w-4 h-4" />;
    case 'catalog':
      return <Package className="w-4 h-4" />;
    case 'order':
      return <ShoppingCart className="w-4 h-4" />;
    case 'employee':
      return <Users className="w-4 h-4" />;
    case 'appointment':
      return <Calendar className="w-4 h-4" />;
    case 'system':
      return <Settings className="w-4 h-4" />;
    default:
      return <Settings className="w-4 h-4" />;
  }
};

const getActionColor = (action: NotificationAction) => {
  switch (action) {
    case 'created':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'updated':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'deleted':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'completed':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'cancelled':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'reminder':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }
};

const NotificationItem = React.memo(function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete, 
  className = '' 
}: NotificationItemProps) {
  const handleMarkAsRead = () => {
    onMarkAsRead(notification._id);
  };

  const handleDelete = () => {
    onDelete(notification._id);
  };

  return (
    <Card className={`p-4 transition-all duration-200 hover:shadow-md ${
      !notification.isRead ? 'bg-blue-50 border-blue-200' : 'bg-white'
    } ${className}`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`p-2 rounded-full ${
          !notification.isRead ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
        }`}>
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className={`font-medium text-sm ${
              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
            }`}>
              {notification.title}
            </h4>
            <div className="flex items-center gap-1">
              <Badge 
                variant="outline" 
                className={`text-xs ${getActionColor(notification.action)}`}
              >
                {notification.action}
              </Badge>
              {!notification.isRead && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {notification.message}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              {formatDate(notification.createdAt)}
            </div>

            <div className="flex items-center gap-1">
              {!notification.isRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAsRead}
                  className="h-7 px-2 text-xs"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Mark read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
});

export { NotificationItem } 