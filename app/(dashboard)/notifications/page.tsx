"use client";

import { NotificationList } from '@/components/ui/NotificationList';

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-600">Manage and view all your system notifications</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <NotificationList className="p-6" maxHeight="70vh" />
      </div>
    </div>
  );
} 